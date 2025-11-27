import mongoose from "mongoose";

// Profile data for users with role "roaster" (future expansion)
const RoasterSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		brandName: { type: String, required: true },
		location: String,
		roastingCapacityKgPerDay: Number,
		equipment: [String],
		certifications: [String],
		contactEmail: String,
		contactPhone: String,
		status: { type: String, enum: ["active", "inactive"], default: "active" },
		notes: String,
	},
	{ timestamps: true }
);

export default mongoose.model("RoasterProfile", RoasterSchema);
