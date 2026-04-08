// pages/InsuranceVault.tsx
import React from 'react';
import { VaultDashboard } from '@/components/vault/VaultDashboard';
import { Layout } from '@/components/Layout';

/**
 * Insurance Vault Page
 * 
 * This page provides access to:
 * - Document upload and management
 * - Family profile creation
 * - AI-powered data extraction
 * - Intelligent form autofill
 */
function InsuranceVaultPage() {
  return (
    <Layout>
      <div className="min-h-screen">
        <VaultDashboard />
      </div>
    </Layout>
  );
}

export default InsuranceVaultPage;
