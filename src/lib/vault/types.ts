/**
 * Types and interfaces for Document Vault system
 */

export interface FamilyProfile {
  _id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface VaultDocument {
  _id: string;
  userId: string;
  familyProfileId: string;
  documentType: 'Aadhaar' | 'PAN' | 'Insurance_Policy' | 'Hospital_Bill' | 'Medical_Report' | 'Other';
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  isEncrypted: boolean;
  isProcessed: boolean;
  extractedDataId?: string;
  uploadedAt: string;
  tags?: string[];
}

export interface ExtractedField {
  value: string | null;
  confidence: number;
  source?: string;
}

export interface ExtractedDataRecord {
  _id: string;
  documentId: string;
  userId: string;
  familyProfileId: string;
  extractedFields: Record<string, ExtractedField>;
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
  extractedAt: string;
  modelUsed: string;
}

export interface AutofillField {
  fieldName: string;
  label: string;
  type: 'text' | 'email' | 'date' | 'select' | 'textarea';
  value: string | null;
  confidence: number;
  suggestedValue?: string;
  editable: boolean;
}

export interface AutofillSuggestion {
  formFields: AutofillField[];
  overallConfidence: number;
  documentUsed: VaultDocument;
}

export interface VaultAPIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
