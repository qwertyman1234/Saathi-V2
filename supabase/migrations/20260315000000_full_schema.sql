-- ============================================================
-- Saathi Health Insurance — Full Schema Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── family_members ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL DEFAULT 'Male',
  conditions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "family_members_select" ON public.family_members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "family_members_insert" ON public.family_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "family_members_update" ON public.family_members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "family_members_delete" ON public.family_members FOR DELETE USING (auth.uid() = user_id);

-- ── policies ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  coverage_amount NUMERIC NOT NULL DEFAULT 0,
  premium_amount NUMERIC NOT NULL DEFAULT 0,
  premium_frequency TEXT NOT NULL DEFAULT 'yearly',
  start_date DATE,
  expiry_date DATE,
  policy_type TEXT NOT NULL DEFAULT 'health',
  status TEXT NOT NULL DEFAULT 'Active',
  document_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policies_select" ON public.policies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "policies_insert" ON public.policies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "policies_update" ON public.policies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "policies_delete" ON public.policies FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── claims ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES public.policies(id) ON DELETE SET NULL,
  claim_number TEXT NOT NULL UNIQUE,
  procedure_name TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  claim_amount NUMERIC NOT NULL DEFAULT 0,
  approved_amount NUMERIC,
  incident_date DATE NOT NULL,
  submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'Submitted',
  notes TEXT,
  missing_documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "claims_select" ON public.claims FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "claims_insert" ON public.claims FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "claims_update" ON public.claims FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "claims_delete" ON public.claims FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── chat_messages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chat_messages_insert" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chat_messages_delete" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);

-- ── login_logs (ensure it exists) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  last_login TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "login_logs_select" ON public.login_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "login_logs_insert" ON public.login_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "login_logs_update" ON public.login_logs FOR UPDATE USING (auth.uid() = user_id);

-- ── Realtime: enable for live updates ─────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.family_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.policies;
ALTER PUBLICATION supabase_realtime ADD TABLE public.claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
