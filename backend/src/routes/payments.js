// src/routes/payments.js
import express from "express";
import pool from "../config/postgres.js";
import User from "../models/User.js";
import { initiateSTKPush, handleMpesaCallback } from "../services/mpesa.js";


const router = express.Router();

async function handlePayment(req, res, expectedRoles) {
  try {
    const { payer_uuid, receiver_uuid, amount } = req.body;

    if (!payer_uuid || !receiver_uuid || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const payer = await User.findOne({ uuid: payer_uuid });
    const receiver = await User.findOne({ uuid: receiver_uuid });

    if (!payer || !receiver) {
      return res.status(404).json({ error: "User(s) not found" });
    }

    const [fromRole, toRole] = expectedRoles;
    if (payer.role !== fromRole || receiver.role !== toRole) {
      return res
        .status(400)
        .json({ error: `Invalid role pairing. Expected ${fromRole} → ${toRole}` });
    }

    const insertQuery = `
      INSERT INTO payments 
      (payer_uuid, receiver_uuid, role_from, role_to, amount, currency, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, [
      payer_uuid,
      receiver_uuid,
      fromRole,
      toRole,
      amount,
      "KSH",
      "PENDING",
    ]);

    const payment = result.rows[0];
    return res.status(201).json({
      message: `Payment recorded successfully: ${fromRole} → ${toRole} (pending M-Pesa confirmation)`,
      payment,
    });
  } catch (err) {
    console.error("Error creating payment:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

router.post("/wetmill-to-farmer", (req, res) =>
  handlePayment(req, res, ["wetmill", "farmer"])
);

router.post("/drymill-to-wetmill", (req, res) =>
  handlePayment(req, res, ["drymill", "wetmill"])
);

router.post("/roaster-to-drymill", (req, res) =>
  handlePayment(req, res, ["roaster", "drymill"])
);

router.post("/exporter-to-drymill", (req, res) =>
  handlePayment(req, res, ["exporter", "drymill"])
);

router.post("/buyer-to-drymill", (req, res) =>
  handlePayment(req, res, ["buyer", "drymill"])
);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM payments ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching payments:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    const result = await pool.query(
      "SELECT * FROM payments WHERE payer_uuid=$1 OR receiver_uuid=$1 ORDER BY created_at DESC",
      [uuid]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user payments:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/mpesa/initiate", async (req, res) => {
  try {
    const { phoneNumber, amount, accountRef } = req.body;
    const result = await initiateSTKPush({ phoneNumber, amount, accountRef });
    res.status(200).json(result);
  } catch (err) {
    console.error("Error initiating M-Pesa:", err);
    res.status(500).json({ error: "M-Pesa initiation failed" });
  }
});


router.post("/mpesa/callback", async (req, res) => {
  await handleMpesaCallback(req.body);
  res.status(200).json({ message: "Callback received" });
});

export default router;
