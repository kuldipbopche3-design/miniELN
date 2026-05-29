/**
 * Fix: workspace_members RLS infinite recursion
 * Uses pg to connect directly to Supabase PostgreSQL
 */
const { Client } = require('pg');

const SQL = `
DROP POLICY IF EXISTS "members_select" ON public.workspace_members;

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
  // Try different connection strings
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: node fix_rls.cjs <db_password>');
    process.exit(1);
  }

  const connectionString = `postgresql://postgres.mbepkdmrownxkmpzkcqn:${password}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected! Applying fix...');
    await client.query(SQL);
    console.log('SUCCESS: RLS recursion fix applied!');
  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await client.end();
  }
}

main();
