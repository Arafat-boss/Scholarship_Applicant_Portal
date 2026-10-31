'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReviewerDashboard from '@/components/ReviewerDashboard';
import CommitteeLoginGate from '@/components/CommitteeLoginGate';
import RubricInfoModal from '@/components/RubricInfoModal';
import { ScholarshipApplication } from '@/types/scholarship';
import { getStoredApplications, saveApplicationsToStorage } from '@/lib/storage';
import { ShieldCheck } from 'lucide-react';

const emptySubscribe = () => () => {};

export default function DashboardPage() {
  const router = useRouter();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [authOverride, setAuthOverride] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Committee Reviewer Dashboard | The Monday Club';
    }
  }, []);

  const isClientAuthenticated = useSyncExternalStore(
    emptySubscribe,
    () => {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams(window.location.search);
      const authParam = params.get('auth');
      if (authParam && (authParam.toLowerCase() === 'monday2026' || authParam === 'aaa')) {
        sessionStorage.setItem('mc_committee_auth', 'true');
        localStorage.setItem('mc_committee_auth', 'true');
        window.history.replaceState({}, '', window.location.pathname);
        return true;
      }
      return (
        sessionStorage.getItem('mc_committee_auth') === 'true' ||
        localStorage.getItem('mc_committee_auth') === 'true'
      );
    },
    () => false
  );

  const isAuthenticated = authOverride !== null ? authOverride : isClientAuthenticated;

  const [storedApps, setStoredApps] = useState<ScholarshipApplication[] | null>(null);
  const applications = storedApps !== null ? storedApps : (isMounted ? getStoredApplications() : []);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);

  // Synchronize applications with server API (/api/applications) and cross-tab BroadcastChannel
  useEffect(() => {
    let isCancelled = false;

    const syncFromServer = async () => {
      try {
        const res = await fetch('/api/applications', { cache: 'no-store' });
        const data = await res.json();
        if (!isCancelled && data.success && Array.isArray(data.applications)) {
          const local = getStoredApplications();
          const map = new Map<string, ScholarshipApplication>();
          for (const a of local) {
            if (a && a.id) map.set(a.id, a);
          }
          for (const a of data.applications) {
            if (a && a.id) map.set(a.id, a);
          }
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
          );
          setStoredApps(merged);
          saveApplicationsToStorage(merged);
        }
      } catch (err) {
        console.warn('Dashboard sync notice:', err);
      }
    };

    // Immediate initial sync
    syncFromServer();

    // Re-check periodically every 3 seconds for new student submissions
    const interval = setInterval(syncFromServer, 3000);

    // Re-sync whenever the reviewer switches focus to this browser tab
    const handleFocus = () => syncFromServer();
    window.addEventListener('focus', handleFocus);

    // Listen to cross-tab BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('mc_scholarship_sync');
      channel.onmessage = () => {
        syncFromServer();
      };
    } catch {
      // ignore
    }

    return () => {
      isCancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      channel?.close();
    };
  }, []);

  // Broadcast dynamic height to Wix / parent iframe so container fits content
  useEffect(() => {
    const notifyHeight = () => {
      if (typeof window === 'undefined') return;
      const height = document.documentElement.scrollHeight || document.body.scrollHeight;
      window.parent?.postMessage({ type: 'setHeight', height }, '*');
      window.parent?.postMessage({ type: 'resize', height }, '*');
      window.parent?.postMessage({ height }, '*');
      window.parent?.postMessage(height, '*');
    };

    notifyHeight();
    const timeout = setTimeout(notifyHeight, 200);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(() => {
        notifyHeight();
      });
      resizeObserver.observe(document.body);
    }

    return () => {
      clearTimeout(timeout);
      resizeObserver?.disconnect();
    };
  }, [isAuthenticated, applications.length]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#090d16] text-slate-100 min-h-0 overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/95 backdrop-blur-md px-3 sm:px-6 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {/* Logo & Portal Branding */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group hover:opacity-90 transition cursor-pointer"
          >
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 p-1 shadow-md">
              <Image
                src="/Logo.png"
                alt="The Monday Club Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-400 transition leading-tight">
                The Monday Club, Inc.
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                Reviewer Committee Dashboard
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Protected Content */}
      <main className="w-full flex-1 pb-10">
        {!isMounted || !isAuthenticated ? (
          <div className="py-6 sm:py-10">
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-700/70">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Restricted Committee Route</span>
              </span>
            </div>
            <CommitteeLoginGate
              openInNewTab={false}
              onAuthenticated={() => setAuthOverride(true)}
              onBackToApplication={() => router.push('/')}
            />
          </div>
        ) : (
          <div className="w-full">
            <ReviewerDashboard
              applications={applications}
              onRefreshApplications={setStoredApps}
              onOpenRubricInfo={() => setIsRubricModalOpen(true)}
            />
          </div>
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

