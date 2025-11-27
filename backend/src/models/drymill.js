import mongoose from "mongoose";

// Extra profile data for users with role "drymill".
const DrymillSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		name: { type: String, required: true },
		location: { type: String },
		capacityKgPerDay: { type: Number },
		certifications: [String],
		contactEmail: String,
		contactPhone: String,
		status: { type: String, enum: ["active", "inactive"], default: "active" },
		notes: String,
	},
	{ timestamps: true }
);

export default mongoose.model("DrymillProfile", DrymillSchema);
