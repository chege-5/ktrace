// backend/ussd/ussd.js
import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// resolve __dirname (since ES modules don’t have it by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from parent folder (../.env)
dotenv.config({ path: path.join(__dirname, "../.env") });

// Debug log
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected for USSD"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// Example schema for USSD users
const UserSchema = new mongoose.Schema({
  phoneNumber: String,
  role: String,
  username: String,
  farm_location: String,
});

const User = mongoose.model("User", UserSchema);

// USSD endpoint (for Africa’s Talking)
app.post("/ussd", async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  let response = "";

  if (text === "") {
    response = `CON Welcome to KahawaTrace
1. Register
2. Login`;
  } else if (text === "1") {
    response = `CON Enter your username`;
  } else if (text.startsWith("1*")) {
    const parts = text.split("*");
    if (parts.length === 2) {
      response = `CON Enter your role (farmer, buyer, admin, miller)`;
    } else if (parts.length === 3) {
      response = `CON Enter your farm location`;
    } else if (parts.length === 4) {
      // Save to DB
      const [_, username, role, farm_location] = parts;
      await User.create({ phoneNumber, username, role, farm_location });
      response = `END Registration successful`;
    }
  } else if (text === "2") {
    response = `CON Enter your username to login`;
  } else {
    response = `END Invalid input`;
  }

  res.set("Content-Type: text/plain");
  res.send(response);
});

// Start server
const PORT = process.env.USSD_PORT || 7000;
app.listen(PORT, () => console.log(`✅ USSD app running on port ${PORT}`));
