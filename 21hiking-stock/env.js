// env.js — Inject environment variables from Vercel
// In Vercel, set SUPABASE_URL and SUPABASE_ANON_KEY as Environment Variables
// Then reference them here via a build step or directly replace below.
// For a purely static Vercel deploy (no build), manually paste your values here.

window.__ENV__ = {
  SUPABASE_URL: 'https://vrbsnbvkdvmainhffppg.supabase.co',       // replace with your project URL
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyYnNuYnZrZHZtYWluaGZmcHBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzNTQyOTMsImV4cCI6MjA5NjkzMDI5M30.ldy_HnO8UJGIEtVZNQ4Py1x3cm2Lf22OgIk6fPJBGhE', // replace with your anon key
};
