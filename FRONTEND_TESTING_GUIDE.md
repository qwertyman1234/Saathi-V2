# Quick Start Testing Without Backend (for Frontend Development)

If you want to test the frontend components before setting up MongoDB/Firebase, use this mock approach.

## 🚀 Quick Frontend-Only Testing

### Option 1: Component Storybook Test
File: `src/components/vault/VaultDashboard.test.tsx`

```typescript
import { VaultDashboard } from './VaultDashboard';

export default {
  title: 'Vault/Dashboard',
  component: VaultDashboard,
};

export const Default = () => <VaultDashboard />;
export const StartAtAutofill = () => <VaultDashboard initialTab="autofill" />;
```

Run: `npm run storybook` (if installed)

### Option 2: Standalone Component Test
File: `src/pages/VaultTest.tsx`

```typescript
import React from 'react';
import { VaultDashboard } from '@/components/vault/VaultDashboard';

export function VaultTestPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Vault Component Test</h1>
      <p className="text-gray-600 mb-8">
        Testing VaultDashboard without backend (mock data mode)
      </p>
      <VaultDashboard />
    </div>
  );
}

export default VaultTestPage;
```

Add to router:
```typescript
<Route path="/test/vault" element={<VaultTestPage />} />
```

### Option 3: Mock API Service for Testing
File: `src/lib/vault/api.mock.ts`

```typescript
import { IFamilyProfile, IDocument, ExtractedDataRecord } from './types';

const MOCK_PROFILES: IFamilyProfile[] = [
  {
    id: '1',
    userId: 'test-user',
    relation: 'Self',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-15',
    email: 'john@example.com',
    phone: '9876543210',
    address: {
      street: '123 Main St',
      city: 'Mumbai',
      state: 'MH',
      zip: '400001'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const MOCK_DOCUMENTS: IDocument[] = [
  {
    id: '1',
    userId: 'test-user',
    familyProfileId: '1',
    fileName: 'sample-aadhaar.pdf',
    fileType: 'AADHAAR',
    fileSize: 1024000,
    uploadedAt: new Date(),
    isEncrypted: false,
    extractionStatus: 'completed',
    extractedDataId: '1'
  }
];

export const mockApi = {
  getFamilyProfiles: async () => MOCK_PROFILES,
  createFamilyProfile: async (data: any) => ({ 
    ...data, 
    id: Date.now().toString() 
  }),
  getDocuments: async () => MOCK_DOCUMENTS,
  processDocument: async (id: string) => ({
    status: 'success',
    documentId: id
  }),
  getExtractedData: async (docId: string) => {
    return {
      name: 'John Doe',
      dateOfBirth: '1990-01-15',
      address: '123 Main St, Mumbai',
      policyNumber: 'POL123456789',
      confidence: 85
    };
  }
};
```

## 🧪 Testing Your Own Data

### 1. Create Test Documents
Save sample documents to `backend/uploads/test/`:
- `aadhaar-sample.pdf`
- `pan-sample.jpg`
- `policy-sample.pdf`

### 2. Use Browser DevTools to Mock Network
In Chrome DevTools Network tab:
1. Right-click request
2. "Override content"
3. Return mock JSON

### 3. Local Storage Testing
```typescript
// Store test data in localStorage:
const testData = {
  families: [...],
  documents: [...]
};

localStorage.setItem('vault_test_data', JSON.stringify(testData));
```

## 📋 Test Data Checklist

Use this checklist to verify component rendering:

- [ ] Family Profile Creation Form appears
- [ ] All input fields visible (name, DOB, phone, address)
- [ ] Form validation works (required fields)
- [ ] Can submit form without error
- [ ] Profiles list displays created profiles
- [ ] Document upload area shows
- [ ] Can select file without backend
- [ ] Extraction preview modal opens
- [ ] Autofill form displays with test data
- [ ] Confidence indicators show colors
- [ ] Can edit form fields
- [ ] Submit button clickable

## 🔍 Visual Testing Without Backend

Test these UI elements:

### Family Profiles Tab
```
[Create New Profile Button]
[Table with existing profiles]
  - Profile name
  - Relation
  - Actions (Edit/Delete)
[Edit Dialog opens]
  - All form fields show
  - Validation messages appear
  - Buttons (Save/Cancel) work
```

### Document Vault Tab
```
[Drag-drop upload area]
  - File icons show
  - Size/type validation displays
[Documents List]
  - Document cards show
  - Icons for doc type
  - Status badges (pending/completed)
  - Action buttons (Extract/Delete)
```

### Autofill Tab
```
[Form Schema Selector]
  - Policy Purchase
  - Claim Form
  - Identity Verification
[Form Fields]
  - Field inputs appear
  - Confidence bars show
  - Color coding works (green/yellow/red)
  - Editable fields respond to input
[Actions]
  - Reset clears form
  - Submit button clickable
```

## 🚀 When Ready for Backend

Once you have MongoDB + Firebase set up, change API calls:

File: `src/lib/vault/api.ts`

```typescript
// Already configured for:
const API_URL = process.env.REACT_APP_VAULT_API_URL || 'http://localhost:5000/api/vault';

// Just add to .env.local:
REACT_APP_VAULT_API_URL=http://localhost:5000/api/vault
```

Then start your backend and components will automatically use real APIs!

## ✨ Component Feature Testing

### Test Each Feature:

**1. Document Upload**
- [ ] Click upload area
- [ ] Select file
- [ ] Show progress
- [ ] Add to document list

**2. Profile Management**
- [ ] Create profile with all fields
- [ ] Edit existing profile
- [ ] Delete profile (confirm dialog)
- [ ] Load profiles from list

**3. Data Extraction**
- [ ] Click "Extract Data"
- [ ] Show loading state
- [ ] Display extracted fields
- [ ] Show confidence scores
- [ ] Mask sensitive data option

**4. Autofill**
- [ ] Select form schema
- [ ] Fields populate from extraction
- [ ] Show confidence indicators
- [ ] Allow editing
- [ ] Reset form
- [ ] Submit form

**5. Error Handling**
- [ ] Show upload errors clearly
- [ ] Network timeout handled
- [ ] Form validation shows messages
- [ ] Loading states prevent double-click

## 📈 Performance Testing

Without backend:
- [ ] Components render quickly
- [ ] Form inputs responsive
- [ ] Modals open/close smoothly
- [ ] Lists scroll without lag
- [ ] No console errors

## 🎯 Next: Add Real Backend

After confirming frontend works:

1. Set up MongoDB (Atlas)
2. Get Firebase credentials
3. Start backend server
4. Test with real data
5. Deploy!

---

**Status**: Frontend ready ✅ | Backend ready (needs config) ⏳
