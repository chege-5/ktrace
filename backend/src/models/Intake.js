// models/Intake.js
import mongoose from "mongoose";

const IntakeSchema = new mongoose.Schema({
  lotId: { type: String, unique: true, required: true },
  id_number: { type: Number, required: true, ref: "User" }, // links to id_number
  wetmillId: { type: String, required: true, ref: "User" }, // wetmill UUID
  date: { type: Date, default: Date.now },
  weightKg: { type: Number, required: true },
  moisture: { type: Number, required: true },
  notes: { type: String },
  status: { type: String, default: "received" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Intake", IntakeSchema);
