'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface CommitteeLoginGateProps {
  onAuthenticated: () => void;
  onBackToApplication: () => void;
}

export default function CommitteeLoginGate({
  onAuthenticated,
  onBackToApplication,
}: CommitteeLoginGateProps) {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Default Committee Passcode
  const CORRECT_PASSCODE = 'monday2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    setTimeout(() => {
      if (passcode.trim() === CORRECT_PASSCODE) {
        setIsLoading(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mc_committee_auth', 'true');
        }
        onAuthenticated();
      } else {
        setIsLoading(false);
        setErrorMsg('Invalid committee passcode. Access restricted to authorized reviewers.');
      }
    }, 400);
  };

  const handleQuickDemoFill = () => {
    setPasscode(CORRECT_PASSCODE);
    setErrorMsg(null);
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-[#131b2e] to-[#0f172a] p-6 sm:p-8 shadow-2xl text-slate-100 text-center">
        {/* Lock Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-4 shadow-lg shadow-blue-500/10">
          <Lock className="h-7 w-7" />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-800/60 mb-2">
          <KeyRound className="h-3.5 w-3.5" />
          <span>Restricted Access</span>
        </span>

        <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
          Committee Reviewer Login
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
          This portal contains sensitive student financial records, GPA metrics, and AI rubric evaluations. Authorized personnel only.
        </p>

        {/* Demo Hint Badge */}
        <div className="my-5 rounded-xl border border-blue-900/60 bg-blue-950/30 p-3 text-left">
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
        </div>

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
            disabled={isLoading || !passcode}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer"
          >
            {isLoading ? (
              <span>Verifying Authorization...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Unlock Reviewer Portal</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onBackToApplication}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Student Application</span>
          </button>
        </div>
      </div>
    </div>
  );
}
