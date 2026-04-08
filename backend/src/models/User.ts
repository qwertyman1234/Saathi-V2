import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firebaseUID: string;           // Link to Firebase user
  email: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  encryptionKey?: string;        // For document encryption
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUID: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    encryptionKey: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
