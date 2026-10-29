'use client';

import React, { useState, useEffect } from 'react';
import ApplicantPortal from '@/components/ApplicantPortal';
import ReviewerDashboard from '@/components/ReviewerDashboard';
import CommitteeLoginGate from '@/components/CommitteeLoginGate';
import RubricInfoModal from '@/components/RubricInfoModal';
import { ScholarshipApplication } from '@/types/scholarship';
import { getStoredApplications, saveApplicationsToStorage } from '@/lib/storage';
import { FileText, ShieldCheck, Sparkles, Lock } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'applicant' | 'reviewer'>('applicant');
  const [applications, setApplications] = useState<ScholarshipApplication[]>(() => {
    return getStoredApplications();
  });
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [isCommitteeAuthenticated, setIsCommitteeAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('mc_committee_auth') === 'true';
    }
    return false;
  });

  // Auto-fetch live applications directly from Google Sheet on startup
  useEffect(() => {
    fetch('/api/google-sheet?action=fetch')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.applications)) {
          setApplications(data.applications);
          saveApplicationsToStorage(data.applications);
        }
      })
      .catch(() => { });
  }, []);

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
  }, [activeTab, isCommitteeAuthenticated, applications.length]);

  const handleSuccessSubmit = (newApp: ScholarshipApplication) => {
    const updated = [newApp, ...applications.filter((a) => a.id !== newApp.id)];
    setApplications(updated);
  };

  const handleLogout = () => {
    setIsCommitteeAuthenticated(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mc_committee_auth');
    }
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
              onClick={() => setActiveTab('applicant')}
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
              onClick={() => setActiveTab('reviewer')}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${activeTab === 'reviewer'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
            >
              {isCommitteeAuthenticated ? (
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-amber-400" />
              )}
              <span>Reviewer Portal</span>
              {applications.length > 0 && isCommitteeAuthenticated && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-400/20 px-1.5 text-xs font-bold text-blue-300">
                  {applications.length}
                </span>
              )}
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
        ) : !isCommitteeAuthenticated ? (
          <CommitteeLoginGate
            onAuthenticated={() => setIsCommitteeAuthenticated(true)}
            onBackToApplication={() => setActiveTab('applicant')}
          />
        ) : (
          <ReviewerDashboard
            applications={applications}
            onRefreshApplications={setApplications}
            onOpenRubricInfo={() => setIsRubricModalOpen(true)}
            onLogout={handleLogout}
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
