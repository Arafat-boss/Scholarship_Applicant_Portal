'use client';

import React, { useState } from 'react';
import ApplicantPortal from '@/components/ApplicantPortal';
import ReviewerDashboard from '@/components/ReviewerDashboard';
import RubricInfoModal from '@/components/RubricInfoModal';
import { ScholarshipApplication } from '@/types/scholarship';
import { getStoredApplications } from '@/lib/storage';
import { FileText, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'applicant' | 'reviewer'>('applicant');
  const [applications, setApplications] = useState<ScholarshipApplication[]>(() => {
    return getStoredApplications();
  });
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);

  const handleSuccessSubmit = (newApp: ScholarshipApplication) => {
    const updated = [newApp, ...applications.filter((a) => a.id !== newApp.id)];
    setApplications(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Inline Section Tab Switcher (Replaces Navbar for Seamless Wix Embedding) */}
      <section className="pt-6 pb-2 px-4 sm:px-6 w-full">
        <div className="mx-auto flex flex-wrap items-center justify-center gap-3">
          {/* Main Tabs Container */}
          <div className="flex rounded-xl bg-slate-900/90 p-1.5 border border-slate-800 shadow-xl">
            <button
              id="tab-apply-now"
              onClick={() => setActiveTab('applicant')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'applicant'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Apply Now</span>
            </button>
            <button
              id="tab-reviewer-portal"
              onClick={() => setActiveTab('reviewer')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'reviewer'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Reviewer Portal</span>
              {applications.length > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-400/20 px-1.5 text-xs font-bold text-blue-300">
                  {applications.length}
                </span>
              )}
            </button>
          </div>

          {/* AI Rubric Explainer Trigger Button */}
          <button
            onClick={() => setIsRubricModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-300 shadow-xl hover:border-slate-700 hover:bg-slate-800 hover:text-white transition"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>AI Rubric (50 pts)</span>
          </button>
        </div>
      </section>

      {/* Main Content Area without outer header or footer */}
      <main className="flex-1 pb-10">
        {activeTab === 'applicant' ? (
          <ApplicantPortal onSuccessSubmit={handleSuccessSubmit} />
        ) : (
          <ReviewerDashboard
            applications={applications}
            onRefreshApplications={setApplications}
            onOpenRubricInfo={() => setIsRubricModalOpen(true)}
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
