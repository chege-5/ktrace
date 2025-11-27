import mongoose from "mongoose";

// Profile data for users with role "wetmill".
const WetmillSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		name: { type: String, required: true },
		location: String,
		processingCapacityKgPerDay: Number,
		elevationMeters: Number,
		contactEmail: String,
		contactPhone: String,
		status: { type: String, enum: ["active", "inactive"], default: "active" },
		notes: String,
	},
	{ timestamps: true }
);

export default mongoose.model("WetmillProfile", WetmillSchema);
