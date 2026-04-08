/**
 * API service for Document Vault
 * Uses Firebase Firestore for data storage
 */

import { auth } from "@/lib/firebase"; 
import * as firebaseVault from "@/lib/firebase/vault";
import { VaultDocument, FamilyProfile, ExtractedDataRecord } from './types';

export interface VaultAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
}

// Get current user ID from Firebase Auth
async function getCurrentUserId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
}

// ==================== Document APIs ====================

/**
 * Upload a document to the vault
 * @param familyProfileId - Profile ID to associate with the document
 * @param documentType - Type of document (Aadhaar, PAN, etc.)
 * @param file - File to upload
 */
export async function uploadDocument(
  familyProfileId: string,
  documentType: string,
  file: File
): Promise<VaultAPIResponse<any>> {
  try {
    const userId = await getCurrentUserId();
    const result = await firebaseVault.uploadVaultDocument(
      userId,
      file,
      documentType,
      familyProfileId
    );
    return {
      success: result.success,
      data: result.id ? { id: result.id } : undefined,
      error: result.error,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Upload error:', errorMessage);
    return { 
      success: false, 
      error: errorMessage 
    };
  }
}

/**
 * Get all documents for a family profile (real-time subscription)
 * @param familyProfileId - Family profile ID
 * @param callback - Function called when documents change
 */
export async function getDocuments(
  familyProfileId?: string
): Promise<VaultAPIResponse<VaultDocument[]>> {
  try {
    const userId = await getCurrentUserId();
    
    // Use subscribeDocuments internally but return as a promise for compatibility
    return new Promise((resolve) => {
      const unsubscribe = firebaseVault.subscribeVaultDocuments(userId, (docs) => {
        if (familyProfileId) {
          const filtered = docs.filter(d => d.familyProfileId === familyProfileId);
          resolve({ success: true, data: filtered });
        } else {
          resolve({ success: true, data: docs });
        }
        unsubscribe?.();
      });
    });
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Subscribe to real-time document updates
 */
export async function subscribeDocuments(
  familyProfileId: string,
  callback: (docs: VaultDocument[]) => void
) {
  try {
    const userId = await getCurrentUserId();
    return firebaseVault.subscribeVaultDocuments(userId, (allDocs) => {
      const filtered = allDocs.filter(d => d.familyProfileId === familyProfileId);
      callback(filtered);
    });
  } catch (error) {
    console.error('Error subscribing to documents:', error);
  }
}

/**
 * Process a document with AI extraction
 * Runs the extraction pipeline: OCR → LLM → JSON
 * @param documentId - Document ID to process
 */
export async function processDocument(documentId: string): Promise<VaultAPIResponse<any>> {
  try {
    // Import extraction service
    const { extractDocumentData } = await import('@/lib/vault/extraction');
    
    // Get document metadata
    const vaultDoc = await firebaseVault.getVaultDocument(documentId);
    if (!vaultDoc || !('fileUrl' in vaultDoc) || !('fileName' in vaultDoc) || !('mimeType' in vaultDoc) || !('documentType' in vaultDoc)) {
      return { success: false, error: 'Document not found or incomplete' };
    }
    
    // Download file from URL
    const fileResponse = await fetch((vaultDoc as any).fileUrl);
    const blob = await fileResponse.blob();
    const file = new File([blob], (vaultDoc as any).fileName, { type: (vaultDoc as any).mimeType });
    
    // Run extraction pipeline
    const result = await extractDocumentData(file, (vaultDoc as any).documentType);
    
    if (result.success && result.data) {
      // Save extracted data
      await saveExtractedData(documentId, result.data);
      return {
        success: true,
        data: result.data
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Document processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Processing failed' };
  }
}

/**
 * Delete a document from the vault
 */
export async function deleteDocument(documentId: string): Promise<VaultAPIResponse<any>> {
  try {
    const result = await firebaseVault.deleteVaultDocument(documentId, '');
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error };
  }
}

// ==================== Data Extraction APIs ====================

export async function saveExtractedData(
  documentId: string,
  extractedData: any
): Promise<VaultAPIResponse<any>> {
  try {
    const userId = await getCurrentUserId();
    const dataToSave = {
      ...extractedData,
      documentId,
      userId,
      _id: `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    
    const result = await firebaseVault.saveExtractedData(
      userId,
      documentId,
      dataToSave
    );
    return {
      success: result.success,
      data: result.id ? { id: result.id } : undefined,
      error: result.error,
    };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getExtractedData(
  documentId: string
): Promise<VaultAPIResponse<ExtractedDataRecord>> {
  try {
    const data = await firebaseVault.getExtractedData(documentId);
    if (!data) {
      return { success: false, error: 'No extracted data found' };
    }
    return {
      success: true,
      data: data as any as ExtractedDataRecord,
    };
  } catch (error) {
    return { success: false, error };
  }
}

// ==================== Family Profile APIs ====================

export async function createFamilyProfile(
  profileData: Partial<FamilyProfile>
): Promise<VaultAPIResponse<any>> {
  try {
    const userId = await getCurrentUserId();
    const result = await firebaseVault.createVaultFamilyProfile(userId, profileData);
    return {
      success: result.success,
      data: result.id ? { id: result.id } : undefined,
      error: result.error,
    };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Get all family profiles (real-time subscription)
 */
export async function getFamilyProfiles(): Promise<VaultAPIResponse<FamilyProfile[]>> {
  try {
    const userId = await getCurrentUserId();
    
    // Use subscribeFamilyProfiles internally but return as a promise for compatibility
    return new Promise((resolve) => {
      const unsubscribe = firebaseVault.subscribeVaultFamilyProfiles(userId, (profiles) => {
        resolve({ success: true, data: profiles });
        unsubscribe?.();
      });
    });
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Subscribe to real-time family profile updates
 */
export async function subscribeFamilyProfiles(
  callback: (profiles: FamilyProfile[]) => void
) {
  try {
    const userId = await getCurrentUserId();
    return firebaseVault.subscribeVaultFamilyProfiles(userId, callback);
  } catch (error) {
    console.error('Error subscribing to family profiles:', error);
  }
}

export async function deleteFamilyProfile(
  profileId: string
): Promise<VaultAPIResponse<any>> {
  try {
    const result = await firebaseVault.deleteVaultFamilyProfile(profileId);
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error };
  }
}

export async function linkDocumentToProfile(
  documentId: string,
  profileId: string
): Promise<VaultAPIResponse<any>> {
  try {
    const result = await firebaseVault.linkDocumentToProfile(documentId, profileId);
    return { success: result.success, error: result.error };
  } catch (error) {
    return { success: false, error };
  }
}
