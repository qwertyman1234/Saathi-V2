/**
 * Demo data for the vault
 * Shows example documents and extracted data
 */

export const DEMO_DOCUMENTS = [
  {
    _id: 'demo_doc_1',
    fileName: 'Aadhaar_Card.pdf',
    documentType: 'Aadhaar',
    fileSize: 245000,
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isProcessed: true,
    extractedFields: {
      fullName: 'Rajesh Kumar',
      aadhaarNumber: '1234 5678 9012',
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      address: 'Mumbai, Maharashtra'
    }
  },
  {
    _id: 'demo_doc_2',
    fileName: 'Health_Insurance_Policy.pdf',
    documentType: 'Insurance_Policy',
    fileSize: 512000,
    uploadedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    isProcessed: true,
    extractedFields: {
      policyNumber: 'POL-2024-12345',
      policyType: 'Family Floater',
      sumInsured: '₹500,000',
      validFrom: '2024-01-01',
      validUpto: '2024-12-31',
      premium: '₹25,000',
      members: '4'
    }
  },
  {
    _id: 'demo_doc_3',
    fileName: 'Medical_Report.pdf',
    documentType: 'Medical_Report',
    fileSize: 358000,
    uploadedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
    isProcessed: true,
    extractedFields: {
      testDate: '2024-03-01',
      testType: 'Annual Checkup',
      bloodGroup: 'O+',
      hemoglobin: '14.2 g/dL',
      cholesterol: '180 mg/dL',
      status: 'Normal'
    }
  }
];

export const DEMO_EXTRACTED_DATA = {
  demo_doc_1: {
    _id: 'ext_demo_1',
    documentId: 'demo_doc_1',
    extractionDate: new Date(),
    documentType: 'Aadhaar',
    extractedFields: {
      fullName: { value: 'Rajesh Kumar', confidence: 0.99 },
      aadhaarNumber: { value: '1234 5678 9012', confidence: 0.98 },
      dateOfBirth: { value: '1985-03-15', confidence: 0.95 },
      gender: { value: 'Male', confidence: 0.99 },
      address: { value: 'Mumbai, Maharashtra', confidence: 0.92 }
    },
    standardizedData: {
      fullName: 'Rajesh Kumar',
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      address: { city: 'Mumbai', state: 'Maharashtra' }
    },
    overallConfidence: 0.97,
    processingTime: 2400
  },
  demo_doc_2: {
    _id: 'ext_demo_2',
    documentId: 'demo_doc_2',
    extractionDate: new Date(),
    documentType: 'Insurance_Policy',
    extractedFields: {
      policyNumber: { value: 'POL-2024-12345', confidence: 0.99 },
      policyType: { value: 'Family Floater', confidence: 0.98 },
      sumInsured: { value: '₹500,000', confidence: 0.96 },
      validFrom: { value: '2024-01-01', confidence: 0.98 },
      validUpto: { value: '2024-12-31', confidence: 0.98 },
      premium: { value: '₹25,000', confidence: 0.97 }
    },
    standardizedData: {
      policyNumber: 'POL-2024-12345',
      policyType: 'Family Floater',
      sumInsured: 500000,
      validFrom: '2024-01-01',
      validUpto: '2024-12-31',
      premium: 25000
    },
    overallConfidence: 0.98,
    processingTime: 3100
  },
  demo_doc_3: {
    _id: 'ext_demo_3',
    documentId: 'demo_doc_3',
    extractionDate: new Date(),
    documentType: 'Medical_Report',
    extractedFields: {
      testDate: { value: '2024-03-01', confidence: 0.99 },
      testType: { value: 'Annual Checkup', confidence: 0.97 },
      bloodGroup: { value: 'O+', confidence: 0.99 },
      hemoglobin: { value: '14.2 g/dL', confidence: 0.95 },
      cholesterol: { value: '180 mg/dL', confidence: 0.94 }
    },
    standardizedData: {
      testDate: '2024-03-01',
      testType: 'Annual Checkup',
      bloodGroup: 'O+',
      results: { hemoglobin: 14.2, cholesterol: 180 }
    },
    overallConfidence: 0.97,
    processingTime: 2200
  }
};

export const DEMO_FAMILY_PROFILE = {
  id: 'demo_profile_1',
  fullName: 'Rajesh Kumar',
  dateOfBirth: '1985-03-15',
  gender: 'M' as const,
  relation: 'Self' as const,
  email: 'rajesh@example.com',
  mobileNumber: '+91-98765-43210',
  address: {
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India'
  }
};
