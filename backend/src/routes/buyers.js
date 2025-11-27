import express from "express";
import BuyerProfile from "../models/buyer.js";
import User from "../models/User.js";

const router = express.Router();

// List buyers
router.get("/", async (_req, res) => {
  try {
    const buyers = await BuyerProfile.find().populate("user", "username email phone role");
    res.json(buyers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create buyer profile (expects user with role buyer to exist)
router.post("/", async (req, res) => {
  try {
    const { userId, company, contactName, phoneAlt, address, country, notes } = req.body;
    const user = await User.findById(userId);
    if (!user || user.role !== "buyer") return res.status(400).json({ error: "Invalid buyer user" });

    const profile = await BuyerProfile.create({
      user: user._id,
      company,
      contactName,
      phoneAlt,
      address,
      country,
      notes,
    });
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single buyer profile
router.get("/:id", async (req, res) => {
  try {
    const profile = await BuyerProfile.findById(req.params.id).populate("user", "username email phone role");
    if (!profile) return res.status(404).json({ error: "Not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update buyer profile
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const profile = await BuyerProfile.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!profile) return res.status(404).json({ error: "Not found" });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete buyer profile
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await BuyerProfile.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;