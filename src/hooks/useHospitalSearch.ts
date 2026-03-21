/**
 * useHospitalSearch Hook
 * Manages hospital search and filtering
 */

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  searchHospitals,
  getNearestHospitals,
  getHospitalsBySpecialty,
  type Hospital,
  type HospitalSearchParams,
} from "@/lib/hospitals/search";

interface UseHospitalSearchOptions {
  initialCity?: string;
  initialSpecialty?: string;
  autoSearch?: boolean;
}

export function useHospitalSearch(options: UseHospitalSearchOptions = {}) {
  const [searchParams, setSearchParams] = useState<HospitalSearchParams>({
    city: options.initialCity,
    specialty: options.initialSpecialty,
    limit: 20,
  });

  const [useLocationSearch, setUseLocationSearch] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Get user's current location
  const getUserLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setUseLocationSearch(true);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Main hospital search query
  const { data: hospitals, isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ["hospitals", searchParams, useLocationSearch, userLocation],
    queryFn: async () => {
      if (useLocationSearch && userLocation) {
        return getNearestHospitals(
          userLocation.latitude,
          userLocation.latitude,
          searchParams.radiusKm || 10,
          searchParams.limit || 20
        );
      }
      return searchHospitals(searchParams);
    },
    enabled: options.autoSearch !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update search parameters
  const updateSearch = useCallback((params: Partial<HospitalSearchParams>) => {
    setSearchParams((prev) => ({ ...prev, ...params }));
    setUseLocationSearch(false);
  }, []);

  // Filter functions
  const filterByCity = useCallback((city: string) => {
    updateSearch({ city, offset: 0 });
  }, [updateSearch]);

  const filterBySpecialty = useCallback((specialty: string) => {
    updateSearch({ specialty, offset: 0 });
  }, [updateSearch]);

  const filterByState = useCallback((state: string) => {
    updateSearch({ state, offset: 0 });
  }, [updateSearch]);

  const toggleCashlessOnly = useCallback(() => {
    updateSearch({
      cashlessOnly: !searchParams.cashlessOnly,
      offset: 0,
    });
  }, [searchParams.cashlessOnly, updateSearch]);

  const toggleEmergency24x7 = useCallback(() => {
    updateSearch({
      emergency24x7: !searchParams.emergency24x7,
      offset: 0,
    });
  }, [searchParams.emergency24x7, updateSearch]);

  const resetFilters = useCallback(() => {
    setSearchParams({
      city: options.initialCity,
      specialty: options.initialSpecialty,
      limit: 20,
    });
    setUseLocationSearch(false);
  }, [options.initialCity, options.initialSpecialty]);

  return {
    // Data
    hospitals: hospitals || [],
    isSearching,
    searchError,
    
    // Search state
    searchParams,
    userLocation,
    useLocationSearch,

    // Update methods
    updateSearch,
    filterByCity,
    filterBySpecialty,
    filterByState,
    toggleCashlessOnly,
    toggleEmergency24x7,
    resetFilters,
    getUserLocation,
  };
}

/**
 * useHospitalDetail Hook
 * Get detailed information about a specific hospital
 */
export function useHospitalDetail(hospitalId: string | null) {
  const { data: hospital, isLoading, error } = useQuery({
    queryKey: ["hospital", hospitalId],
    queryFn: async () => {
      if (!hospitalId) return null;
      const { getHospitalById } = await import("@/lib/hospitals/search");
      return getHospitalById(hospitalId);
    },
    enabled: !!hospitalId,
  });

  return {
    hospital: hospital || null,
    isLoading,
    error,
  };
}
