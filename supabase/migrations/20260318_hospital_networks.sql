/**
 * Supabase Migration: Hospital Networks Database
 * 
 * Creates comprehensive hospital network data structure
 * Run with: supabase db push
 */

-- Create hospital_networks table
CREATE TABLE IF NOT EXISTS PUBLIC.hospital_networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  city VARCHAR NOT NULL,
  state VARCHAR NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR,
  email VARCHAR,
  
  -- Hospital details
  beds_count INT,
  established_year INT,
  accreditation_status VARCHAR, -- NABH, NABL, etc.
  accreditation_valid_until TIMESTAMP,
  
  -- Network status
  network_status VARCHAR DEFAULT 'active', -- active, inactive, negotiating
  is_empaneled BOOLEAN DEFAULT TRUE, -- Part of current network
  
  -- Specialties as array
  specialties TEXT[] DEFAULT '{}', -- ['Cardiology', 'Neurology', ...]
  departments TEXT[] DEFAULT '{}',
  
  -- Cashless availability
  cashless_available BOOLEAN DEFAULT TRUE,
  cashless_claim_ratio DECIMAL DEFAULT 0.95, -- 95% claims are cashless
  avg_claim_processing_days INT DEFAULT 7,
  
  -- Operations
  emergency_24_7 BOOLEAN DEFAULT TRUE,
  ambulance_available BOOLEAN DEFAULT TRUE,
  icu_beds INT DEFAULT 0,
  
  -- Contact & location
  address TEXT,
  postal_code VARCHAR,
  google_maps_url VARCHAR,
  
  -- Metadata
  additional_info JSONB,
  last_audited_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create hospital_specialties view for easy filtering
CREATE OR REPLACE VIEW PUBLIC.hospital_specialties_view AS
SELECT 
  id,
  name,
  city,
  state,
  latitude,
  longitude,
  unnest(specialties) as specialty,
  cashless_available,
  network_status
FROM PUBLIC.hospital_networks
WHERE network_status = 'active';

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_hospital_city ON PUBLIC.hospital_networks(city);
CREATE INDEX IF NOT EXISTS idx_hospital_state ON PUBLIC.hospital_networks(state);
CREATE INDEX IF NOT EXISTS idx_hospital_specialties ON PUBLIC.hospital_networks USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_hospital_location ON PUBLIC.hospital_networks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_hospital_cashless ON PUBLIC.hospital_networks(cashless_available);
CREATE INDEX IF NOT EXISTS idx_hospital_network_status ON PUBLIC.hospital_networks(network_status);

-- Enable Row Level Security
ALTER TABLE PUBLIC.hospital_networks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view active hospital networks
CREATE POLICY "Anyone can view active hospital networks"
  ON PUBLIC.hospital_networks
  FOR SELECT
  USING (network_status = 'active' AND is_empaneled = true);

-- RLS Policy: Only admins can create/update hospital networks
CREATE POLICY "Only admins can manage hospital networks"
  ON PUBLIC.hospital_networks
  FOR ALL
  USING (
    -- This would check user role from a user_roles table
    -- For now, a basic check that can be expanded
    EXISTS (
      SELECT 1 FROM PUBLIC.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );
