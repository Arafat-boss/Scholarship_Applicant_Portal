import { NextRequest, NextResponse } from 'next/server';
import { generateScholarshipJsPdf } from '@/lib/pdfExport';
import { ScholarshipApplication } from '@/types/scholarship';

export async function POST(req: NextRequest) {
  try {
    let applications: ScholarshipApplication[] = [];

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const rawApps = formData.get('applications');
      if (typeof rawApps === 'string') {
        applications = JSON.parse(rawApps);
      }
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      applications = body.applications || [];
    }

    if (!Array.isArray(applications) || applications.length === 0) {
      return NextResponse.json(
        { error: 'No applications provided to export.' },
        { status: 400 }
      );
    }

    const { doc, fileName } = generateScholarshipJsPdf(applications);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating PDF in /api/pdf:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF dossier.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('id');

    let applications: ScholarshipApplication[] = [];

    // Fetch from Google Sheet webhook if available
    const webhookUrl =
      process.env.GOOGLE_SHEET_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL;

    if (webhookUrl) {
      try {
        const res = await fetch(`${webhookUrl}?action=fetch`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (data && data.success && Array.isArray(data.applications)) {
          applications = data.applications;
        }
      } catch (err) {
        console.warn('Could not fetch from Google Sheet in /api/pdf:', err);
      }
    }

    if (targetId && applications.length > 0) {
      const filtered = applications.filter(
        (a) => a.id === targetId || a.applicationNumber === targetId
      );
      if (filtered.length > 0) {
        applications = filtered;
      }
    }

    if (applications.length === 0) {
      return new Response(
        `<!DOCTYPE html><html><body style="background:#090d16;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;padding:24px;"><h2>No Applications Found</h2><p style="color:#94a3b8;">No applications are currently stored or available for this ID.</p></div></body></html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    const { doc, fileName } = generateScholarshipJsPdf(applications);
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating PDF in GET /api/pdf:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF.' },
      { status: 500 }
    );
  }
}
