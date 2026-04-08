import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IDocument extends MongoDocument {
  userId: string;
  familyProfileId: string;
  documentType: 'Aadhaar' | 'PAN' | 'Insurance_Policy' | 'Hospital_Bill' | 'Medical_Report' | 'Other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;                  // Local or cloud storage path
  isEncrypted: boolean;
  isProcessed: boolean;              // Whether AI has extracted data
  extractedDataId?: string;          // Reference to extracted data
  uploadedAt: Date;
  expiresAt?: Date;                  // For optional document expiry
  tags?: string[];
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    familyProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'FamilyProfile',
      index: true,
    },
    documentType: {
      type: String,
      enum: ['Aadhaar', 'PAN', 'Insurance_Policy', 'Hospital_Bill', 'Medical_Report', 'Other'],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      enum: ['application/pdf', 'image/jpeg', 'image/png'],
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    isEncrypted: {
      type: Boolean,
      default: true,
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    extractedDataId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExtractedData',
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Compound index for user's documents
DocumentSchema.index({ userId: 1, familyProfileId: 1 });

export const Document = mongoose.model<IDocument>('Document', DocumentSchema);
