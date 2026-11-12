'use client';

import { ScholarshipApplication } from '@/types/scholarship';
import { evaluateApplicationWithAI } from './aiScoring';
import { getScholarshipDates } from './scholarshipDates';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem('mc_committee_token') || localStorage.getItem('mc_committee_token');
  } catch {
    return null;
  }
}

export function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-committee-token'] = token;
  }
  return headers;
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

// In-memory runtime cache for fast client navigation
let runtimeApplicationsCache: ScholarshipApplication[] = [];

/**
 * Return applications from in-memory runtime cache (NO local storage persistence).
 * Always backed by MongoDB Atlas.
 */
export function getStoredApplications(): ScholarshipApplication[] {
  return runtimeApplicationsCache;
}

export function saveApplicationsToStorage(apps: ScholarshipApplication[]): void {
  runtimeApplicationsCache = apps;
}

/**
 * Fetch applications directly from MongoDB Atlas backend API.
 * Never merges with device local storage so every device sees the exact same data.
 */
export async function fetchApplicationsFromServer(): Promise<ScholarshipApplication[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/applications', {
      cache: 'no-store',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (data.success && Array.isArray(data.applications)) {
      runtimeApplicationsCache = data.applications;
      return data.applications;
    }
  } catch (err) {
    console.warn('Could not fetch from MongoDB /api/applications:', err);
  }
  return runtimeApplicationsCache;
}

/**
 * Save new student application directly to MongoDB Atlas.
 */
export function saveNewApplication(
  formData: Omit<ScholarshipApplication, 'id' | 'applicationNumber' | 'submittedAt' | 'aiScoring' | 'committeeReview'>
): ScholarshipApplication {
  const currentYear = getScholarshipDates().currentYear;
  const id = `app-${Date.now()}`;
  const submittedAt = new Date().toISOString();
  const randomSuffix = String(Math.floor(100 + Math.random() * 900));
  const applicationNumber = `MC-${currentYear}-${randomSuffix}`;

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

  runtimeApplicationsCache = [newApp, ...runtimeApplicationsCache.filter((a) => a.id !== id)];

  if (typeof window !== 'undefined') {
    // Send to MongoDB Atlas API
    fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.applications)) {
          runtimeApplicationsCache = data.applications;
        }
      })
      .catch((err) => console.warn('Background MongoDB sync notice:', err));

    broadcastUpdate('NEW_APPLICATION', newApp);
  }

  return newApp;
}

/**
 * Update committee review decision in MongoDB Atlas.
 */
export function updateCommitteeReview(
  applicationId: string,
  review: {
    status: ScholarshipApplication['committeeReview']['status'];
    reviewerScore?: number;
    reviewerName?: string;
    committeeNotes?: string;
  }
): ScholarshipApplication[] {
  if (!applicationId) return runtimeApplicationsCache;

  const updated = runtimeApplicationsCache.map((app) => {
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

  runtimeApplicationsCache = updated;

  if (typeof window !== 'undefined') {
    // Send update to MongoDB Atlas backend
    fetch('/api/applications', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ applicationId, review }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.applications)) {
          runtimeApplicationsCache = data.applications;
        }
      })
      .catch((err) => console.warn('Background API review sync notice:', err));

    broadcastUpdate('UPDATE_REVIEW', { applicationId, review });
  }

  return updated;
}

/**
 * Delete application from MongoDB Atlas.
 */
export function deleteApplication(applicationId: string): ScholarshipApplication[] {
  if (!applicationId) return runtimeApplicationsCache;

  const updated = runtimeApplicationsCache.filter((app) => app.id !== applicationId);
  runtimeApplicationsCache = updated;

  if (typeof window !== 'undefined') {
    // Send delete to MongoDB Atlas backend
    fetch(`/api/applications?id=${encodeURIComponent(applicationId)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ applicationId }),
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.applications)) {
          runtimeApplicationsCache = data.applications;
        }
      })
      .catch((err) => console.warn('Background API delete sync notice:', err));

    broadcastUpdate('DELETE_APPLICATION', { applicationId });
  }

  return updated;
}

export function clearAllApplications(): ScholarshipApplication[] {
  runtimeApplicationsCache = [];
  return [];
}
