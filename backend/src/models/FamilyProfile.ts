import mongoose, { Schema, Document } from 'mongoose';

export interface IFamilyProfile extends Document {
  userId: string;                    // Reference to User
  fullName: string;
  dateOfBirth: string;               // Format: YYYY-MM-DD
  gender: 'M' | 'F' | 'Other';
  relation: 'Self' | 'Spouse' | 'Father' | 'Mother' | 'Sister' | 'Brother' | 'Son' | 'Daughter' | 'Other';
  mobileNumber?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  aadhaarNumber?: string;            // Masked or hashed
  panNumber?: string;                // Masked or hashed
  createdAt: Date;
  updatedAt: Date;
}

const FamilyProfileSchema = new Schema<IFamilyProfile>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ['M', 'F', 'Other'],
      required: true,
    },
    relation: {
      type: String,
      enum: ['Self', 'Spouse', 'Father', 'Mother', 'Sister', 'Brother', 'Son', 'Daughter', 'Other'],
      required: true,
    },
    mobileNumber: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
    },
    address: {
      street: { type: String, default: null },
      city: { type: String, default: null },
      state: { type: String, default: null },
      pincode: { type: String, default: null },
    },
    aadhaarNumber: {
      type: String,
      default: null,
    },
    panNumber: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for user's family profiles
FamilyProfileSchema.index({ userId: 1, relation: 1 });

export const FamilyProfile = mongoose.model<IFamilyProfile>('FamilyProfile', FamilyProfileSchema);
