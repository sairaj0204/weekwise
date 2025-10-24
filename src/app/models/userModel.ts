// 
import mongoose, { Schema, Document, Model } from "mongoose";

interface IUser {
  userName: string;
  password: string;
  email: string;
  timezone: string; // ✅ ADDED
  information: string;
  isVerified: boolean;
  forgotPasswordToken?: string;
  forgotPasswordTokenExpiry?: Date;
  verifyToken?: string;
  verifyTokenExpiry?: Date;
}

interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>({
  userName: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  timezone: { type: String, required: true }, // ✅ ADDED
  information: {type: String},
  isVerified: { type: Boolean, default: false },
  forgotPasswordToken: String,
  forgotPasswordTokenExpiry: Date,
  verifyToken: String,
  verifyTokenExpiry: Date,
});

const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);

export default User;