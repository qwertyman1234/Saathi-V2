/*
 * Translation Coverage Analyzer
 * Scans all component files and identifies untranslated strings
 * This tool helps ensure 100% translation coverage across the application
 */

import fs from "fs";
import path from "path";

interface UntranslatedString {
  file: string;
  line: number;
  content: string;
  type: "hardcoded" | "toast" | "error" | "placeholder" | "other";
}

interface TranslationReport {
  totalFiles: number;
  totalUntranslated: number;
  untranslatedByType: Record<string, number>;
  strings: UntranslatedString[];
}

/**
 * Patterns to detect hardcoded strings that should be translated
 * These patterns look for common ways strings are hardcoded in React
 */
const DETECTION_PATTERNS = [
  // String literals in JSX
  {
    pattern: />([A-Z][a-zA-Z\s]+)</g,
    type: "hardcoded",
    name: "JSX text content",
  },
  // toast messages
  {
    pattern: /toast\.(error|success|warning|info)\("([^"]+)"/g,
    type: "toast",
    name: "Toast message",
  },
  // placeholder attributes
  {
    pattern: /placeholder="([^"]+)"/g,
    type: "placeholder",
    name: "Placeholder text",
  },
  // aria-label attributes
  {
    pattern: /aria-label="([^"]+)"/g,
    type: "placeholder",
    name: "Aria label",
  },
  // title attributes
  {
    pattern: /title="([^"]+)"/g,
    type: "placeholder",
    name: "Title attribute",
  },
];

/**
 * Patterns that should be IGNORED (likely dates, numbers, variables)
 */
const IGNORE_PATTERNS = [
  /^\d+(\.\d+)?$/, // Numbers
  /^[₹$€£]/, // Currency
  /^[A-Z0-9-]+$/, // IDs/Codes
  /^\{.*\}$/, // Variable references
  /^[a-z_]+\./g, // Namespace references
  /^Loading/, // Common loading text
  /^Success/, // Common success text
  /^Error/, // Common error text
  /^\./, // Dots
  /^-$/, // Hyphens
];

/**
 * Scan a file for untranslated strings
 */
function scanFile(filePath: string): UntranslatedString[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const untranslated: UntranslatedString[] = [];

  lines.forEach((line, index) => {
    // Skip imports and comments
    if (line.includes("import ") || line.trim().startsWith("//")) {
      return;
    }

    // Check for t( pattern (already translated)
    if (line.includes('t("') || line.includes("t('")) {
      return;
    }

    // Check patterns
    DETECTION_PATTERNS.forEach((patternObj) => {
      const matches = line.matchAll(patternObj.pattern);
      for (const match of matches) {
        const str = match[1] || match[2] || "";

        // Skip if matches ignore patterns
        if (IGNORE_PATTERNS.some((p) => p.test(str))) {
          return;
        }

        // Skip very short strings
        if (str.length < 3) {
          return;
        }

        untranslated.push({
          file: filePath,
          line: index + 1,
          content: str.substring(0, 100),
          type: patternObj.type as any,
        });
      }
    });
  });

  return untranslated;
}

/**
 * Recursively scan all TypeScript/TSX files in a directory
 */
function scanDirectory(
  dir: string,
  exclude: string[] = []
): UntranslatedString[] {
  const allUntranslated: UntranslatedString[] = [];

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip excluded directories
    if (exclude.some((e) => filePath.includes(e))) {
      return;
    }

    if (stat.isDirectory()) {
      allUntranslated.push(...scanDirectory(filePath, exclude));
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      // Skip test files
      if (file.includes(".test.") || file.includes(".spec.")) {
        return;
      }

      allUntranslated.push(...scanFile(filePath));
    }
  });

  return allUntranslated;
}

/**
 * Generate a comprehensive translation coverage report
 */
export function generateTranslationReport(projectRoot: string): TranslationReport {
  const srcDir = path.join(projectRoot, "src");

  // Directories to exclude from scanning
  const exclude = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "locales",
    "lib/i18n",
    "hooks/useTranslate",
  ];

  console.log("🔍 Scanning for untranslated strings...\n");

  const untranslatedStrings = scanDirectory(srcDir, exclude);

  // Group by type
  const untranslatedByType: Record<string, number> = {};
  const fileSet = new Set<string>();

  untranslatedStrings.forEach((str) => {
    untranslatedByType[str.type] = (untranslatedByType[str.type] || 0) + 1;
    fileSet.add(str.file);
  });

  const report: TranslationReport = {
    totalFiles: fileSet.size,
    totalUntranslated: untranslatedStrings.length,
    untranslatedByType,
    strings: untranslatedStrings.slice(0, 100), // First 100 for report
  };

  return report;
}

/**
 * Pretty print the report
 */
export function printReport(report: TranslationReport): void {
  console.log("═════════════════════════════════════════════════════");
  console.log("📊 TRANSLATION COVERAGE REPORT");
  console.log("═════════════════════════════════════════════════════\n");

  console.log(`Total Untranslated Strings: ${report.totalUntranslated}`);
  console.log(`Affected Files: ${report.totalFiles}\n`);

  if (report.totalUntranslated === 0) {
    console.log("✅ All strings are translated!\n");
  } else {
    console.log("Untranslated by Type:");
    Object.entries(report.untranslatedByType).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count}`);
    });

    console.log("\nFirst 20 Untranslated Instances:");
    console.log("─────────────────────────────────────────────────────");
    report.strings.slice(0, 20).forEach((str, i) => {
      const relPath = str.file.replace(process.cwd(), "");
      console.log(
        `${i + 1}. [${relPath}:${str.line}] "${str.content}"`
      );
    });

    if (report.totalUntranslated > 20) {
      console.log(
        `\n... and ${report.totalUntranslated - 20} more untranslated strings`
      );
    }
  }

  console.log("\n═════════════════════════════════════════════════════\n");
}

// Run if executed directly
if (require.main === module) {
  const projectRoot = process.cwd();
  const report = generateTranslationReport(projectRoot);
  printReport(report);
}

export default generateTranslationReport;
