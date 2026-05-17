// lib/supabase.js
// Supabase recently renamed "anon key" → "publishable key" in their dashboard.
// We accept both env var names so either works.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '\n[SkillSwap] Supabase env vars not found.\n' +
    'Your .env.local needs:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)\n' +
    'Then RESTART the dev server.\n'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
