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
  Copy,
  ExternalLink,
  Lock,
  Trash2,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  FileDown,
} from 'lucide-react';
import { ScholarshipApplication } from '@/types/scholarship';
import { exportApplicationsToPDF } from '@/lib/pdfExport';
import {
  updateCommitteeReview,
  deleteApplication,
  saveApplicationsToStorage,
} from '@/lib/storage';
import { evaluateApplicationWithAI } from '@/lib/aiScoring';
import {
  GOOGLE_SHEET_URL,
  GOOGLE_APPS_SCRIPT_CODE,
  getStoredWebhookUrl,
  saveStoredWebhookUrl,
  syncAllToGoogleSheet,
  deleteApplicationFromGoogleSheet,
  fetchApplicationsFromGoogleSheet,
} from '@/lib/googleSheet';

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

  // Active Rubric Criteria (guarantees all 10 criteria are displayed and scrollable)
  const activeCriteria = React.useMemo(() => {
    if (!selectedApp) return [];
    if (selectedApp.aiScoring?.criteria && selectedApp.aiScoring.criteria.length >= 10) {
      return selectedApp.aiScoring.criteria;
    }
    const fullScoring = evaluateApplicationWithAI(selectedApp);
    return fullScoring.criteria;
  }, [selectedApp]);

  // Google Sheet Modal & Sync state
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(() => getStoredWebhookUrl());
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetSyncResult, setSheetSyncResult] = useState<{ text: string; isError: boolean } | null>(null);
  const [sheetSyncToast, setSheetSyncToast] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptGuide, setShowScriptGuide] = useState(() => !getStoredWebhookUrl());

  // Live Sync directly from Google Sheet
  const handleFetchFromGoogleSheet = async () => {
    setIsFetchingSheet(true);
    setSheetSyncToast(null);

    try {
      const res = await fetchApplicationsFromGoogleSheet();
      if (res && res.success && Array.isArray(res.applications)) {
        onRefreshApplications(res.applications);
        saveApplicationsToStorage(res.applications);
        setSheetSyncToast({
          text: `✓ Google Sheet Live Sync Complete: Loaded ${res.applications.length} applications directly from your Google Sheet!`,
          isError: false,
        });
      } else {
        setSheetSyncToast({
          text: res.message || 'Could not fetch from Google Sheet. Check webhook or link sharing settings.',
          isError: true,
        });
      }
    } catch {
      setSheetSyncToast({
        text: 'Network error connecting to Google Sheet.',
        isError: true,
      });
    } finally {
      setIsFetchingSheet(false);
      setTimeout(() => setSheetSyncToast(null), 6000);
    }
  };

  // Delete modal state
  const [appToDelete, setAppToDelete] = useState<ScholarshipApplication | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessToast, setDeleteSuccessToast] = useState<string | null>(null);

  // Modal refs for auto-scrolling directly into view when opened on Wix / iframes
  const reviewModalRef = React.useRef<HTMLDivElement>(null);
  const googleSheetModalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (selectedApp) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      reviewModalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedApp]);

  React.useEffect(() => {
    if (isGoogleSheetModalOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      googleSheetModalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [isGoogleSheetModalOpen]);

  // Check server-side webhook configuration on load
  React.useEffect(() => {
    fetch('/api/google-sheet')
      .then((r) => r.json())
      .then((data) => {
        if (data.configured && data.webhookUrl) {
          setWebhookUrl(data.webhookUrl);
          setShowScriptGuide(false);
          if (typeof window !== 'undefined') {
            localStorage.setItem('mc_google_sheet_webhook_url', data.webhookUrl);
          }
        }
      })
      .catch(() => { });
  }, []);

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



  // Delete Application (from state & Google Sheet)
  const handleConfirmDelete = async () => {
    if (!appToDelete) return;
    setIsDeleting(true);

    const targetApp = appToDelete;
    // 1. Delete from local storage & state
    const updated = deleteApplication(targetApp.id);
    onRefreshApplications(updated);

    if (selectedApp?.id === targetApp.id) {
      setSelectedApp(null);
    }

    // 2. Trigger deletion in Google Sheet
    try {
      await deleteApplicationFromGoogleSheet(targetApp.applicationNumber, targetApp.id);
    } catch (e) {
      console.warn('Google Sheet delete sync notice:', e);
    }

    setIsDeleting(false);
    setAppToDelete(null);
    setDeleteSuccessToast(
      `Application ${targetApp.applicationNumber} (${targetApp.applicant.firstName} ${targetApp.applicant.lastName}) deleted successfully from portal & Google Sheet.`
    );
    setTimeout(() => setDeleteSuccessToast(null), 5000);
  };

  // Save Webhook URL
  const handleSaveWebhook = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed || !trimmed.startsWith('http')) {
      setSheetSyncResult({
        text: '⚠️ Please paste a valid Google Apps Script Web App URL (starts with https://script.google.com/...)',
        isError: true,
      });
      setTimeout(() => setSheetSyncResult(null), 6000);
      return;
    }
    setWebhookUrl(trimmed);
    await saveStoredWebhookUrl(trimmed);
    setShowScriptGuide(false);
    setSheetSyncResult({
      text: '✓ Webhook URL saved successfully and permanently stored! Now your submissions will mirror live to Google Sheet.',
      isError: false,
    });
    setTimeout(() => setSheetSyncResult(null), 5000);
  };

  // Bulk sync to Google Sheet
  const handleSyncAllToSheet = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      setSheetSyncResult({
        text: '⚠️ Webhook URL is not connected yet! Follow the 4 steps below to deploy Apps Script on your Google Sheet.',
        isError: true,
      });
      setShowScriptGuide(true);
      setTimeout(() => setSheetSyncResult(null), 8000);
      return;
    }

    setIsSyncingSheet(true);
    setSheetSyncResult(null);
    const result = await syncAllToGoogleSheet(applications);
    setIsSyncingSheet(false);

    if (result.success && result.webhookConfigured) {
      setSheetSyncResult({
        text: `✓ ${result.message || 'All applications successfully synced to Google Sheet!'}`,
        isError: false,
      });
    } else {
      setSheetSyncResult({
        text: `⚠️ ${result.message || 'Failed to sync with Google Sheet. Please check your Web App URL.'}`,
        isError: true,
      });
    }
    setTimeout(() => setSheetSyncResult(null), 8000);
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

  // ----------------------------------------------------
  // DEDICATED FULL APPLICATION REVIEW VIEW
  // (In-viewport, zero scrolling required on Wix / iframes)
  // ----------------------------------------------------
  if (selectedApp) {
    return (
      <div ref={reviewModalRef} className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8 text-slate-100 animate-in fade-in duration-200">
        {/* Navigation & Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedApp(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Applications Queue</span>
            </button>
            <span className="rounded bg-blue-950 px-2.5 py-1 font-mono text-xs font-bold text-blue-400 border border-blue-800/80">
              {selectedApp.applicationNumber}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Submitted {new Date(selectedApp.submittedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenRubricInfo}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-900/60 bg-blue-950/40 px-3 py-1.5 text-xs font-medium text-blue-300 hover:bg-blue-900/50 hover:text-white transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Rubric Guide</span>
            </button>
            <div className="rounded-xl border border-blue-800 bg-blue-950/60 px-3 py-1 text-center">
              <span className="text-[10px] font-semibold uppercase text-blue-400 block">AI Rubric</span>
              <span className="text-base font-black text-white">{selectedApp.aiScoring.totalScore} <span className="text-xs text-slate-400">/ 50</span></span>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${selectedApp.committeeReview.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                selectedApp.committeeReview.status === 'Shortlisted' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                  selectedApp.committeeReview.status === 'Rejected' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
              {selectedApp.committeeReview.status}
            </span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#0c1322] p-4 sm:p-6 shadow-xl mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {selectedApp.applicant.firstName} {selectedApp.applicant.lastName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {selectedApp.schoolFamily.currentHighSchool} &bull; GPA: <strong className="text-emerald-400">{selectedApp.schoolFamily.gpa}</strong> &bull; {selectedApp.applicant.email} &bull; {selectedApp.applicant.telephone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportApplicationsToPDF([selectedApp])}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                title="Download this applicant's dossier as PDF"
              >
                <FileDown className="h-4 w-4 text-indigo-400" />
                <span>Export Dossier (PDF)</span>
              </button>
              <button
                onClick={handleSaveDecision}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Save Decision</span>
              </button>
            </div>
          </div>
          {saveSuccessMsg && (
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-center text-xs font-medium animate-in fade-in">
              ✓ Decision and score saved successfully!
            </div>
          )}
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
                      <span className={`text-[10px] font-semibold uppercase px-1 rounded ${col.status === 'accepted' ? 'text-emerald-400 bg-emerald-950' : 'text-slate-400 bg-slate-800'
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

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {selectedApp.aiScoring.summary}
              </p>

              {/* Criteria Header with Scroll Indicator */}
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-300/90 mb-2 px-0.5">
                <span>10 Evaluated Criteria ({activeCriteria.length}):</span>
                <span className="text-[10px] bg-blue-950/90 text-blue-300 px-2 py-0.5 rounded border border-blue-800/80 font-mono flex items-center gap-1 shadow-sm">
                  <span>↕</span> Scroll down to inspect all 10
                </span>
              </div>

              {/* Criteria Items (1 to 10) - Scrollable */}
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-2 custom-rubric-scroll">
                {activeCriteria.map((c) => (
                  <div key={c.id} className="rounded-lg bg-slate-900/90 p-2.5 border border-slate-800 hover:border-blue-800/60 transition shadow-sm">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-white">{c.title}</span>
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
                    className="w-full rounded-lg px-3 py-1.5 text-white font-mono font-bold text-sm bg-slate-950 border border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Application Status:
                  </label>
                  <select
                    value={decisionStatus}
                    onChange={(e) => setDecisionStatus(e.target.value as ScholarshipApplication['committeeReview']['status'])}
                    className="w-full rounded-lg px-3 py-1.5 text-white capitalize text-xs bg-slate-950 border border-slate-800"
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
                    className="w-full rounded-lg px-3 py-1.5 text-white text-xs bg-slate-950 border border-slate-800"
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
                    className="w-full rounded-lg px-3 py-1.5 text-white text-xs bg-slate-950 border border-slate-800"
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

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
          <button
            type="button"
            onClick={() => {
              setSelectedApp(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Applications Queue</span>
          </button>
          <button
            onClick={handleSaveDecision}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Save Committee Decision</span>
          </button>
        </div>
      </div>
    );
  }

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
              Inspect applicant records, analyze AI 10-criterion rubrics (0–50 pts), input committee overrides, and sync with Google Sheet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Download All Applications into a single organized PDF */}
            <button
              type="button"
              id="btn-download-all-pdf"
              onClick={() => exportApplicationsToPDF(filteredApplications.length > 0 ? filteredApplications : applications)}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition cursor-pointer"
              title="Download all applications into a beautifully organized single PDF report"
            >
              <FileDown className="h-4 w-4" />
              <span>Download All (PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleFetchFromGoogleSheet}
              disabled={isFetchingSheet}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
              title="Sync live records directly from your Google Sheet"
            >
              <RotateCcw className={`h-4 w-4 ${isFetchingSheet ? 'animate-spin' : ''}`} />
              <span>{isFetchingSheet ? 'Syncing...' : 'Sync from Google Sheet'}</span>
            </button>
            <button
              onClick={() => setIsGoogleSheetModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F9D58] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-green-700/20 hover:bg-[#0b8043] transition cursor-pointer"
              title="Open and configure Google Sheet integration"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Google Sheet Settings</span>
            </button>
            <button
              onClick={onOpenRubricInfo}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Rubric Guide</span>
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

      {sheetSyncToast && (
        <div
          className={`mb-4 flex items-center justify-between p-3 rounded-xl border text-xs font-semibold animate-in fade-in ${sheetSyncToast.isError
              ? 'bg-amber-950/80 border-amber-800 text-amber-200'
              : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
            }`}
        >
          <div className="flex items-center gap-2">
            <RotateCcw className={`h-4 w-4 shrink-0 ${sheetSyncToast.isError ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>{sheetSyncToast.text}</span>
          </div>
          <button
            onClick={() => setSheetSyncToast(null)}
            className="p-1 rounded cursor-pointer opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {deleteSuccessToast && (
        <div className="mb-4 flex items-center justify-between p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400 shrink-0" />
            <span>{deleteSuccessToast}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessToast(null)}
            className="text-red-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
          <table className="min-w-[1080px] w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 w-[110px] min-w-[110px]">ID &amp; Date</th>
                <th className="px-4 py-3 min-w-[180px]">Applicant Name</th>
                <th className="px-4 py-3 min-w-[190px]">High School &amp; GPA</th>
                <th className="px-4 py-3 w-[110px] min-w-[110px]">Service Hours</th>
                <th className="px-4 py-3 w-[210px] min-w-[210px]">AI Rubric (50 pts)</th>
                <th className="px-4 py-3 w-[140px] min-w-[140px]">Committee Status</th>
                <th className="px-4 py-3 text-right w-[170px] min-w-[170px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    {applications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3">
                        <p className="text-sm text-slate-300 font-medium">No applications found in the portal yet.</p>
                        <button
                          type="button"
                          onClick={handleFetchFromGoogleSheet}
                          disabled={isFetchingSheet}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow cursor-pointer disabled:opacity-60"
                        >
                          <RotateCcw className={`h-4 w-4 ${isFetchingSheet ? 'animate-spin' : ''}`} />
                          <span>{isFetchingSheet ? 'Fetching from Google Sheet...' : 'Sync from Google Sheet'}</span>
                        </button>
                      </div>
                    ) : (
                      'No applications found matching your criteria.'
                    )}
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
                      className={`transition cursor-pointer ${appToDelete?.id === app.id
                          ? 'bg-red-950/40 border-l-4 border-l-red-500'
                          : 'hover:bg-slate-900/60'
                        }`}
                      onClick={() => {
                        if (appToDelete?.id !== app.id) {
                          handleOpenReview(app);
                        }
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap w-[110px] min-w-[110px]">
                        <span className="font-bold text-blue-400">{app.applicationNumber}</span>
                        <div className="text-[10px] text-slate-500">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-white min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{app.applicant.firstName} {app.applicant.lastName}</span>
                          {appToDelete?.id === app.id && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-950/90 border border-red-700/80 px-1.5 py-0.5 rounded animate-pulse">
                              Delete?
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{app.applicant.email}</div>
                      </td>

                      <td className="px-4 py-3 min-w-[190px]">
                        <div className="text-slate-200 line-clamp-1">{app.schoolFamily.currentHighSchool}</div>
                        <div className="text-[11px] font-mono text-emerald-400">GPA: {app.schoolFamily.gpa}</div>
                      </td>

                      <td className="px-4 py-3 font-mono whitespace-nowrap w-[110px] min-w-[110px]">
                        <span className="text-slate-200 font-semibold">{volunteerHours} hrs</span>
                        <div className="text-[10px] text-slate-500">{app.activities.length} clubs</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap w-[210px] min-w-[210px]">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="shrink-0 rounded bg-blue-950/90 px-2.5 py-1 font-mono text-xs font-extrabold text-blue-300 border border-blue-800/80 shadow-sm whitespace-nowrap">
                            {app.aiScoring.totalScore} / 50
                          </span>
                          <span
                            className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${app.aiScoring.ratingCategory === 'Exceptional'
                                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/80'
                                : app.aiScoring.ratingCategory === 'High Merit'
                                  ? 'bg-blue-950/90 text-blue-300 border-blue-700/80'
                                  : app.aiScoring.ratingCategory === 'Recommended'
                                    ? 'bg-amber-950/90 text-amber-300 border-amber-700/80'
                                    : app.aiScoring.ratingCategory === 'Competitive'
                                      ? 'bg-purple-950/90 text-purple-300 border-purple-700/80'
                                      : 'bg-slate-800/90 text-slate-300 border-slate-700'
                              }`}
                          >
                            {app.aiScoring.ratingCategory}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap w-[140px] min-w-[140px]">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${app.committeeReview.status === 'Approved'
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

                      <td className="px-4 py-3 text-right whitespace-nowrap w-[170px] min-w-[170px]" onClick={(e) => e.stopPropagation()}>
                        {appToDelete?.id === app.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-in fade-in">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={handleConfirmDelete}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-md shadow-red-600/30 hover:bg-red-500 disabled:opacity-50 transition cursor-pointer"
                              title="Confirm delete application"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  <span>Deleting...</span>
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Confirm</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => setAppToDelete(null)}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReview(app);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 px-2.5 py-1.5 text-xs font-semibold text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white transition cursor-pointer"
                              title="Review details & Rubric"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Review</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAppToDelete(app);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600/10 px-2.5 py-1.5 text-xs font-semibold text-red-400 border border-red-500/30 hover:bg-red-600 hover:text-white transition cursor-pointer"
                              title="Delete application from portal & Google Sheet"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
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
      {/* GOOGLE SHEET INTEGRATION & LIVE SYNC MODAL */}
      {/* ======================================================== */}
      {isGoogleSheetModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-3 sm:p-6 pt-4 sm:pt-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div ref={googleSheetModalRef} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0f172a] p-5 sm:p-7 shadow-2xl text-slate-100 mb-8">
            <button
              onClick={() => setIsGoogleSheetModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5 pr-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F9D58]/20 text-[#34A853] border border-[#0F9D58]/40">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">Google Sheet Live Integration</h3>
                  <span
                    className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${webhookUrl && webhookUrl.startsWith('http')
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : 'bg-red-950 text-red-300 border-red-700'
                      }`}
                  >
                    {webhookUrl && webhookUrl.startsWith('http') ? '✓ Connected' : '⚠️ Setup Required'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Auto-records every applicant submission &amp; removes deleted records in real time.
                </p>
              </div>
            </div>

            {sheetSyncResult && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs font-medium text-center animate-in fade-in ${sheetSyncResult.isError
                    ? 'bg-red-950/80 border-red-700 text-red-200'
                    : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  }`}
              >
                {sheetSyncResult.text}
              </div>
            )}

            {/* Proactive Banner when Webhook is not connected */}
            {(!webhookUrl || !webhookUrl.startsWith('http')) && (
              <div className="mb-4 rounded-xl border border-amber-600/70 bg-amber-950/40 p-3.5 text-xs text-amber-200 leading-relaxed space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>গুগল শীটে সরাসরি ডাটা যাওয়ার জন্য ১-মিনিটের সেটআপ বাকি:</span>
                </div>
                <p className="text-slate-300">
                  গুগল সিকিউরিটির জন্য বাইরের যেকোনো ওয়েবসাইট থেকে শীটে লিখতে হলে একটি <strong className="text-white">Apps Script Web App</strong> প্রয়োজন। নিচের ৪টি ধাপ সম্পন্ন করে পাওয়া URL-টি এখানে দিন।
                </p>
              </div>
            )}

            {/* Primary Actions: Open Sheet, Pull Live, Push All */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-5">
              <a
                href={GOOGLE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#0F9D58] px-3.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-green-700/30 hover:bg-[#0b8043] transition cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open Google Sheet</span>
              </a>

              <button
                type="button"
                onClick={handleFetchFromGoogleSheet}
                disabled={isFetchingSheet}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-700/40 px-3.5 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white disabled:opacity-50 transition cursor-pointer"
              >
                <RotateCcw className={`h-4 w-4 ${isFetchingSheet ? 'animate-spin' : ''}`} />
                <span>{isFetchingSheet ? 'Pulling...' : 'Pull from Sheet'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncAllToSheet}
                disabled={isSyncingSheet}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition cursor-pointer"
              >
                {isSyncingSheet ? (
                  <span>Syncing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Push to Sheet ({applications.length})</span>
                  </>
                )}
              </button>
            </div>

            {/* Webhook Configuration Section */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Google Apps Script Web App URL:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 rounded-lg bg-slate-950 px-3 py-2 text-xs text-white border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  onClick={() => handleSaveWebhook(webhookUrl)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition cursor-pointer shrink-0"
                >
                  Save URL
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Connecting your Google Apps Script URL enables instant, bi-directional row creation and deletion in your Google Sheet.
              </p>
            </div>

            {/* 2-Minute Setup Guide Accordion */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">How to connect in 2 minutes:</span>
                <button
                  type="button"
                  onClick={() => setShowScriptGuide(!showScriptGuide)}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300 underline cursor-pointer"
                >
                  {showScriptGuide ? 'Hide instructions' : 'View instructions & script'}
                </button>
              </div>

              {showScriptGuide && (
                <div className="mt-3.5 pt-3.5 border-t border-slate-800 space-y-3 text-xs text-slate-300">
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-300">
                    <li>
                      Open your{' '}
                      <a
                        href={GOOGLE_SHEET_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 underline font-medium"
                      >
                        Google Sheet
                      </a>
                      .
                    </li>
                    <li>
                      Click menu <strong className="text-white">Extensions &gt; Apps Script</strong>.
                    </li>
                    <li>
                      Delete any existing code, paste the script below, and click <strong className="text-white">Save</strong>.
                    </li>
                    <li>
                      Click <strong className="text-white">Deploy &gt; New deployment</strong>.
                    </li>
                    <li>
                      Select type <strong className="text-white">Web app</strong>, set <em>Who has access</em> to <strong className="text-white">Anyone</strong>, and click <strong className="text-white">Deploy</strong>.
                    </li>
                    <li>
                      Copy the Web App URL (ends in <code className="text-amber-300">/exec</code>) and paste it into the box above!
                    </li>
                  </ol>

                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase">
                        Apps Script Code:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
                          setCopiedScript(true);
                          setTimeout(() => setCopiedScript(false), 3000);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copiedScript ? '✓ Copied Script!' : 'Copy Entire Script'}</span>
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={GOOGLE_APPS_SCRIPT_CODE}
                      rows={5}
                      className="w-full rounded-lg bg-slate-950 p-2.5 text-[10px] font-mono text-slate-400 border border-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
