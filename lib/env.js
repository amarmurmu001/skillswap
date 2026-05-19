/**
 * lib/env.js
 * Validates all required environment variables at startup.
 * Import this at the top of lib/supabase.js to get a clear error
 * message when a variable is missing, instead of a cryptic runtime crash.
 *
 * To add zod for stricter validation:
 *   npm install zod
 *   Then replace the manual checks below with z.object({...}).parse(...)
 */

const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  // Accept either name (Supabase recently renamed anon key → publishable key)
  ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'],
];

if (typeof window !== 'undefined') {
  const missing = [];

  for (const entry of REQUIRED) {
    if (Array.isArray(entry)) {
      // At least one of the alternatives must be set
      const hasOne = entry.some(k => Boolean(process.env[k]));
      if (!hasOne) missing.push(entry.join(' or '));
    } else {
      if (!process.env[entry]) missing.push(entry);
    }
  }

  if (missing.length > 0) {
    console.error(
      `[SkillSwap] ⚠️  Missing required environment variables:\n` +
      missing.map(v => `  • ${v}`).join('\n') +
      `\n\nAdd them to .env.local and restart the dev server.`
    );
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

export default env;
