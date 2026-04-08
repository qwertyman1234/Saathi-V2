/**
 * Example: How to integrate VaultDashboard into your existing application
 *
 * This file demonstrates 3 different integration patterns:
 * 1. Standalone Dashboard page
 * 2. In settings/profile page
 * 3. With custom form schema
 */

import { VaultDashboard } from '@/components/vault/VaultDashboard';
import { FORM_SCHEMAS } from '@/lib/vault/autofill';

// ============================================================
// PATTERN 1: Standalone Vault Dashboard Page
// ============================================================
// Add this to your src/pages/ directory
// Usage: /vault or /documents

export function VaultPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Document Vault</h1>
        <p className="text-muted-foreground mt-2">
          Manage your insurance documents and application forms
        </p>
      </div>

      {/* Full dashboard with all features */}
      <VaultDashboard
        initialTab="vault"
        formSchema={FORM_SCHEMAS.POLICY_PURCHASE}
      />
    </div>
  );
}

// ============================================================
// PATTERN 2: Embedded in User Profile/Settings
// ============================================================
// Add to src/pages/UserProfile.tsx or similar

export function ProfileWithVault() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Existing profile sections */}
      <div className="lg:col-span-1">
        {/* Profile card, settings, etc. */}
      </div>

      {/* Vault dashboard */}
      <div className="lg:col-span-2">
        <div className="bg-card rounded-lg border border-border p-6">
          <VaultDashboard
            initialTab="vault"
            formSchema={FORM_SCHEMAS.POLICY_PURCHASE}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PATTERN 3: With Custom Form Schema
// ============================================================
// For claim submission flow

import { FORM_SCHEMAS } from '@/lib/vault/autofill';

export function ClaimSubmissionFlow() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Submit Insurance Claim</h2>
        <p className="text-muted-foreground mt-2">
          Upload claim documents and we'll auto-fill the form
        </p>
      </div>

      {/* Use claim form schema */}
      <VaultDashboard
        initialTab="autofill"
        formSchema={FORM_SCHEMAS.CLAIM_FORM}
      />
    </div>
  );
}

// ============================================================
// PATTERN 4: With Custom Schema
// ============================================================

export function CustomFormFlow() {
  const customSchema = {
    fields: [
      {
        fieldName: 'beneficiaryName',
        label: 'Beneficiary Name',
        type: 'text',
        extractFromPaths: ['standardizedData.fullName'],
        required: true,
      },
      {
        fieldName: 'relationshipToPolicyholder',
        label: 'Relationship',
        type: 'select',
        required: true,
      },
      {
        fieldName: 'bankAccount',
        label: 'Bank Account Number',
        type: 'text',
        required: true,
      },
    ],
  };

  return (
    <VaultDashboard
      initialTab="autofill"
      formSchema={customSchema}
    />
  );
}

// ============================================================
// PATTERN 5: Router Integration
// ============================================================
// Add to your router configuration

import { BrowserRouter, Routes, Route } from 'react-router-dom';

export const AppRoutes = () => (
  <Routes>
    {/* Existing routes */}

    {/* New Vault routes */}
    <Route path="/vault" element={<VaultPage />} />
    <Route path="/vault/policies" element={<ClaimSubmissionFlow />} />
    <Route path="/vault/claims" element={<ClaimSubmissionFlow />} />
    <Route path="/profile" element={<ProfileWithVault />} />

    {/* Catch-all */}
  </Routes>
);

// ============================================================
// PATTERN 6: Direct Component Usage
// ============================================================
// If you only need specific components

import { FamilyProfilesManager } from '@/components/vault/FamilyProfilesManager';
import { DocumentVault } from '@/components/vault/DocumentVault';
import { AutofillForm } from '@/components/vault/AutofillForm';

export function MinimalVaultSetup() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Just the family profiles manager */}
      <FamilyProfilesManager onProfileSelect={setSelectedProfileId} />

      {/* Just the document vault */}
      {selectedProfileId && (
        <DocumentVault
          familyProfileId={selectedProfileId}
          onDocumentProcessed={(docId) => console.log('Processed:', docId)}
        />
      )}
    </div>
  );
}

// ============================================================
// QUICK START
// ============================================================

/**
 * To quickly add vault functionality to your app:
 *
 * 1. Import the component:
 *    import { VaultDashboard } from '@/components/vault/VaultDashboard';
 *
 * 2. Add to your page:
 *    <VaultDashboard />
 *
 * 3. Ensure .env.local has:
 *    REACT_APP_VAULT_API_URL=http://localhost:5000/api/vault
 *
 * 4. Start backend:
 *    cd backend && npm run dev
 *
 * Done! Users can now upload documents and autofill forms.
 */
