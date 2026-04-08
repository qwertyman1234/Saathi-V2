/**
 * User-friendly error message mapping
 * Converts technical errors to helpful messages for users
 */

export const ERROR_MESSAGES: Record<string, string> = {
  // Firebase Authentication Errors
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Try again or reset your password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/too-many-requests": "Too many failed login attempts. Please wait a few minutes.",
  "auth/email-already-in-use": "This email is already registered. Try logging in instead.",
  "auth/weak-password": "Password is too weak. Use at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/account-exists-with-different-credential": "An account already exists with this email.",
  "auth/popup-closed-by-user": "Sign-in was cancelled. Please try again.",
  "auth/network-request-failed": "Network error. Please check your internet connection.",

  // Firebase Firestore Errors
  "permission-denied": "You don't have permission to perform this action.",
  "not-found": "The item you're looking for doesn't exist or was deleted.",
  "already-exists": "This item already exists. Please choose a different name.",
  "failed-precondition": "You cannot perform this action right now. Please try again later.",
  "invalid-argument": "Some of the information you provided is invalid.",
  "resource-exhausted": "Storage limit reached. Please delete some items and try again.",

  // File Upload Errors
  "file-too-large": "File is too large. Please use a file under 900 KB.",
  "invalid-file-type": "This file type is not allowed. Please upload a valid document.",

  // General Errors
  "network-error": "Network error. Please check your internet connection and try again.",
  "timeout": "Request took too long. Please try again.",
  "unknown-error": "Something went wrong. Please try again or contact support.",
};

/**
 * Map Firebase error codes to user-friendly messages
 */
export function getUserFriendlyError(error: any): string {
  if (!error) return ERROR_MESSAGES["unknown-error"];

  // Check for Firebase error code
  if (error.code) {
    return ERROR_MESSAGES[error.code] || ERROR_MESSAGES["unknown-error"];
  }

  // Check for custom error messages
  if (error.message && ERROR_MESSAGES[error.message]) {
    return ERROR_MESSAGES[error.message];
  }

  // Return custom message if available, otherwise generic error
  if (error.message && typeof error.message === "string") {
    return error.message;
  }

  return ERROR_MESSAGES["unknown-error"];
}

/**
 * Form validation error messages
 */
export const VALIDATION_MESSAGES = {
  required: (field: string) => `${field} is required`,
  email: "Please enter a valid email address",
  phone: "Please enter a valid phone number",
  password: "Password must be at least 6 characters",
  passwordMatch: "Passwords do not match",
  age: "Please enter a valid age",
  dateOfBirth: "Please select a valid date of birth",
  futureDate: "Please select a past date",
  url: "Please enter a valid URL",
  minLength: (field: string, length: number) => `${field} must be at least ${length} characters`,
  maxLength: (field: string, length: number) => `${field} must be at most ${length} characters`,
};

/**
 * Success messages for common operations
 */
export const SUCCESS_MESSAGES = {
  saved: "Changes saved successfully!",
  created: "Item created successfully!",
  deleted: "Item deleted successfully!",
  updated: "Item updated successfully!",
  uploaded: "File uploaded successfully!",
  sent: "Message sent successfully!",
  claimed: "Claim submitted successfully!",
  added: " added successfully!",
  removed: " removed successfully!",
};
