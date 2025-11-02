import express from "express";
import User from "../models/User.js";
import Intake from "../models/Intake.js";

const router = express.Router();

// SEARCH ROUTE FIRST
router.get("/search", async (req, res) => {
  const { q, page = 1 } = req.query;
  const limit = 50;
  const skip = (page - 1) * limit;

  if (!q) return res.json({ farmers: [], totalPages: 0 });

  try {
    const queryObj = {
      role: "farmer",
      $or: [
        { username: { $regex: q, $options: "i" } },
        { id_number: Number(q) || -1 }
      ]
    };

    const total = await User.countDocuments(queryObj);
    const totalPages = Math.ceil(total / limit);

    const farmers = await User.find(queryObj).skip(skip).limit(limit);

    res.json({ farmers, totalPages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ farmers: [], totalPages: 0 });
  }
});

// GET FARMER PROFILE BY ID
router.get("/:farmerId", async (req, res) => {
  const { farmerId } = req.params;

  try {
    // convert to Number since schema expects Number
    const farmer = await User.findOne({ id_number: Number(farmerId), role: "farmer" });

    if (!farmer) {
      return res.status(404).json({ message: "Farmer not found" });
    }

    const intakeHistory = await Intake.find({ id_number: Number(farmerId) }).sort({ createdAt: 1 });

    res.json({ farmer, intakeHistory });
  } catch (err) {
    console.error("Error fetching farmer:", err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;
