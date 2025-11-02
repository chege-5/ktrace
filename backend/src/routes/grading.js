import express from "express";
import Delivery from "../models/Delivery.js";
import { calculateGrades, calculatePayout } from "../config/Grade.js";

const router = express.Router();

router.post("/grade", async (req, res) => {
  try {
    const { lotId, defects, moistureContent, cuppingScore } = req.body;

    // Step 1: Find existing delivery
    const delivery = await Delivery.findOne({ lotId });
    if (!delivery) {
      return res.status(404).json({ error: "Delivery not found" });
    }

    // Step 2: Calculate grade & payout
    const grade = calculateGrades({ moistureContent, defects, cuppingScore });
    const totalPayout = calculatePayout({
      grade,
      weight: delivery.weight,
    });

    // Step 3: Update delivery
    delivery.defects = defects;
    delivery.moistureContent = moistureContent;
    delivery.cuppingScore = cuppingScore;
    delivery.grade = grade;
    delivery.totalPayout = totalPayout;
    await delivery.save();

    res.json({ success: true, delivery });
  } catch (error) {
    console.error("Error grading:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
