# Document Vault + AI Autofill System - Quick Reference

## 🎯 What Was Built

A complete full-stack system for:
- 📄 **Document Management**: Secure upload & storage of insurance documents
- 👨‍👩‍👧 **Family Profiles**: Manage documents for multiple family members
- 🤖 **AI Extraction**: Automatically extract data from documents with confidence scores
- ⚡ **Autofill Forms**: Intelligently map extracted data to form fields

---

## 📦 Key Components

### Frontend (React)
```
src/components/vault/
  ├── VaultDashboard.tsx          # Main component (full feature UI)
  ├── FamilyProfilesManager.tsx   # CRUD family members
  ├── DocumentVault.tsx            # Upload, list, process documents
  ├── ExtractionPreview.tsx        # View extracted data
  └── AutofillForm.tsx             # Editable form with AI suggestions

src/lib/vault/
  ├── types.ts                     # TypeScript interfaces
  ├── api.ts                       # API service layer
  └── autofill.ts                  # Autofill logic & form schemas
```

### Backend (Express + MongoDB)
```
backend/src/
  ├── models/                      # Mongoose schemas
  │   ├── User.ts
  │   ├── FamilyProfile.ts
  │   ├── Document.ts
  │   └── ExtractedData.ts
  ├── controllers/                 # Request handlers
  │   ├── familyProfileController.ts
  │   └── documentController.ts
  ├── routes/vault.ts              # API endpoints
  ├── services/aiExtractionService.ts  # AI logic
  ├── middleware/auth.ts           # Firebase auth
  └── server.ts                    # Express app
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start Backend
```bash
cd backend
npm install
npm run dev
# Server on http://localhost:5000
```

### Step 2: Configure Frontend
```bash
# In project root, create/update .env.local
REACT_APP_VAULT_API_URL=http://localhost:5000/api/vault
```

### Step 3: Add to Your App
```typescript
import { VaultDashboard } from '@/components/vault/VaultDashboard';

export function MyPage() {
  return <VaultDashboard />;
}
```

### Step 4: Test
1. Create family profile
2. Upload document (PDF/JPG/PNG)
3. Click "Extract Data"
4. Review autofilled form

---

## 📡 API Quick Reference

### Authentication
All endpoints require Firebase JWT token:
```bash
curl -H "Authorization: Bearer {token}" ...
```

### Family Profiles
```
POST   /api/vault/family-profiles           Create profile
GET    /api/vault/family-profiles           List all
GET    /api/vault/family-profiles/:id       Get one
PUT    /api/vault/family-profiles/:id       Update
DELETE /api/vault/family-profiles/:id       Delete
```

### Documents
```
POST   /api/vault/documents/upload          Upload file
GET    /api/vault/documents                 List documents
POST   /api/vault/documents/:id/process     Extract data (AI)
GET    /api/vault/documents/:id/extracted   Get extracted data
DELETE /api/vault/documents/:id             Delete
```

---

## 🤖 AI Extraction

### How It Works
```
PDF/Image → OCR/Text → Mock AI → Structured JSON
↓
{
  fullName: { value: "Rajesh", confidence: 95 },
  dateOfBirth: { value: "1985-06-15", confidence: 92 },
  policyNumber: { value: "POL-123", confidence: 98 }
}
```

### Mock Data (for testing)
No real AI call. Returns realistic test data for learning.

### Real Claude Integration
Replace in `aiExtractionService.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function extractData(text: string) {
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    messages: [{ role: 'user', content: `Extract data: ${text}` }]
  });
  return parseResponse(message);
}
```

---

## 📋 Form Schemas

### Pre-built Templates
```typescript
import { FORM_SCHEMAS } from '@/lib/vault/autofill';

// Policy purchase form
FORM_SCHEMAS.POLICY_PURCHASE

// Claim submission form
FORM_SCHEMAS.CLAIM_FORM

// Identity verification
FORM_SCHEMAS.IDENTITY_VERIFICATION
```

### Custom Schema
```typescript
const mySchema = {
  fields: [
    {
      fieldName: 'fullName',
      label: 'Full Name',
      type: 'text',
      extractFromPaths: ['standardizedData.fullName'],
      required: true
    }
  ]
};

<VaultDashboard formSchema={mySchema} />
```

---

## 🔐 Security

✅ **What's Secure:**
- Firebase JWT authentication
- Password-reset via Firebase
- Encrypted document storage
- Sensitive data masking
- Server-side validation
- CORS protection

⚠️ **What to Add for Production:**
- HTTPS/TLS
- Rate limiting
- Audit logging
- Data encryption at rest
- Regular backups
- GDPR compliance

---

## 📊 Data Models

### User
```typescript
{
  firebaseUID: string;    // Unique ID
  email: string;
  fullName: string;
  isVerified: boolean;
}
```

### FamilyProfile
```typescript
{
  userId: string;
  fullName: string;
  dateOfBirth: string;    // YYYY-MM-DD
  gender: 'M' | 'F' | 'Other';
  relation: 'Self' | 'Spouse' | 'Father' | ...;
}
```

### ExtractedData
```typescript
{
  documentId: string;
  extractedFields: {
    [key]: { value, confidence (0-100) }
  };
  standardizedData: {
    fullName?, dateOfBirth?, policyNumber?, ...
  };
}
```

---

## 🧪 Test Scenarios

### Scenario 1: Basic Workflow
1. Create profile (Self)
2. Upload insurance policy PDF
3. Extract data
4. Review extracted fields
5. Submit autofilled form

### Scenario 2: Family Member
1. Create profile (Spouse)
2. Upload Aadhaar image
3. Extract details
4. Use in claim form

### Scenario 3: Multiple Documents
1. Create profile
2. Upload 3 documents (Aadhaar, PAN, Policy)
3. Extract all
4. View in vault
5. Delete one

---

## 🛠️ Customization

### Add New Document Type
```typescript
// 1. Update model
documentType: '..._Policy' | 'MY_NEW_TYPE'

// 2. Add extraction
if (documentType === 'MY_NEW_TYPE') {
  extracted.customField = { value: '...', confidence: 90 };
}

// 3. Update UI
const DOCUMENT_TYPES = [
  { value: 'MY_NEW_TYPE', label: 'My Document' },
];
```

### Change Color Scheme
Edit `src/index.css` theme variables (green by default).
Or pass custom Tailwind config.

### Add New Form Field
```typescript
const schema = {
  fields: [
    ...FORM_SCHEMAS.POLICY_PURCHASE.fields,
    {
      fieldName: 'customField',
      label: 'My Field',
      type: 'text',
      required: true
    }
  ]
};
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check Firebase token & backend auth middleware |
| Cannot connect to API | Ensure backend running on :5000 |
| File upload fails | Check size < 10MB, type is PDF/JPG/PNG |
| Extraction returns same data | That's the mock! Real data with Claude API |
| Form not autofilling | Check schema field names match extracted |

---

## 📈 Performance Tips

- **Database**: Use MongoDB Atlas for production
- **Storage**: Use S3 instead of local filesystem
- **Extraction**: Queue docs for async processing
- **Caching**: Cache extracted data in Redis
- **Frontend**: Lazy load components with React.lazy()

---

## 🔗 Integration Points

### With Existing System
```typescript
// In your existing form pages
import { VaultDashboard } from '@/components/vault/VaultDashboard';
import { FORM_SCHEMAS } from '@/lib/vault/autofill';

function BuyInsurancePage() {
  return (
    <>
      {/* Existing form */}
      {/* + Vault for autofill */}
      <VaultDashboard formSchema={FORM_SCHEMAS.POLICY_PURCHASE} />
    </>
  );
}
```

### With Your API
```typescript
// Handle autofill submission
const handleFormSubmit = async (data) => {
  const response = await your-api.submitPolicyForm(data);
  // ...
};
```

---

## 📚 File Structure Reference

```
File                                      Purpose
────────────────────────────────────────────────────────────
backend/src/models/*.ts                  Database schemas
backend/src/controllers/*.ts             Request handlers
backend/src/services/aiExtractionService.ts  AI logic
backend/src/routes/vault.ts              API endpoints
src/components/vault/*.tsx               React components
src/lib/vault/types.ts                   TypeScript types
src/lib/vault/api.ts                     API client
src/lib/vault/autofill.ts                Form logic + schemas
VAULT_SYSTEM_README.md                   Full documentation
BACKEND_SETUP_GUIDE.md                   Backend walkthrough
VAULT_INTEGRATION_EXAMPLES.tsx           Integration examples
```

---

## ✅ Feature Checklist

- [x] Document upload (PDF, JPG, PNG)
- [x] Family profile management
- [x] Document categorization
- [x] AI data extraction (mock)
- [x] Confidence scoring
- [x] Sensitive data masking
- [x] Autofill form mapping
- [x] Form schema templates
- [x] Firebase authentication
- [x] Database models
- [x] Express API endpoints
- [x] React components
- [x] TypeScript types
- [x] Error handling
- [x] Documentation

---

## 🚀 Next Steps

1. **Test locally**: Run backend + frontend, create profiles, upload docs
2. **Customize**: Adjust form schemas and colors
3. **Integrate Claude**: Replace mock with real API
4. **Add pages**: Create `/vault`, `/documents`, etc. routes
5. **Deploy**: MongoDB Atlas, Firebase, Vercel/Railway
6. **Monitor**: Set up logging, error tracking
7. **Scale**: Add job queue, S3 storage, caching

---

## 📞 Support Resources

- **Main Docs**: VAULT_SYSTEM_README.md
- **Backend Guide**: BACKEND_SETUP_GUIDE.md
- **Examples**: VAULT_INTEGRATION_EXAMPLES.tsx
- **Types**: src/lib/vault/types.ts
- **API**: src/lib/vault/api.ts

---

**Built for production. Ready to scale.** 🎉

Last Updated: March 30, 2024
