import { useTranslate, AVAILABLE_LANGUAGES } from "@/hooks/useTranslate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  showIcon?: boolean;
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ showIcon = true, compact = false, className = "" }: LanguageSwitcherProps) {
  const { language, changeLanguage } = useTranslate();

  const handleLanguageChange = (value: string) => {
    console.log("Changing language to:", value);
    changeLanguage(value).catch((error) => {
      console.error("Failed to change language:", error);
    });
  };

  if (compact) {
    return (
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger 
          title="Change language" 
          className={`h-auto w-full md:w-10 border border-sidebar-border bg-sidebar-background text-sidebar-foreground hover:bg-sidebar-accent transition-colors rounded px-2 md:px-1.5 py-1.5 md:py-2 flex items-center justify-center ${className}`}
        >
          <Globe className="h-4 w-4 md:h-4 md:w-4" />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.nativeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={`flex items-center gap-2 md:gap-2.5 ${className}`}>
      {showIcon && <Globe className="h-4 w-4 md:h-4 md:w-4 text-sidebar-foreground" />}
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="flex-1 md:w-40 border border-sidebar-border bg-sidebar-background text-sidebar-foreground hover:bg-sidebar-accent transition-colors text-xs md:text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AVAILABLE_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.nativeName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
