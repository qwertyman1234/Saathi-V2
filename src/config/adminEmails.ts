/**
 * Admin email whitelist
 * Users with these email addresses will be granted admin role on signup/login
 * Add or remove emails as needed
 */

export const ADMIN_EMAILS = [
  "namangod0@gmail.com",
  // Add more admin emails here
];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.some((adminEmail) =>
    adminEmail.toLowerCase() === email.toLowerCase()
  );
}
