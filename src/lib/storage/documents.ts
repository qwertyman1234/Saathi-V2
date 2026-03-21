/**
 * Firebase Storage Document Service
 * Handles uploading and managing claim documents
 */

import { storage } from "@/lib/firebase";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from "firebase/storage";

export interface DocumentMetadata {
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  url: string;
  contentType: string;
}

/**
 * Upload claim document
 */
export async function uploadClaimDocument(
  userId: string,
  claimId: string,
  file: File,
  documentType: string
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    // Validate file
    if (!file) {
      return { success: false, error: "No file selected" };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File size must be less than 10MB" };
    }

    // Check file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: "File type not allowed. Use PDF, Image, or Word files.",
      };
    }

    // Create storage path: /claims/{userId}/{claimId}/{documentType}_{timestamp}.ext
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "";
    const safePath = `claims/${userId}/${claimId}/${documentType}_${timestamp}.${fileExtension}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, safePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        documentType,
        claimId,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadUrl };
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to upload document",
    };
  }
}

/**
 * Get all documents for a claim
 */
export async function getClaimDocuments(
  userId: string,
  claimId: string
): Promise<DocumentMetadata[]> {
  try {
    const claimDir = ref(storage, `claims/${userId}/${claimId}`);
    const { items } = await listAll(claimDir);

    const documents: DocumentMetadata[] = [];

    for (const itemRef of items) {
      const metadata = await getMetadata(itemRef);
      const url = await getDownloadURL(itemRef);

      documents.push({
        name: itemRef.name,
        size: metadata.size || 0,
        type: metadata.contentType || "application/octet-stream",
        uploadedAt: metadata.timeCreated
          ? new Date(metadata.timeCreated)
          : new Date(),
        url,
        contentType: metadata.contentType || "",
      });
    }

    return documents;
  } catch (error) {
    console.error("Error fetching claim documents:", error);
    return [];
  }
}

/**
 * Delete a document
 */
export async function deleteClaimDocument(
  userId: string,
  claimId: string,
  documentName: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const docRef = ref(
      storage,
      `claims/${userId}/${claimId}/${documentName}`
    );
    await deleteObject(docRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete document",
    };
  }
}

/**
 * Upload policy document (PDF)
 */
export async function uploadPolicyDocument(
  userId: string,
  policyNumber: string,
  file: File
): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    if (!file) {
      return { success: false, error: "No file selected" };
    }

    if (file.type !== "application/pdf") {
      return { success: false, error: "Only PDF files are allowed for policies" };
    }

    const timestamp = Date.now();
    const safePath = `policies/${userId}/${policyNumber}_${timestamp}.pdf`;

    const storageRef = ref(storage, safePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: "application/pdf",
      customMetadata: {
        policyNumber,
        uploadedAt: new Date().toISOString(),
      },
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadUrl };
  } catch (error) {
    console.error("Error uploading policy document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Get policy document URL
 */
export async function getPolicyDocumentUrl(
  userId: string,
  policyNumber: string
): Promise<string | null> {
  try {
    const pathRef = ref(storage, `policies/${userId}`);
    const { items } = await listAll(pathRef);

    const policyFile = items.find((item) =>
      item.name.startsWith(policyNumber)
    );

    if (!policyFile) return null;

    return await getDownloadURL(policyFile);
  } catch (error) {
    console.error("Error getting policy document:", error);
    return null;
  }
}

/**
 * Required documents for claim submission
 */
export const REQUIRED_CLAIM_DOCUMENTS = [
  { type: "discharge_summary", label: "Discharge Summary", required: true },
  { type: "medical_reports", label: "Medical Reports", required: true },
  { type: "hospital_bills", label: "Hospital Bills", required: true },
  { type: "id_proof", label: "ID Proof", required: true },
  { type: "insurance_card", label: "Insurance Card", required: true },
  { type: "prescription", label: "Prescription", required: false },
  { type: "lab_reports", label: "Lab Reports", required: false },
];

/**
 * Validate claim documents completeness
 */
export function validateClaimDocuments(uploadedDocs: DocumentMetadata[]): {
  valid: boolean;
  missing: string[];
} {
  const uploadedTypes = new Set(
    uploadedDocs.map((doc) => {
      // Extract type from filename: "discharge_summary_1234.pdf" -> "discharge_summary"
      const match = doc.name.match(/^([a-z_]+)_\d+/);
      return match ? match[1] : null;
    })
  );

  const required = REQUIRED_CLAIM_DOCUMENTS.filter((d) => d.required).map(
    (d) => d.type
  );
  const missing = required.filter((type) => !uploadedTypes.has(type));

  return {
    valid: missing.length === 0,
    missing: missing.map(
      (type) => REQUIRED_CLAIM_DOCUMENTS.find((d) => d.type === type)?.label || type
    ),
  };
}
