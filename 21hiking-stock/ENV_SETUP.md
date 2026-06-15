<!-- 
  env.html — Environment variable injection
  
  On Vercel, use a Build Output API or environment variable injection.
  
  The simplest approach: create a /api/env.js Vercel serverless function
  that serves your env vars safely to the client.
  
  OR: Replace the placeholder values in supabase.js directly.
  
  RECOMMENDED FOR PRODUCTION:
  Edit supabase.js lines:
    const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
    const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';
  
  The anon key is safe to expose in client-side code.
  It is protected by Row Level Security (RLS) policies.
-->
