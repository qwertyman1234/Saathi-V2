/**
 * Hospital Search Service
 * Queries hospital networks from Supabase
 */

import { supabase } from "@/lib/supabase";

export interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  specialties: string[];
  departments: string[];
  cashless_available: boolean;
  cashless_claim_ratio: number;
  avg_claim_processing_days: number;
  emergency_24_7: boolean;
  ambulance_available: boolean;
  icu_beds: number;
  address: string;
  postal_code: string;
  google_maps_url?: string;
}

export interface HospitalSearchParams {
  city?: string;
  state?: string;
  specialty?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  cashlessOnly?: boolean;
  emergency24x7?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Search hospitals by filters
 */
export async function searchHospitals(
  params: HospitalSearchParams
): Promise<Hospital[]> {
  try {
    let query = supabase
      .from("hospital_networks")
      .select(
        `id, name, city, state, latitude, longitude, phone, email, 
        specialties, departments, cashless_available, cashless_claim_ratio,
        avg_claim_processing_days, emergency_24_7, ambulance_available, 
        icu_beds, address, postal_code, google_maps_url`
      )
      .eq("network_status", "active")
      .eq("is_empaneled", true);

    // Filter by city
    if (params.city) {
      query = query.ilike("city", `%${params.city}%`);
    }

    // Filter by state
    if (params.state) {
      query = query.eq("state", params.state);
    }

    // Filter by specialty (using array contains)
    if (params.specialty) {
      query = query.contains("specialties", [params.specialty]);
    }

    // Filter by cashless only
    if (params.cashlessOnly) {
      query = query.eq("cashless_available", true);
    }

    // Filter by 24/7 emergency
    if (params.emergency24x7) {
      query = query.eq("emergency_24_7", true);
    }

    // Pagination
    const limit = params.limit || 20;
    const offset = params.offset || 0;
    query = query.range(offset, offset + limit - 1);

    // Sort by relevance (updated_at desc)
    query = query.order("updated_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Hospital search failed: ${error.message}`);
    }

    return (data as Hospital[]) || [];
  } catch (error) {
    console.error("Error searching hospitals:", error);
    throw error;
  }
}

/**
 * Get single hospital by ID
 */
export async function getHospitalById(hospitalId: string): Promise<Hospital | null> {
  try {
    const { data, error } = await supabase
      .from("hospital_networks")
      .select("*")
      .eq("id", hospitalId)
      .single();

    if (error) {
      console.error("Error fetching hospital:", error);
      return null;
    }

    return data as Hospital;
  } catch (error) {
    console.error("Error in getHospitalById:", error);
    return null;
  }
}

/**
 * Get hospitals by specialty
 */
export async function getHospitalsBySpecialty(
  specialty: string,
  city?: string,
  limit: number = 10
): Promise<Hospital[]> {
  return searchHospitals({
    specialty,
    city,
    limit,
    cashlessOnly: true,
  });
}

/**
 * Get nearest hospitals by coordinates
 * Note: Requires PostGIS extension in PostgreSQL
 */
export async function getNearestHospitals(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  limit: number = 10
): Promise<Hospital[]> {
  try {
    const { data, error } = await supabase
      .from("hospital_networks")
      .select(
        `id, name, city, state, latitude, longitude, phone, email,
        specialties, departments, cashless_available, cashless_claim_ratio,
        avg_claim_processing_days, emergency_24_7, ambulance_available,
        icu_beds, address, postal_code, google_maps_url`
      )
      .eq("network_status", "active")
      .eq("is_empaneled", true)
      // Distance calculation (if PostGIS is enabled)
      // For MVP without PostGIS, use basic coordinate filtering
      .gte("latitude", latitude - (radiusKm / 111))
      .lte("latitude", latitude + (radiusKm / 111))
      .gte("longitude", longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))
      .lte("longitude", longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))))
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get nearest hospitals: ${error.message}`);
    }

    return (data as Hospital[]) || [];
  } catch (error) {
    console.error("Error getting nearest hospitals:", error);
    return [];
  }
}

/**
 * Get hospital statistics for a city
 */
export async function getHospitalStats(city: string): Promise<{
  totalCount: number;
  cashlessCount: number;
  emergency24x7Count: number;
  specialties: string[];
}> {
  try {
    const hospitals = await searchHospitals({ city, limit: 1000 });

    const specialtiesSet = new Set<string>();
    let cashlessCount = 0;
    let emergency24x7Count = 0;

    hospitals.forEach((hospital) => {
      hospital.specialties.forEach((s) => specialtiesSet.add(s));
      if (hospital.cashless_available) cashlessCount++;
      if (hospital.emergency_24_7) emergency24x7Count++;
    });

    return {
      totalCount: hospitals.length,
      cashlessCount,
      emergency24x7Count,
      specialties: Array.from(specialtiesSet),
    };
  } catch (error) {
    console.error("Error getting hospital stats:", error);
    return {
      totalCount: 0,
      cashlessCount: 0,
      emergency24x7Count: 0,
      specialties: [],
    };
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
