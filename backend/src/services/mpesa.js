// src/services/mpesa.js
import axios from "axios";
import pool from "../config/postgres.js";

const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
  MPESA_BASE_URL = "https://sandbox.safaricom.co.ke",
} = process.env;

// Generate token
export const getMpesaToken = async () => {
  const url = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");
  const { data } = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return data.access_token;
};

// Initiate STK push
export const initiateSTKPush = async ({ phoneNumber, amount, accountRef }) => {
  const token = await getMpesaToken();
  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

  const payload = {
    BusinessShortCode: MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: MPESA_CALLBACK_URL,
    AccountReference: accountRef,
    TransactionDesc: "Kahawa Payment",
  };

  const url = `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`;
  const { data } = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
  return data;
};

// Handle callback
export const handleMpesaCallback = async (data) => {
  try {
    const callback = data.Body.stkCallback;
    const checkoutId = callback.CheckoutRequestID;
    const resultCode = callback.ResultCode;
    const status = resultCode === 0 ? "PAID" : "FAILED";

    await pool.query("UPDATE payments SET status=$1 WHERE mpesa_checkout_id=$2", [status, checkoutId]);
    console.log(`Payment ${status} for checkout ID ${checkoutId}`);
  } catch (err) {
    console.error("Callback error:", err);
  }
};
