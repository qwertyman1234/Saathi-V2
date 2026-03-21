import { useState } from "react";
import { Eye, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRevealHiddenThings } from "@/hooks/useAIFeatures";
import ReactMarkdown from "react-markdown";

interface RevealHiddenThingsProps {
  policyDetails: any;
  buttonText?: string;
  buttonVariant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  showInDialog?: boolean;
  className?: string;
}

/**
 * RevealHiddenThings Component
 * Exposes hidden clauses, restrictions, exclusions, and unfavorable terms in insurance policies
 */
export function RevealHiddenThings({
  policyDetails,
  buttonText = "🔍 Reveal Hidden Things",
  buttonVariant = "outline",
  showInDialog = true,
  className = "",
}: RevealHiddenThingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { hiddenThings, loading, error, reveal } = useRevealHiddenThings();

  const handleReveal = async () => {
    try {
      await reveal(policyDetails);
    } catch (err) {
      console.error("Failed to reveal hidden things:", err);
    }
  };

  const handleOpenDialog = async () => {
    setIsOpen(true);
    if (!hiddenThings) {
      await handleReveal();
    }
  };

  const content = (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
          <span className="ml-2 text-sm text-gray-600">
            Analyzing policy for hidden restrictions...
          </span>
        </div>
      )}

      {hiddenThings && !loading && (
        <div className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              This analysis reveals hidden restrictions, exclusions, and unfavorable terms that insurance companies often hide in fine print.
            </AlertDescription>
          </Alert>

          <div className="prose prose-sm max-w-none rounded-lg border border-gray-200 bg-white p-4">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h2 className="mt-4 mb-2 text-lg font-bold text-gray-900" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h3 className="mt-3 mb-2 text-base font-semibold text-gray-800" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h4 className="mt-2 mb-1 text-sm font-semibold text-gray-700" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="ml-2" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-sm text-gray-700 mb-2" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-gray-900" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-gray-800" {...props} />
                ),
              }}
            >
              {hiddenThings}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Button
        onClick={showInDialog ? handleOpenDialog : handleReveal}
        variant={buttonVariant}
        className={`gap-2 ${className}`}
        disabled={loading}
      >
        <Eye className="h-4 w-4" />
        {loading ? "Analyzing..." : buttonText}
      </Button>

      {showInDialog && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Hidden Things Revealed
              </DialogTitle>
              <DialogDescription>
                Exposing hidden clauses, restrictions, exclusions, and unfavorable terms in this policy
              </DialogDescription>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      )}

      {!showInDialog && (
        <div className="mt-4">{content}</div>
      )}
    </>
  );
}

export default RevealHiddenThings;
