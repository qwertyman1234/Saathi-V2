/**
 * Encryption Service for Sensitive Data
 * IRDA Compliance: Encrypts PAN, Aadhaar, and other PII
 * 
 * Uses crypto-js for browser encryption
 * For production, use server-side encryption with TweetNaCl
 */

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || "default-key-change-in-production";

/**
 * Encrypt sensitive string
 */
export async function encryptSensitiveData(
  plaintext: string,
  key: string = ENCRYPTION_KEY
): Promise<EncryptedData> {
  try {
    // Dynamic import to keep crypto-js lightweight
    const CryptoJS = await import("crypto-js");

    // Generate random IV
    const iv = CryptoJS.lib.WordArray.random(16);

    // Encrypt data
    const encrypted = CryptoJS.AES.encrypt(plaintext, CryptoJS.enc.Utf8.parse(key), {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv.toString(),
      authTag: "", // Placeholder for AEAD
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt sensitive string
 */
export async function decryptSensitiveData(
  encryptedData: EncryptedData,
  key: string = ENCRYPTION_KEY
): Promise<string> {
  try {
    const CryptoJS = await import("crypto-js");

    const decrypted = CryptoJS.AES.decrypt(
      encryptedData.encrypted,
      CryptoJS.enc.Utf8.parse(key),
      {
        iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Secure hash function (SHA-256)
 * For password verification
 */
export async function hashSensitiveData(plaintext: string): Promise<string> {
  try {
    const CryptoJS = await import("crypto-js");
    return CryptoJS.SHA256(plaintext).toString();
  } catch (error) {
    console.error("Hashing failed:", error);
    throw new Error("Failed to hash data");
  }
}

/**
 * Encrypt PAN (Permanent Account Number)
 */
export async function encryptPAN(pan: string): Promise<EncryptedData> {
  // Validate PAN format (20 characters)
  if (!pan || pan.length !== 20) {
    throw new Error("Invalid PAN format");
  }
  return encryptSensitiveData(pan);
}

/**
 * Encrypt Aadhaar (12-digit number)
 * Note: Storing Aadhaar is regulated - consider storing only hash
 */
export async function encryptAadhaar(aadhaar: string): Promise<EncryptedData> {
  // Only store last 4 digits in plain, encrypt full number
  if (!aadhaar || aadhaar.length !== 12) {
    throw new Error("Invalid Aadhaar format");
  }

  // Store only last 4 digits public
  const last4 = aadhaar.slice(-4);
  const encrypted = await encryptSensitiveData(aadhaar);

  return {
    ...encrypted,
    // Store last 4 for reference
    authTag: last4,
  };
}

/**
 * Encrypt Bank Account Number
 */
export async function encryptBankAccount(accountNumber: string): Promise<EncryptedData> {
  if (!accountNumber || accountNumber.length < 9) {
    throw new Error("Invalid bank account number");
  }
  return encryptSensitiveData(accountNumber);
}

/**
 * Mask sensitive data for display
 * E.g., "1234567890123456" -> "****7890123456"
 */
export function maskSensitiveData(
  data: string,
  visibleChars: number = 4
): string {
  if (data.length <= visibleChars) {
    return "*".repeat(data.length);
  }
  const masked = "*".repeat(data.length - visibleChars);
  return masked + data.slice(-visibleChars);
}

/**
 * Validate and hash password
 */
export async function validateAndHashPassword(password: string): Promise<{
  valid: boolean;
  error?: string;
  hash?: string;
}> {
  // Password requirements
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain uppercase letters" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain numbers" };
  }

  if (!/[!@#$%^&*]/.test(password)) {
    return { valid: false, error: "Password must contain special characters" };
  }

  const hash = await hashSensitiveData(password);
  return { valid: true, hash };
}

/**
 * Secure string comparison (prevent timing attacks)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate secure random token
 */
export async function generateSecureToken(length: number = 32): Promise<string> {
  try {
    const CryptoJS = await import("crypto-js");
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    console.error("Token generation failed:", error);
    throw new Error("Failed to generate secure token");
  }
}

/**
 * IRDA Compliance: Sensitive fields that should be encrypted when stored
 */
export const SENSITIVE_FIELDS = {
  PAN: "pan",
  AADHAAR: "aadhaar",
  BANK_ACCOUNT: "bankAccount",
  PHONE: "phone",
  EMAIL: "email",
  DOB: "dateOfBirth",
  MEDICAL_HISTORY: "medicalHistory",
};

/**
 * Encrypt object containing sensitive fields
 */
export async function encryptSensitiveFields(
  obj: Record<string, any>,
  fieldsToEncrypt: string[]
): Promise<Record<string, any>> {
  const encrypted = { ...obj };

  for (const field of fieldsToEncrypt) {
    if (encrypted[field]) {
      encrypted[field] = await encryptSensitiveData(
        String(encrypted[field])
      );
    }
  }

  return encrypted;
}

/**
 * Decrypt object containing sensitive fields
 */
export async function decryptSensitiveFields(
  obj: Record<string, any>,
  fieldsToDecrypt: string[]
): Promise<Record<string, any>> {
  const decrypted = { ...obj };

  for (const field of fieldsToDecrypt) {
    if (
      decrypted[field] &&
      typeof decrypted[field] === "object" &&
      "encrypted" in decrypted[field]
    ) {
      decrypted[field] = await decryptSensitiveData(decrypted[field]);
    }
  }

  return decrypted;
}
