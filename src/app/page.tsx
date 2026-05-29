import React from 'react';
import Link from 'next/link';
import { FlaskConical, CheckCircle2, ShieldCheck, Share2, ClipboardList, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* 1. Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-zinc-200/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FlaskConical className="h-5.5 w-5.5" />
            </div>
            <span className="text-lg font-bold text-zinc-900 tracking-tight">LabFlow</span>
          </div>
          
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-zinc-600 hover:text-zinc-950 transition">
              Sign In
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-xs hover:scale-105 transition-transform duration-200">
                Create Lab Workspace
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center py-20 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-300/30 to-emerald-300/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold select-none animate-fade-in">
            <FlaskConical className="h-3.5 w-3.5" /> Introducing LabFlow v2.0
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold text-zinc-900 tracking-tight leading-tight">
            The Electronic Lab Notebook <br />
            <span className="bg-gradient-to-r from-indigo-650 via-indigo-800 to-emerald-700 bg-clip-text text-transparent">
              for Modern Research Teams
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-650 max-w-2xl mx-auto leading-relaxed">
            Ditch paper logs, fragile Excel sheets, and scattered WhatsApp files. Document experiments, log test samples, manage files, and export regulatory-compliant PDFs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto shadow-md hover:scale-103 cursor-pointer">
                Start Free Workspace <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto cursor-pointer bg-white">
                Access Lab Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Feature Highlights Grid */}
      <section className="bg-white border-y border-zinc-200/80 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Why Research Labs Trust LabFlow</h2>
            <p className="text-zinc-500 text-sm">Everything you need to streamline testing, chemistry audits, and team validation pipelines.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-55 hover:border-zinc-300 hover:shadow-xs transition duration-200 space-y-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-900">Rich Text Experiment logs</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Log formulas, procedures, and observation tables using a distraction-free, Notion-like editor workspace.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-55 hover:border-zinc-300 hover:shadow-xs transition duration-200 space-y-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
                <Share2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-900">Team Collaboration</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Invite lab staff, assign user permissions, track modifications, and coordinate review tasks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-55 hover:border-zinc-300 hover:shadow-xs transition duration-200 space-y-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-900">Workspace Security</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Role-based access controls and isolated multi-tenant databases keep your research findings secure.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-55 hover:border-zinc-300 hover:shadow-xs transition duration-200 space-y-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-zinc-900">PDF Notebook Export</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Generate high-quality lab PDFs with sign-off signatures ready for audits or patent applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Footer */}
      <footer className="bg-zinc-900 text-zinc-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto border-t border-zinc-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white">
            <FlaskConical className="h-5 w-5 text-indigo-400" />
            <span className="font-bold tracking-tight">LabFlow ELN</span>
          </div>
          <p className="text-xs text-zinc-500">© 2026 LabFlow Technologies Inc. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
