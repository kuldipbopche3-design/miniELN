'use client';

import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FlaskConical } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/update`,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSent(true);
        toast.success('Password reset link sent to your email!');
      }
    } catch {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Toaster position="top-right" />
      
      {/* Left Column: Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white shadow-xl z-10 border-r border-zinc-200">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <FlaskConical className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-zinc-900 tracking-tight">LabFlow</span>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Reset your password</h2>
              <p className="mt-2 text-sm text-zinc-600">
                We will email you a link to securely update your password, or{' '}
                <Link href="/login" className="font-semibold text-primary hover:text-primary-dark hover:underline">
                  return to sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8">
            {isSent ? (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm space-y-3">
                <p className="font-semibold">Check your inbox</p>
                <p>We sent a secure password reset link to <strong>{email}</strong>. Please check your spam folder if you do not receive it in a few minutes.</p>
                <Button variant="outline" size="sm" onClick={() => setIsSent(false)} className="mt-2">
                  Send again
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Work email address"
                  type="email"
                  placeholder="you@lab.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div>
                  <Button type="submit" className="w-full" isLoading={isLoading}>
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Visual Side (Desktop only) */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-700 via-indigo-900 to-emerald-900 flex flex-col justify-between p-16 text-white">
          <div className="flex items-center gap-1.5 opacity-80">
            <span className="text-sm font-semibold uppercase tracking-wider">ELECTRONIC LAB NOTEBOOK</span>
          </div>

          <div className="space-y-6 max-w-xl">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Restore access to your research notebook.
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed">
              LabFlow keeps all your experiment notes, team communication logs, and PDF files safe and secure. Follow the link inside the recovery email to update your login credentials.
            </p>
          </div>

          <div className="border-t border-white/20 pt-8 flex items-center justify-between">
            <p className="text-xs text-white/55">© 2026 LabFlow Technologies Inc. All rights reserved.</p>
            <div className="flex gap-4 text-xs text-white/60">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
