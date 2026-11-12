'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { KeyRound, ShieldAlert, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react';

interface CommitteeLoginGateProps {
  onAuthenticated: () => void;
  openInNewTab?: boolean;
}

export default function CommitteeLoginGate({
  onAuthenticated,
  openInNewTab = false,
}: CommitteeLoginGateProps) {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Secure login submission:
   * 1. Sends passcode in POST body to /api/auth/login (not via URL query params)
   * 2. Server sets an HttpOnly session cookie on successful verification
   * 3. Opens a clean URL with no query parameters, preventing credential leakage on copy-paste
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mc_committee_auth', 'true');
          localStorage.setItem('mc_committee_auth', 'true');
          if (data.token) {
            sessionStorage.setItem('mc_committee_token', data.token);
            localStorage.setItem('mc_committee_token', data.token);
          }

          if (openInNewTab) {
            // Clean URL destination with no credentials or query parameters
            const targetUrl = `${window.location.origin}/dashboard`;
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          }
        }
        onAuthenticated();
      } else {
        setErrorMsg(data.error || 'Invalid passcode. Access restricted to authorized committee reviewers.');
      }
    } catch {
      setErrorMsg('Network error connecting to authentication server. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    const yr = typeof window !== 'undefined' ? new Date().getFullYear() : 2026;
    setPasscode(`Monday${yr}`);
    setErrorMsg(null);
  };

  return (
    <div className="mx-auto max-w-md px-3 sm:px-6 py-6 sm:py-8">
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-[#131b2e] to-[#0f172a] p-4 sm:p-8 shadow-2xl text-slate-100 text-center">
        {/* Logo and Emblem */}
        <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-[#0d1629] border border-slate-700/60 p-2 mb-4 shadow-lg">
          <Image
            src="/Logo.png"
            alt="The Monday Club Logo"
            width={80}
            height={80}
            className="h-full w-full object-contain"
          />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-800/60 mb-2">
          <KeyRound className="h-3.5 w-3.5" />
          <span>Restricted Access</span>
        </span>

        <h2 className="text-lg sm:text-2xl font-black text-white mt-1">
          Committee Reviewer Login
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          This portal contains sensitive student financial records, GPA metrics, and AI rubric evaluations. Authorized personnel only.
        </p>
        <br />

        {/* Demo Hint Badge */}
        {/* <div className="my-5 rounded-xl border border-blue-900/60 bg-blue-950/30 p-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Demo Committee Passcode:</span>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-xs font-mono font-bold text-blue-400 hover:text-blue-300 underline underline-offset-2 cursor-pointer"
              title="Click to autofill passcode"
            >
              monday2026
            </button>
          </div>
        </div> */}

        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Enter Committee Passcode:
            </label>
            <div className="relative">
              <input
                id="input-committee-passcode"
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode..."
                className="w-full rounded-xl bg-slate-900/90 pl-3.5 pr-10 py-2.5 text-sm text-white border border-slate-700 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                className="absolute right-3 top-3 text-slate-400 hover:text-white transition"
              >
                {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            id="btn-unlock-reviewer"
            type="submit"
            disabled={!passcode.trim() || isLoading}
            className="w-full flex items-center justify-start sm:justify-center gap-2.5 rounded-xl bg-blue-600 px-4.5 sm:px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer text-left sm:text-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Unlock Reviewer Portal</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
