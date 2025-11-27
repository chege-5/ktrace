import express from "express";
import User from "../models/User.js";
import BuyerProfile from "../models/buyer.js";
import WetmillProfile from "../models/wetmill.js";
import DrymillProfile from "../models/drymill.js";
import RoasterProfile from "../models/roaster.js";
import Delivery from "../models/Delivery.js";
import Catalog from "../models/catalog.js";
import pool from "../config/postgres.js";
import auth from "../middleware/authMiddleware.js"; // simple token check

const router = express.Router();

// Basic admin check: require JWT and role admin
const requireAdmin = async (req, res, next) => {
    try {
        auth(req, res, async () => {
            const user = await User.findById(req.user);
            if (!user || user.role !== "admin") return res.status(403).json({ error: "Admin only" });
            next();
        });
    } catch (e) {
        res.status(401).json({ error: "Unauthorized" });
    }
};

// List all users with role grouping
router.get("/users", requireAdmin, async (_req, res) => {
    try {
        const users = await User.find({}, "username email phone role isVerified createdAt");
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Create user (admin adds any role)
router.post("/users", requireAdmin, async (req, res) => {
    try {
        const { username, email, phone, farm_location, id_number, role, password } = req.body;
        const user = await User.create({ username, email, phone, farm_location, id_number, role, password });
        res.status(201).json({ id: user._id, username: user.username, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Suspend user
router.post("/users/:id/suspend", requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        user.isVerified = false; // simple suspend flag substitute
        await user.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Delete user
router.delete("/users/:id", requireAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Approve role-specific profiles
router.post("/approve/buyer", requireAdmin, async (req, res) => {
    try {
        const { userId, company } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const profile = await BuyerProfile.findOneAndUpdate(
            { user: user._id },
            { user: user._id, company },
            { upsert: true, new: true }
        );
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/approve/wetmill", requireAdmin, async (req, res) => {
    try {
        const { userId, name } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const profile = await WetmillProfile.findOneAndUpdate(
            { user: user._id },
            { user: user._id, name },
            { upsert: true, new: true }
        );
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/approve/drymill", requireAdmin, async (req, res) => {
    try {
        const { userId, name } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const profile = await DrymillProfile.findOneAndUpdate(
            { user: user._id },
            { user: user._id, name },
            { upsert: true, new: true }
        );
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/approve/roaster", requireAdmin, async (req, res) => {
    try {
        const { userId, brandName } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const profile = await RoasterProfile.findOneAndUpdate(
            { user: user._id },
            { user: user._id, brandName },
            { upsert: true, new: true }
        );
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Payments queue: admin approval
router.get("/payments", requireAdmin, async (_req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM payments ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/payments/:id/approve", requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("UPDATE payments SET status='APPROVED', updated_at=NOW() WHERE id=$1", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/payments/:id/reject", requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        await pool.query("UPDATE payments SET status='REJECTED', updated_at=NOW() WHERE id=$1", [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Catalog approvals
router.post("/catalog/:id/approve", requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const entry = await Catalog.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
        if (!entry) return res.status(404).json({ error: 'Not found' });
        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/catalog/:id/reject", requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const entry = await Catalog.findByIdAndUpdate(id, { status: 'withdrawn' }, { new: true });
        if (!entry) return res.status(404).json({ error: 'Not found' });
        res.json(entry);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics summaries
router.get("/stats", requireAdmin, async (_req, res) => {
    try {
        const [usersCount, deliveriesCount] = await Promise.all([
            User.countDocuments(),
            Delivery.countDocuments(),
        ]);
        const totalWeight = await Delivery.aggregate([{ $group: { _id: null, total: { $sum: "$weight" } } }]);
        res.json({ users: usersCount, deliveries: deliveriesCount, totalWeight: totalWeight[0]?.total || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Analytics: Top performers
router.get("/analytics/top-farmers", requireAdmin, async (req, res) => {
    try {
        const limit = Number(req.query.limit || 3);
        const agg = await Delivery.aggregate([
            { $group: { _id: "$id_number", totalWeight: { $sum: "$weight" }, deliveriesCount: { $sum: 1 } } },
            { $sort: { totalWeight: -1 } },
            { $limit: limit }
        ]);
        // Join usernames
        const ids = agg.map(a => a._id);
        const users = await User.find({ id_number: { $in: ids } }, "id_number username");
        const byId = new Map(users.map(u => [u.id_number, u.username]));
        const result = agg.map(a => ({ id_number: a._id, username: byId.get(a._id) || "", totalWeight: a.totalWeight, deliveriesCount: a.deliveriesCount }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/analytics/top-wetmills", requireAdmin, async (req, res) => {
    try {
        const limit = Number(req.query.limit || 3);
        const agg = await Delivery.aggregate([
            { $group: { _id: "$lotId", totalWeight: { $sum: "$weight" }, deliveriesCount: { $sum: 1 } } },
            { $sort: { deliveriesCount: -1 } },
            { $limit: limit }
        ]);
        res.json(agg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/analytics/top-drymills", requireAdmin, async (req, res) => {
    try {
        const limit = Number(req.query.limit || 3);
        // Placeholder: if you track drymill association per delivery, adjust group key
        const agg = await Delivery.aggregate([
            { $group: { _id: "$grade", totalWeight: { $sum: "$weight" }, deliveriesCount: { $sum: 1 } } },
            { $sort: { totalWeight: -1 } },
            { $limit: limit }
        ]);
        res.json(agg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Reports: simple CSV exports placeholders (intake/delivery, payments)
router.get("/reports/deliveries.csv", requireAdmin, async (_req, res) => {
    try {
        const deliveries = await Delivery.find({}, "lotId weight date grade");
        const header = "lotId,weight,date,grade\n";
        const rows = deliveries.map(d => `${d.lotId},${d.weight},${d.date.toISOString()},${d.grade || ""}`).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.send(header + rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/reports/payments.csv", requireAdmin, async (_req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, payer_uuid, receiver_uuid, amount, status, created_at FROM payments ORDER BY created_at DESC");
        const header = "id,payer_uuid,receiver_uuid,amount,status,created_at\n";
        const body = rows.map(r => `${r.id},${r.payer_uuid},${r.receiver_uuid},${r.amount},${r.status},${r.created_at.toISOString()}`).join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.send(header + body);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;