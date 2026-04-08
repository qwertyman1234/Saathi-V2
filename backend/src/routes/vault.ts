import { Router } from 'express';
import { verifyFirebaseToken } from '../middleware/auth';
import * as familyProfileController from '../controllers/familyProfileController';
import * as documentController from '../controllers/documentController';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// ==================== Family Profile Routes ====================
router.post('/family-profiles', verifyFirebaseToken, familyProfileController.createFamilyProfile);
router.get('/family-profiles', verifyFirebaseToken, familyProfileController.getFamilyProfiles);
router.get('/family-profiles/:profileId', verifyFirebaseToken, familyProfileController.getFamilyProfile);
router.put('/family-profiles/:profileId', verifyFirebaseToken, familyProfileController.updateFamilyProfile);
router.delete('/family-profiles/:profileId', verifyFirebaseToken, familyProfileController.deleteFamilyProfile);

// ==================== Document Routes ====================
router.post('/documents/upload', verifyFirebaseToken, upload.single('file'), documentController.uploadDocument);
router.get('/documents', verifyFirebaseToken, documentController.getDocuments);
router.post('/documents/:documentId/process', verifyFirebaseToken, documentController.processDocument);
router.get('/documents/:documentId/extracted', verifyFirebaseToken, documentController.getExtractedData);
router.delete('/documents/:documentId', verifyFirebaseToken, documentController.deleteDocument);

export default router;
