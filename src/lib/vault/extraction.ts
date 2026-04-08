/**
 * Document Extraction Service
 * Handles: OCR (if needed) → LLM extraction → JSON structuring
 * Pipeline: File → Text extraction → AI analysis → Structured data
 */

import { askAI } from "@/lib/aiService";
import { ExtractedDataRecord } from './types';

// ==================== Text Extraction ====================

/**
 * Extract text from file (PDF or image)
 * Falls back to simple text extraction if OCR libraries not available
 */
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  
  // Handle PDF files
  if (fileType === 'application/pdf') {
    try {
      return await extractTextFromPDF(file);
    } catch (error) {
      console.warn('PDF extraction failed, trying generic method:', error);
      return await fallbackTextExtraction(file);
    }
  }
  
  // Handle image files
  if (fileType.startsWith('image/')) {
    try {
      return await extractTextFromImage(file);
    } catch (error) {
      console.warn('Image OCR failed, using fallback:', error);
      return await fallbackTextExtraction(file);
    }
  }
  
  // Try generic text reading
  return await fallbackTextExtraction(file);
}

/**
 * Fallback text extraction for PDFs
 * Attempts basic text extraction without external libraries
 */
async function fallbackTextExtraction(file: File): Promise<string> {
  try {
    // For PDFs, try to extract as text
    if (file.type === 'application/pdf') {
      const text = await file.text();
      if (text && text.trim()) return text.trim();
    }
    
    // For text files
    if (file.type.startsWith('text/')) {
      return await file.text();
    }
    
    // For images or unknown types, return file metadata as context
    return `Document: ${file.name} (${file.type}, ${file.size} bytes). Unable to extract text - please review the document manually.`;
  } catch (error) {
    console.error('Fallback extraction failed:', error);
    return `Document: ${file.name}. Unable to extract text.`;
  }
}

/**
 * Extract text from PDF using pdf.js (if available)
 */
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // @ts-ignore - pdf.js may not be installed
    // eslint-disable-next-line
    const pdfModule = await import('pdfjs-dist');
    const pdf = pdfModule.default;
    
    // Set up PDF.js worker
    pdf.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdf.version}/pdf.worker.min.js`;
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await pdf.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  } catch (error) {
    throw error;
  }
}

/**
 * Extract text from image using Tesseract.js OCR (if available)
 */
async function extractTextFromImage(file: File): Promise<string> {
  try {
    // @ts-ignore - tesseract.js may not be installed
    // eslint-disable-next-line
    const TesseractModule = await import('tesseract.js');
    const Tesseract = TesseractModule.default;
    
    const fileData = await fileToBase64(file);
    
    const result = await Tesseract.recognize(fileData, 'eng', {
      logger: (m: any) => console.log('OCR Progress:', m.progress)
    });
    
    return result.data.text;
  } catch (error) {
    throw error;
  }
}

// ==================== LLM Extraction ====================

interface ExtractionPromptContext {
  documentType: string;
  fileText: string;
}

/**
 * Generate extraction prompt based on document type
 */
function generateExtractionPrompt(context: ExtractionPromptContext): string {
  const { documentType, fileText } = context;
  
  const prompts: Record<string, string> = {
    'Aadhaar': `Extract Aadhaar card information from this text and return as JSON:
{
  "aadhaarNumber": "XXXX XXXX XXXX",
  "name": "",
  "dateOfBirth": "",
  "gender": "",
  "address": ""
}
Return ONLY valid JSON, no markdown or explanations.
Text: ${fileText}`,

    'PAN': `Extract PAN card information from this text and return as JSON:
{
  "panNumber": "",
  "name": "",
  "dateOfBirth": "",
  "fatherName": "",
  "status": ""
}
Return ONLY valid JSON, no markdown or explanations.
Text: ${fileText}`,

    'Insurance_Policy': `Extract insurance policy information from this text and return as JSON:
{
  "policyNumber": "",
  "holderName": "",
  "policyType": "",
  "sumInsured": "",
  "premiumAmount": "",
  "policyStartDate": "",
  "policyEndDate": "",
  "coverageDetails": "",
  "issuerName": ""
}
Return ONLY valid JSON, no markdown or explanations.
Text: ${fileText}`,

    'Hospital_Bill': `Extract hospital bill information from this text and return as JSON:
{
  "billNumber": "",
  "hospitalName": "",
  "patientName": "",
  "dateOfAdmission": "",
  "dateOfDischarge": "",
  "totalAmount": "",
  "procedures": [],
  "medicines": []
}
Return ONLY valid JSON, no markdown or explanations.
Text: ${fileText}`,

    'Medical_Report': `Extract medical report information from this text and return as JSON:
{
  "reportType": "",
  "patientName": "",
  "dateOfTest": "",
  "laboratory": "",
  "testResults": {},
  "normalRange": {},
  "doctorName": ""
}
Return ONLY valid JSON, no markdown or explanations.
Text: ${fileText}`,

    'Other': `Extract all key information from this document and return as JSON:
{
  "documentTitle": "",
  "keyInformation": {},
  "dates": [],
  "amounts": [],
  "names": [],
  "identifiers": []
}
Return ONLY valid JSON, no markdown or explanations.
Text: ${fileText}`,
  };
  
  return prompts[documentType] || prompts['Other'];
}

/**
 * Extract structured data from document text using LLM
 */
async function extractDataWithLLM(
  fileText: string,
  documentType: string
): Promise<Record<string, any>> {
  try {
    const prompt = generateExtractionPrompt({
      documentType,
      fileText
    });
    
    const response = await askAI(prompt, 'Extract structured data from document');
    
    // Parse JSON response
    let jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Try with markdown code block
      jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Could not extract JSON from response');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('LLM extraction failed:', error);
    throw new Error(`Failed to extract data: ${error}`);
  }
}

// ==================== Confidence Scoring ====================

/**
 * Calculate confidence score for extracted fields
 */
function calculateConfidence(
  extractedData: Record<string, any>,
  documentType: string
): Record<string, number> {
  const essentialFields: Record<string, string[]> = {
    'Aadhaar': ['aadhaarNumber', 'name', 'dateOfBirth'],
    'PAN': ['panNumber', 'name'],
    'Insurance_Policy': ['policyNumber', 'policyType', 'sumInsured'],
    'Hospital_Bill': ['billNumber', 'hospitalName', 'totalAmount'],
    'Medical_Report': ['reportType', 'dateOfTest', 'testResults'],
  };
  
  const confidence: Record<string, number> = {};
  const fields = essentialFields[documentType] || Object.keys(extractedData);
  
  fields.forEach(field => {
    const value = extractedData[field];
    // Simple confidence: filled = 80-100%, missing = 20%
    confidence[field] = (value && value.toString().trim()) ? 0.85 : 0.2;
  });
  
  return confidence;
}

// ==================== Main Extraction Pipeline ====================

/**
 * Complete extraction pipeline
 * File → OCR/Text extraction → LLM → Structured JSON
 */
export async function extractDocumentData(
  file: File,
  documentType: string
): Promise<{ 
  success: boolean; 
  data?: ExtractedDataRecord; 
  error?: string;
}> {
  try {
    console.log(`Starting extraction pipeline for ${documentType}...`);
    
    // Step 1: Extract text from file
    console.log('Step 1: Text extraction...');
    const fileText = await extractTextFromFile(file);
    
    if (!fileText || fileText.trim().length < 10) {
      throw new Error('No text could be extracted from the file');
    }
    
    console.log(`Extracted ${fileText.length} characters of text`);
    
    // Step 2: LLM extraction to structured data
    console.log('Step 2: LLM extraction...');
    const extractedData = await extractDataWithLLM(fileText, documentType);
    
    // Step 3: Calculate confidence scores
    console.log('Step 3: Confidence scoring...');
    const fieldConfidence = calculateConfidence(extractedData, documentType);
    
    // Convert to ExtractedDataRecord format
    const extractedFields: Record<string, any> = {};
    const standardizedData: Record<string, any> = {};
    
    Object.entries(extractedData).forEach(([key, value]) => {
      const confidence = fieldConfidence[key] || 0.5;
      extractedFields[key] = {
        value,
        confidence,
        source: 'ai-extraction'
      };
      
      // Map common fields to standardizedData
      const fieldMapping: Record<string, string> = {
        'name': 'fullName',
        'dateOfBirth': 'dateOfBirth',
        'gender': 'gender',
        'address': 'address',
        'policyNumber': 'policyNumber',
        'issuerName': 'insurerName',
        'aadhaarNumber': 'aadhaarNumber',
        'panNumber': 'panNumber',
      };
      
      if (fieldMapping[key]) {
        standardizedData[fieldMapping[key]] = value;
      }
    });
    
    const result: ExtractedDataRecord = {
      _id: `ext_${Date.now()}`,
      documentId: '', // Will be set by caller
      userId: '', // Will be set by caller
      familyProfileId: '',
      extractedFields,
      standardizedData,
      documentType,
      extractedAt: new Date().toISOString(),
      modelUsed: 'openrouter-free'
    };
    
    console.log('Extraction completed successfully');
    return { success: true, data: result };
  } catch (error) {
    console.error('Extraction pipeline error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown extraction error'
    };
  }
}

// ==================== Utility Functions ====================

/**
 * Convert file to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 to blob
 */
function base64ToBlob(base64: string): Blob {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/png' });
}
