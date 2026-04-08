/**
 * Example: How to use extracted vault data for form autofill
 * 
 * In any component (like BuyInsurance, CostEstimator, etc.),
 * import and use the useVault hook to access extracted user data
 */

import { useVault } from '@/contexts/VaultContext';

export function ExampleFormWithVaultAutofill() {
  const vault = useVault();
  
  // Access extracted data
  const fullName = vault.getFieldValue('fullName');
  const dateOfBirth = vault.getFieldValue('dateOfBirth');
  const gender = vault.getFieldValue('gender');
  
  // Also access the full extracted data object
  const extractedData = vault.extractedData;
  const familyProfile = vault.familyProfile;

  return (
    <form>
      {/* Input pre-filled with extracted name */}
      <input
        type="text"
        placeholder="Full Name"
        defaultValue={fullName || ''}
      />
      
      {/* DOB pre-filled from vault */}
      <input
        type="date"
        defaultValue={dateOfBirth || ''}
      />
      
      {/* Health details from extracted medical reports */}
      {extractedData?.standardizedData && (
        <>
          <input
            type="text"
            placeholder="Blood Group"
            defaultValue={vault.getFieldValue('bloodGroup') || ''}
          />
          <input
            type="text"
            placeholder="Medical History"
            defaultValue={vault.getFieldValue('medicalHistory') || ''}
          />
        </>
      )}
      
      {/* Insurance details from extracted policies */}
      {extractedData?.documentType === 'Insurance_Policy' && (
        <input
          type="text"
          placeholder="Existing Policy Number"
          defaultValue={vault.getFieldValue('policyNumber') || ''}
        />
      )}
    </form>
  );
}

/**
 * USAGE IN ACTUAL COMPONENTS:
 * 
 * 1. BuyInsurance.tsx - Pre-fill user details
 * 2. CostEstimator.tsx - Use age, health data for premium calculation
 * 3. ComparePolicies.tsx - Filter policies based on existing coverage
 * 4. GapAnalysis.tsx - Compare extracted coverage with recommended
 * 5. ChatAssistant.tsx - Reference user data in conversations
 * 
 * EXAMPLE:
 * 
 * import { useVault } from '@/contexts/VaultContext';
 * 
 * export function BuyInsurance() {
 *   const vault = useVault();
 *   const [formData, setFormData] = useState({
 *     name: vault.getFieldValue('fullName') || '',
 *     dob: vault.getFieldValue('dateOfBirth') || '',
 *     // ... other fields
 *   });
 * }
 */
