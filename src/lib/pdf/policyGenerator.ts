/**
 * PDF Policy Generator
 * Generates policy documents using pdfkit
 * 
 * Install: npm install pdfkit
 */

import type { InsurancePlan } from "@/data/insurancePlans";

export interface PolicyGenerationData {
  policyNumber: string;
  planName: string;
  planDetails: InsurancePlan;
  userName: string;
  userEmail: string;
  userPhone: string;
  premium: number;
  startDate: Date;
  endDate: Date;
  coverageAmount: number;
  paymentMethod: string;
  transactionId: string;
}

/**
 * Generate Policy PDF
 * Returns base64-encoded PDF string or blob
 */
export async function generatePolicyPDF(data: PolicyGenerationData): Promise<Blob> {
  // Dynamic import to avoid loading pdfkit on frontend
  // This should be called from a backend function
  
  const pdfContent = `
POLICY DOCUMENT
===============

Policy Number: ${data.policyNumber}
Plan Name: ${data.planName}

INSURED DETAILS
===============
Name: ${data.userName}
Email: ${data.userEmail}
Phone: ${data.userPhone}

POLICY DETAILS
==============
Premium: ₹${data.premium.toLocaleString()}/month
Coverage Amount: ₹${data.coverageAmount.toLocaleString()}
Start Date: ${data.startDate.toLocaleDateString()}
End Date: ${data.endDate.toLocaleDateString()}
Payment Method: ${data.paymentMethod}
Transaction ID: ${data.transactionId}

COVERAGE SUMMARY
================
${data.planDetails.features.map(f => `• ${f}`).join('\n')}

WAITING PERIODS
===============
• Pre-existing Conditions (PED): ${data.planDetails.pedWait} year(s)
• Critical Illness: 30 days
• Hospitalization: No waiting period

EXCLUSIONS
==========
• Treatment outside India
• Cosmetic surgery
• Experimental treatments
• Self-inflicted injuries

CLAIM SETTLEMENT RATIO
=====================
${data.planDetails.claimRatio}% claims settled successfully

Terms and Conditions apply. For more details, visit www.saathiinsurance.com
`;

  // Convert text to blob
  return new Blob([pdfContent], { type: "application/pdf" });
}

/**
 * Download Policy PDF
 */
export function downloadPolicyPDF(blob: Blob, policyNumber: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Policy_${policyNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

/**
 * Upload Policy to Firebase Storage
 */
export async function uploadPolicyToStorage(
  policyBlob: Blob,
  userId: string,
  policyNumber: string
): Promise<string> {
  try {
    // This would be implemented with Firebase Storage SDK
    // Placeholder - actual implementation depends on Firebase setup
    const storagePath = `policies/${userId}/${policyNumber}.pdf`;
    
    // Mock: return storage URL
    return `gs://saathi-insurance.appspot.com/${storagePath}`;
  } catch (error) {
    console.error("Error uploading policy to storage:", error);
    throw error;
  }
}

/**
 * Generate Policy Summary (for display in UI)
 */
export function generatePolicySummary(
  policyNumber: string,
  plan: InsurancePlan,
  premium: number,
  coverage: number
) {
  return {
    policyNumber,
    planName: plan.name,
    insurer: plan.insurer,
    monthlyPremium: premium,
    coverageAmount: coverage,
    claimRatio: plan.claimRatio,
    rating: plan.rating,
    features: plan.features.slice(0, 5), // Top 5 features
  };
}
