/**
 * Backend Setup & API Testing Guide
 * Complete walkthrough to get the backend running
 */

// ============================================================
// 1. INSTALL DEPENDENCIES
// ============================================================

/*
cd backend
npm install

Dependencies installed:
- express: Web framework
- mongoose: MongoDB ODM
- firebase-admin: Firebase authentication
- cors: Cross-origin requests
- dotenv: Environment variables
- multer: File uploads
- typescript: Type safety
*/

// ============================================================
// 2. ENVIRONMENT SETUP
// ============================================================

/*
Create backend/.env file with:

PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/insurance-vault

FIREBASE_SERVICE_ACCOUNT_KEY=<your-firebase-json>

To get Firebase service account:
1. Go to Firebase Console
2. Project Settings > Service Accounts
3. Generate New Private Key
4. Copy the JSON content
*/

// ============================================================
// 3. START MONGODB
// ============================================================

/*
Option A: Local MongoDB
  mongod

Option B: MongoDB Atlas (Cloud)
  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/insurance-vault

Option C: Docker
  docker run -d -p 27017:27017 --name mongodb mongo
*/

// ============================================================
// 4. START BACKEND SERVER
// ============================================================

/*
npm run dev

Expected output:
✓ Database connected
✓ Server running on http://localhost:5000
✓ API available at http://localhost:5000/api
*/

// ============================================================
// 5. TEST ENDPOINTS
// ============================================================

/*
Health Check:
GET http://localhost:5000/api/health

Response:
{ "status": "OK", "timestamp": "2024-03-30T10:00:00.000Z" }
*/

// ============================================================
// 6. API TESTING WITH CURL
// ============================================================

/*
Note: All endpoints (except health) require Authorization header

Get Firebase Token (from frontend auth):
const token = await user.getIdToken();

Then use in requests:
-H "Authorization: Bearer {token}"
*/

// ============================================================
// 7. EXAMPLE: CREATE FAMILY PROFILE
// ============================================================

/*
curl -X POST http://localhost:5000/api/vault/family-profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "fullName": "Rajesh Kumar Singh",
    "dateOfBirth": "1985-06-15",
    "gender": "M",
    "relation": "Self",
    "mobileNumber": "+919800000000",
    "email": "rajesh@example.com"
  }'

Response:
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "firebase-uid",
    "fullName": "Rajesh Kumar Singh",
    "dateOfBirth": "1985-06-15",
    "gender": "M",
    "relation": "Self",
    "mobileNumber": "+919800000000",
    "email": "rajesh@example.com",
    "createdAt": "2024-03-30T10:00:00.000Z",
    "updatedAt": "2024-03-30T10:00:00.000Z"
  }
}
*/

// ============================================================
// 8. EXAMPLE: UPLOAD DOCUMENT
// ============================================================

/*
curl -X POST http://localhost:5000/api/vault/documents/upload \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -F "familyProfileId=507f1f77bcf86cd799439011" \
  -F "documentType=Insurance_Policy" \
  -F "file=@/path/to/policy.pdf"

# Using FormData in JavaScript:
const formData = new FormData();
formData.append('familyProfileId', profileId);
formData.append('documentType', 'Insurance_Policy');
formData.append('file', fileInput.files[0]);

fetch('http://localhost:5000/api/vault/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
*/

// ============================================================
// 9. EXAMPLE: PROCESS DOCUMENT (AI EXTRACTION)
// ============================================================

/*
curl -X POST http://localhost:5000/api/vault/documents/507f191e810c19729de860ea/process \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

Response:
{
  "success": true,
  "data": {
    "document": { ...document data... },
    "extractedData": {
      "_id": "507f191e810c19729de860eb",
      "documentId": "507f191e810c19729de860ea",
      "extractedFields": {
        "fullName": {
          "value": "Rajesh Kumar Singh",
          "confidence": 95
        },
        "dateOfBirth": {
          "value": "1985-06-15",
          "confidence": 92
        },
        "policyNumber": {
          "value": "POL-2024-0123456",
          "confidence": 98
        }
      },
      "standardizedData": {
        "fullName": "Rajesh Kumar Singh",
        "dateOfBirth": "1985-06-15",
        "policyNumber": "POL-2024-0123456"
      }
    }
  }
}
*/

// ============================================================
// 10. EXAMPLE: GET EXTRACTED DATA
// ============================================================

/*
curl -X GET http://localhost:5000/api/vault/documents/507f191e810c19729de860ea/extracted \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"

Returns the full ExtractedData object with:
- extractedFields: Raw extraction with confidence scores
- standardizedData: Clean, mapped data for forms
*/

// ============================================================
// 11. COMMON ISSUES & SOLUTIONS
// ============================================================

/*
Issue: MongoNetworkError
Solution: Ensure MongoDB is running
  mongod  # or use MongoDB Atlas

Issue: Firebase auth fails
Solution: Check FIREBASE_SERVICE_ACCOUNT_KEY is valid
  Visit: Firebase Console > Settings > Service Accounts

Issue: CORS error from frontend
Solution: Already handled. Ensure backend is on :5000

Issue: File upload fails
Solution: Check file size < 10MB and type is PDF/JPG/PNG

Issue: Extraction always returns same data
Solution: That's the mock! It returns realistic test data for all doc types
  To use real Claude: Update aiExtractionService.ts
*/

// ============================================================
// 12. DATABASE INSPECTION
// ============================================================

/*
Using MongoDB Compass:
1. Download MongoDB Compass
2. Connect to localhost:27017 (or your MongoDB Atlas URL)
3. Browse collections:
   - users
   - familyprofiles
   - documents
   - extracteddatas

Using mongosh (CLI):
  mongosh mongodb://localhost:27017/insurance-vault
  
  # List collections
  show collections
  
  # View users
  db.users.find()
  
  # View documents
  db.documents.find()
  
  # View extracted data
  db.extracteddatas.find()
*/

// ============================================================
// 13. PRODUCTION DEPLOYMENT
// ============================================================

/*
Checklist:
☐ Use MongoDB Atlas (not local)
☐ Set NODE_ENV=production
☐ Enable HTTPS
☐ Use AWS S3 or similar for file storage
☐ Implement rate limiting
☐ Set up logging/monitoring
☐ Test authentication thoroughly
☐ Encrypt sensitive fields
☐ Regular database backups
☐ Load balancing for multiple instances
*/

// ============================================================
// 14. SCALE THE SYSTEM
// ============================================================

/*
High Volume Processing:
1. Use job queue (Bull, RabbitMQ)
2. Process documents asynchronously
3. Store in S3 instead of local filesystem
4. Cache extracted data

Example job flow:
Upload → Queue job → Process (async) → Notify user → Store result
*/

// ============================================================
// 15. NEXT STEPS
// ============================================================

/*
1. ✅ Backend running
2. ✅ Frontend connected
3. Next:
   - Test with real documents
   - Customize form schemas
   - Integrate Claude API for production
   - Set up monitoring
   - Deploy to production
*/
