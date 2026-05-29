'use client';

// Prevent Next.js from statically prerendering auth-protected routes at build time.
// This has no effect on runtime behaviour — only on the build process.
export const dynamic = 'force-dynamic';

import React from 'react';
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';
import { Shell } from '@/components/layout/Shell';
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceProvider>
      <Toaster position="top-right" />
      <Shell>{children}</Shell>
    </WorkspaceProvider>
  );
}
