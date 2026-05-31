'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 space-y-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-650 shadow-sm animate-pulse">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-zinc-900">Loading Workspace...</p>
        <p className="text-xs text-zinc-400">Fetching latest database entries and records.</p>
      </div>
    </div>
  );
}
