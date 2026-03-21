import { supabase } from './client';
import type { Database } from './types';

export async function trackLogin(userId: string, email?: string) {
  try {
    const { data, error } = await supabase
      .from('login_logs')
      .upsert({
        user_id: userId,
        email: email || null,
        last_login: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error tracking login:', error);
    return { data: null, error: error as Error };
  }
}

export async function getLoginLogs() {
  try {
    const { data, error } = await supabase
      .from('login_logs')
      .select('*')
      .order('last_login', { ascending: false });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching login logs:', error);
    return { data: null, error: error as Error };
  }
}

export async function getLoginLogsByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from('login_logs')
      .select('*')
      .eq('user_id', userId)
      .order('last_login', { ascending: false });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching login logs by user ID:', error);
    return { data: null, error: error as Error };
  }
}