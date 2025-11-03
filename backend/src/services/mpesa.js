// src/services/mpesa.js
import axios from "axios";
import dotenv from "dotenv";
import pool from "../config/postgres.js";

dotenv.config();


const {
  MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE,
  MPESA_PASSKEY,
  MPESA_CALLBACK_URL,
  MPESA_BASE_URL = "https://sandbox.safaricom.co.ke",
} = process.env;


export const getMpesaToken = async () => {
  const url = `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString("base64");

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  return response.data.access_token;
};


export const initiateSTKPush = async ({ phoneNumber, amount, accountRef }) => {
  const token = await getMpesaToken();
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
    

  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString("base64");

  const url = `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`;

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
    TransactionDesc: "Wetmill to Farmer payment",
  };

  const response = await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });


  return response.data;
};


export const handleMpesaCallback = async (data) => {
  try {
    const resultCode = data.Body.stkCallback.ResultCode;
    const checkoutId = data.Body.stkCallback.CheckoutRequestID;

    if (resultCode === 0) {

        const amount = data.Body.stkCallback.CallbackMetadata.Item.find(i => i.Name === "Amount")?.Value;

      await pool.query(
        "UPDATE payments SET status = $1 WHERE mpesa_checkout_id = $2",
        ["SUCCESS", checkoutId]
      );

      console.log(`Payment confirmed for checkout ID ${checkoutId}, amount ${amount} Ksh`);
    } else {
      await pool.query(
        "UPDATE payments SET status = $1 WHERE mpesa_checkout_id = $2",
        ["FAILED", checkoutId]
      );
      console.log(`Payment failed for checkout ID ${checkoutId}`);
    }
  } catch (err) {
    console.error("Error processing M-Pesa callback:", err);
  }
};
