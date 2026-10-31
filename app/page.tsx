'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import ApplicantPortal from '@/components/ApplicantPortal';
import CommitteeLoginGate from '@/components/CommitteeLoginGate';
import RubricInfoModal from '@/components/RubricInfoModal';
import { ScholarshipApplication } from '@/types/scholarship';
import { getStoredApplications } from '@/lib/storage';
import { FileText, Sparkles, Lock, ExternalLink, CheckCircle2, ArrowLeft } from 'lucide-react';

const emptySubscribe = () => () => {};

export default function Home() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [activeTab, setActiveTab] = useState<'applicant' | 'reviewer'>('applicant');
  const [openedInNewTab, setOpenedInNewTab] = useState(false);
  const [storedApps, setStoredApps] = useState<ScholarshipApplication[] | null>(null);
  const applications = storedApps !== null ? storedApps : (isMounted ? getStoredApplications() : []);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);

  // Scroll to top ONLY when switching tabs
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Broadcast dynamic height to Wix / parent iframe so container perfectly matches content height
  useEffect(() => {
    const notifyParentHeight = () => {
      if (typeof window === 'undefined') return;
      const height = document.documentElement.scrollHeight || document.body.scrollHeight;

      // Broadcast to Wix / iframe parent listeners
      window.parent?.postMessage({ type: 'setHeight', height }, '*');
      window.parent?.postMessage({ type: 'resize', height }, '*');
      window.parent?.postMessage({ height }, '*');
      window.parent?.postMessage(height, '*');
    };

    // Immediate check
    notifyParentHeight();
    const timeout = setTimeout(notifyParentHeight, 150);

    // Observe body resize changes dynamically
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(() => {
        notifyParentHeight();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      clearTimeout(timeout);
      resizeObserver?.disconnect();
    };
  }, [activeTab, openedInNewTab, applications.length]);

  const handleSuccessSubmit = (newApp: ScholarshipApplication) => {
    const updated = [newApp, ...applications.filter((a) => a.id !== newApp.id)];
    setStoredApps(updated);
  };

  return (
    <div className="w-full flex flex-col bg-[#090d16] text-slate-100 min-h-0 overflow-x-hidden">
      {/* Inline Section Tab Switcher (Replaces Navbar for Seamless Wix Embedding) */}
      <section className="pt-4 sm:pt-6 pb-2 px-3 sm:px-6 w-full">
        <div className="mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {/* Main Tabs Container */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 sm:p-1.5 border border-slate-800 shadow-xl">
            <button
              id="tab-apply-now"
              onClick={() => {
                setActiveTab('applicant');
                setOpenedInNewTab(false);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${activeTab === 'applicant'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Apply Now</span>
            </button>

            <button
              id="tab-reviewer-portal"
              onClick={() => {
                setActiveTab('reviewer');
                setOpenedInNewTab(false);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${activeTab === 'reviewer'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              <Lock className="h-3.5 w-3.5 text-amber-400" />
              <span>Reviewer Portal</span>
            </button>
          </div>

          {/* AI Rubric Explainer Trigger Button */}
          <button
            onClick={() => setIsRubricModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-slate-300 shadow-xl hover:border-slate-700 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" />
            <span>AI Rubric (50 pts)</span>
          </button>
        </div>
      </section>

      {/* Main Content Area without outer header or footer */}
      <main className="w-full pb-6">
        {activeTab === 'applicant' ? (
          <ApplicantPortal onSuccessSubmit={handleSuccessSubmit} />
        ) : openedInNewTab ? (
          <div className="mx-auto max-w-md py-8 px-4 text-center">
            <div className="rounded-2xl border border-blue-800/80 bg-gradient-to-b from-[#131b2e] to-[#0f172a] p-6 sm:p-8 shadow-2xl">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-950/80 border border-blue-700/60 p-2 mb-3 shadow-lg">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/60 mb-2">
                Access Granted
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Reviewer Dashboard Opened
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
                The Reviewer Committee Portal has opened in a new browser tab outside of Wix at <span className="font-mono text-blue-400 font-semibold">/dashboard</span>.
              </p>

              <div className="flex flex-col gap-2.5">
                <a
                  href="/dashboard?auth=monday2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs sm:text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30 transition cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Open Reviewer Dashboard (New Tab)</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setOpenedInNewTab(false);
                    setActiveTab('applicant');
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Student Application</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <CommitteeLoginGate
            openInNewTab={true}
            onAuthenticated={() => {
              setOpenedInNewTab(true);
            }}
            onBackToApplication={() => setActiveTab('applicant')}
          />
        )}
      </main>

      {/* 10-Criterion Rubric Explainer Modal */}
      <RubricInfoModal
        isOpen={isRubricModalOpen}
        onClose={() => setIsRubricModalOpen(false)}
      />
    </div>
  );
}
