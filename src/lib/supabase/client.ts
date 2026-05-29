import { createBrowserClient } from '@supabase/ssr';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate required environment variables and surface a clear error in development.
if (!supabaseUrl || !supabaseAnonKey) {
  const missing: string[] = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  const msg =
    `[Supabase] Missing required environment variable(s): ${missing.join(', ')}.\n` +
    `For local development add them to .env.local.\n` +
    `For Netlify deployment add them in Site Settings → Environment variables.`;

  if (process.env.NODE_ENV === 'development') {
    // Throw immediately in dev so the error is obvious in the terminal/console.
    throw new Error(msg);
  } else {
    // In production, log without crashing the module import so other pages can
    // still render, but Supabase operations will fail with a descriptive message.
    console.error(msg);
  }
}

export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!
  );
}
