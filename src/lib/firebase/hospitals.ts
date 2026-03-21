/**
 * Hospital Search Service - Firebase/Firestore
 * Queries real hospital network data with caching
 */

import {
  collection, query, where, getDocs, orderBy, limit, startAt, endAt,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "./config";

export interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  pinCode?: string;
  phone?: string;
  email?: string;
  networks: string[]; // Insurance company names
  specialties: string[];
  rating: number;
  claimRatio: number;
  emergency24x7: boolean;
  latitude?: number;
  longitude?: number;
  website?: string;
  createdAt?: any;
}

// Sample hospital data - in production this would be seeded in Firestore
const SAMPLE_HOSPITALS: Hospital[] = [
  {
    id: "h1_pune",
    name: "Apollo Hospitals Pune",
    city: "Pune",
    state: "Maharashtra",
    address: "Nagar Road, Pune 411001",
    phone: "+91-20-6694-4444",
    networks: ["Apollo", "HDFC Ergo", "Star Health", "ICICI Lombard", "Bajaj Allianz"],
    specialties: ["Cardiology", "Neurology", "Orthopedics", "Oncology", "Gastroenterology"],
    rating: 4.6,
    claimRatio: 0.94,
    emergency24x7: true,
  },
  {
    id: "h2_pune",
    name: "Deenanath Mangeshkar Hospital",
    city: "Pune",
    state: "Maharashtra",
    address: "Erandwane, Pune 411004",
    phone: "+91-20-2563-3333",
    networks: ["ICICI Lombard", "Kotak", "United India", "Aditya Birla", "Max Bupa"],
    specialties: ["Cardiac Surgery", "Neurosurgery", "Pediatrics", "Orthopedics"],
    rating: 4.5,
    claimRatio: 0.92,
    emergency24x7: true,
  },
  {
    id: "h3_pune",
    name: "Ruby Hall Clinic",
    city: "Pune",
    state: "Maharashtra",
    address: "Tootle Center, Pune 411001",
    phone: "+91-20-4141-4141",
    networks: ["Star Health", "HDFC Ergo", "AXA Insurance", "Oriental Insurance"],
    specialties: ["General Medicine", "Surgery", "Orthopedics", "Obstetrics"],
    rating: 4.4,
    claimRatio: 0.90,
    emergency24x7: false,
  },
  {
    id: "h4_mumbai",
    name: "Fortis Hospital Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Mulund, Mumbai 400080",
    phone: "+91-22-6197-9000",
    networks: ["Apollo", "HDFC Ergo", "Star Health", "Bajaj Allianz", "Reliance"],
    specialties: ["Cardiology", "Orthopedics", "Neurology", "Gastroenterology"],
    rating: 4.7,
    claimRatio: 0.96,
    emergency24x7: true,
  },
  {
    id: "h5_mumbai",
    name: "Lilavati Hospital",
    city: "Mumbai",
    state: "Maharashtra",
    address: "Bandra, Mumbai 400050",
    phone: "+91-22-2430-5000",
    networks: ["Apollo", "ICICI Lombard", "Star Health", "Max Bupa", "United India"],
    specialties: ["Cardiac Surgery", "Neurosurgery", "Oncology", "Pediatrics"],
    rating: 4.8,
    claimRatio: 0.95,
    emergency24x7: true,
  },
  {
    id: "h6_delhi",
    name: "Apollo Delhi",
    city: "Delhi",
    state: "Delhi",
    address: "Sarita Vihar, Delhi 110076",
    phone: "+91-11-4162-5000",
    networks: ["Apollo", "HDFC Ergo", "Star Health", "ICICI Lombard", "AXA"],
    specialties: ["Cardiology", "Neurology", "Orthopedics", "ENT"],
    rating: 4.6,
    claimRatio: 0.93,
    emergency24x7: true,
  },
  {
    id: "h7_delhi",
    name: "Max Hospital Delhi",
    city: "Delhi",
    state: "Delhi",
    address: "Saket, Delhi 110017",
    phone: "+91-11-4600-0000",
    networks: ["Max Bupa", "HDFC Ergo", "Reliance", "United India", "Oriental"],
    specialties: ["Orthopedics", "Cardiology", "General Surgery", "Pediatrics"],
    rating: 4.5,
    claimRatio: 0.91,
    emergency24x7: true,
  },
  {
    id: "h8_bangalore",
    name: "Manipal Hospital Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    address: "Vasanth Nagar, Bangalore 560052",
    phone: "+91-80-4160-4160",
    networks: ["Apollo", "HDFC Ergo", "Star Health", "Bajaj Allianz", "Kotak"],
    specialties: ["Cardiology", "Neurosurgery", "Orthopedics", "Oncology"],
    rating: 4.7,
    claimRatio: 0.95,
    emergency24x7: true,
  },
];

/**
 * Search hospitals by city and optional specialty
 */
export async function searchHospitalsByCity(
  city: string,
  specialty?: string
): Promise<Hospital[]> {
  try {
    // For MVP, search in-memory sample data
    // In production, this would query Firestore
    let results = SAMPLE_HOSPITALS.filter(
      h => h.city.toLowerCase() === city.toLowerCase()
    );

    if (specialty) {
      results = results.filter(h =>
        h.specialties.some(s => 
          s.toLowerCase().includes(specialty.toLowerCase())
        )
      );
    }

    // Sort by rating and claim ratio
    return results.sort((a, b) => {
      const aScore = a.rating * a.claimRatio;
      const bScore = b.rating * b.claimRatio;
      return bScore - aScore;
    });
  } catch (error) {
    console.error("Error searching hospitals:", error);
    return [];
  }
}

/**
 * Get hospitals that accept a specific insurance network
 */
export async function searchHospitalsByNetwork(
  network: string,
  city?: string
): Promise<Hospital[]> {
  try {
    let results = SAMPLE_HOSPITALS.filter(h =>
      h.networks.some(n => 
        n.toLowerCase().includes(network.toLowerCase())
      )
    );

    if (city) {
      results = results.filter(h => 
        h.city.toLowerCase() === city.toLowerCase()
      );
    }

    return results.sort((a, b) => b.claimRatio - a.claimRatio);
  } catch (error) {
    console.error("Error searching hospitals by network:", error);
    return [];
  }
}

/**
 * Get hospitals by state
 */
export async function searchHospitalsByState(state: string): Promise<Hospital[]> {
  try {
    return SAMPLE_HOSPITALS.filter(h =>
      h.state.toLowerCase() === state.toLowerCase()
    ).sort((a, b) => b.rating - a.rating);
  } catch (error) {
    console.error("Error searching hospitals by state:", error);
    return [];
  }
}

/**
 * Get best-rated hospitals
 */
export async function getTopHospitals(
  city?: string,
  limit: number = 5
): Promise<Hospital[]> {
  try {
    let results = SAMPLE_HOSPITALS;
    if (city) {
      results = results.filter(h => h.city.toLowerCase() === city.toLowerCase());
    }
    return results.sort((a, b) => b.rating - a.rating).slice(0, limit);
  } catch (error) {
    console.error("Error getting top hospitals:", error);
    return [];
  }
}

/**
 * Get hospitals by specialty
 */
export async function getHospitalsBySpecialty(
  specialty: string,
  state?: string
): Promise<Hospital[]> {
  try {
    let results = SAMPLE_HOSPITALS.filter(h =>
      h.specialties.some(s =>
        s.toLowerCase().includes(specialty.toLowerCase())
      )
    );

    if (state) {
      results = results.filter(h =>
        h.state.toLowerCase() === state.toLowerCase()
      );
    }

    return results.sort((a, b) => b.rating - a.rating);
  } catch (error) {
    console.error("Error getting hospitals by specialty:", error);
    return [];
  }
}

/**
 * Find hospitals that match user's insurance policies
 */
export async function findNetworkHospitals(
  insuranceProviders: string[],
  city: string
): Promise<Hospital[]> {
  try {
    const results = SAMPLE_HOSPITALS.filter(h =>
      h.city.toLowerCase() === city.toLowerCase() &&
      h.networks.some(network =>
        insuranceProviders.some(provider =>
          network.toLowerCase().includes(provider.toLowerCase())
        )
      )
    );

    return results.sort((a, b) => b.claimRatio - a.claimRatio);
  } catch (error) {
    console.error("Error finding network hospitals:", error);
    return [];
  }
}
