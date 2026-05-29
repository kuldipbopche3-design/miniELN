'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FlaskConical } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Please enter all password fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
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
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Set a new password</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Please enter a secure password with at least 6 characters.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="New password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  Save Password
                </Button>
              </div>
            </form>
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
              Create a secure password.
            </h1>
            <p className="text-zinc-300 text-lg leading-relaxed">
              Ensure your new password uses a combination of upper/lowercase characters, numbers, and symbols to protect sensitive intellectual property stored in your workspace.
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
