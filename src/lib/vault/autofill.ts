/**
 * Autofill mapping logic
 * Maps extracted data to form fields and calculates confidence scores
 */

import { ExtractedDataRecord, AutofillField, AutofillSuggestion } from './types';

export interface FormSchema {
  fields: {
    fieldName: string;
    label: string;
    type: string;
    extractFromPaths?: string[];  // Path to extract data from extracted record
    required?: boolean;
  }[];
}

/**
 * Generate autofill suggestions based on extracted data
 * Maps extracted fields to form fields and provides confidence scores
 */
export function generateAutofillSuggestion(
  extractedData: ExtractedDataRecord,
  formSchema: FormSchema
): AutofillSuggestion {
  const formFields: AutofillField[] = [];
  let totalConfidence = 0;
  let fieldCount = 0;

  for (const formField of formSchema.fields) {
    let fieldValue: string | null = null;
    let confidence = 0;

    if (formField.extractFromPaths) {
      // Try to extract from specified paths
      for (const path of formField.extractFromPaths) {
        const result = extractValueFromPath(extractedData, path);
        if (result.value) {
          fieldValue = result.value;
          confidence = result.confidence;
          break;
        }
      }
    } else {
      // Try to find matching field by name
      const result = extractValueByFieldName(extractedData, formField.fieldName);
      if (result.value) {
        fieldValue = result.value;
        confidence = result.confidence;
      }
    }

    formFields.push({
      fieldName: formField.fieldName,
      label: formField.label,
      type: formField.type,
      value: fieldValue,
      confidence: confidence,
      suggestedValue: fieldValue || undefined,
      editable: true,
    });

    totalConfidence += confidence;
    fieldCount++;
  }

  const overallConfidence = fieldCount > 0 ? totalConfidence / fieldCount : 0;

  return {
    formFields,
    overallConfidence: Math.round(overallConfidence),
    documentUsed: {
      _id: extractedData.documentId,
      userId: extractedData.userId,
      familyProfileId: extractedData.familyProfileId,
      documentType: extractedData.documentType as any,
      fileName: '',
      fileSize: 0,
      mimeType: '',
      filePath: '',
      isEncrypted: true,
      isProcessed: true,
      extractedDataId: extractedData._id,
      uploadedAt: extractedData.extractedAt,
    },
  };
}

/**
 * Extract value from nested object path
 * e.g., "standardizedData.fullName" -> gets value from extractedData.standardizedData.fullName
 */
function extractValueFromPath(
  extractedData: any,
  path: string
): { value: string | null; confidence: number } {
  const keys = path.split('.');
  let current = extractedData;
  let confidence = 100;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return { value: null, confidence: 0 };
    }
  }

  // If current is an object with value and confidence, extract them
  if (current && typeof current === 'object' && 'value' in current && 'confidence' in current) {
    return {
      value: current.value || null,
      confidence: current.confidence || 0,
    };
  }

  // If current is a string, return as value
  if (typeof current === 'string') {
    return { value: current, confidence };
  }

  return { value: null, confidence: 0 };
}

/**
 * Extract value by matching field name with extracted field names
 */
function extractValueByFieldName(
  extractedData: ExtractedDataRecord,
  fieldName: string
): { value: string | null; confidence: number } {
  // First check standardized data
  const standardized = extractedData.standardizedData as any;
  if (fieldName in standardized && standardized[fieldName]) {
    const value = standardized[fieldName];
    if (typeof value === 'string') {
      return { value, confidence: 85 };
    }
    if (typeof value === 'object' && value.name) {
      return { value: value.name, confidence: 80 };
    }
  }

  // Then check extracted fields
  const extracted = extractedData.extractedFields as any;
  if (fieldName in extracted && extracted[fieldName]) {
    const field = extracted[fieldName];
    return {
      value: field.value || null,
      confidence: field.confidence || 0,
    };
  }

  // Try fuzzy matching
  const lowerFieldName = fieldName.toLowerCase();
  for (const [key, field] of Object.entries(extracted)) {
    if (key.toLowerCase().includes(lowerFieldName) || lowerFieldName.includes(key.toLowerCase())) {
      if (typeof field === 'object' && 'value' in field) {
        return {
          value: (field as any).value || null,
          confidence: ((field as any).confidence || 0) - 10, // Reduce confidence for fuzzy match
        };
      }
    }
  }

  return { value: null, confidence: 0 };
}

/**
 * Predefined form schemas for common insurance forms
 */
export const FORM_SCHEMAS = {
  POLICY_PURCHASE: {
    fields: [
      { fieldName: 'fullName', label: 'Full Name', type: 'text', extractFromPaths: ['standardizedData.fullName'], required: true },
      { fieldName: 'dateOfBirth', label: 'Date of Birth', type: 'date', extractFromPaths: ['standardizedData.dateOfBirth'], required: true },
      { fieldName: 'gender', label: 'Gender', type: 'select', extractFromPaths: ['standardizedData.gender'], required: true },
      { fieldName: 'email', label: 'Email', type: 'email', extractFromPaths: ['standardizedData.email'], required: true },
      { fieldName: 'mobileNumber', label: 'Mobile Number', type: 'text', required: true },
      { fieldName: 'address', label: 'Address', type: 'textarea', extractFromPaths: ['standardizedData.address.street'], required: false },
      { fieldName: 'city', label: 'City', type: 'text', extractFromPaths: ['standardizedData.address.city'], required: false },
      { fieldName: 'state', label: 'State', type: 'text', extractFromPaths: ['standardizedData.address.state'], required: false },
      { fieldName: 'pincode', label: 'Pincode', type: 'text', extractFromPaths: ['standardizedData.address.pincode'], required: false },
    ],
  } as FormSchema,

  CLAIM_FORM: {
    fields: [
      { fieldName: 'policyNumber', label: 'Policy Number', type: 'text', extractFromPaths: ['standardizedData.policyNumber'], required: true },
      { fieldName: 'insurerName', label: 'Insurer Name', type: 'text', extractFromPaths: ['standardizedData.insurerName'], required: true },
      { fieldName: 'claimantName', label: 'Claimant Name', type: 'text', extractFromPaths: ['standardizedData.fullName'], required: true },
      { fieldName: 'nomineeDetails', label: 'Nominee Details', type: 'text', extractFromPaths: ['standardizedData.nomineeDetails.name'], required: false },
      { fieldName: 'coverageAmount', label: 'Coverage Amount', type: 'text', extractFromPaths: ['extractedFields.coverageAmount.value'], required: false },
    ],
  } as FormSchema,

  IDENTITY_VERIFICATION: {
    fields: [
      { fieldName: 'fullName', label: 'Full Name', type: 'text', extractFromPaths: ['standardizedData.fullName'], required: true },
      { fieldName: 'dateOfBirth', label: 'Date of Birth', type: 'date', extractFromPaths: ['standardizedData.dateOfBirth'], required: true },
      { fieldName: 'aadhaarNumber', label: 'Aadhaar Number', type: 'text', extractFromPaths: ['standardizedData.aadhaarNumber'], required: false },
      { fieldName: 'panNumber', label: 'PAN Number', type: 'text', extractFromPaths: ['standardizedData.panNumber'], required: false },
      { fieldName: 'address', label: 'Address', type: 'textarea', extractFromPaths: ['standardizedData.address.street'], required: false },
    ],
  } as FormSchema,
};
