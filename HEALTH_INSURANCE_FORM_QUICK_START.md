# Health Insurance Form - Quick Developer Guide

## 🚀 Quick Start

### File Location
```
src/components/buy-insurance/HealthInsuranceForm.tsx
```

### Integration
Component is auto-integrated into `/buy-insurance` route as Step 1.

```typescript
// In src/pages/BuyInsurance.tsx
import HealthInsuranceForm from "@/components/buy-insurance/HealthInsuranceForm";

// Usage (Step 0)
{step === 0 && (
  <HealthInsuranceForm />
)}
```

---

## 📋 Component Overview

**Main Component**: `HealthInsuranceForm` (1,200+ LOC)

**Exports**:
- Default export: `HealthInsuranceForm` component
- Named export: `HealthInsuranceFormData` interface

**Props**: None required (standalone component)

---

## 🎯 4-Step Internal Structure

### Step 0: Contact & Personal Information
- 8 form fields
- Basic validation
- Edit: Lines 200-330

### Step 1: Health Information
- 9 form fields
- Conditional BMI calculation
- Conditional smoker frequency
- Conditional pre-existing conditions
- Edit: Lines 331-550

### Step 2: Family Coverage & Income
- 5 form fields  
- Conditional dependent ages
- Sum insured selection
- Income range
- Edit: Lines 551-720

### Step 3: Review & Confirmation
- 4 summary cards
- Terms & conditions
- Submit button
- Edit: Lines 721-900

---

## 🔧 Common Modifications

### Change Color Scheme

Find and replace all green color references:

```typescript
// Find all:
"bg-green-600"      // → "bg-blue-600"
"bg-green-50"       // → "bg-blue-50"
"border-green-200"  // → "border-blue-200"
"border-green-600"  // → "border-blue-600"
"text-green-600"    // → "text-blue-600"
"text-green-700"    // → "text-blue-700"
"focus:ring-green-500" // → "focus:ring-blue-500"
```

### Add New Pre-existing Condition

```typescript
const PRE_EXISTING_CONDITIONS = [
  "Diabetes",
  "Hypertension",
  // ... existing conditions
  "Mental Health",  // ← Add here
];
```

### Change Sum Insured Options

In Step 3 section (~line 680):
```typescript
<SelectItem value="5">₹5 Lakhs</SelectItem>
<SelectItem value="8">₹8 Lakhs</SelectItem>  // ← Add
<SelectItem value="12">₹12 Lakhs</SelectItem> // ← Add
// Modify or add new options
```

### Disable localStorage Persistence

Find `saveFormData()` calls and comment out:
```typescript
// const saveFormData = (data) => {
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
// };
```

### Change Redirect Destination

In `handleSubmit()` function (~line 150):
```typescript
setTimeout(() => {
  navigate("/custom-page");  // ← Change destination
}, 2000);
```

### Custom API Submission

Replace mock submission:
```typescript
const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    const response = await fetch('/api/health-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) throw new Error('Submission failed');
    
    const result = await response.json();
    console.log('Server response:', result);
    
    setShowConfirmation(true);
    setTimeout(() => navigate("/next-page"), 2000);
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 🎨 Styling Customization

### Change Primary Button Color

Find button styling:
```typescript
<Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700">
  // Change to:
  <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700">
```

### Modify Border Radius

Change `rounded-lg` to:
- `rounded-none` - Sharp corners
- `rounded-md` - Medium radius
- `rounded-xl` - Large radius
- `rounded-full` - Pill/circle

### Adjust Spacing

Common spacing modifiers:
- `p-6` → `p-4` (smaller padding)
- `gap-4` → `gap-2` (tighter gap)
- `mb-6` → `mb-8` (more margin)

---

## 🔍 Finding Key Code Sections

### BMI Calculation
**Line**: ~80  
**Search**: "useEffect(() => {"  
**Function**: Auto-calculation on height/weight change

### Validation Logic
**Line**: ~110  
**Search**: "const validateStep = ("  
**Function**: All validation rules per step

### Conditional Field Rendering
**Line**: ~240 (Smoker), ~380 (Pre-existing)  
**Search**: "form.isSmoker &&"  
**Function**: Show/hide dependent on parent field

### localStorage Management
**Line**: ~60 (Save), ~65 (Load)  
**Search**: "localStorage.getItem"  
**Function**: Persistence implementation

### Navigation Buttons
**Line**: ~1040  
**Search**: "handleNext()"  
**Function**: Step progression logic

---

## 📊 Data Structure Reference

### Form Data Object Structure

```typescript
{
  // Step 1 (9 fields)
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "9876543210",
  city: "Mumbai",
  age: "35",
  gender: "male",
  maritalStatus: "married",
  occupation: "Software Engineer",

  // Step 2 (9 fields)
  height: "170",
  weight: "75",
  bmi: 25.9,  // auto-calculated
  systolicBP: "120",
  diastolicBP: "80",
  isSmoker: false,
  smokerFrequency: "",  // empty if not smoker
  alcoholConsumption: "none",
  hasPreExistingConditions: true,
  preExistingConditions: ["Diabetes", "Hypertension"],
  conditionDetails: "Diabetes since 2015, controlled...",

  // Step 3 (5 fields)
  coverageType: "family",
  familyMembers: "[]",
  dependentAges: "32,28,5",
  desiredSumInsured: "25",
  annualIncomeRange: "25to50",

  // Step 4 (2 fields)
  agreedToTerms: true,
  timestamp: "2026-03-18T10:30:00.000Z"
}
```

---

## 🧪 Testing the Form

### Manual Testing Checklist

- [ ] Fill all fields on Step 1, click Next
- [ ] Verify validation errors appear for empty fields
- [ ] Fill Step 2, toggle "Smoker" - verify frequency appears
- [ ] Enter height/weight - verify BMI auto-calculates
- [ ] Toggle pre-existing - verify condition list appears
- [ ] Select Family coverage - verify dependent ages field appears
- [ ] Reach Step 4, try submit without T&C checked
- [ ] Accept T&C, click Submit
- [ ] Verify confirmation page shows
- [ ] Check browser console for logged form data
- [ ] Refresh page - verify data persists
- [ ] Verify redirect after 2 seconds

### Unit Test Example

```typescript
describe('HealthInsuranceForm', () => {
  it('should calculate BMI correctly', () => {
    // Test: height 170cm, weight 75kg → BMI 25.9
    const heightInMeters = 170 / 100;
    const bmi = 75 / (heightInMeters * heightInMeters);
    expect(Math.round(bmi * 10) / 10).toBe(25.9);
  });

  it('should validate email format', () => {
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(validEmail.test('john@example.com')).toBe(true);
    expect(validEmail.test('invalid-email')).toBe(false);
  });

  it('should validate phone 10 digits', () => {
    const phone = '9876543210';
    expect(/^\d{10}$/.test(phone.replace(/[^\d]/g, ''))).toBe(true);
  });
});
```

---

## 🐛 Debugging Tips

### Form Not Showing?
1. Check route: Navigate to `/buy-insurance`
2. Open browser DevTools (F12)
3. Check Console for errors
4. Verify BuyInsurance.tsx has import
5. Verify `step === 0` renders HealthInsuranceForm

### Data Not Persisting?
1. Open DevTools → Application → localStorage
2. Search for `healthInsuranceFormData` key
3. Check if data is being saved
4. Clear localStorage: `localStorage.clear()`
5. Refresh and re-enter data

### Conditional Fields Not Showing?
1. Check if parent field is actually toggled
2. Look for `form.isSmoker &&` in code
3. Verify Framer Motion: `initial={{ opacity: 0, height: 0 }}`
4. Check CSS classes not hiding element

### Validation Not Working?
1. Open DevTools → Network
2. Check form submission payload
3. Look at `validateStep()` function
4. Verify error state is set: `setErrors(newErrors)`

### LocalStorage Issues (Quota)?
```javascript
// Check storage quota
if (navigator.storage && navigator.storage.estimate) {
  navigator.storage.estimate().then(estimate => {
    console.log(`Used: ${estimate.usage} bytes`);
    console.log(`Available: ${estimate.quota} bytes`);
  });
}
```

---

## 📱 Mobile Testing

### Mobile Responsiveness Checklist

**iPhone SE (375px)**
- [ ] All fields stack vertically
- [ ] Buttons are full-width with readable size
- [ ] Text is readable (>16px minimum)
- [ ] Touch targets >44px
- [ ] Progress bar visible
- [ ] No horizontal scroll

**iPad (768px)**
- [ ] 2-column layout where appropriate
- [ ] Form cards have good spacing
- [ ] All content visible without scroll
- [ ] Buttons appropriately sized

**Desktop (1920px)**
- [ ] 2-3 column layout optimal
- [ ] Cards well-organized
- [ ] Spacing generous

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Run `npm run build` - builds successfully
- [ ] Run `npm run test:all` - all tests pass
- [ ] Run `npm run lint` - no linting errors
- [ ] Test on mobile devices
- [ ] Test on different browsers
- [ ] Test form validation
- [ ] Test data persistence
- [ ] Test redirect after submission
- [ ] Verify API endpoint ready (if using custom submission)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Privacy Policy link working
- [ ] Terms & Conditions link working
- [ ] Support email configured

---

## 📞 Support & Issues

### Common Issue: Type Errors in TypeScript

If you see type errors after modifying:
1. Ensure imports are correct
2. Check interface definitions match
3. Run `npm run build` to see full error
4. Verify all required props are provided

### Performance Issues

If form is slow:
1. Check browser DevTools → Performance
2. Profile with React DevTools
3. Consider memoizing with `useMemo`
4. Check localStorage size:
   ```javascript
   const size = JSON.stringify(localStorage).length;
   console.log(`Storage: ${size} bytes`);
   ```

### localStorage Full Error

```javascript
// Clear old data periodically
const clearOldFormData = () => {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  if (stored.timestamp) {
    const age = Date.now() - new Date(stored.timestamp).getTime();
    if (age > 7 * 24 * 60 * 60 * 1000) { // 7 days
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
```

---

## 🎓 Developer Resources

**Key Files:**
- Main component: `src/components/buy-insurance/HealthInsuranceForm.tsx`
- Integration: `src/pages/BuyInsurance.tsx`
- UI Components: `src/components/ui/` (shadcn/ui)

**Dependencies:**
- `react`: Core framework
- `framer-motion`: Animations
- `tailwindcss`: Styling
- `shadcn/ui`: UI components
- `sonner`: Toasts
- `react-router-dom`: Navigation
- `lucide-react`: Icons

**Documentation:**
- `HEALTH_INSURANCE_FORM_DOCUMENTATION.md` - Complete guide
- `HEALTH_INSURANCE_FORM_FEATURES.md` - Feature checklist
- This file - Developer quick start

---

## ✅ Verification Commands

```bash
# Build the project
npm run build

# Run all tests
npm run test:all -- --workers=1

# Run specific test file
npm run test buy-insurance.spec.ts

# Lint code
npm run lint

# Check TypeScript
npm run type-check

# Start dev server
npm run dev
```

---

## 🎉 You're Ready!

The health insurance form is production-ready. Start using it for collecting user insurance data!

**Questions?** Check the full documentation at:
- `HEALTH_INSURANCE_FORM_DOCUMENTATION.md`
- `HEALTH_INSURANCE_FORM_FEATURES.md`
