import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IExtractedData extends MongoDocument {
  documentId: string;
  userId: string;
  familyProfileId: string;
  rawText?: string;                  // Raw OCR/text result
  extractedFields: {
    [key: string]: {
      value: string | null;
      confidence: number;             // 0-100 confidence score
      source?: string;               // Where the field came from
    };
  };
  standardizedData: {
    fullName?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    policyNumber?: string;
    insurerName?: string;
    nomineeDetails?: {
      name?: string;
      relation?: string;
    };
    aadhaarNumber?: string;
    panNumber?: string;
  };
  documentType: string;
  extractedAt: Date;
  modelUsed: string;                 // Which AI model/method was used
}

const ExtractedDataSchema = new Schema<IExtractedData>(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Document',
      index: true,
    },
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
    rawText: {
      type: String,
      default: null,
    },
    extractedFields: {
      type: Map,
      of: {
        value: { type: String, default: null },
        confidence: { type: Number, required: true },
        source: { type: String, default: null },
      },
      default: {},
    },
    standardizedData: {
      fullName: { type: String, default: null },
      dateOfBirth: { type: String, default: null },
      gender: { type: String, default: null },
      address: {
        street: { type: String, default: null },
        city: { type: String, default: null },
        state: { type: String, default: null },
        pincode: { type: String, default: null },
      },
      policyNumber: { type: String, default: null },
      insurerName: { type: String, default: null },
      nomineeDetails: {
        name: { type: String, default: null },
        relation: { type: String, default: null },
      },
      aadhaarNumber: { type: String, default: null },
      panNumber: { type: String, default: null },
    },
    documentType: {
      type: String,
      required: true,
    },
    extractedAt: {
      type: Date,
      default: Date.now,
    },
    modelUsed: {
      type: String,
      enum: ['claude-ai', 'ocr-mock', 'regex-based'],
      required: true,
    },
  },
  { timestamps: true }
);

export const ExtractedData = mongoose.model<IExtractedData>('ExtractedData', ExtractedDataSchema);
