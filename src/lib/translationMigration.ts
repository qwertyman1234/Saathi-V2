/**
 * Translation Migration Helper
 * Provides utilities to systematically add translations to components
 */

/**
 * Sample migration pattern for a component
 * 
 * BEFORE:
 * ```tsx
 * export default function Dashboard() {
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       <button>Add Policy</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * AFTER:
 * ```tsx
 * import { useTranslate } from "@/hooks/useTranslate";
 * 
 * export default function Dashboard() {
 *   const { t } = useTranslate();
 *   
 *   return (
 *     <div>
 *       <h1>{t("dashboard.title")}</h1>
 *       <button>{t("dashboard.addPolicy")}</button>
 *     </div>
 *   );
 * }
 * ```
 */

export const MIGRATION_PATTERN = `
1. Import the translation hook at the top of component:
   import { useTranslate } from "@/hooks/useTranslate";

2. Use the hook in your component:
   const { t } = useTranslate();

3. Replace hardcoded strings with t() calls:
   - Before: <h1>Dashboard</h1>
   - After:  <h1>{t("dashboard.title")}</h1>

4. For toast messages:
   - Before: toast.success("Policy added successfully");
   - After:  toast.success(t("dashboard.policyAdded"));

5. For placeholders and aria-labels:
   - Before: <input placeholder="Enter your email" />
   - After:  <input placeholder={t("common.enterEmail")} />
`;

/**
 * List of all components that need translation updates
 * Priority based on user-facing impact
 */
export const COMPONENTS_TO_MIGRATE = [
  // Priority 1: Navigation & Layout (Critical)
  { file: "src/components/AppSidebar.tsx", status: "pending", scope: "nav" },
  { file: "src/pages/Login.tsx", status: "pending", scope: "auth" },
  { file: "src/pages/SignUp.tsx", status: "pending", scope: "auth" },
  { file: "src/pages/Dashboard.tsx", status: "pending", scope: "dashboard" },

  // Priority 2: Main Features (High)
  { file: "src/pages/ClaimsTracker.tsx", status: "pending", scope: "claims" },
  { file: "src/pages/ComparePolicies.tsx", status: "pending", scope: "compare" },
  { file: "src/pages/ChatAssistant.tsx", status: "pending", scope: "chat" },
  { file: "src/pages/ExplainPolicy.tsx", status: "pending", scope: "explain" },
  { file: "src/pages/GapAnalysis.tsx", status: "pending", scope: "gap" },

  // Priority 3: Secondary Features (Medium)
  { file: "src/pages/CostEstimator.tsx", status: "pending", scope: "cost" },
  { file: "src/pages/BuyInsurance.tsx", status: "pending", scope: "buy" },
  { file: "src/pages/CheckClaim.tsx", status: "pending", scope: "check" },
  { file: "src/pages/HyperlocalSearch.tsx", status: "pending", scope: "search" },
  { file: "src/pages/UserProfile.tsx", status: "pending", scope: "profile" },
  { file: "src/pages/FamilyWallet.tsx", status: "pending", scope: "family" },
  { file: "src/pages/Onboarding.tsx", status: "pending", scope: "onboarding" },

  // Priority 4: Admin & Secondary (Low)
  { file: "src/pages/admin/ManagePlans.tsx", status: "pending", scope: "admin" },
  { file: "src/pages/admin/ManageUsers.tsx", status: "pending", scope: "admin" },
  { file: "src/pages/admin/ReviewClaims.tsx", status: "pending", scope: "admin" },
  { file: "src/pages/admin/AnalyticsDashboard.tsx", status: "pending", scope: "admin" },

  // Priority 5: UI Components (Low)
  { file: "src/components/Layout.tsx", status: "pending", scope: "common" },
  { file: "src/components/buy-insurance/StepDetails.tsx", status: "pending", scope: "buy" },
  { file: "src/components/buy-insurance/StepPreferences.tsx", status: "pending", scope: "buy" },
  { file: "src/components/buy-insurance/StepComparePlans.tsx", status: "pending", scope: "buy" },
  { file: "src/components/buy-insurance/StepReview.tsx", status: "pending", scope: "buy" },
];

/**
 * Verify that all translation keys are defined in the JSON files
 */
export function getTranslationKeysFromComponent(componentCode: string): string[] {
  const matches = componentCode.match(/t\(['"]([^'"]+)['"]\)/g) || [];
  return matches.map((m) => m.match(/['"]([^'"]+)['"]/)?.[1] || "").filter(Boolean);
}

/**
 * Generate a checklist for translation migration
 */
export function generateMigrationChecklist(): string {
  return `
# Translation Migration Checklist

## Pre-Migration
- [x] Create translation JSON files (en.json, hi.json, mr.json)
- [x] Set up i18n configuration
- [x] Create useTranslate hook
- [x] Create LanguageSwitcher component
- [ ] Review all components

## Component Migration (By Priority)
### Phase 1: Navigation & Auth
- [ ] AppSidebar.tsx
- [ ] Login.tsx
- [ ] SignUp.tsx
- [ ] Layout.tsx

### Phase 2: Core Features
- [ ] Dashboard.tsx
- [ ] ClaimsTracker.tsx
- [ ] ChatAssistant.tsx
- [ ] ExplainPolicy.tsx

### Phase 3: Analysis Features
- [ ] GapAnalysis.tsx
- [ ] CostEstimator.tsx
- [ ] ComparePolicies.tsx
- [ ] CheckClaim.tsx

### Phase 4: Secondary Pages
- [ ] BuyInsurance.tsx
- [ ] UserProfile.tsx
- [ ] FamilyWallet.tsx
- [ ] HyperlocalSearch.tsx
- [ ] Onboarding.tsx

### Phase 5: Admin & Utils
- [ ] ManagePlans.tsx
- [ ] ManageUsers.tsx
- [ ] ReviewClaims.tsx
- [ ] AnalyticsDashboard.tsx

## Post-Migration
- [ ] Run translation audit
- [ ] Test all pages in English
- [ ] Test all pages in Hindi
- [ ] Test all pages in Marathi
- [ ] Verify language persistence
- [ ] Check error messages translation
- [ ] Check toast notifications translation

## Testing Checklist
- [ ] Language switcher works
- [ ] All buttons have labels
- [ ] All placeholders are translated
- [ ] All error messages are translated
- [ ] Toast messages are translated
- [ ] Page titles are translated
- [ ] Navigation items are translated
- [ ] Form labels are translated
- [ ] Help text is translated
- [ ] No console errors
`;
}

export default {
  MIGRATION_PATTERN,
  COMPONENTS_TO_MIGRATE,
  getTranslationKeysFromComponent,
  generateMigrationChecklist,
};
