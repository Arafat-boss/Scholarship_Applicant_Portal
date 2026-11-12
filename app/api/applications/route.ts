import { NextRequest, NextResponse } from 'next/server';
import { ScholarshipApplication } from '@/types/scholarship';
import fs from 'fs';
import path from 'path';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { getApplicationsCollection } from '@/lib/mongodb';

// Ensure this route handler is evaluated dynamically and never prerendered at build time
export const dynamic = 'force-dynamic';

/**
 * Committee authentication verification helper:
 * Verifies that the incoming request includes a valid HttpOnly session cookie
 */
function isAuthorizedCommittee(req: NextRequest): boolean {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token && verifySessionToken(token)) return true;

  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.slice(7).trim();
    if (headerToken && verifySessionToken(headerToken)) return true;
  }

  const customToken = req.headers.get('x-committee-token');
  if (customToken && verifySessionToken(customToken)) return true;

  return false;
}

// File-based persistence in /tmp (or OS temporary directory) as fallback
const DATA_FILE = path.join(
  process.env.TMPDIR || process.env.TEMP || '/tmp',
  'mc_scholarship_applications.json'
);

// Global in-memory cache to guarantee persistence across warm serverless/node instances
declare global {
  var __MC_APPLICATIONS_CACHE__: ScholarshipApplication[] | undefined;
}

function loadFallbackApplications(): ScholarshipApplication[] {
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

function saveFallbackApplications(apps: ScholarshipApplication[]): void {
  global.__MC_APPLICATIONS_CACHE__ = apps;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(apps, null, 2), 'utf8');
  } catch (err) {
    console.warn('[API Applications] Could not write to DATA_FILE:', err);
  }
}

// --------------------------------------------------------------------------
// GET: Return all submitted applications (Protected: Committee only)
// --------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  // Restrict access to authenticated committee members only
  if (!isAuthorizedCommittee(req)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unauthorized: Committee authentication required.',
        applications: [],
      },
      { status: 401 }
    );
  }

  try {
    const collection = await getApplicationsCollection();
    if (collection) {
      const docs = await collection
        .find({}, { projection: { _id: 0 } })
        .sort({ submittedAt: -1 })
        .toArray();

      return NextResponse.json(
        {
          success: true,
          source: 'mongodb',
          count: docs.length,
          applications: docs,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }
  } catch (err) {
    console.warn('[API Applications GET] MongoDB query failed, falling back to local cache:', err);
  }

  const apps = loadFallbackApplications();
  return NextResponse.json(
    {
      success: true,
      source: 'local-fallback',
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
    const collection = await getApplicationsCollection();

    // Case 1: Bulk array of applications
    if (body && Array.isArray(body.applications)) {
      const incoming: ScholarshipApplication[] = body.applications;

      if (collection) {
        try {
          for (const app of incoming) {
            if (app && app.id) {
              await collection.updateOne(
                { id: app.id },
                { $set: app },
                { upsert: true }
              );
            }
          }

          const docs = await collection
            .find({}, { projection: { _id: 0 } })
            .sort({ submittedAt: -1 })
            .toArray();

          saveFallbackApplications(docs);

          return NextResponse.json({
            success: true,
            source: 'mongodb',
            count: docs.length,
            applications: docs,
          });
        } catch (dbErr) {
          console.warn('[API Applications POST] MongoDB bulk write error, using fallback:', dbErr);
        }
      }

      // Fallback merge
      const currentApps = loadFallbackApplications();
      const map = new Map<string, ScholarshipApplication>();

      for (const app of currentApps) {
        if (app && app.id) map.set(app.id, app);
      }
      for (const app of incoming) {
        if (app && app.id) map.set(app.id, app);
      }

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      );

      saveFallbackApplications(merged);

      return NextResponse.json({
        success: true,
        source: 'local-fallback',
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

    if (collection) {
      try {
        await collection.updateOne(
          { id: newApp.id },
          { $set: newApp },
          { upsert: true }
        );

        const docs = await collection
          .find({}, { projection: { _id: 0 } })
          .sort({ submittedAt: -1 })
          .toArray();

        saveFallbackApplications(docs);

        return NextResponse.json({
          success: true,
          source: 'mongodb',
          count: docs.length,
          application: newApp,
          applications: docs,
        });
      } catch (dbErr) {
        console.warn('[API Applications POST] MongoDB single write error, using fallback:', dbErr);
      }
    }

    // Fallback single write
    const currentApps = loadFallbackApplications();
    const filtered = currentApps.filter(
      (a) => a.id !== newApp.id && a.applicationNumber !== newApp.applicationNumber
    );
    const updated = [newApp, ...filtered];

    saveFallbackApplications(updated);

    return NextResponse.json({
      success: true,
      source: 'local-fallback',
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
// PUT: Update committee review status, reviewer score, or notes (Protected)
// --------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  if (!isAuthorizedCommittee(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Committee authentication required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { applicationId, review } = body;

    if (!applicationId || !review) {
      return NextResponse.json(
        { success: false, message: 'Missing applicationId or review data' },
        { status: 400 }
      );
    }

    const reviewedAt = new Date().toISOString();
    const collection = await getApplicationsCollection();

    if (collection) {
      try {
        const existing = await collection.findOne({ id: applicationId });
        if (existing) {
          const mergedReview = {
            ...(existing.committeeReview || {}),
            ...review,
            reviewedAt,
          };

          await collection.updateOne(
            { id: applicationId },
            { $set: { committeeReview: mergedReview } }
          );

          const docs = await collection
            .find({}, { projection: { _id: 0 } })
            .sort({ submittedAt: -1 })
            .toArray();

          saveFallbackApplications(docs);

          return NextResponse.json({
            success: true,
            source: 'mongodb',
            applications: docs,
          });
        }
      } catch (dbErr) {
        console.warn('[API Applications PUT] MongoDB update error, using fallback:', dbErr);
      }
    }

    // Fallback update
    const currentApps = loadFallbackApplications();
    const updated = currentApps.map((app) => {
      if (app.id === applicationId) {
        return {
          ...app,
          committeeReview: {
            ...app.committeeReview,
            ...review,
            reviewedAt,
          },
        };
      }
      return app;
    });

    saveFallbackApplications(updated);

    return NextResponse.json({
      success: true,
      source: 'local-fallback',
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
// DELETE: Delete an application (Protected)
// --------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  if (!isAuthorizedCommittee(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Committee authentication required.' },
      { status: 401 }
    );
  }

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

    const collection = await getApplicationsCollection();

    if (collection) {
      try {
        await collection.deleteOne({ id: applicationId });

        const docs = await collection
          .find({}, { projection: { _id: 0 } })
          .sort({ submittedAt: -1 })
          .toArray();

        saveFallbackApplications(docs);

        return NextResponse.json({
          success: true,
          source: 'mongodb',
          count: docs.length,
          applications: docs,
        });
      } catch (dbErr) {
        console.warn('[API Applications DELETE] MongoDB delete error, using fallback:', dbErr);
      }
    }

    // Fallback delete
    const currentApps = loadFallbackApplications();
    const updated = currentApps.filter((a) => a.id !== applicationId);

    saveFallbackApplications(updated);

    return NextResponse.json({
      success: true,
      source: 'local-fallback',
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
