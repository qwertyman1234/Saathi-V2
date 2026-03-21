/**
 * Supabase Migration: Audit Logging Tables
 * 
 * Creates tables for IRDA compliance audit trail
 * Run with: supabase db push
 */

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS PUBLIC.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR NOT NULL, -- POLICY_CREATED, CLAIM_APPROVED, etc.
  resource_type VARCHAR NOT NULL, -- policy, claim, payment, user
  resource_id VARCHAR NOT NULL,
  
  -- Action details
  details JSONB, -- Stores action-specific information
  
  -- Admin trail (if action taken by admin)
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remarks TEXT, -- Admin notes/reason for action
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for fast queries
  INDEX idx_action ON action,
  INDEX idx_resource ON (resource_type, resource_id),
  INDEX idx_user ON user_id,
  INDEX idx_timestamp ON timestamp
);

-- Create compliance_snapshots table (for periodic exports)
CREATE TABLE IF NOT EXISTS PUBLIC.compliance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  report_type VARCHAR NOT NULL, -- monthly, quarterly, annual
  audit_logs_count INT,
  policies_count INT,
  claims_count INT,
  total_premium DECIMAL,
  total_claims_amount DECIMAL,
  
  snapshot_data JSONB, -- Full snapshot for archival
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_date ON snapshot_date,
  INDEX idx_type ON report_type
);

-- Create data_access_logs table (for GDPR/privacy compliance)
CREATE TABLE IF NOT EXISTS PUBLIC.data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL if user accessed own data
  data_type VARCHAR NOT NULL, -- personal_info, policy_details, claim_details
  action VARCHAR NOT NULL, -- view, download, export
  ip_address INET,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user ON user_id,
  INDEX idx_timestamp ON timestamp
);

-- Enable Row Level Security
ALTER TABLE PUBLIC.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE PUBLIC.compliance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE PUBLIC.data_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON PUBLIC.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM PUBLIC.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- RLS Policy: Users can only view their own access logs
CREATE POLICY "Users can view their own data access logs"
  ON PUBLIC.data_access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Only admins can view compliance snapshots
CREATE POLICY "Only admins can view compliance snapshots"
  ON PUBLIC.compliance_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM PUBLIC.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create function to archive old audit logs (7-year retention per IRDA guidelines)
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- This would typically move logs older than 7 years to an archive table
  -- For now, just mark them as archived
  UPDATE PUBLIC.audit_logs
  SET details = jsonb_set(
    details,
    '{archived}',
    'true'::jsonb
  )
  WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '7 years'
  AND NOT (details ->> 'archived' = 'true');
END;
$$ LANGUAGE plpgsql;

-- Schedule daily archive (requires pg_cron extension)
-- SELECT cron.schedule('archive-audit-logs', '0 2 * * *', 'SELECT archive_old_audit_logs()');
