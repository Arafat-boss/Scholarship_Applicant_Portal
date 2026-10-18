'use client';

import { ScholarshipApplication } from '@/types/scholarship';
import { sampleApplications } from './sampleData';
import { evaluateApplicationWithAI } from './aiScoring';

const STORAGE_KEY = 'monday_club_scholarship_applications_v2';

export function getStoredApplications(): ScholarshipApplication[] {
  if (typeof window === 'undefined') {
    return sampleApplications;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleApplications));
      return sampleApplications;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleApplications));
    return sampleApplications;
  } catch (err) {
    console.error('Failed to read from localStorage:', err);
    return sampleApplications;
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
  }
  return updated;
}

export function deleteApplication(applicationId: string): ScholarshipApplication[] {
  const existing = getStoredApplications();
  const updated = existing.filter((app) => app.id !== applicationId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return updated;
}

export function resetToSampleData(): ScholarshipApplication[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleApplications));
  }
  return sampleApplications;
}
