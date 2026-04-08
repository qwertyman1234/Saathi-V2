import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import * as vaultAPI from '@/lib/vault/api';
import { ExtractedDataRecord, VaultDocument } from '@/lib/vault/types';
import { DEMO_EXTRACTED_DATA } from '@/lib/vault/demoData';

interface ExtractionPreviewProps {
  documentId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtractionPreview({ documentId, isOpen, onOpenChange }: ExtractionPreviewProps) {
  const [extractedData, setExtractedData] = useState<ExtractedDataRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExtractedData();
    }
  }, [isOpen, documentId]);

  const loadExtractedData = async () => {
    try {
      setLoading(true);
      
      // Check if it's a demo document
      if (documentId.startsWith('demo_')) {
        const demoData = (DEMO_EXTRACTED_DATA as any)[documentId];
        if (demoData) {
          setExtractedData(demoData);
          setLoading(false);
          return;
        }
      }
      
      // Otherwise fetch from API
      const response = await vaultAPI.getExtractedData(documentId);
      if (response.success && response.data) {
        setExtractedData(response.data);
      } else {
        toast.error(response.error || 'Failed to load extracted data');
      }
    } catch (error) {
      console.error('Error loading extracted data:', error);
      toast.error('Failed to load extracted data');
    } finally {
      setLoading(false);
    }
  };

  const maskSensitiveData = (value: string, type: string): string => {
    if (!showSensitiveData && ['aadhaarNumber', 'panNumber', 'policyNumber'].includes(type)) {
      return value?.slice(-4).padStart(value.length, '*') || '';
    }
    return value || '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Extracted Data Preview</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="gap-2"
            >
              {showSensitiveData ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Sensitive
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Sensitive
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : extractedData ? (
          <Tabs defaultValue="standardized" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="standardized">Standardized</TabsTrigger>
              <TabsTrigger value="raw">Raw Fields</TabsTrigger>
            </TabsList>

            <TabsContent value="standardized" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(extractedData.standardizedData || {}).map(([key, value]) => (
                  value ? (
                    <div key={key} className="bg-secondary/30 p-3 rounded-lg border border-border">
                      <label className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <p className="text-sm font-semibold text-card-foreground mt-1">
                        {typeof value === 'object' ? JSON.stringify(value) : maskSensitiveData(String(value), key)}
                      </p>
                    </div>
                  ) : null
                ))}
              </div>
            </TabsContent>

            <TabsContent value="raw" className="space-y-3">
              {Object.entries(extractedData.extractedFields || {}).map(([key, field]: any) => (
                field?.value ? (
                  <div key={key} className="bg-secondary/30 p-3 rounded-lg border border-border">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <p className="text-sm font-semibold text-card-foreground mt-1">
                          {maskSensitiveData(String(field.value), key)}
                        </p>
                      </div>
                      <div className="ml-3 text-right">
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="text-sm font-semibold text-primary">
                          {Math.round((field.confidence || 0) * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null
              ))}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <p>No extracted data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
