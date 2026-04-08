import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { AutofillField } from '@/lib/vault/types';

interface AutofillFormProps {
  fields: AutofillField[];
  overallConfidence: number;
  onSubmit: (data: Record<string, string>) => void;
  loading?: boolean;
}

export function AutofillForm({ fields, overallConfidence, onSubmit, loading = false }: AutofillFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce((acc, field) => {
      acc[field.fieldName] = field.value || '';
      return acc;
    }, {} as Record<string, string>)
  );

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleSkip = () => {
    // Reset to original values
    const resetData = fields.reduce((acc, field) => {
      acc[field.fieldName] = field.value || '';
      return acc;
    }, {} as Record<string, string>);
    setFormData(resetData);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4 text-success" />;
    if (confidence >= 60) return <AlertTriangle className="h-4 w-4 text-warning" />;
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      {/* Confidence Summary */}
      <Card className="bg-primary/5 border-primary/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-card-foreground">Autofill Suggestion</h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI has extracted and mapped fields from your documents
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Overall Confidence</p>
            <div className={`text-2xl font-bold ${getConfidenceColor(overallConfidence)}`}>
              {overallConfidence}%
            </div>
          </div>
        </div>
      </Card>

      {/* Form Fields */}
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.fieldName} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.fieldName} className="flex items-center gap-2">
                {field.label}
                {field.confidence > 0 && (
                  <span className="flex items-center gap-1">
                    {getConfidenceIcon(field.confidence)}
                    <span className={`text-xs ${getConfidenceColor(field.confidence)}`}>
                      {field.confidence}%
                    </span>
                  </span>
                )}
              </Label>
            </div>

            {field.type === 'textarea' ? (
              <textarea
                id={field.fieldName}
                value={formData[field.fieldName] || ''}
                onChange={e => handleFieldChange(field.fieldName, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"
              />
            ) : field.type === 'select' ? (
              <select
                id={field.fieldName}
                value={formData[field.fieldName] || ''}
                onChange={e => handleFieldChange(field.fieldName, e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select {field.label}</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <Input
                id={field.fieldName}
                type={field.type}
                value={formData[field.fieldName] || ''}
                onChange={e => handleFieldChange(field.fieldName, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            )}

            {field.confidence > 0 && field.confidence < 70 && (
              <p className="text-xs text-warning">
                ⚠ Low confidence extraction. Please review carefully.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-border">
        <Button variant="outline" onClick={handleSkip}>
          Use Original Values
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Form'}
        </Button>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30 rounded-lg p-3">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          ℹ️ Review all fields before submitting. You can edit any field that doesn't look correct.
        </p>
      </div>
    </div>
  );
}
