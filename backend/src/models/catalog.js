import mongoose from "mongoose";

// Catalog entries publish graded coffee lots for sale or internal transfer.
// Links to Delivery to reuse lot/weight/grade info while allowing pricing.
const CatalogSchema = new mongoose.Schema(
	{
		lot: { type: mongoose.Schema.Types.ObjectId, ref: "Delivery", required: true, unique: true },
		listedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
		grade: { type: String }, // duplicated for quick filtering
		askingPricePerKg: { type: Number, required: true },
		availableKg: { type: Number, required: true },
		currency: { type: String, default: "KES" },
		status: { type: String, enum: ["listed", "approved", "reserved", "sold", "withdrawn"], default: "listed" },
		notes: String,
	},
	{ timestamps: true }
);

CatalogSchema.index({ grade: 1, status: 1 });

export default mongoose.model("Catalog", CatalogSchema);
