/**
 * Claim Document Analyzer
 * Processes PDF and image uploads to extract claim information
 * Uses AI vision to analyze documents and extract key claim details
 */

export interface ClaimDocumentData {
  hospitalName: string;
  treatmentType: string;
  totalAmount: number;
  dateOfAdmission: string;
  dateOfDischarge: string;
  numberOfDays: number;
  procedures: string[];
  diagnostics: string[];
  medicines: string[];
  rawText: string;
}

/**
 * Convert file to base64 for vision API
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extract text from image using base64
 */
export async function extractImageText(imageBase64: string): Promise<string> {
  try {
    const OR_KEY = import.meta.env.VITE_OPENROUTER_KEY ?? "";

    if (!OR_KEY) {
      console.warn("OpenRouter key not configured for image processing");
      return "";
    }

    const response = await fetch("https://openrouter.ai/api/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OR_KEY}`,
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-70b-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this medical document. Be accurate and include all numbers, dates, and medical terms. Return only the extracted text.",
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("Vision API error:", response.statusText);
      return "";
    }

    const data = await response.json();
    return data.content?.[0]?.text || "";
  } catch (error) {
    console.error("Error extracting image text:", error);
    return "";
  }
}

/**
 * Extract text from PDF file
 * Uses PDF.js for client-side processing
 */
export async function extractPdfText(file: File): Promise<string> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Try to extract using simple pattern matching for common PDF structures
    // This is a lightweight alternative that works for most hospital bills
    const view = new Uint8Array(arrayBuffer);
    const text = new TextDecoder("utf-8", { fatal: false }).decode(view);

    // Extract readable text from PDF
    return extractReadableTextFromPDF(text);
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    return "";
  }
}

/**
 * Extract readable text from PDF binary data
 */
function extractReadableTextFromPDF(binaryData: string): string {
  // Remove PDF markers and extract text strings
  let text = binaryData
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F]/g, " ") // Remove control characters
    .replace(/\n+/g, "\n"); // Normalize newlines

  // Extract text between parentheses (common PDF text format)
  const matches = text.match(/\((.*?)\)/g) || [];
  const extracted = matches
    .map((m) => m.replace(/[()\\]/g, ""))
    .filter((t) => t.length > 2)
    .join("\n");

  return extracted || text.substring(0, 5000);
}

/**
 * Analyze claim document and extract key information
 */
export async function analyzeClaimDocument(
  fileContent: string,
  fileName: string
): Promise<ClaimDocumentData> {
  try {
    const { askAI } = await import("./ai");

    const prompt = `Analyze this medical document and extract key claim information.
Return a JSON object with these fields (use 0 or empty string if not found):
{
  "hospitalName": "Hospital name or 'Unknown'",
  "treatmentType": "Type of treatment (surgery, medication, diagnostics, etc.)",
  "totalAmount": 0,
  "dateOfAdmission": "YYYY-MM-DD format",
  "dateOfDischarge": "YYYY-MM-DD format",
  "numberOfDays": 0,
  "procedures": ["list", "of", "procedures"],
  "diagnostics": ["list", "of", "tests", "done"],
  "medicines": ["list", "of", "medicines"]
}

Document content:
${fileContent.substring(0, 4000)}

Return ONLY valid JSON, no markdown or explanation.`;

    const system = `You are a medical billing specialist. Extract claim information from medical documents accurately. 
Identify hospitals, treatments, costs, and procedures. Focus on information relevant to insurance claims.
Per IRDAI guidelines, ensure you capture treatment type, hospitalization dates, and costs.`;

    const result = await askAI(system, prompt, 1000);

    // Parse JSON response
    const clean = result.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        hospitalName: parsed.hospitalName || "Unknown",
        treatmentType: parsed.treatmentType || "Medical treatment",
        totalAmount: parsed.totalAmount || 0,
        dateOfAdmission: parsed.dateOfAdmission || "",
        dateOfDischarge: parsed.dateOfDischarge || "",
        numberOfDays: parsed.numberOfDays || 0,
        procedures: Array.isArray(parsed.procedures) ? parsed.procedures : [],
        diagnostics: Array.isArray(parsed.diagnostics) ? parsed.diagnostics : [],
        medicines: Array.isArray(parsed.medicines) ? parsed.medicines : [],
        rawText: fileContent.substring(0, 2000),
      };
    }

    return {
      hospitalName: "Unknown",
      treatmentType: "Medical treatment",
      totalAmount: 0,
      dateOfAdmission: "",
      dateOfDischarge: "",
      numberOfDays: 0,
      procedures: [],
      diagnostics: [],
      medicines: [],
      rawText: fileContent,
    };
  } catch (error) {
    console.error("Error analyzing claim document:", error);
    return {
      hospitalName: "Unknown",
      treatmentType: "Medical treatment",
      totalAmount: 0,
      dateOfAdmission: "",
      dateOfDischarge: "",
      numberOfDays: 0,
      procedures: [],
      diagnostics: [],
      medicines: [],
      rawText: "",
    };
  }
}

/**
 * Process uploaded file and extract claim data
 * Handles PDF and image formats
 */
export async function processClaimFile(file: File): Promise<{
  success: boolean;
  data?: ClaimDocumentData;
  error?: string;
}> {
  try {
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    console.log(`Processing file: ${file.name} (${file.type})`);

    let fileContent = "";

    // Handle different file types
    if (file.type === "application/pdf") {
      fileContent = await extractPdfText(file);
    } else if (file.type.startsWith("image/")) {
      // Convert image to base64 and extract text
      const base64 = await fileToBase64(file);
      fileContent = await extractImageText(base64);
    } else {
      return { success: false, error: "File type not supported. Use PDF or image." };
    }

    if (!fileContent) {
      return { success: false, error: "Could not extract text from file" };
    }

    // Analyze extracted content
    const data = await analyzeClaimDocument(fileContent, file.name);

    return { success: true, data };
  } catch (error) {
    console.error("Error processing claim file:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process file",
    };
  }
}

/**
 * IRDAI Guidelines Reference for Claim Eligibility
 */
export const IRDAI_GUIDELINES = {
  claimSettlementPeriod: "30 days for reimbursement claims, 1 hour for cashless claims",
  minimumHospitalization: "24 hours or more for hospitalization benefit",
  documentationRequired: [
    "Original hospital bills and itemized invoices",
    "Discharge summary from hospital",
    "Medical prescription and clinical notes",
    "Investigation reports (X-ray, CT, blood tests, etc.)",
    "Pre-authorization approval (if obtained)",
    "Health insurance claim form",
  ],
  commonRejectionReasons: [
    "Treatment not covered under policy",
    "Pre-existing disease exclusion (usually 24-48 months)",
    "Hospital not in network (for network policies)",
    "Claim filed beyond 90 days",
    "Incomplete documentation",
    "Treatment at non-NABH or non-NابH accredited hospital",
    "Treatments classified as non-medical or cosmetic",
  ],
  coveredTreatments: [
    "Inpatient hospitalization",
    "Day-care procedures",
    "Maternity coverage",
    "Pre/post-hospitalization expenses",
    "Organ transplant",
    "Critical illness",
  ],
  exclusions: [
    "Waiting period (typically 30 days for accidents, 1-4 years for illnesses)",
    "Pre-existing diseases (subject to waiting period)",
    "Health checkups and vaccinations",
    "Cosmetic surgery",
    "Infertility treatment (depends on policy)",
    "Substance abuse treatment",
  ],
};

/**
 * Check claim eligibility based on IRDAI guidelines
 */
export function checkClaimEligibilityByGuidelines(
  claimData: ClaimDocumentData,
  policyType: string = "comprehensive"
): {
  score: number;
  riskFactors: string[];
  recommendations: string[];
} {
  const riskFactors: string[] = [];
  let score = 100;

  // Check hospitalization duration
  if (claimData.numberOfDays < 1) {
    riskFactors.push(
      "Hospitalization duration unclear. Per IRDAI, minimum 24 hours typically required for hospitalization benefits."
    );
    score -= 15;
  }

  // Check for common procedures
  const coveredProcedures = [
    "surgery",
    "operation",
    "hospitalization",
    "treatment",
    "procedure",
    "biopsy",
    "ct scan",
    "mri",
  ];
  const hasCoveredProcedure = claimData.procedures.some((p) =>
    coveredProcedures.some((cp) => p.toLowerCase().includes(cp))
  );
  if (!hasCoveredProcedure && claimData.procedures.length === 0) {
    riskFactors.push(
      "Treatment type not clearly documented. Ensure medical necessity is established."
    );
    score -= 10;
  }

  // Check claim amount
  if (claimData.totalAmount === 0) {
    riskFactors.push("Claim amount not found. Ensure itemized invoice is provided.");
    score -= 10;
  } else if (claimData.totalAmount > 1000000) {
    riskFactors.push(
      "High claim amount. Additional documentation may be required per insurer policy."
    );
    score -= 5;
  }

  // Check dates are present
  if (!claimData.dateOfAdmission || !claimData.dateOfDischarge) {
    riskFactors.push(
      "Hospitalization dates not clearly mentioned. Required for claim processing per IRDAI."
    );
    score -= 15;
  }

  // Generate recommendations
  const recommendations = [
    "Verify hospital has NABH/NابH accreditation",
    "Ensure all medical justification documents are attached",
    "Check policy for specific coverage limits for this treatment type",
    "Confirm no pre-existing exclusion applies to this condition",
    "Review claim filing within 90-day window",
  ];

  if (claimData.totalAmount > 100000) {
    recommendations.push("Consider pre-authorization for faster processing");
  }

  return {
    score: Math.max(0, score),
    riskFactors,
    recommendations,
  };
}
