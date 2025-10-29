import express from "express";
import 'dotenv/config';
import passport from "./config/passport.js";
import session from "express-session";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import cors from "cors";
import farmersRoutes from "./routes/farmers.js";
import intakeRoutes from "./routes/intake.js";
import gradingRoutes from "./routes/grading.js";
import "./config/passport.js"; // load passport config

connectDB();

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());


// sessions (needed by passport)
app.use(
  session({
    secret: "kahawa_secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/farmers", farmersRoutes);
app.use("/api/intake", intakeRoutes);
app.use("/api/grading", gradingRoutes);

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
