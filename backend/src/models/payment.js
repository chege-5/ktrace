// models/paymentModel.js
import pool from "../config/postgres.js";

export const createPaymentTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      transaction_id UUID DEFAULT gen_random_uuid(),
      payer_uuid VARCHAR(255) NOT NULL,
      receiver_uuid VARCHAR(255) NOT NULL,
      role_from VARCHAR(50),
      role_to VARCHAR(50),
      amount NUMERIC(12,2) NOT NULL,
      currency VARCHAR(10) DEFAULT 'KES',
      mpesa_ref VARCHAR(100),
      status VARCHAR(20) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log("Payments table ready");
  } catch (err) {
    console.error("Error during creation", err);
  }
};
