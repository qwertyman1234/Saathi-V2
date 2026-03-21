/**
 * Supabase Migration: Payment Tracking Schema
 * 
 * Creates tables to track payments and policies
 * Run with: supabase migration new add_payment_tracking
 */

-- Add payment-related columns to policies table
ALTER TABLE PUBLIC.policies ADD COLUMN IF NOT EXISTS (
  razorpay_order_id VARCHAR,
  razorpay_payment_id VARCHAR,
  payment_status VARCHAR DEFAULT 'pending', -- pending, completed, failed
  payment_method VARCHAR, -- razorpay_upi, razorpay_card, etc.
  transaction_date TIMESTAMP,
  amount_paid DECIMAL,
  currency VARCHAR DEFAULT 'INR'
);

-- Create payments table for detailed transaction history
CREATE TABLE IF NOT EXISTS PUBLIC.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES PUBLIC.policies(id) ON DELETE SET NULL,
  razorpay_order_id VARCHAR UNIQUE,
  razorpay_payment_id VARCHAR UNIQUE,
  razorpay_signature VARCHAR,
  amount DECIMAL NOT NULL,
  currency VARCHAR DEFAULT 'INR',
  payment_method VARCHAR,
  status VARCHAR DEFAULT 'pending', -- pending, completed, failed, refunded
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Create payment_webhooks table for webhook tracking
CREATE TABLE IF NOT EXISTS PUBLIC.payment_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES PUBLIC.payments(id) ON DELETE CASCADE,
  event_type VARCHAR, -- payment.authorized, payment.failed, payment.captured
  webhook_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON PUBLIC.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_policy_id ON PUBLIC.payments(policy_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON PUBLIC.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_payment_id ON PUBLIC.payment_webhooks(payment_id);

-- Enable Row Level Security
ALTER TABLE PUBLIC.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE PUBLIC.payment_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own payments
CREATE POLICY "Users can view their own payments"
  ON PUBLIC.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Only authenticated users can insert payments
CREATE POLICY "Users can create payments for themselves"
  ON PUBLIC.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
