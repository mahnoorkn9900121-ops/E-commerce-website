import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useStore } from '../../context/StoreContext.tsx';
import type { AdminUser } from '../../types/store.ts';
import { adminFetch, AdminApiError, setStoredAdminToken } from './adminApi.ts';

interface AdminLoginScreenProps {
  onSuccess: (user: AdminUser) => void;
}

export function AdminLoginScreen({ onSuccess }: AdminLoginScreenProps) {
  const { goHome, theme, toggleTheme, storefrontConfig } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const brandName = storefrontConfig?.cms.settings.websiteName || 'MAISON KOVA';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter both administrator email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminFetch<{ authenticated: boolean; user: AdminUser; sessionToken?: string }>(
        '/api/admin/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );
      if (res.authenticated && res.user) {
        if (res.sessionToken) {
          setStoredAdminToken(res.sessionToken);
        }
        onSuccess(res.user);
      } else {
        setError('Unable to verify administrator credentials.');
      }
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(err.message);
      } else {
        setError('Unable to sign in right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between px-4 sm:px-8 py-6 bg-[#FAF9F6] dark:bg-[#111110]">
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Storefront</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-md border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#191816] text-stone-600 dark:text-stone-300 hover:border-stone-400 cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="max-w-md w-full mx-auto my-10">
        <div className="rounded-xl bg-white dark:bg-[#171614] border border-stone-200 dark:border-stone-800 p-7 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9A6B42] dark:text-[#C89B6E]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator Access</span>
            </div>
            <h1 className="font-display text-3xl font-medium text-stone-900 dark:text-stone-100">
              {brandName} Console
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              Sign in with your store administrator credentials to manage products, orders, customers, CMS content, and AI concierge settings.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-login-email"
                className="block text-xs font-medium text-stone-700 dark:text-stone-300"
              >
                Administrator Email
              </label>
              <input
                id="admin-login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="admin-login-password"
                className="block text-xs font-medium text-stone-700 dark:text-stone-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#FAF9F6] dark:bg-[#111110] border border-stone-300 dark:border-stone-700 rounded-md text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-[#9A6B42]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-medium uppercase tracking-[0.14em] bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Verifying Session...' : 'Sign In to Dashboard'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
            <span>HTTP-only encrypted session</span>
            <span>Protected API access</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto text-center text-[11px] text-stone-400 dark:text-stone-500">
        {brandName} Store Operations
      </div>
    </div>
  );
}
