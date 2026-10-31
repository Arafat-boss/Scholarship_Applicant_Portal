'use client';

import React from 'react';
import Image from 'next/image';
import { FileText, ShieldCheck, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'applicant' | 'reviewer';
  setActiveTab: (tab: 'applicant' | 'reviewer') => void;
  onOpenRubric: () => void;
  applicationCount: number;
  onAutofillSample?: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenRubric,
  applicationCount,
  onAutofillSample,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#090d16]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Subtitle matching Client Spec */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/60 bg-[#0d1629] p-1.5 shadow-md shrink-0">
            <Image
              src="/Logo.png"
              alt="The Monday Club Logo"
              width={44}
              height={44}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                The Monday Club
              </span>
              <span className="rounded-full bg-blue-950/70 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-800/60">
                Scholarship Portal
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              The Monday Club Scholarship
            </h1>
            <p className="hidden text-[11px] text-slate-400 sm:block">
              Holloway St. / Dr. Woodrow Wilson / James H. Sills, Jr. / Delaware State University
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex rounded-lg bg-slate-900/90 p-1 border border-slate-800">
            <button
              id="nav-applicant-tab"
              onClick={() => setActiveTab('applicant')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'applicant'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Apply Now</span>
            </button>
            <button
              id="nav-reviewer-tab"
              onClick={() => setActiveTab('reviewer')}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'reviewer'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Reviewer Portal</span>
              {applicationCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-400/20 px-1 text-[10px] font-bold text-blue-300">
                  {applicationCount}
                </span>
              )}
            </button>
          </div>

          {/* 10-Criterion Rubric Explainer Button */}
          <button
            onClick={onOpenRubric}
            className="hidden items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white md:flex"
            title="View 10-Criterion Rubric (0-50 Scale)"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>AI Rubric (50 pts)</span>
          </button>

          {/* Quick Demo Fill (for instant testing) */}
          {activeTab === 'applicant' && onAutofillSample && (
            <button
              onClick={onAutofillSample}
              className="flex items-center gap-1 rounded-lg border border-indigo-700/60 bg-indigo-950/40 px-2.5 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-900/60 hover:text-white"
              title="Pre-fill form with a realistic sample applicant"
            >
              <Sparkles className="h-3 w-3 text-indigo-400" />
              <span className="hidden sm:inline">Auto-fill Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
