import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Upload, FileUp, Loader2, Trash2, Sparkles, CheckCircle, Zap } from 'lucide-react';
import * as vaultAPI from '@/lib/vault/api';
import { VaultDocument } from '@/lib/vault/types';
import { DEMO_DOCUMENTS, DEMO_EXTRACTED_DATA } from '@/lib/vault/demoData';

interface DocumentVaultProps {
  familyProfileId?: string;
  onDocumentProcessed?: (documentId: string) => void;
}

const DOCUMENT_TYPES = [
  { value: 'Aadhaar', label: 'Aadhaar Card' },
  { value: 'PAN', label: 'PAN Card' },
  { value: 'Insurance_Policy', label: 'Insurance Policy' },
  { value: 'Hospital_Bill', label: 'Hospital Bill' },
  { value: 'Medical_Report', label: 'Medical Report' },
  { value: 'Other', label: 'Other' },
];

export function DocumentVault({ familyProfileId = '', onDocumentProcessed }: DocumentVaultProps) {
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('Aadhaar');

  useEffect(() => {
    loadDocuments();
  }, [familyProfileId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      if (!familyProfileId) {
        // Show demo documents when no profile is selected
        const demoDocsWithIds = DEMO_DOCUMENTS.map(doc => ({
          ...doc,
          id: doc._id,
          userId: 'demo',
          familyProfileId: '',
          mimeType: 'application/pdf',
          fileUrl: null,
          storagePath: null,
          status: 'processed'
        }));
        setDocuments(demoDocsWithIds as any);
        toast.info('📋 Showing demo documents - upload your own to get started!');
        return;
      }
      const response = await vaultAPI.getDocuments(familyProfileId);
      if (response.success && response.data) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocType) {
      toast.error('Please select a file and document type');
      return;
    }

    try {
      setUploading(true);
      
      const response = await vaultAPI.uploadDocument(
        familyProfileId || 'auto',
        selectedDocType,
        selectedFile
      );

      if (response.success) {
        const docId = response.data?.id;
        toast.success('✅ Document uploaded! File is uploading in background...');
        
        // Close dialog immediately
        setIsDialogOpen(false);
        setSelectedFile(null);
        setUploading(false);
        loadDocuments();
        
        // Process document asynchronously (fire and forget)
        if (docId) {
          // Wait a bit for the file to be ready, then extract
          setTimeout(() => {
            vaultAPI.processDocument(docId)
              .then(() => {
                onDocumentProcessed?.(docId);
                toast.success('✨ Document processed! Data extracted.');
              })
              .catch((error) => {
                console.error('Background processing error:', error);
              });
          }, 2000);
        }
      } else {
        toast.error(response.error || 'Upload failed');
        setUploading(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to upload document';
      console.error('Upload error:', errorMsg);
      toast.error(errorMsg);
      setUploading(false);
    }
  };

  const handleProcessDocument = async (documentId: string) => {
    try {
      setProcessing(documentId);
      
      // Check if it's a demo document
      if (documentId.startsWith('demo_')) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success('✨ Demo document processed! Data extracted.');
        onDocumentProcessed?.(documentId);
        setProcessing(null);
        return;
      }
      
      const response = await vaultAPI.processDocument(documentId);

      if (response.success) {
        toast.success('✨ Document processed! Data extracted.');
        loadDocuments();
        onDocumentProcessed?.(documentId);
      } else {
        toast.error(response.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process document');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await vaultAPI.deleteDocument(documentId);

      if (response.success) {
        toast.success('Document deleted successfully');
        loadDocuments();
      } else {
        toast.error(response.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Document Vault</h2>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center p-8 bg-secondary/30 rounded-lg border border-border border-dashed">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No documents uploaded yet</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Upload documents to extract data and autofill forms
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <div
              key={doc._id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-card-foreground">{doc.fileName}</h3>
                    {doc.isProcessed && (
                      <CheckCircle className="h-4 w-4 text-success" />
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Type: {doc.documentType.replace('_', ' ')}</span>
                    <span>Size: {(doc.fileSize / 1024).toFixed(1)}KB</span>
                    <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!doc.isProcessed && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleProcessDocument(doc._id)}
                      disabled={processing === doc._id}
                      className="gap-1"
                    >
                      {processing === doc._id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      Extract Data
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Document Type *</label>
              <select
                value={selectedDocType}
                onChange={e => setSelectedDocType(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">File *</label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm">
                    {selectedFile ? selectedFile.name : 'Click to select or drag and drop'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (max 10MB)</p>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="flex-1 gap-2"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
