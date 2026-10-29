'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Printer, X, FileText, CheckCircle2 } from 'lucide-react';
import type jsPDF from 'jspdf';
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
  const docRef = useRef<jsPDF | null>(null);

  const targetId = searchParams.get('id');
  const serverDownloadUrl = targetId
    ? `/api/pdf?download=1&id=${encodeURIComponent(targetId)}`
    : '/api/pdf?download=1';

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
        } catch {}
      }

      if (!isMounted) return;

      if (apps.length === 0) {
        setIsGenerating(false);
        return;
      }

      setTotalApps(apps.length);

      try {
        const { doc, fileName: generatedFileName } = generateScholarshipJsPdf(apps);
        docRef.current = doc;
        setFileName(generatedFileName);

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
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
  }, [searchParams, targetId]);

  const handleManualDownload = (e?: React.MouseEvent) => {
    setDownloadTriggered(true);

    // 1. Try jsPDF direct save
    if (docRef.current) {
      try {
        docRef.current.save(fileName);
        return;
      } catch (err) {
        console.warn('doc.save error:', err);
      }
    }

    // 2. Try anchor download with blobUrl
    if (pdfUrl) {
      try {
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (document.body.contains(a)) document.body.removeChild(a);
        }, 150);
        return;
      } catch (err) {
        console.warn('Blob anchor error:', err);
      }
    }

    // 3. Fallback to direct HTTP attachment download
    if (e) {
      // Allow default <a> navigation to serverDownloadUrl
      return;
    }
    window.location.href = serverDownloadUrl;
  };

  const handlePrint = () => {
    if (docRef.current) {
      try {
        docRef.current.autoPrint();
        const blobUrl = docRef.current.output('bloburl');
        window.open(blobUrl, '_blank');
        return;
      } catch {}
    }
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

          <a
            href={serverDownloadUrl}
            download={fileName}
            onClick={handleManualDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Save PDF File</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer"
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
      <main className="flex-1 w-full h-full relative bg-slate-900 overflow-hidden">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            <p className="text-sm font-medium text-white">Generating Scholarship Committee Dossier...</p>
            <p className="text-xs text-slate-400">Compiling rubric evaluations, profiles, and scorecards</p>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0 bg-slate-900"
            title="PDF Dossier Viewer"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 p-8 text-center">
            <p className="text-sm text-slate-300">No applications found in local cache.</p>
            <a
              href={serverDownloadUrl}
              download={fileName}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow"
            >
              <Download className="h-4 w-4" />
              <span>Download Live Dossier from Google Sheet</span>
            </a>
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
