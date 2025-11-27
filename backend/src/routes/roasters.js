import express from "express";
import RoasterProfile from "../models/roaster.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const items = await RoasterProfile.find().populate("user", "username role");
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userId, brandName, location, roastingCapacityKgPerDay, equipment, certifications, contactEmail, contactPhone, notes } = req.body;
    const user = await User.findById(userId);
    if (!user || user.role !== "roaster") return res.status(400).json({ error: "Invalid roaster user" });
    const profile = await RoasterProfile.create({
      user: user._id,
      brandName,
      location,
      roastingCapacityKgPerDay,
      equipment,
      certifications,
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
    const item = await RoasterProfile.findById(req.params.id).populate("user", "username role");
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const item = await RoasterProfile.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await RoasterProfile.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;