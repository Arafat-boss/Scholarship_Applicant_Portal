'use client';

import React from 'react';
import { X, Sparkles, ShieldAlert, FileSpreadsheet } from 'lucide-react';

interface RubricInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RubricInfoModal({ isOpen, onClose }: RubricInfoModalProps) {
  if (!isOpen) return null;

  const criteriaList = [
    { num: '01', title: 'Academic Performance & GPA Rigor', points: '0–5', desc: 'Evaluates cumulative GPA against the 2.75 Delaware benchmark and honors/AP coursework rigor.' },
    { num: '02', title: 'Financial Need Assessment', points: '0–5', desc: 'Analyzes Student Aid Report (SAR), EFC/SAI metrics, siblings, and family members concurrently in college.' },
    { num: '03', title: 'Leadership & School Involvement', points: '0–5', desc: 'Assesses extracurricular club memberships, designated officer/captain leadership positions, and commitment.' },
    { num: '04', title: 'Community Service & Civic Impact', points: '0–5', desc: 'Measures documented volunteer hours, church initiatives, and community service across Delaware.' },
    { num: '05', title: 'Work Ethic & Employment History', points: '0–5', desc: 'Evaluates student accountability, maturity, and perseverance through part-time employment while in school.' },
    { num: '06', title: 'College Ambition & Preparedness', points: '0–5', desc: 'Assesses 4-year university admissions pipeline (including Delaware State University) and acceptance readiness.' },
    { num: '07', title: 'Letters of Recommendation Strength', points: '0–5', desc: 'Evaluates 3 endorsement letters (including 2 non-relatives) regarding character, integrity, and intellectual curiosity.' },
    { num: '08', title: 'Transcript Consistency & Trajectory', points: '0–5', desc: 'Verifies official high school mid-year transcript through January, grade upward trajectory, and prerequisites.' },
    { num: '09', title: 'Mission Alignment & Heritage Focus', points: '0–5', desc: 'Ensures alignment with The Monday Club legacy: Delaware high school senior of African-American, Hispanic, or Native descent.' },
    { num: '10', title: 'Completeness, Cohesion & Clarity', points: '0–5', desc: 'Appraises attention to detail, verified certification, signed declarations, and supplemental documentation.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0f172a] p-4 sm:p-8 shadow-2xl text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 sm:gap-4 mb-5 sm:mb-6 pr-8">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-blue-400">
                Evaluation Standard
              </span>
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-amber-300 border border-amber-500/20">
                Total 50 Points
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white mt-1">
              AI-Assisted 10-Criterion Rubric Scoring
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Each criterion is scored from <strong className="text-white">0–5</strong> for a composite total out of <strong className="text-white">50 points</strong>.
            </p>
          </div>
        </div>

        {/* Key Policy Banner (from Proposal) */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-200">
            <strong className="font-semibold text-white">Client Proposal Policy: </strong>
            &ldquo;AI output will support—not replace—the committee&apos;s final decision.&rdquo; Reviewers retain full authority to override scores, enter human evaluations, and finalize scholarship approvals.
          </div>
        </div>

        {/* Criteria Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {criteriaList.map((item) => (
            <div
              key={item.num}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-800/60">
                    {item.num}
                  </span>
                  <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-1">
                    {item.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 shrink-0">
                  {item.points} pts
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Committee Output & Export Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-5">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FileSpreadsheet className="h-4 w-4 text-[#0F9D58]" />
            <span>All 10 criterion scores and committee decisions are synced with Google Sheet.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
