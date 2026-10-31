import { NextRequest, NextResponse } from 'next/server';
import { ScholarshipApplication } from '@/types/scholarship';
import fs from 'fs';
import path from 'path';

// File-based persistence in /tmp (or OS temporary directory)
const DATA_FILE = path.join(
  process.env.TMPDIR || process.env.TEMP || '/tmp',
  'mc_scholarship_applications.json'
);

// Global in-memory cache to guarantee persistence across warm serverless/node instances
declare global {
  var __MC_APPLICATIONS_CACHE__: ScholarshipApplication[] | undefined;
}

function loadApplications(): ScholarshipApplication[] {
  if (global.__MC_APPLICATIONS_CACHE__ && Array.isArray(global.__MC_APPLICATIONS_CACHE__)) {
    return global.__MC_APPLICATIONS_CACHE__;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        global.__MC_APPLICATIONS_CACHE__ = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[API Applications] Could not read from DATA_FILE:', err);
  }

  global.__MC_APPLICATIONS_CACHE__ = [];
  return [];
}

function saveApplications(apps: ScholarshipApplication[]): void {
  global.__MC_APPLICATIONS_CACHE__ = apps;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.warn('[API Applications] Could not write to DATA_FILE:', err);
  }
}

// --------------------------------------------------------------------------
// GET: Return all submitted applications
// --------------------------------------------------------------------------
export async function GET() {
  const apps = loadApplications();
  return NextResponse.json(
    {
      success: true,
      count: apps.length,
      applications: apps,
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

// --------------------------------------------------------------------------
// POST: Save a new application or bulk-sync applications
// --------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentApps = loadApplications();

    // Case 1: Bulk array of applications
    if (body && Array.isArray(body.applications)) {
      const incoming: ScholarshipApplication[] = body.applications;
      const map = new Map<string, ScholarshipApplication>();

      // Existing first
      for (const app of currentApps) {
        if (app && app.id) map.set(app.id, app);
      }
      // Incoming updates or adds
      for (const app of incoming) {
        if (app && app.id) map.set(app.id, app);
      }

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      saveApplications(merged);

      return NextResponse.json({
        success: true,
        count: merged.length,
        applications: merged,
      });
    }

    // Case 2: Single application submission
    const newApp: ScholarshipApplication = body.application || body;
    if (!newApp || !newApp.id) {
      return NextResponse.json(
        { success: false, message: 'Invalid application object' },
        { status: 400 }
      );
    }

    const filtered = currentApps.filter(
      (a) => a.id !== newApp.id && a.applicationNumber !== newApp.applicationNumber
    );
    const updated = [newApp, ...filtered];

    saveApplications(updated);

    return NextResponse.json({
      success: true,
      count: updated.length,
      application: newApp,
      applications: updated,
    });
  } catch (err) {
    console.error('[API Applications POST Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to process application' },
      { status: 500 }
    );
  }
}

// --------------------------------------------------------------------------
// PUT: Update committee review status, reviewer score, or notes
// --------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { applicationId, review } = body;

    if (!applicationId || !review) {
      return NextResponse.json(
        { success: false, message: 'Missing applicationId or review data' },
        { status: 400 }
      );
    }

    const currentApps = loadApplications();
    const updated = currentApps.map((app) => {
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

    saveApplications(updated);

    return NextResponse.json({
      success: true,
      applications: updated,
    });
  } catch (err) {
    console.error('[API Applications PUT Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update committee review' },
      { status: 500 }
    );
  }
}

// --------------------------------------------------------------------------
// DELETE: Delete an application
// --------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let applicationId = id;
    if (!applicationId) {
      const body = await req.json().catch(() => ({}));
      applicationId = body.applicationId || body.id;
    }

    if (!applicationId) {
      return NextResponse.json(
        { success: false, message: 'Missing applicationId to delete' },
        { status: 400 }
      );
    }

    const currentApps = loadApplications();
    const updated = currentApps.filter((a) => a.id !== applicationId);

    saveApplications(updated);

    return NextResponse.json({
      success: true,
      count: updated.length,
      applications: updated,
    });
  } catch (err) {
    console.error('[API Applications DELETE Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}
