// routes/intake.js
import express from "express";
import Intake from "../models/Intake.js";
import User from "../models/User.js";
import { sendSMS } from "../utils/sms.js";

const router = express.Router();

router.post("/manual", async (req, res) => {
  const entries = Array.isArray(req.body) ? req.body : [req.body];
  const results = [];

  for (const entry of entries) {
    const { farmerId, wetmillId, weightKg, moisture, notes } = entry;

    try {
      const farmer = await User.findOne({ id_number: farmerId });
      if (!farmer) {
        results.push({ farmerId, success: false, reason: "Farmer not found" });
        continue;
      }

      // 🔧 FIX: proper start of day
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const count = await Intake.countDocuments({
        createdAt: { $gte: startOfDay },
      });

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const lotId = `LOT-${dateStr}-${count + 1}`;

      const intake = await Intake.create({
        lotId,
        id_number: farmerId,
        wetmillId,
        weightKg,
        moisture,
        notes,
      });

      if (farmer?.phone) {
        const displayName = farmer.username || farmer.name || "Farmer";
        const smsMessage = `Dear ${displayName}, we received ${weightKg}kg of coffee at the wetmill. Moisture: ${moisture}%. Lot ID: ${lotId}.`;

        try {
          await sendSMS(farmer.phone, smsMessage);
          console.log(`✅ SMS sent for ${displayName} (${farmer.phone}) | Lot: ${lotId}`);
        } catch (smsErr) {
          console.error("❌ SMS failed:", smsErr.message);
          results.push({ farmerId, success: false, reason: "SMS failed" });
          continue;
        }
      }

      results.push({ farmerId, success: true, intake });
    } catch (err) {
      console.error("Manual intake error:", err);
      results.push({ farmerId, success: false, reason: err.message });
    }
  }

  res.json({
    success: results.every(r => r.success),
    results,
  });
});

export default router;
