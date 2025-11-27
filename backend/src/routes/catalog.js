import express from "express";
import Catalog from "../models/catalog.js";
import Delivery from "../models/Delivery.js";
import User from "../models/User.js";

const router = express.Router();

// List catalog entries (basic filters)
router.get("/", async (req, res) => {
  try {
    const { grade, status } = req.query;
    const filter = {};
    if (grade) filter.grade = grade;
    if (status) filter.status = status;
    const items = await Catalog.find(filter)
      .populate({ path: "lot", select: "lotId weight moistureContent grade" })
      .populate({ path: "listedBy", select: "username role" });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create catalog entry (lot must exist)
router.post("/", async (req, res) => {
  try {
    const { lotId, userId, askingPricePerKg, availableKg, notes } = req.body;
    const lot = await Delivery.findOne({ lotId });
    if (!lot) return res.status(404).json({ error: "Delivery lot not found" });
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ error: "Listing user not found" });
    const entry = await Catalog.create({
      lot: lot._id,
      listedBy: user._id,
      grade: lot.grade,
      askingPricePerKg,
      availableKg,
      notes,
    });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single catalog entry
router.get("/:id", async (req, res) => {
  try {
    const entry = await Catalog.findById(req.params.id)
      .populate("lot")
      .populate("listedBy", "username role");
    if (!entry) return res.status(404).json({ error: "Not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update catalog entry (price, status, available)
router.put("/:id", async (req, res) => {
  try {
    const updates = req.body;
    const entry = await Catalog.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!entry) return res.status(404).json({ error: "Not found" });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete catalog entry
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Catalog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;