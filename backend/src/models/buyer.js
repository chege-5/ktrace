import mongoose from "mongoose";

// Additional metadata for users with role "buyer".
// We link to the core User document to avoid duplicating auth fields.
const BuyerSchema = new mongoose.Schema(
	{
		user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		company: { type: String, required: true },
		contactName: { type: String },
		phoneAlt: { type: String },
		address: { type: String },
		country: { type: String, default: "KE" },
		status: { type: String, enum: ["active", "inactive"], default: "active" },
		notes: String,
	},
	{ timestamps: true }
);

export default mongoose.model("BuyerProfile", BuyerSchema);
