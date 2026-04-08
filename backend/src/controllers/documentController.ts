import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Document as DocumentModel, IDocument } from '../models/Document';
import { ExtractedData } from '../models/ExtractedData';
import { FamilyProfile } from '../models/FamilyProfile';
import { extractDataFromDocument, standardizeExtractedData } from '../services/aiExtractionService';
import fs from 'fs';
import path from 'path';

/**
 * Upload a new document
 */
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { familyProfileId, documentType, fileName } = req.body;
    const file = req.file;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!file || !familyProfileId || !documentType) {
      return res.status(400).json({ error: 'Missing required fields or file' });
    }

    // Verify family profile belongs to user
    const profile = await FamilyProfile.findById(familyProfileId);
    if (!profile || profile.userId !== userId) {
      return res.status(404).json({ error: 'Family profile not found' });
    }

    // Validate file type
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only PDF, JPG, PNG allowed.' });
    }

    // Save file to local storage (in production, use S3/Cloud Storage)
    const uploadDir = path.join(process.cwd(), 'uploads', userId);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, `${Date.now()}_${file.originalname}`);
    fs.writeFileSync(filePath, file.buffer);

    // Create document record
    const document = await DocumentModel.create({
      userId,
      familyProfileId,
      documentType,
      fileName: fileName || file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      filePath,
      isEncrypted: true,
      isProcessed: false,
    });

    return res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully. Processing will begin shortly.',
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return res.status(500).json({ error: 'Failed to upload document' });
  }
};

/**
 * Get all documents for a user
 */
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { familyProfileId } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let query: any = { userId };
    if (familyProfileId) {
      query.familyProfileId = familyProfileId;
    }

    const documents = await DocumentModel.find(query).sort({ uploadedAt: -1 });

    return res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

/**
 * Process document with AI extraction
 */
export const processDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { documentId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const document = await DocumentModel.findById(documentId);

    if (!document || document.userId !== userId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (document.isProcessed) {
      return res.status(400).json({ error: 'Document already processed' });
    }

    // Read document file
    let documentText = '';
    if (document.mimeType === 'application/pdf') {
      // In production, use pdf-parse or similar
      documentText = `PDF content from ${document.filePath}`;
    } else {
      // For images, use OCR (e.g., Tesseract.js)
      documentText = `Image content from ${document.filePath}`;
    }

    // Extract data using AI service
    const extractedFields = await extractDataFromDocument(documentText, document.documentType);

    // Standardize extracted data
    const standardizedData = standardizeExtractedData(extractedFields, document.documentType);

    // Save extracted data
    const extractedData = await ExtractedData.create({
      documentId: document._id,
      userId,
      familyProfileId: document.familyProfileId,
      extractedFields,
      standardizedData,
      documentType: document.documentType,
      modelUsed: 'ocr-mock', // Mock AI model
    });

    // Update document as processed
    document.isProcessed = true;
    document.extractedDataId = extractedData._id;
    await document.save();

    return res.json({
      success: true,
      data: {
        document,
        extractedData,
      },
      message: 'Document processed successfully',
    });
  } catch (error) {
    console.error('Error processing document:', error);
    return res.status(500).json({ error: 'Failed to process document' });
  }
};

/**
 * Get extracted data for a document
 */
export const getExtractedData = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { documentId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const document = await DocumentModel.findById(documentId);

    if (!document || document.userId !== userId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.extractedDataId) {
      return res.status(404).json({ error: 'No extracted data found. Process document first.' });
    }

    const extractedData = await ExtractedData.findById(document.extractedDataId);

    return res.json({
      success: true,
      data: extractedData,
    });
  } catch (error) {
    console.error('Error fetching extracted data:', error);
    return res.status(500).json({ error: 'Failed to fetch extracted data' });
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { documentId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const document = await DocumentModel.findById(documentId);

    if (!document || document.userId !== userId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from storage
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete extracted data if exists
    if (document.extractedDataId) {
      await ExtractedData.findByIdAndDelete(document.extractedDataId);
    }

    // Delete document record
    await DocumentModel.findByIdAndDelete(documentId);

    return res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({ error: 'Failed to delete document' });
  }
};
