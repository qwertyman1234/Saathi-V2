// Example: Adding InsuranceVault to your existing React Router
// Add this to your main routing configuration (e.g., App.tsx or your router setup)

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { InsuranceVaultPage } from '@/pages/InsuranceVault';
import { Dashboard } from '@/pages/Dashboard';
import { BuyInsurance } from '@/pages/BuyInsurance';
// ... other imports

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/buy-insurance" element={<BuyInsurance />} />
        
        {/* NEW: Add Document Vault */}
        <Route path="/vault" element={<InsuranceVaultPage />} />
        {/* OR with a nested path: */}
        {/* <Route path="/insurance/vault" element={<InsuranceVaultPage />} /> */}
        
        {/* ... other routes */}
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;

// ============================================
// OPTION 2: In your Navigation/Sidebar
// ============================================

// Add this link to your navigation menu:

import { Link } from 'react-router-dom';

export function Navigation() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/buy-insurance">Buy Insurance</Link></li>
        
        {/* NEW Link to Vault */}
        <li><Link to="/vault">Document Vault</Link></li>
        
        {/* ... other nav items */}
      </ul>
    </nav>
  );
}

// ============================================
// OPTION 3: In your Sidebar Component
// ============================================

import { AiOutlineFile, AiOutlineRobot } from 'react-icons/ai';

export function SidebarItems() {
  return (
    <div className="sidebar">
      {/* Existing items */}
      
      {/* NEW Sidebar item with icon */}
      <SidebarItem
        icon={<AiOutlineFile />}
        label="Document Vault"
        href="/vault"
      />
      
      <SidebarItem
        icon={<AiOutlineRobot />}
        label="AI Autofill"
        href="/vault?tab=autofill"
      />
    </div>
  );
}

// ============================================
// OPTION 4: Quick Navigation Helper
// ============================================

// Use this to navigate programmatically:

import { useNavigate } from 'react-router-dom';

export function SomeComponent() {
  const navigate = useNavigate();

  const goToVault = () => {
    navigate('/vault');
  };

  const goToVaultAutofill = () => {
    navigate('/vault?tab=autofill');
  };

  return (
    <div>
      <button onClick={goToVault}>Open Vault</button>
      <button onClick={goToVaultAutofill}>AI Autofill</button>
    </div>
  );
}

// ============================================
// OPTION 5: Configuration for URL Parameter
// ============================================

// Component accepts initialTab prop:

import { InsuranceVaultPage } from '@/pages/InsuranceVault';
import { useSearchParams } from 'react-router-dom';

// In your router:
<Route 
  path="/vault" 
  element={
    <InsuranceVaultPage initialTab={getTabFromUrl()} />
  } 
/>

// Helper function:
function getTabFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('tab') || 'vault';  // Default to 'vault' tab
}
