'use client';

import React, { useActionState, useState } from 'react';
import { loginAction, AuthState } from '@/lib/actions/auth-actions';
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<AuthState | null, FormData>(
    loginAction,
    null
  );
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md bg-[#FFFFFF] p-8 sm:p-10 rounded-xl border border-[#E3E5E7] shadow-md transition-all">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#34495E] text-white mb-3 shadow-xs">
          <Building2 className="w-6 h-6 text-[#E2E8F0]" />
        </div>
        <div className="text-[11px] font-bold tracking-widest text-[#34495E] uppercase">
          STOREHUB
        </div>
        <h1 className="text-xl font-bold tracking-tight text-[#202326] mt-1">
          Store Management System
        </h1>
        <p className="text-xs text-[#697077] mt-1.5">
          Authorized storekeeper & institutional personnel access
        </p>
      </div>

      {/* Error Banner */}
      {state?.error && (
        <div
          className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in"
          role="alert"
        >
          <span className="font-semibold">Error:</span> {state.error}
        </div>
      )}

      {/* Login Form */}
      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-semibold text-[#202326] uppercase tracking-wider mb-1.5"
          >
            Institutional Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#697077] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue="storekeeper@dhiu.in"
              placeholder="storekeeper@dhiu.in"
              className="w-full pl-10 pr-3.5 py-2.5 bg-white text-[#202326] text-sm rounded-lg border border-[#E3E5E7] focus:border-[#34495E] focus:ring-1 focus:ring-[#34495E] outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-[#202326] uppercase tracking-wider"
            >
              Password
            </label>
            <span
              className="text-xs text-[#697077] hover:text-[#202326] cursor-not-allowed select-none"
              title="Contact system administrator to reset credentials"
            >
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#697077] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              defaultValue="password123"
              placeholder="••••••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-white text-[#202326] text-sm rounded-lg border border-[#E3E5E7] focus:border-[#34495E] focus:ring-1 focus:ring-[#34495E] outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#697077] hover:text-[#202326] p-0.5 rounded"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-3 py-2.5 px-4 bg-[#34495E] hover:bg-[#2C3E50] text-white text-sm font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign in to Store</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Institutional Demo Credentials Hint */}
      <div className="mt-8 pt-5 border-t border-[#E3E5E7] text-left bg-[#F6F6F3] -mx-8 -mb-10 p-6 rounded-b-xl border-b">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#34495E] mb-2">
          <ShieldCheck className="w-4 h-4 text-[#34495E]" />
          <span>Default Storekeeper Credentials:</span>
        </div>
        <div className="text-xs text-[#4A5568] space-y-1 font-normal">
          <div>
            <span className="font-semibold text-[#202326]">Email:</span> storekeeper@dhiu.in
          </div>
          <div>
            <span className="font-semibold text-[#202326]">Password:</span> password123
          </div>
        </div>
      </div>
    </div>
  );
}
