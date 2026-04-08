/**
 * Vault Context - Manages extracted user data from documents
 * Makes extracted data available globally for form autofill
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { ExtractedDataRecord } from '@/lib/vault/types';

export interface FamilyMember {
  id: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  relation?: string;
  email?: string;
  mobileNumber?: string;
  extractedData?: ExtractedDataRecord;
}

interface VaultContextType {
  extractedData: ExtractedDataRecord | null;
  setExtractedData: (data: ExtractedDataRecord | null) => void;
  familyProfile: any | null;
  setFamilyProfile: (profile: any) => void;
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (memberId: string) => void;
  clearVaultData: () => void;
  // Helper to get specific standardized field for form autofill
  getFieldValue: (fieldName: string) => string | null;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [extractedData, setExtractedData] = useState<ExtractedDataRecord | null>(null);
  const [familyProfile, setFamilyProfile] = useState<any | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const addFamilyMember = (member: FamilyMember) => {
    setFamilyMembers(prev => {
      const exists = prev.some(m => m.id === member.id);
      if (exists) {
        return prev.map(m => m.id === member.id ? member : m);
      }
      return [...prev, member];
    });
  };

  const removeFamilyMember = (memberId: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const clearVaultData = () => {
    setExtractedData(null);
    setFamilyProfile(null);
    setFamilyMembers([]);
  };

  const getFieldValue = (fieldName: string): string | null => {
    if (!extractedData?.standardizedData) return null;
    
    const value = (extractedData.standardizedData as any)?.[fieldName];
    
    if (typeof value === 'string') {
      return value;
    } else if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return value ? String(value) : null;
  };

  return (
    <VaultContext.Provider
      value={{
        extractedData,
        setExtractedData,
        familyProfile,
        setFamilyProfile,
        familyMembers,
        setFamilyMembers,
        addFamilyMember,
        removeFamilyMember,
        clearVaultData,
        getFieldValue,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
