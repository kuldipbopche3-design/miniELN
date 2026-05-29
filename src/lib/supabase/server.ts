import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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
    `For Netlify deployment add them in Site Settings \u2192 Environment variables.`;

  if (process.env.NODE_ENV === 'development') {
    throw new Error(msg);
  } else {
    console.error(msg);
  }
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
