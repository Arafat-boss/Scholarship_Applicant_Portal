'use client';

import { ScholarshipApplication } from '@/types/scholarship';
import { evaluateApplicationWithAI } from './aiScoring';

const STORAGE_KEY = 'monday_club_scholarship_applications_v3';

export function getStoredApplications(): ScholarshipApplication[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return [];
  }
}

function broadcastUpdate(action: string, payload?: unknown) {
  if (typeof window === 'undefined') return;
  try {
    const channel = new BroadcastChannel('mc_scholarship_sync');
    channel.postMessage({ action, payload, timestamp: Date.now() });
    channel.close();
  } catch {
    // BroadcastChannel unsupported or restricted in older envs
  }
}

export async function fetchApplicationsFromServer(): Promise<ScholarshipApplication[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/applications', { cache: 'no-store' });
    const data = await res.json();
    if (data.success && Array.isArray(data.applications)) {
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
      saveApplicationsToStorage(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Could not sync from /api/applications:', err);
  }
  return getStoredApplications();
}

export function saveApplicationsToStorage(apps: ScholarshipApplication[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  }
}

export function saveNewApplication(
  formData: Omit<ScholarshipApplication, 'id' | 'applicationNumber' | 'submittedAt' | 'aiScoring' | 'committeeReview'>
): ScholarshipApplication {
  const existing = getStoredApplications();
  const nextNum = existing.length + 1;
  const applicationNumber = `MC-2026-${String(nextNum).padStart(3, '0')}`;
  const id = `app-${Date.now()}`;
  const submittedAt = new Date().toISOString();

  // Run AI 10-Criterion Rubric evaluation
  const aiScoring = evaluateApplicationWithAI({
    id,
    applicationNumber,
    submittedAt,
    ...formData,
  });

  const newApp: ScholarshipApplication = {
    id,
    applicationNumber,
    submittedAt,
    ...formData,
    aiScoring,
    committeeReview: {
      status: 'Under Review',
      committeeNotes: '',
    },
  };

  const updated = [newApp, ...existing];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Send to server backend with keepalive
    fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp),
      keepalive: true,
    }).catch((err) => console.warn('Background API sync notice:', err));

    broadcastUpdate('NEW_APPLICATION', newApp);
  }
  return newApp;
}

export function updateCommitteeReview(
  applicationId: string,
  review: {
    status: ScholarshipApplication['committeeReview']['status'];
    reviewerScore?: number;
    reviewerName?: string;
    committeeNotes?: string;
  }
): ScholarshipApplication[] {
  const existing = getStoredApplications();
  const updated = existing.map((app) => {
    if (app.id === applicationId) {
      return {
        ...app,
        committeeReview: {
          ...app.committeeReview,
          ...review,
          reviewedAt: new Date().toISOString(),
        },
      };
    }
    return app;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Send update to server backend
    fetch('/api/applications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, review }),
      keepalive: true,
    }).catch((err) => console.warn('Background API review sync notice:', err));

    broadcastUpdate('UPDATE_REVIEW', { applicationId, review });
  }
  return updated;
}

export function deleteApplication(applicationId: string): ScholarshipApplication[] {
  const existing = getStoredApplications();
  const updated = existing.filter((app) => app.id !== applicationId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Send delete to server backend
    fetch('/api/applications', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId }),
      keepalive: true,
    }).catch((err) => console.warn('Background API delete sync notice:', err));

    broadcastUpdate('DELETE_APPLICATION', { applicationId });
  }
  return updated;
}

export function clearAllApplications(): ScholarshipApplication[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  return [];
}
