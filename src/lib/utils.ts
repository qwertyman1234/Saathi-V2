import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAdminEmail } from "@/config/adminEmails";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type UserRole = "admin" | "employee" | "user";

/**
 * Determine user role based on email
 */
export function getRoleFromEmail(email: string): UserRole {
  return isAdminEmail(email) ? "admin" : "user";
}

/**
 * Check if user has admin role
 */
export function isAdmin(role?: UserRole): role is "admin" {
  return role === "admin";
}
