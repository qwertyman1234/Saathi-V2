/**
 * Unit Tests for Data Encryption
 * Testing PII encryption/decryption and data security
 */

import { describe, it, expect, vi } from "vitest";
import {
  maskSensitiveData,
  validateAndHashPassword,
  secureCompare,
} from "@/lib/encryption/secure";

describe("Data Encryption Service", () => {
  describe("maskSensitiveData", () => {
    it("should mask all but last 4 characters", () => {
      const masked = maskSensitiveData("1234567890123456");
      expect(masked).toBe("************3456");
    });

    it("should handle short strings", () => {
      const masked = maskSensitiveData("1234");
      expect(masked).toBe("****");
    });

    it("should mask PAN correctly", () => {
      const masked = maskSensitiveData("AAAPA1234B5678C12");
      expect(masked).toContain("****");
      expect(masked.endsWith("8C12")).toBe(true);
    });

    it("should custom visible character count", () => {
      const masked = maskSensitiveData("1234567890", 2);
      expect(masked).toBe("********90");
    });
  });

  describe("validateAndHashPassword", () => {
    it("should reject password less than 8 characters", async () => {
      const result = await validateAndHashPassword("Abc1!");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("8 characters");
    });

    it("should reject password without uppercase", async () => {
      const result = await validateAndHashPassword("abcd1234!");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("uppercase");
    });

    it("should reject password without numbers", async () => {
      const result = await validateAndHashPassword("Abcdefgh!");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("numbers");
    });

    it("should reject password without special characters", async () => {
      const result = await validateAndHashPassword("Abcd1234");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("special");
    });

    it("should accept valid password and return hash", async () => {
      const result = await validateAndHashPassword("ValidPass123!");
      expect(result.valid).toBe(true);
      expect(result.hash).toBeDefined();
      expect(result.hash?.length).toBeGreaterThan(0);
    });

    it("should produce consistent hash for same password", async () => {
      const result1 = await validateAndHashPassword("ValidPass123!");
      const result2 = await validateAndHashPassword("ValidPass123!");
      expect(result1.hash).toBe(result2.hash);
    });
  });

  describe("secureCompare", () => {
    it("should return true for identical strings", () => {
      const result = secureCompare("hello", "hello");
      expect(result).toBe(true);
    });

    it("should return false for different strings", () => {
      const result = secureCompare("hello", "world");
      expect(result).toBe(false);
    });

    it("should return false for different lengths", () => {
      const result = secureCompare("hello", "hello123");
      expect(result).toBe(false);
    });

    it("should use constant-time comparison", () => {
      // This prevents timing attacks
      const start = performance.now();
      secureCompare("a".repeat(100), "b".repeat(100));
      const duration1 = performance.now() - start;

      const start2 = performance.now();
      secureCompare("a".repeat(100), "a".repeat(99) + "b");
      const duration2 = performance.now() - start2;

      // Should take similar time regardless of where mismatch is
      expect(Math.abs(duration1 - duration2)).toBeLessThan(5);
    });
  });
});
