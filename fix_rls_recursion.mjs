/**
 * FIX: workspace_members RLS infinite recursion
 *
 * Root cause: The SELECT policy on workspace_members calls is_workspace_member(),
 * which queries workspace_members, triggering the policy again → infinite loop.
 *
 * Fix:
 * 1. Replace the members_select policy with a direct user_id check (no function call)
 * 2. Re-create helper functions as proper SECURITY DEFINER sql functions
 */

import pg from 'pg';
const { Client } = pg;

// Supabase PostgreSQL connection (use the pooled connection string)
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
// For direct connection: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

// We'll connect via the Supabase direct DB URL
// Project ref: mbepkdmrownxkmpzkcqn
const CONNECTION_STRING = 'postgresql://postgres.mbepkdmrownxkmpzkcqn:' + process.env.DB_PASSWORD + '@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';

const SQL = `
-- ================================================
-- FIX: Remove infinite recursion from workspace_members SELECT policy
-- ================================================

-- Drop the old recursive SELECT policy
DROP POLICY IF EXISTS "members_select" ON public.workspace_members;

-- New policy: user can see rows if they ARE the user_id, 
-- OR if the workspace_id matches any workspace they belong to
-- Uses a direct subquery — no call to is_workspace_member (avoids recursion)
CREATE POLICY "members_select" ON public.workspace_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    workspace_id IN (
      SELECT wm.workspace_id
      FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
    )
  );

-- Update helper functions (SECURITY DEFINER bypasses RLS on the workspace_members table
-- when called from OTHER tables' policies - they won't trigger workspace_members policy recursion)
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_workspace_role(ws_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.workspace_members
  WHERE workspace_id = ws_id AND user_id = auth.uid()
  LIMIT 1;
$$;
`;

async function main() {
  if (!process.env.DB_PASSWORD) {
    console.error('ERROR: DB_PASSWORD environment variable not set');
    console.log('\nPlease run: DB_PASSWORD=your_db_password node fix_rls_recursion.mjs');
    process.exit(1);
  }

  const client = new Client({ connectionString: CONNECTION_STRING });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('Connected. Applying RLS fix...\n');

    await client.query(SQL);
    console.log('✅ SUCCESS: RLS recursion fix applied!');
    console.log('\nWhat was fixed:');
    console.log('  - Dropped the old recursive "members_select" policy');
    console.log('  - Created new non-recursive SELECT policy using direct user_id check');
    console.log('  - Updated is_workspace_member() and get_workspace_role() as SECURITY DEFINER sql functions');
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    throw err;
  } finally {
    await client.end();
  }
}

main();
