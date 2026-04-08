// Mock function to simulate Claude API data extraction
// In production, integrate with actual Claude API via @anthropic-ai/sdk

export interface ExtractionResult {
  [key: string]: {
    value: string | null;
    confidence: number;
  };
}

/**
 * Mock AI extraction function
 * Simulates extracting structured data from document text/OCR
 * In production, would use Claude API or similar
 */
export async function extractDataFromDocument(
  documentText: string,
  documentType: string
): Promise<ExtractionResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const extractedData: ExtractionResult = {};

  // Mock extraction logic based on document type
  if (documentType === 'Aadhaar') {
    extractedData.fullName = {
      value: 'Rajesh Kumar Singh',
      confidence: 95,
    };
    extractedData.dateOfBirth = {
      value: '1985-06-15',
      confidence: 92,
    };
    extractedData.gender = {
      value: 'M',
      confidence: 98,
    };
    extractedData.aadhaarNumber = {
      value: '1234-5678-9012',
      confidence: 99,
    };
    extractedData.address = {
      value: '123 Main Street, Mumbai, Maharashtra 400001',
      confidence: 85,
    };
  } else if (documentType === 'PAN') {
    extractedData.fullName = {
      value: 'Rajesh Kumar Singh',
      confidence: 94,
    };
    extractedData.dateOfBirth = {
      value: '1985-06-15',
      confidence: 90,
    };
    extractedData.panNumber = {
      value: 'ABCDE1234F',
      confidence: 99,
    };
  } else if (documentType === 'Insurance_Policy') {
    extractedData.policyNumber = {
      value: 'POL-2024-0123456',
      confidence: 98,
    };
    extractedData.insurerName = {
      value: 'Star Health Insurance',
      confidence: 96,
    };
    extractedData.fullName = {
      value: 'Rajesh Kumar Singh',
      confidence: 93,
    };
    extractedData.coverageAmount = {
      value: '500000',
      confidence: 92,
    };
    extractedData.policyStartDate = {
      value: '2023-01-01',
      confidence: 95,
    };
    extractedData.policyEndDate = {
      value: '2024-01-01',
      confidence: 95,
    };
    extractedData.nomineeDetails = {
      value: 'Priya Singh (Spouse)',
      confidence: 88,
    };
  } else if (documentType === 'Hospital_Bill') {
    extractedData.billNumber = {
      value: 'BILL-2024-12345',
      confidence: 97,
    };
    extractedData.hospitalName = {
      value: 'Apollo Hospitals, New Delhi',
      confidence: 94,
    };
    extractedData.patientName = {
      value: 'Rajesh Kumar Singh',
      confidence: 91,
    };
    extractedData.billAmount = {
      value: '125000',
      confidence: 93,
    };
    extractedData.billDate = {
      value: '2024-01-15',
      confidence: 96,
    };
  } else {
    // Generic extraction
    extractedData.text = {
      value: documentText.substring(0, 200),
      confidence: 70,
    };
  }

  return extractedData;
}

/**
 * Standardize extracted data into common fields
 */
export function standardizeExtractedData(
  extractedFields: ExtractionResult,
  documentType: string
): Record<string, any> {
  const standardized: Record<string, any> = {};

  // Map extracted fields to standardized format
  if (extractedFields.fullName) {
    standardized.fullName = extractedFields.fullName.value;
  }
  if (extractedFields.dateOfBirth) {
    standardized.dateOfBirth = extractedFields.dateOfBirth.value;
  }
  if (extractedFields.gender) {
    standardized.gender = extractedFields.gender.value;
  }
  if (extractedFields.address) {
    standardized.address = parseAddress(extractedFields.address.value || '');
  }

  // Document-specific fields
  if (documentType === 'Insurance_Policy') {
    standardized.policyNumber = extractedFields.policyNumber?.value || null;
    standardized.insurerName = extractedFields.insurerName?.value || null;
    standardized.coverageAmount = extractedFields.coverageAmount?.value || null;
    standardized.policyStartDate = extractedFields.policyStartDate?.value || null;
    standardized.policyEndDate = extractedFields.policyEndDate?.value || null;
    if (extractedFields.nomineeDetails) {
      standardized.nomineeDetails = parseNomineeDetails(extractedFields.nomineeDetails.value || '');
    }
  }

  return standardized;
}

/**
 * Parse address string into components
 */
function parseAddress(addressStr: string): { street?: string; city?: string; state?: string; pincode?: string } {
  // Simple regex-based parsing (in production, use NLP)
  const parts = addressStr.split(',').map(p => p.trim());
  return {
    street: parts[0] || null,
    city: parts[1] || null,
    state: parts[2] || null,
    pincode: parts[3] || null,
  };
}

/**
 * Parse nominee details
 */
function parseNomineeDetails(nomineeStr: string): { name?: string; relation?: string } {
  // Extract name and relation from string like "Priya Singh (Spouse)"
  const match = nomineeStr.match(/^(.+?)\s*\((.+?)\)$/);
  if (match) {
    return {
      name: match[1].trim(),
      relation: match[2].trim(),
    };
  }
  return { name: nomineeStr };
}
