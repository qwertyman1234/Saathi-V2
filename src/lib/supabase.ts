// Supabase Configuration
import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://localhost:3000";
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Only create client if we have a valid URL (for testing)
export const supabase = (supabaseUrl && supabaseUrl !== "https://localhost:3000") 
  ? createClient(supabaseUrl, supabaseKey)
  : null as any;
