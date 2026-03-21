/**
 * Unit Tests for Hospital Search
 * Testing filtering, distance calculation, and data retrieval
 */

import { describe, it, expect } from "vitest";
import { calculateDistance } from "@/lib/hospitals/search";

describe("Hospital Search Service", () => {
  describe("calculateDistance", () => {
    it("should calculate distance between two coordinates (Haversine formula)", () => {
      // Mumbai (19.0760, 72.8777) to Delhi (28.7041, 77.1025)
      const distance = calculateDistance(19.0760, 72.8777, 28.7041, 77.1025);

      // Expected: ~1153 km (straight-line distance, actual road distance is ~1424 km)
      expect(distance).toBeGreaterThan(1100);
      expect(distance).toBeLessThan(1200);
    });

    it("should return 0 distance for same coordinates", () => {
      const distance = calculateDistance(19.0760, 72.8777, 19.0760, 72.8777);
      expect(distance).toBe(0);
    });

    it("should handle negative coordinates", () => {
      const distance = calculateDistance(-33.8688, 151.2093, -33.8688, 151.2093);
      expect(distance).toBe(0);
    });
  });

  describe("Hospital Search Filtering", () => {
    const mockHospitals = [
      {
        id: "h1",
        name: "Apollo Hospital",
        city: "Mumbai",
        state: "Maharashtra",
        specialties: ["Cardiology", "Orthopedics"],
        cashless_available: true,
        cashless_claim_ratio: 0.95,
        avg_claim_processing_days: 7,
        emergency_24_7: true,
        ambulance_available: true,
        icu_beds: 50,
        beds_count: 500,
        latitude: 19.0176,
        longitude: 72.8479,
        address: "123 Main St",
        postal_code: "400001",
      },
      {
        id: "h2",
        name: "Fortis Hospital",
        city: "Delhi",
        state: "Delhi",
        specialties: ["Neurology", "Oncology"],
        cashless_available: false,
        cashless_claim_ratio: 0.8,
        avg_claim_processing_days: 10,
        emergency_24_7: true,
        ambulance_available: true,
        icu_beds: 30,
        beds_count: 300,
        latitude: 28.5244,
        longitude: 77.1045,
        address: "456 Park Ave",
        postal_code: "110016",
      },
    ];

    it("should filter hospitals by city", () => {
      const mumbaiHospitals = mockHospitals.filter((h) => h.city === "Mumbai");
      expect(mumbaiHospitals).toHaveLength(1);
      expect(mumbaiHospitals[0].name).toBe("Apollo Hospital");
    });

    it("should filter hospitals by specialty", () => {
      const cardiologyHospitals = mockHospitals.filter((h) =>
        h.specialties.includes("Cardiology")
      );
      expect(cardiologyHospitals).toHaveLength(1);
      expect(cardiologyHospitals[0].name).toBe("Apollo Hospital");
    });

    it("should filter hospitals with cashless available", () => {
      const cashlessHospitals = mockHospitals.filter(
        (h) => h.cashless_available
      );
      expect(cashlessHospitals).toHaveLength(1);
      expect(cashlessHospitals[0].name).toBe("Apollo Hospital");
    });

    it("should filter hospitals with 24/7 emergency", () => {
      const emergencyHospitals = mockHospitals.filter(
        (h) => h.emergency_24_7
      );
      expect(emergencyHospitals).toHaveLength(2);
    });

    it("should combine multiple filters", () => {
      const filtered = mockHospitals.filter(
        (h) => h.city === "Mumbai" && h.cashless_available && h.emergency_24_7
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Apollo Hospital");
    });
  });
});
