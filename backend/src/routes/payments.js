import express from "express";
import axios from "axios";
import pool from "../config/postgres.js";
import User from "../models/User.js";
import { format } from "date-fns";
import { Buffer } from "buffer";

const router = express.Router();

// Generate MPesa token
async function generateMpesaToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");

  const { data } = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );

  return data.access_token;
}

// Initiate STK Push
async function initiateSTKPush({ phoneNumber, amount, accountRef }) {
  const token = await generateMpesaToken();
  const timestamp = format(new Date(), "yyyyMMddHHmmss");
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString("base64");

  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: "Kahawa Trace Payment",
  };

  const { data } = await axios.post(
    "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return data;
}

// Generic payment creation
async function handlePayment(req, res, expectedRoles) {
  try {
    const { payer_uuid, receiver_uuid, amount } = req.body;
    if (!payer_uuid || !receiver_uuid || !amount) return res.status(400).json({ error: "Missing fields" });

    const payer = await User.findOne({ uuid: payer_uuid });
    const receiver = await User.findOne({ uuid: receiver_uuid });

    if (!payer || !receiver) return res.status(404).json({ error: "User not found" });

    const [fromRole, toRole] = expectedRoles;
    if (payer.role !== fromRole || receiver.role !== toRole)
      return res.status(400).json({ error: `Expected roles ${fromRole} → ${toRole}` });

    const result = await pool.query(
      `INSERT INTO payments 
        (payer_uuid, receiver_uuid, role_from, role_to, amount, currency, status, checkout_request_id)
        VALUES ($1,$2,$3,$4,$5,$6,'PENDING',null) RETURNING *`,
      [payer_uuid, receiver_uuid, fromRole, toRole, amount, "KES"]
    );

    res.status(201).json({ message: "Payment created", payment: result.rows[0] });
  } catch (err) {
    console.error("Payment creation error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Routes for different role flows
router.post("/wetmill-to-farmer", (req, res) => handlePayment(req, res, ["wetmill", "farmer"]));
router.post("/drymill-to-wetmill", (req, res) => handlePayment(req, res, ["drymill", "wetmill"]));
router.post("/roaster-to-drymill", (req, res) => handlePayment(req, res, ["roaster", "drymill"]));
router.post("/exporter-to-drymill", (req, res) => handlePayment(req, res, ["exporter", "drymill"]));
router.post("/buyer-to-drymill", (req, res) => handlePayment(req, res, ["buyer", "drymill"]));

// Initiate STK Push
router.post("/mpesa/initiate", async (req, res) => {
  try {
    const { paymentId, phoneNumber, amount } = req.body;
    const { rows } = await pool.query("SELECT * FROM payments WHERE id=$1", [paymentId]);
    if (!rows.length) return res.status(404).json({ error: "Payment not found" });

    const payment = rows[0];
    if (payment.status !== 'APPROVED') {
      return res.status(400).json({ error: "Payment not approved by admin" });
    }
    const accountRef = payment.transaction_id;
    const stk = await initiateSTKPush({ phoneNumber, amount, accountRef });

    if (!stk.CheckoutRequestID) return res.status(400).json({ error: "No CheckoutRequestID", raw: stk });

    await pool.query("UPDATE payments SET checkout_request_id=$1 WHERE id=$2", [stk.CheckoutRequestID, paymentId]);

    res.json({ message: "STK Push initiated", CheckoutRequestID: stk.CheckoutRequestID, CustomerMessage: stk.CustomerMessage });
  } catch (err) {
    console.error("STK initiation error:", err);
    res.status(500).json({ error: "Failed to initiate STK Push" });
  }
});

// M-Pesa callback
router.post("/mpesa/callback", async (req, res) => {
  try {
    const stk = req.body.Body?.stkCallback;
    if (!stk) return res.status(400).json({ error: "Invalid callback payload" });

    const CheckoutRequestID = stk.CheckoutRequestID;
    const ResultCode = stk.ResultCode;
    const metadata = stk.CallbackMetadata?.Item || [];
    const MpesaReceiptNumber = metadata.find(i => i.Name === "MpesaReceiptNumber")?.Value || null;
    const Amount = metadata.find(i => i.Name === "Amount")?.Value || null;
    const status = ResultCode === 0 ? "PAID" : "FAILED";

    await pool.query(
      `UPDATE payments
       SET mpesa_ref=$1, amount=$2, status=$3, updated_at=NOW()
       WHERE checkout_request_id=$4`,
      [MpesaReceiptNumber, Amount, status, CheckoutRequestID]
    );

    res.status(200).json({ message: "Callback processed" });
  } catch (err) {
    console.error("Callback error:", err);
    res.status(500).json({ error: "Failed to process callback" });
  }
});

// List all payments
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM payments ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// List payments by user
router.get("/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await pool.query(
      "SELECT * FROM payments WHERE payer_uuid=$1 OR receiver_uuid=$1 ORDER BY created_at DESC",
      [uuid]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("User payments error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export default router;
