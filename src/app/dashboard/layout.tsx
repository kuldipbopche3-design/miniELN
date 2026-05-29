'use client';

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
