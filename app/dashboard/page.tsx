'use client';

// Force dynamic execution on Vercel so edge cache is never stale
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ReviewerDashboard from '@/components/ReviewerDashboard';
import CommitteeLoginGate from '@/components/CommitteeLoginGate';
import RubricInfoModal from '@/components/RubricInfoModal';
import { ScholarshipApplication } from '@/types/scholarship';
import { getStoredApplications, saveApplicationsToStorage } from '@/lib/storage';
import { ShieldCheck, LogOut, Loader2 } from 'lucide-react';

const emptySubscribe = () => () => {};

export default function DashboardPage() {
  const router = useRouter();
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Session state:
  // null = Verifying HttpOnly cookie with server
  // true = Authenticated (render dashboard)
  // false = Unauthenticated (render passcode gate)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const [storedApps, setStoredApps] = useState<ScholarshipApplication[] | null>(null);
  const applications = storedApps !== null ? storedApps : (isMounted ? getStoredApplications() : []);
  const [isRubricModalOpen, setIsRubricModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Set document title
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Committee Reviewer Dashboard | The Monday Club';
    }
  }, []);

  // Verify HttpOnly session cookie on initial page mount
  useEffect(() => {
    let isCancelled = false;

    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/verify', { cache: 'no-store' });
        const data = await res.json();
        if (!isCancelled) {
          setIsAuthenticated(Boolean(data.authenticated));
        }
      } catch {
        if (!isCancelled) {
          setIsAuthenticated(false);
        }
      }
    };

    verifySession();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Logout handler: clear server cookie and reset client state
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout notice:', err);
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mc_committee_auth');
      localStorage.removeItem('mc_committee_auth');
    }

    setIsAuthenticated(false);
    setStoredApps(null);
    setIsLoggingOut(false);
  };

  // Sync applications from server API when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    let isCancelled = false;

    const syncFromServer = async () => {
      try {
        const res = await fetch('/api/applications', { cache: 'no-store' });
        
        // Handle session expiration
        if (res.status === 401) {
          if (!isCancelled) setIsAuthenticated(false);
          return;
        }

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

    // Periodically poll every 3 seconds for new submissions
    const interval = setInterval(syncFromServer, 3000);

    // Re-sync when switching focus back to tab
    const handleFocus = () => syncFromServer();
    window.addEventListener('focus', handleFocus);

    // Cross-tab broadcast channel sync
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
  }, [isAuthenticated]);

  // Broadcast dynamic iframe height to parent container
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
          {/* Logo & Portal Branding (Static non-clickable element) */}
          <div className="flex items-center gap-2.5 pointer-events-none select-none cursor-default" role="presentation">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-700/80 p-1 shadow-md">
              <Image
                src="/Logo.png"
                alt="The Monday Club Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain pointer-events-none"
                priority
              />
            </div>
            <div className="pointer-events-none">
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">
                The Monday Club, Inc.
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                Reviewer Committee Dashboard
              </div>
            </div>
          </div>

          {/* Authorized status badge and logout button */}
          {isAuthenticated && (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-[11px] font-medium text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Authorized Session</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-900/60 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                title="Log out and terminate session"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 pb-10">
        {!isMounted || isAuthenticated === null ? (
          // Session verification loading state
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="text-xs text-slate-400 font-mono tracking-wide">
              Verifying secure session...
            </span>
          </div>
        ) : !isAuthenticated ? (
          // Render login gate if not authenticated or session expired
          <div className="py-6 sm:py-10">
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-700/70">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Restricted Committee Route</span>
              </span>
            </div>
            <CommitteeLoginGate
              openInNewTab={false}
              onAuthenticated={() => setIsAuthenticated(true)}
              onBackToApplication={() => router.push('/')}
            />
          </div>
        ) : (
          // Render dashboard when authenticated with valid cookie
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
