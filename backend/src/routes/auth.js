import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/User.js";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { sendEmail } from "../utils/mailer.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "kahawa_secret";

// Temporary in-memory store for reset codes (better: Redis/DB)
let resetCodes = {};

// -------------------- GOOGLE OAUTH --------------------
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:3000/login" }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, name: req.user.username, role: req.user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const redirectURL = new URL("http://localhost:3000/oauth-success");
    redirectURL.searchParams.set("token", token);
    if (req.user.isNewUser) redirectURL.searchParams.set("welcome", req.user.username);

    res.redirect(redirectURL.toString());
  }
);

// -------------------- SIGNUP --------------------
router.post("/signup", async (req, res) => {
  try {
    const { username, email, phone, farm_location, id_number, role, password1, password2 } = req.body;

    if (role === "admin") {
      return res.status(400).json({ error: "Admin accounts cannot be created via signup" });
    }

    if (password1 !== password2) return res.status(400).json({ error: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password1, 10);

    const user = await User.create({
      username,
      email,
      phone,
      farm_location,
      id_number,
      role,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: user._id, name: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created successfully",
      token,
      user: { id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------- LOGIN --------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // 🔹 Admin special case
    if (role === "admin") {
      if (email === "admin@gmail.com" && password === "Admin@123") {
        const token = jwt.sign(
          { id: "admin", name: "Admin", role: "admin" },
          JWT_SECRET,
          { expiresIn: "1d" }
        );
        return res.json({ token, user: { id: "admin", username: "Admin", role: "admin" } });
      }
      return res.status(401).json({ msg: "Invalid admin credentials" });
    }

    // 🔹 Normal users
    const user = await User.findOne({ email, role });
    if (!user) return res.status(401).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, name: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        farm_location: user.farm_location,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// -------------------- FORGOT PASSWORD --------------------
router.post("/forgot-password", async (req, res) => {
  try {
    let { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ msg: "Please provide email or phone" });
    }

    // Trim and normalize input
    if (email) email = email.trim().toLowerCase();
    if (phone) phone = phone.trim();

    // Search user case-insensitively for email
    let user;
    if (email) {
      user = await User.findOne({ email: new RegExp(`^${email}$`, "i") });
    } else if (phone) {
      user = await User.findOne({ phone });
    }

    if (!user) return res.status(404).json({ msg: "User not found" });

    // Generate 6-digit reset code
    const code = Math.floor(100000 + Math.random() * 900000);

    // Store temporarily in memory (consider DB or Redis for production)
    resetCodes[user._id] = { code, expires: Date.now() + 15 * 60 * 1000 };

    // Send via email
    if (email) {
      await sendEmail(user.email, "Password Reset Code", `Your KahawaTrace reset code is ${code}`);
    }

    // Send via SMS
    if (phone) {
      const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      await client.messages.create({
        body: `Your KahawaTrace reset code is ${code}`,
        from: process.env.TWILIO_PHONE,
        to: user.phone,
      });
    }

    console.log(`Reset code for user ${user.email || user.phone}:`, code);

    res.json({ msg: "Reset code sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
});


// -------------------- VERIFY CODE --------------------
router.post("/verify-code", async (req, res) => {
  try {
    const { identifier, code } = req.body;
    let user = await User.findOne({ $or: [{ email: identifier }, { phone: identifier }] });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const record = resetCodes[user._id];
    if (!record || record.code != code || record.expires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired code" });
    }

    delete resetCodes[user._id];

    const resetToken = jwt.sign(
      { id: user._id, action: "reset-password" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({ msg: "Code verified", token: resetToken });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// -------------------- RESET PASSWORD --------------------
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.action !== "reset-password") {
      return res.status(401).json({ msg: "Invalid reset token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ msg: "Password reset successful!" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// -------------------- SEND VERIFICATION CODE --------------------
router.post("/send-verification", async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });
    if (user.isVerified) return res.status(400).json({ msg: "Email already verified" });

    const code = Math.floor(100000 + Math.random() * 900000);
    resetCodes[user._id] = { code, expires: Date.now() + 15 * 60 * 1000 };

    await sendEmail(user.email, "Verify Your Email", `Your verification code is ${code}`);

    res.json({ msg: "Verification code sent to your email" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// -------------------- VERIFY EMAIL --------------------
router.post("/verify-email", async (req, res) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const record = resetCodes[user._id];
    if (!record || record.code != code || record.expires < Date.now()) {
      return res.status(400).json({ msg: "Invalid or expired code" });
    }

    user.isVerified = true;
    await user.save();
    delete resetCodes[user._id];

    res.json({ msg: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


export default router;
