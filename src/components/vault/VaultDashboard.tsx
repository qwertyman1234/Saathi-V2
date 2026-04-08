import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Vault, Zap, Upload } from 'lucide-react';
import { DocumentVault } from './DocumentVault';
import { ExtractionPreview } from './ExtractionPreview';
import { AutofillForm } from './AutofillForm';
import * as vaultAPI from '@/lib/vault/api';
import { generateAutofillSuggestion, FORM_SCHEMAS, FormSchema } from '@/lib/vault/autofill';
import { AutofillField, ExtractedDataRecord } from '@/lib/vault/types';
import { useAuth } from '@/contexts/AuthContext';
import { useVault } from '@/contexts/VaultContext';
import { DEMO_EXTRACTED_DATA, DEMO_FAMILY_PROFILE } from '@/lib/vault/demoData';

interface VaultDashboardProps {
  initialTab?: string;
  formSchema?: FormSchema;
}

export function VaultDashboard({ initialTab = 'vault', formSchema = FORM_SCHEMAS.POLICY_PURCHASE }: VaultDashboardProps) {
  const { user } = useAuth();
  const vault = useVault();
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [showExtractionPreview, setShowExtractionPreview] = useState(false);
  const [autofillSuggestion, setAutofillSuggestion] = useState<{
    fields: AutofillField[];
    confidence: number;
  } | null>(null);
  const [processingForAutofill, setProcessingForAutofill] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedDataRecord | null>(null);
  const [autoCreatedProfile, setAutoCreatedProfile] = useState<any>(null);
  const autofillRef = useRef<HTMLDivElement>(null);

  /**
   * Automatically create a family profile from extracted data
   */
  const createProfileFromExtractedData = async (data: ExtractedDataRecord) => {
    try {
      const genderMap: Record<string, 'M' | 'F' | 'Other'> = {
        'Male': 'M',
        'Female': 'F',
        'M': 'M',
        'F': 'F',
        'Other': 'Other'
      };
      
      const profileData = {
        fullName: data.standardizedData?.fullName || 'Unknown',
        dateOfBirth: data.standardizedData?.dateOfBirth || '',
        gender: (genderMap[data.standardizedData?.gender as string] || 'Other') as 'M' | 'F' | 'Other',
        relation: 'Self' as const,
        email: user?.email || '',
        mobileNumber: user?.phoneNumber || '',
        address: data.standardizedData?.address || {}
      };

      const response = await vaultAPI.createFamilyProfile(profileData);
      
      if (response.success) {
        setAutoCreatedProfile(response.data);
        toast.success(`Profile auto-created: ${profileData.fullName}`);
        return response.data;
      } else {
        console.error('Failed to auto-create profile:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error creating profile from extracted data:', error);
      return null;
    }
  };

  /**
   * Process document and auto-generate profile + autofill suggestion
   */
  const handleDocumentProcessed = async (documentId: string) => {
    try {
      setProcessingForAutofill(true);
      
      // Check if it's a demo document
      let data: ExtractedDataRecord | null = null;
      
      if (documentId.startsWith('demo_')) {
        // Use demo data
        data = (DEMO_EXTRACTED_DATA as any)[documentId] as ExtractedDataRecord;
      } else {
        const response = await vaultAPI.getExtractedData(documentId);
        if (response.success && response.data) {
          data = response.data as ExtractedDataRecord;
        }
      }

      if (data) {
        // Set all state together before opening modal
        setSelectedDocumentId(documentId);
        setExtractedData(data);
        setShowExtractionPreview(true);

        // Save extracted data to global vault context for form autofill
        vault.setExtractedData(data);

        // Step 1: Auto-create profile from extracted data (use demo profile for demo docs)
        let profile = null;
        if (documentId.startsWith('demo_')) {
          profile = DEMO_FAMILY_PROFILE;
          setAutoCreatedProfile(profile);
          toast.success(`✅ Profile: ${DEMO_FAMILY_PROFILE.fullName}`);
        } else {
          profile = await createProfileFromExtractedData(data);
        }
        
        // Save profile to global vault context
        if (profile) {
          vault.setFamilyProfile(profile);
          // Also add to family members list for Buy Insurance autofill
          vault.addFamilyMember({
            id: profile.id || documentId,
            fullName: profile.fullName,
            dateOfBirth: profile.dateOfBirth,
            gender: profile.gender,
            relation: profile.relation,
            email: profile.email,
            mobileNumber: profile.mobileNumber,
            extractedData: data
          });
        }
        
        // Step 2: Generate autofill suggestion from extracted data
        const suggestion = generateAutofillSuggestion(data, formSchema);

        setAutofillSuggestion({
          fields: suggestion.formFields,
          confidence: suggestion.overallConfidence,
        });

        // Scroll to autofill section
        setTimeout(() => {
          autofillRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 500);

        toast.success('✨ Profile created & data extracted! Review the autofilled form below.');
      } else {
        toast.error('Failed to process document');
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast.error('Failed to process document');
    } finally {
      setProcessingForAutofill(false);
    }
  };

  const handleAutofillSubmit = (formData: Record<string, string>) => {
    console.log('Form submitted with data:', formData);
    toast.success('Form submitted successfully!');
    // Here you would send this data to your backend
    // Example: await submitInsuranceForm(formData);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Vault className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold">Smart Document Vault</h1>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => handleDocumentProcessed('demo_doc_1')}
            className="gap-1"
          >
            <Zap className="h-3 w-3" />
            View Demo
          </Button>
        </div>
        <p className="text-muted-foreground text-base">
          Upload your insurance documents and we'll automatically extract data to create your profile and prefill forms.
        </p>
      </div>

      {/* How It Works - Feature Overview */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
        <h3 className="font-bold text-lg mb-4 text-card-foreground">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Upload</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add any document (Aadhaar, PAN, Policy, Medical Reports)
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Extract</p>
              <p className="text-xs text-muted-foreground mt-1">
                AI extracts structured data with confidence scores
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Auto-Profile</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your profile is automatically created
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
              <span className="text-sm font-bold text-primary">4</span>
            </div>
            <div>
              <p className="font-semibold text-card-foreground text-sm">Autofill</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pre-filled forms ready to submit
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Content - Single Flow */}
      <div className="space-y-6">
        {/* Step 1: Upload Documents */}
        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
              1
            </div>
            <h2 className="text-xl font-bold">Upload Documents</h2>
          </div>
          <DocumentVault 
            familyProfileId="" 
            onDocumentProcessed={handleDocumentProcessed}
          />
        </Card>

        {/* Step 2: Auto-Created Profile Info */}
        {autoCreatedProfile && (
          <Card className="p-6 border-l-4 border-l-success bg-success/5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white text-sm font-bold flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-card-foreground mb-2">✓ Profile Created</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>{autoCreatedProfile?.fullName || 'User'}</strong> has been added to your vault.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Data Preview */}
        {selectedDocumentId && extractedData && (
          <Card className="p-6 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
                3
              </div>
              <h2 className="text-lg font-bold">Extracted Data</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mb-4"
              onClick={() => setShowExtractionPreview(true)}
            >
              View Full Details
            </Button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(extractedData.extractedFields || {}).map(([key, value]: any) => (
                <div key={key} className="bg-secondary/30 p-3 rounded-lg border border-secondary/50">
                  <p className="text-xs text-muted-foreground font-medium capitalize">{key}</p>
                  <p className="text-sm font-semibold text-card-foreground truncate">
                    {value.value || 'N/A'}
                  </p>
                  <div className="flex gap-2 items-center mt-2">
                    <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-success transition-all" 
                        style={{ width: `${(value.confidence || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                      {Math.round((value.confidence || 0) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Step 4: AI Autofill Form */}
        {autofillSuggestion && (
          <Card className="p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-white text-sm font-bold">
                4
              </div>
              <h2 className="text-lg font-bold">Autofill Form</h2>
            </div>
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  Your form has been pre-filled with extracted data. Review and adjust as needed before submitting.
                </p>
              </div>
            </div>
            <AutofillForm
              fields={autofillSuggestion.fields}
              overallConfidence={autofillSuggestion.confidence}
              onSubmit={handleAutofillSubmit}
              loading={processingForAutofill}
            />
          </Card>
        )}

        {/* Empty State */}
        {!autoCreatedProfile && !extractedData && (
          <Card className="p-12 text-center bg-secondary/20 border-dashed">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">Start by uploading a document</p>
            <p className="text-sm text-muted-foreground mt-2">
              We'll automatically extract data, create your profile, and prefill forms for you.
            </p>
          </Card>
        )}
      </div>

      {/* Extraction Preview Modal */}
      {selectedDocumentId && extractedData && (
        <ExtractionPreview
          documentId={selectedDocumentId}
          isOpen={showExtractionPreview}
          onOpenChange={setShowExtractionPreview}
        />
      )}
    </div>
  );
}

export default VaultDashboard;
