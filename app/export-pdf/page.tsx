'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import { ScholarshipApplication } from '@/types/scholarship';
import { getStoredApplications } from '@/lib/storage';
import { generateScholarshipJsPdf } from '@/lib/pdfExport';

function ExportPdfContent() {
  const searchParams = useSearchParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('Scholarship_Applications.pdf');
  const [totalApps, setTotalApps] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initPdf = async () => {
      let apps: ScholarshipApplication[] = [];

      // 1. Try reading from temporary export storage
      try {
        const temp = localStorage.getItem('monday_club_export_temp');
        if (temp) {
          const parsed = JSON.parse(temp);
          if (Array.isArray(parsed) && parsed.length > 0) {
            apps = parsed;
          }
        }
      } catch (e) {
        console.warn('Error reading temp export:', e);
      }

      // 2. Filter by specific ID if query param specifies one
      const targetId = searchParams.get('id');
      const allStored = getStoredApplications();

      if (targetId && allStored.length > 0) {
        const found = allStored.filter(
          (a) => a.id === targetId || a.applicationNumber === targetId
        );
        if (found.length > 0) {
          apps = found;
        }
      } else if (apps.length === 0 && allStored.length > 0) {
        apps = allStored;
      }

      // 3. Fallback: fetch from Google Sheet API if empty
      if (apps.length === 0) {
        try {
          const res = await fetch('/api/google-sheet?action=fetch');
          const data = await res.json();
          if (data && data.success && Array.isArray(data.applications)) {
            apps = data.applications;
          }
        } catch { }
      }

      if (!isMounted) return;

      if (apps.length === 0) {
        setIsGenerating(false);
        return;
      }

      setTotalApps(apps.length);

      try {
        const { doc, fileName: generatedFileName } = generateScholarshipJsPdf(apps);
        setFileName(generatedFileName);

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setIsGenerating(false);

        setIsGenerating(false);
      } catch (err) {
        console.error('Failed to generate PDF:', err);
        setIsGenerating(false);
      }
    };

    initPdf();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleManualDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadTriggered(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="bg-[#0f172a] border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">
              The Monday Club Scholarship — Master PDF Dossier
            </h1>
            <p className="text-xs text-slate-400">
              {totalApps > 0 ? `${totalApps} Application(s) included` : 'Generating Dossier...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {downloadTriggered && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Download Started</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleManualDownload}
            disabled={!pdfUrl}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Save PDF File</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!pdfUrl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50 transition cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={() => window.close()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main PDF View */}
      <main className="flex-1 w-full h-full relative bg-slate-900">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm font-medium text-white">Generating Scholarship Committee Dossier...</p>
            <p className="text-xs text-slate-400">Compiling rubric evaluations, profiles, and scorecards</p>
          </div>
        ) : pdfUrl ? (
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center text-slate-300">
              <p className="text-base font-semibold text-white">Your PDF Dossier is ready.</p>
              <button
                type="button"
                onClick={handleManualDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Save PDF File ({fileName})</span>
              </button>
            </div>
          </object>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
            <p className="text-sm">No applications found to export.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ExportPdfPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-[#090d16] text-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <ExportPdfContent />
    </Suspense>
  );
}
