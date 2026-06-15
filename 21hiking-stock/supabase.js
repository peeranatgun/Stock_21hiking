// supabase.js — Supabase client
// Set SUPABASE_URL and SUPABASE_ANON_KEY in env.js before deploying
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = window.__ENV__?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.__ENV__?.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL') {
  console.error('⚠️ กรุณาตั้งค่า SUPABASE_URL ใน env.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
