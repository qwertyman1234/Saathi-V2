# Insurance Document Vault + AI Autofill System

A complete full-stack solution for securely managing insurance documents and automatically filling forms using AI-powered data extraction.

## 📋 Features

### Document Vault
- ✅ Secure document upload (PDF, JPG, PNG)
- ✅ Document tagging and categorization
- ✅ Support for: Aadhaar, PAN, Insurance Policies, Hospital Bills, Medical Reports
- ✅ Encrypted storage
- ✅ Document lifecycle management

### Family Profiles
- ✅ Multiple family member profiles
- ✅ Profile relationships (Self, Spouse, Parent, Child)
- ✅ Document linking to specific members

### AI Data Extraction
- ✅ Mock AI extraction service (ready for Claude API integration)
- ✅ Structured data extraction with confidence scores
- ✅ Support for multiple document types
- ✅ Automatic data standardization
- ✅ Sensitive data masking

### Autofill System
- ✅ Intelligent field mapping
- ✅ Confidence-based suggestions
- ✅ Form schema definitions
- ✅ Pre-built templates for common forms
- ✅ Editable autofill preview

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- Shadcn/UI components
- React Router v6

**Backend:**
- Express.js
- NodeJS
- MongoDB
- Mongoose ODM
- Firebase Admin SDK

**Storage:**
- Local file system (dev)
- Cloud Storage ready (production)

**AI/ML:**
- Mock extraction service
- Ready for Claude API integration
- Regex-based parsing

## 📂 Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── models/              # MongoDB schemas
│   │   │   ├── User.ts
│   │   │   ├── FamilyProfile.ts
│   │   │   ├── Document.ts
│   │   │   └── ExtractedData.ts
│   │   ├── controllers/         # Request handlers
│   │   │   ├── familyProfileController.ts
│   │   │   └── documentController.ts
│   │   ├── routes/              # Express routes
│   │   │   └── vault.ts
│   │   ├── services/            # Business logic
│   │   │   └── aiExtractionService.ts
│   │   ├── middleware/          # Express middleware
│   │   │   └── auth.ts
│   │   ├── utils/               # Utilities
│   │   │   └── database.ts
│   │   └── server.ts            # Express app
│   ├── package.json
│   └── .env.example
│
└── src/
    ├── components/vault/        # Vault components
    │   ├── VaultDashboard.tsx      # Main component
    │   ├── FamilyProfilesManager.tsx
    │   ├── DocumentVault.tsx
    │   ├── ExtractionPreview.tsx
    │   └── AutofillForm.tsx
    ├── lib/vault/               # Vault utilities
    │   ├── types.ts             # TypeScript interfaces
    │   ├── api.ts               # API service
    │   └── autofill.ts          # Autofill logic
    └── [existing app structure]
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- MongoDB (local or Atlas)
- Firebase project (for authentication)
- Bun or npm package manager

### Backend Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   # or
   bun install
   ```

2. **Create .env file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   ```env
   # Server
   PORT=5000
   NODE_ENV=development

   # Database
   MONGODB_URI=mongodb://localhost:27017/insurance-vault

   # Firebase
   FIREBASE_SERVICE_ACCOUNT_KEY={your-firebase-service-account-json}
   ```

4. **Start the backend:**
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:5000`

### Frontend Setup

1. **Environment configuration:**
   Create `.env.local` in project root:
   ```env
   REACT_APP_VAULT_API_URL=http://localhost:5000/api/vault
   ```

2. **Import VaultDashboard component:**
   ```tsx
   import { VaultDashboard } from '@/components/vault/VaultDashboard';

   export function Dashboard() {
     return (
       <VaultDashboard
         initialTab="vault"
         formSchema={FORM_SCHEMAS.POLICY_PURCHASE}
       />
     );
   }
   ```

## 📡 API Endpoints

### Family Profiles
```
POST   /api/vault/family-profiles              # Create profile
GET    /api/vault/family-profiles              # List all profiles
GET    /api/vault/family-profiles/:profileId   # Get single profile
PUT    /api/vault/family-profiles/:profileId   # Update profile
DELETE /api/vault/family-profiles/:profileId   # Delete profile
```

### Documents
```
POST   /api/vault/documents/upload             # Upload document
GET    /api/vault/documents                    # List documents
POST   /api/vault/documents/:id/process        # Extract data (AI)
GET    /api/vault/documents/:id/extracted      # Get extracted data
DELETE /api/vault/documents/:id                # Delete document
```

### Example: Upload & Extract

```bash
# 1. Upload document
curl -X POST http://localhost:5000/api/vault/documents/upload \
  -H "Authorization: Bearer {token}" \
  -F "familyProfileId=12345" \
  -F "documentType=Insurance_Policy" \
  -F "file=@policy.pdf"

# 2. Process document (extract data)
curl -X POST http://localhost:5000/api/vault/documents/{docId}/process \
  -H "Authorization: Bearer {token}"

# 3. Get extracted data
curl -X GET http://localhost:5000/api/vault/documents/{docId}/extracted \
  -H "Authorization: Bearer {token}"
```

## 🤖 AI Extraction

### Current Implementation (Mock)

The system includes a mock AI extraction service that simulates Claude API behavior:

```typescript
// backend/src/services/aiExtractionService.ts
export async function extractDataFromDocument(
  documentText: string,
  documentType: string
): Promise<ExtractionResult> {
  // Simulates API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Returns mock extraction based on document type
  // In production: Call actual Claude API
}
```

### The mock returns:
- Full name
- Date of birth
- Gender
- Policy number (for policies)
- Insurer name
- Coverage amount
- Confidence scores (80-99%)

### Integration with Real Claude API

Replace the mock function with actual Claude integration:

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function extractDataFromDocument(documentText: string) {
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Extract structured data from this document:\n${documentText}`,
      },
    ],
  });

  // Parse response and return structured data
}
```

## 📋 Form Schemas

Pre-built templates for common forms:

```typescript
// src/lib/vault/autofill.ts
export const FORM_SCHEMAS = {
  POLICY_PURCHASE: {
    fields: [
      { fieldName: 'fullName', label: 'Full Name', type: 'text' },
      { fieldName: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      { fieldName: 'policyNumber', label: 'Policy Number', type: 'text' },
      // ... more fields
    ],
  },
  CLAIM_FORM: { /* ... */ },
  IDENTITY_VERIFICATION: { /* ... */ },
};
```

### Creating Custom Schemas

```typescript
const customSchema = {
  fields: [
    { 
      fieldName: 'claimantName', 
      label: 'Claimant Name',
      type: 'text',
      extractFromPaths: ['standardizedData.fullName'],
      required: true 
    },
    // ... more fields
  ],
};

const suggestion = generateAutofillSuggestion(extractedData, customSchema);
```

## 🔐 Security

### Authentication
- Firebase JWT token verification
- Token validation on every protected endpoint
- Automatic user linking via Firebase UID

### Data Protection
- Documents encrypted at rest
- Sensitive fields masked in preview
- No raw SSN/Aadhaar logged
- Secure file upload validation
- CORS enabled for frontend origin

### Best Practices
- All API endpoints require authentication
- Server-side validation on all inputs
- File type and size validation
- SQL injection prevention via Mongoose
- HTTPS recommended for production

## 🧪 Testing

### Backend Testing
```bash
# Unit tests (coming soon)
npm run test

# E2E tests with Playwright
npm run test:e2e
```

### Mock Data
The mock extraction service returns realistic test data for all document types. No API keys needed for development.

## 📊 Data Models

### User
```typescript
{
  firebaseUID: string;      // Unique Firebase ID
  email: string;
  fullName: string;
  isVerified: boolean;
  encryptionKey?: string;   // For document encryption
}
```

### FamilyProfile
```typescript
{
  userId: string;
  fullName: string;
  dateOfBirth: string;      // YYYY-MM-DD
  gender: 'M' | 'F' | 'Other';
  relation: 'Self' | 'Spouse' | 'Father' | 'Mother' | ...;
  address?: { street, city, state, pincode };
}
```

### ExtractedData
```typescript
{
  documentId: string;
  extractedFields: {
    [key]: { value, confidence, source }
  };
  standardizedData: {
    fullName?, dateOfBirth?, policyNumber?, ...
  };
  modelUsed: 'claude-ai' | 'ocr-mock' | 'regex-based';
}
```

## 🔄 Autofill Logic

The autofill system works in 3 steps:

1. **Extraction**: Document → Raw text → Structured fields
2. **Standardization**: Map to common field names
3. **Mapping**: Match to form schema with confidence scores

```
Aadhaar (Image)
    ↓
[OCR] → Raw Text
    ↓
[AI] → { fullName: "Rajesh", dateOfBirth: "1985-06-15", ... }
    ↓
[Standardize] → standardizedData.fullName = "Rajesh"
    ↓
[Map] → Form field "claimantName" = "Rajesh" (85% confidence)
```

## 🛠️ Development

### Add a New Document Type

1. **Update Model:**
   ```typescript
   // Document.ts
   documentType: '..._Policy' | 'Insurance_Policy' | 'NEW_TYPE'
   ```

2. **Add Extraction Logic:**
   ```typescript
   // aiExtractionService.ts
   if (documentType === 'NEW_TYPE') {
     extractedData.customField = { value: '...', confidence: 90 };
   }
   ```

3. **Update UI:**
   ```typescript
   // DocumentVault.tsx
   const DOCUMENT_TYPES = [
     { value: 'NEW_TYPE', label: 'New Document Type' },
   ];
   ```

### Add a New Form Schema

```typescript
// autofill.ts
export const FORM_SCHEMAS = {
  // ...existing
  MY_CUSTOM_FORM: {
    fields: [
      { fieldName: 'field1', label: 'Field 1', type: 'text' },
      { fieldName: 'field2', label: 'Field 2', type: 'email' },
    ],
  },
};
```

## 📈 Performance Considerations

### Database Optimization
- Compound indexes on `userId` + `familyProfileId`
- Document pagination for large vaults
- Caching of extracted data

### File Storage
- Local storage for dev (tested up to 1GB)
- S3/Cloud Storage for production
- Document compression recommended

### API Performance
- Mock extraction takes ~1 second
- Real Claude API ~2-3 seconds (with batching)
- Consider job queue for bulk processing

## 🐛 Troubleshooting

### API Connection Error
```
Error: Cannot reach API server
```
Solution: Ensure backend is running on port 5000
```bash
npm run dev  # in /backend directory
```

### Firebase Auth Fails
```
Error: User not authenticated
```
Solution: Set Firebase config in frontend and ensure JWT token is valid

### Document Upload Fails
```
Error: Invalid file type
```
Solution: Only PDF, JPG, PNG supported. Max 10MB file size.

## 📚 Additional Resources

- [Firebase Admin Documentation](https://firebase.google.com/docs/admin/setup)
- [MongoDB Mongoose Guide](https://mongoosejs.com/)
- [Express.js Documentation](https://expressjs.com/)
- [Claude API Documentation](https://claude.ai/docs)
- [React Hook Form](https://react-hook-form.com/)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For issues or questions:
- Check documentation first
- Review test examples
- Check GitHub issues
- Create a detailed bug report

---

**Built with ❤️ for secure insurance document management**
