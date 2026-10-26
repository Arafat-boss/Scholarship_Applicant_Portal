'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Eye,
  Sparkles,
  CheckCircle2,
  UserCheck,
  FileSpreadsheet,
  RotateCcw,
  GraduationCap,
  Award,
  FileText,
  MapPin,
  X,
  Download,
  Copy,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { ScholarshipApplication } from '@/types/scholarship';
import { updateCommitteeReview, resetToSampleData } from '@/lib/storage';
import { convertApplicationsToCSV, downloadCSV, copyCSVToClipboard } from '@/lib/csvExport';

interface ReviewerDashboardProps {
  applications: ScholarshipApplication[];
  onRefreshApplications: (apps: ScholarshipApplication[]) => void;
  onOpenRubricInfo: () => void;
  onLogout?: () => void;
}

export default function ReviewerDashboard({
  applications,
  onRefreshApplications,
  onOpenRubricInfo,
  onLogout,
}: ReviewerDashboardProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');

  // Selected Application for full review modal
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);

  // Active review form state inside modal
  const [overrideScore, setOverrideScore] = useState<number>(0);
  const [decisionStatus, setDecisionStatus] = useState<ScholarshipApplication['committeeReview']['status']>('Under Review');
  const [reviewerName, setReviewerName] = useState('Committee Member');
  const [committeeNotes, setCommitteeNotes] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // When opening modal, populate review state
  const handleOpenReview = (app: ScholarshipApplication) => {
    setSelectedApp(app);
    setOverrideScore(app.committeeReview.reviewerScore ?? app.aiScoring.totalScore);
    setDecisionStatus(app.committeeReview.status);
    setReviewerName(app.committeeReview.reviewerName || 'Selection Committee');
    setCommitteeNotes(app.committeeReview.committeeNotes || '');
    setSaveSuccessMsg(false);
  };

  // Save Committee Decision
  const handleSaveDecision = () => {
    if (!selectedApp) return;

    const updated = updateCommitteeReview(selectedApp.id, {
      status: decisionStatus,
      reviewerScore: overrideScore,
      reviewerName,
      committeeNotes,
    });

    onRefreshApplications(updated);
    const refreshedSelected = updated.find((a) => a.id === selectedApp.id) || null;
    setSelectedApp(refreshedSelected);
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  // CSV Export handler
  const handleExportCSV = () => {
    const csv = convertApplicationsToCSV(filteredApplications);
    downloadCSV(csv, `Monday_Club_Scholarship_Review_${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Reset sample applications
  const handleReset = () => {
    if (confirm('Reset application queue to initial sample data?')) {
      const sample = resetToSampleData();
      onRefreshApplications(sample);
      setSelectedApp(null);
    }
  };

  // Filter calculations
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      `${app.applicant.firstName} ${app.applicant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.schoolFamily.currentHighSchool.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || app.committeeReview.status === statusFilter;

    const matchesTier =
      tierFilter === 'ALL' || app.aiScoring.ratingCategory === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  // KPI Metrics
  const totalCount = applications.length;
  const underReviewCount = applications.filter((a) => a.committeeReview.status === 'Under Review').length;
  const approvedCount = applications.filter((a) => a.committeeReview.status === 'Approved').length;
  const shortlistedCount = applications.filter((a) => a.committeeReview.status === 'Shortlisted').length;

  const avgGpa = totalCount > 0
    ? (applications.reduce((sum, a) => sum + (parseFloat(a.schoolFamily.gpa) || 0), 0) / totalCount).toFixed(2)
    : '0.00';

  const avgAiScore = totalCount > 0
    ? Math.round(applications.reduce((sum, a) => sum + a.aiScoring.totalScore, 0) / totalCount)
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Committee Portal Banner */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#131b2e] via-[#0f172a] to-[#111827] p-4 sm:p-6 shadow-xl text-slate-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-800/60 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              <span>Reviewer & Committee Dashboard</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              Application & AI Rubric Scoring Queue
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Inspect applicant records, analyze AI 10-criterion rubrics (0–50 pts), input committee overrides, and export CSV reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition cursor-pointer"
              title="Download entire queue as CSV"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={onOpenRubricInfo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Rubric Guide</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              title="Reset to sample data"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-900/50 hover:text-white transition cursor-pointer"
                title="Lock Reviewer Portal (Require Passcode)"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Lock</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-3.5">
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Received</span>
            <div className="mt-1 text-xl sm:text-2xl font-black text-white">{totalCount}</div>
          </div>
          <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-3 sm:p-3.5">
            <span className="text-[10px] sm:text-[11px] font-medium text-blue-300 uppercase tracking-wider">Under Review</span>
            <div className="mt-1 text-xl sm:text-2xl font-black text-blue-400">{underReviewCount}</div>
          </div>
          <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-3 sm:p-3.5">
            <span className="text-[10px] sm:text-[11px] font-medium text-emerald-300 uppercase tracking-wider">Shortlisted / Approved</span>
            <div className="mt-1 text-xl sm:text-2xl font-black text-emerald-400">{approvedCount + shortlistedCount}</div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 sm:p-3.5">
            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 uppercase tracking-wider">Average GPA</span>
            <div className="mt-1 text-xl sm:text-2xl font-black text-white">{avgGpa}</div>
          </div>
          <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-3 sm:p-3.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] sm:text-[11px] font-medium text-amber-300 uppercase tracking-wider">Average AI Score</span>
            <div className="mt-1 text-xl sm:text-2xl font-black text-amber-400">{avgAiScore} <span className="text-xs font-normal text-slate-400">/ 50</span></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#0f172a] p-3 sm:p-3.5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by student name, high school, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg bg-slate-900 pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg bg-slate-900 px-2.5 py-2 text-xs text-slate-300 border border-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="Under Review">Under Review</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Approved">Approved</option>
            <option value="Waitlisted">Waitlisted</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* AI Tier filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="w-full sm:w-auto rounded-lg bg-slate-900 px-2.5 py-2 text-xs text-slate-300 border border-slate-800"
          >
            <option value="ALL">All AI Tiers</option>
            <option value="Exceptional">Exceptional (44–50)</option>
            <option value="High Merit">High Merit (38–43)</option>
            <option value="Recommended">Recommended (30–37)</option>
            <option value="Competitive">Competitive (24–29)</option>
            <option value="Needs Review">Needs Review (&lt;24)</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-md">
        <div className="sm:hidden px-3.5 py-2 text-[11px] text-slate-400 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <span>👉 Swipe table left/right to view details</span>
          <span className="font-mono text-blue-400 font-bold">{filteredApplications.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3">ID & Date</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">High School & GPA</th>
                <th className="px-4 py-3">Service Hours</th>
                <th className="px-4 py-3">AI Rubric (50 pts)</th>
                <th className="px-4 py-3">Committee Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No applications found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => {
                  const volunteerHours = app.communityService.reduce(
                    (sum, cs) => sum + (parseFloat(cs.totalHours) || 0),
                    0
                  );

                  return (
                    <tr
                      key={app.id}
                      className="hover:bg-slate-900/60 transition cursor-pointer"
                      onClick={() => handleOpenReview(app)}
                    >
                      <td className="px-4 py-3 font-mono text-xs">
                        <span className="font-bold text-blue-400">{app.applicationNumber}</span>
                        <div className="text-[10px] text-slate-500">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-white">
                        <div className="font-bold">{app.applicant.firstName} {app.applicant.lastName}</div>
                        <div className="text-[11px] text-slate-400">{app.applicant.email}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-200 line-clamp-1">{app.schoolFamily.currentHighSchool}</div>
                        <div className="text-[11px] font-mono text-emerald-400">GPA: {app.schoolFamily.gpa}</div>
                      </td>

                      <td className="px-4 py-3 font-mono">
                        <span className="text-slate-200 font-semibold">{volunteerHours} hrs</span>
                        <div className="text-[10px] text-slate-500">{app.activities.length} clubs</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-blue-950 px-2 py-0.5 font-mono text-xs font-black text-blue-300 border border-blue-800/80">
                            {app.aiScoring.totalScore} / 50
                          </span>
                          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            app.aiScoring.ratingCategory === 'Exceptional' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            app.aiScoring.ratingCategory === 'High Merit' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {app.aiScoring.ratingCategory}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            app.committeeReview.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : app.committeeReview.status === 'Shortlisted'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : app.committeeReview.status === 'Rejected'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {app.committeeReview.status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenReview(app);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 px-3 py-1.5 text-xs font-semibold text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FULL APPLICATION REVIEW MODAL */}
      {/* ======================================================== */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0f172a] shadow-2xl text-slate-100 p-4 sm:p-8">
            {/* Close Button */}
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-blue-950 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-400 border border-blue-800/80">
                    {selectedApp.applicationNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    Submitted on {new Date(selectedApp.submittedAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  {selectedApp.applicant.firstName} {selectedApp.applicant.lastName}
                </h2>
                <p className="text-xs text-slate-400">
                  {selectedApp.schoolFamily.currentHighSchool} &bull; Cumulative GPA: <strong className="text-emerald-400">{selectedApp.schoolFamily.gpa}</strong>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-blue-800 bg-blue-950/60 px-4 py-2 text-center">
                  <div className="text-[10px] font-semibold uppercase text-blue-400">AI Rubric Score</div>
                  <div className="text-xl font-black text-white">{selectedApp.aiScoring.totalScore} <span className="text-xs text-slate-400">/ 50</span></div>
                </div>
              </div>
            </div>

            {/* 2-Column Split: Left = Applicant 8 Sections, Right = AI Rubric + Committee Action */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT COLUMN: Applicant Profile (All 8 Sections) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Contact & Demographic */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>Applicant & Guardian Details</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Address:</span>
                      <p className="text-white mt-0.5">{selectedApp.applicant.streetAddress}, {selectedApp.applicant.city}, {selectedApp.applicant.state} {selectedApp.applicant.zip}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Date of Birth:</span>
                      <p className="text-white mt-0.5 font-mono">{selectedApp.applicant.dateOfBirth}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone & Email:</span>
                      <p className="text-white mt-0.5">{selectedApp.applicant.telephone}</p>
                      <p className="text-blue-400 break-all">{selectedApp.applicant.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Parent / Guardian:</span>
                      <p className="text-white mt-0.5">{selectedApp.parentGuardian.fullName}</p>
                      <p className="text-slate-400 break-all">{selectedApp.parentGuardian.phone} &bull; {selectedApp.parentGuardian.email}</p>
                    </div>
                  </div>
                </div>

                {/* 2. School & Family Need Metrics */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    <span>School & Family Context</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">High School GPA:</span>
                      <p className="text-base font-bold text-emerald-400 mt-0.5">{selectedApp.schoolFamily.gpa}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Siblings:</span>
                      <p className="text-base font-bold text-white mt-0.5">{selectedApp.schoolFamily.numberOfSiblings}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Family in College:</span>
                      <p className="text-base font-bold text-amber-400 mt-0.5">{selectedApp.schoolFamily.familyMembersInCollege}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Activities & Volunteering */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Award className="h-4 w-4" />
                    <span>Activities, Service & Employment</span>
                  </h3>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Clubs & Leadership:</span>
                    <ul className="mt-1 space-y-1 text-xs">
                      {selectedApp.activities.map((a, i) => (
                        <li key={i} className="flex items-center justify-between text-slate-200 bg-slate-950/60 p-1.5 rounded">
                          <span><strong>{a.activity}</strong> {a.role && `(${a.role})`}</span>
                          <span className="text-slate-400 font-mono text-[11px]">{a.years}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Community Service:</span>
                    <ul className="mt-1 space-y-1 text-xs">
                      {selectedApp.communityService.map((cs, i) => (
                        <li key={i} className="flex items-center justify-between text-slate-200 bg-slate-950/60 p-1.5 rounded">
                          <div>
                            <strong>{cs.organization}</strong>
                            <div className="text-[11px] text-slate-400">{cs.description}</div>
                          </div>
                          <span className="text-blue-400 font-mono font-bold text-[11px] shrink-0">{cs.totalHours} hrs</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {selectedApp.employment.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">Employment:</span>
                      <ul className="mt-1 space-y-1 text-xs">
                        {selectedApp.employment.map((emp, i) => (
                          <li key={i} className="flex items-center justify-between text-slate-200 bg-slate-950/60 p-1.5 rounded">
                            <span><strong>{emp.employer}</strong> — {emp.position}</span>
                            <span className="text-slate-400 text-[11px]">{emp.dates}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">Colleges & Universities:</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedApp.colleges.map((col, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded bg-slate-950 px-2 py-1 text-xs border border-slate-800">
                          <span className="text-white font-medium">{col.college}</span>
                          <span className={`text-[10px] font-semibold uppercase px-1 rounded ${
                            col.status === 'accepted' ? 'text-emerald-400 bg-emerald-950' : 'text-slate-400 bg-slate-800'
                          }`}>
                            {col.status}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Uploaded Documents */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-2.5 flex items-center gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>Uploaded Documents</span>
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    {selectedApp.documents.transcript && (
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                        <span className="text-white font-medium">Official Transcript (Through Jan)</span>
                        <span className="text-emerald-400 text-[11px] font-mono">Verified Attached</span>
                      </div>
                    )}
                    {selectedApp.documents.studentAidReport && (
                      <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                        <span className="text-white font-medium">Student Aid Report (SAR)</span>
                        <span className="text-emerald-400 text-[11px] font-mono">Verified Attached</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <span className="text-white font-medium">Recommendation Letters</span>
                      <span className="text-blue-400 text-[11px] font-mono">
                        {selectedApp.documents.recommendationLetters.length} Letter(s) on file
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: AI 10-Criterion Rubric + Committee Action */}
              <div className="lg:col-span-5 space-y-5">
                {/* 10-Criterion Rubric Scorecard */}
                <div className="rounded-xl border border-blue-900/40 bg-gradient-to-b from-[#111c35] to-[#0d1527] p-4 shadow-lg">
                  <div className="flex items-center justify-between mb-3 border-b border-blue-800/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                        10-Criterion AI Rubric
                      </h3>
                    </div>
                    <span className="font-mono text-xs font-bold text-white bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700">
                      {selectedApp.aiScoring.totalScore} / 50 pts
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {selectedApp.aiScoring.summary}
                  </p>

                  {/* Criteria Items (1 to 10) */}
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {selectedApp.aiScoring.criteria.map((c) => (
                      <div key={c.id} className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-white line-clamp-1">{c.title}</span>
                          <span className="font-mono font-bold text-amber-400 shrink-0 ml-2">
                            {c.score} / 5
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden mb-1.5">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${(c.score / 5) * 100}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {c.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Committee Review Action Panel */}
                <div className="rounded-xl border border-amber-500/30 bg-[#161c2e] p-4 shadow-lg">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
                    <UserCheck className="h-4 w-4 text-amber-400" />
                    <span>Committee Review Decision</span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Committee Score (Override 0–50):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={overrideScore}
                        onChange={(e) => setOverrideScore(Math.min(50, Math.max(0, parseInt(e.target.value) || 0)))}
                        className="w-full rounded-lg px-3 py-1.5 text-white font-mono font-bold text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Application Status:
                      </label>
                      <select
                        value={decisionStatus}
                        onChange={(e) => setDecisionStatus(e.target.value as ScholarshipApplication['committeeReview']['status'])}
                        className="w-full rounded-lg px-3 py-1.5 text-white capitalize text-xs"
                      >
                        <option value="Under Review">Under Review</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Approved">Approved (Award Scholarship)</option>
                        <option value="Waitlisted">Waitlisted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Reviewer / Committee Signature:
                      </label>
                      <input
                        type="text"
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="e.g. Committee Member"
                        className="w-full rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Committee Deliberation Notes:
                      </label>
                      <textarea
                        rows={3}
                        value={committeeNotes}
                        onChange={(e) => setCommitteeNotes(e.target.value)}
                        placeholder="Enter committee comments, scholarship allocation notes, or interview follow-up..."
                        className="w-full rounded-lg px-3 py-1.5 text-white text-xs"
                      />
                    </div>

                    <button
                      onClick={handleSaveDecision}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Save Committee Decision</span>
                    </button>

                    {saveSuccessMsg && (
                      <div className="p-2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-center font-medium animate-in fade-in">
                        ✓ Decision and score saved successfully!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ======================================================== */}
      {/* EXPORT CSV MODAL (Works inside all iframes & Wix) */}
      {/* ======================================================== */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0f172a] p-4 sm:p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Export Applications Data</h3>
                <p className="text-xs text-slate-400">Total {filteredApplications.length} application records ready • Wix & Embed compatible</p>
              </div>
            </div>

            {copiedToast && (
              <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-medium text-center animate-in fade-in">
                ✓ Copied to clipboard! You can now paste (Ctrl+V) directly into Excel or Google Sheets.
              </div>
            )}

            <div className="space-y-2.5 mb-5">
              {/* Direct Download Button (Iframe-safe server attachment or client blob) */}
              <button
                onClick={handleExportCSV}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download CSV File</span>
              </button>

              {/* Copy to Clipboard Button (With execCommand fallback for sandboxed iframes) */}
              <button
                onClick={async () => {
                  const csv = convertApplicationsToCSV(filteredApplications);
                  const copied = await copyCSVToClipboard(csv);
                  if (copied) {
                    setCopiedToast(true);
                    setTimeout(() => setCopiedToast(false), 4000);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                <Copy className="h-4 w-4 text-emerald-400" />
                <span>Copy to Clipboard (Paste into Excel / Sheets)</span>
              </button>

              {/* Pop-out to full browser tab (Bypasses all iframe restrictions) */}
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.open(window.location.href, '_blank');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open Dashboard in Full Tab (Outside Wix)</span>
              </button>
            </div>

            <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Data Preview ({filteredApplications.length} records):
              </span>
              <pre className="text-[10px] font-mono text-slate-400 max-h-24 overflow-y-auto whitespace-pre-wrap">
                {convertApplicationsToCSV(filteredApplications).slice(0, 240)}...
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
