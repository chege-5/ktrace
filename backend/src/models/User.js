import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const UserSchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4, unique: true }, // fixed
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  farm_location: { type: String, required: true },
  id_number: { type: Number, required: true, unique: true },
  googleId: { type: String, unique: true, sparse: true },
  name: String,
  avatar: String,
  role: { 
    type: String, 
    enum: ["farmer", "buyer", "wetmill", "drymill"], 
    required: true
  },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, // email verification
  resetCode: Number,
  resetCodeExpiry: Date,
}, { timestamps: true });

UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model("User", UserSchema);
