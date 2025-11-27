import express from "express";
import WetmillProfile from "../models/wetmill.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const items = await WetmillProfile.find().populate("user", "username role");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, name, location, processingCapacityKgPerDay, elevationMeters, contactEmail, contactPhone, notes } = req.body;
    const user = await User.findById(userId);
    if (!user || user.role !== "wetmill") return res.status(400).json({ error: "Invalid wetmill user" });
    const profile = await WetmillProfile.create({
      user: user._id,
      name,
      location,
      processingCapacityKgPerDay,
      elevationMeters,
      contactEmail,
      contactPhone,
      notes,
    });
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await WetmillProfile.findById(req.params.id).populate("user", "username role");
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const item = await WetmillProfile.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await WetmillProfile.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;