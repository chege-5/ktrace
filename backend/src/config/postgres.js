// config/postgres.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

pool.on("connect", () => {
  console.log("successfully connected...");
});

pool.on("error", (err) => {
  console.error("connection error", err);
  process.exit(-1);
});

export default pool;
