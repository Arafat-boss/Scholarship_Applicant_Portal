import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_SHEET_URL,
  GOOGLE_SHEET_ID,
  DEFAULT_WEBHOOK_URL,
  parseGoogleSheetCsv,
} from '@/lib/googleSheet';
import fs from 'fs';
import path from 'path';

async function fetchFromWebhookOrCsv(webhookUrl: string) {
  // 1. Try POST action fetchAll
  if (webhookUrl && webhookUrl.startsWith('http')) {
    try {
      const postRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetchAll' }),
        redirect: 'follow',
      });
      const postData = await postRes.json().catch(() => null);
      if (postData && Array.isArray(postData.applications)) {
        return { source: 'webhook-post', applications: postData.applications };
      }
    } catch {
      // ignore
    }

    // 2. Try GET to Webhook
    try {
      const getRes = await fetch(webhookUrl, {
        method: 'GET',
        redirect: 'follow',
      });
      const getData = await getRes.json().catch(() => null);
      if (getData && Array.isArray(getData.applications)) {
        return { source: 'webhook-get', applications: getData.applications };
      }
    } catch {
      // ignore
    }
  }

  // 3. Try direct Google Sheet CSV export (if link sharing is enabled)
  try {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;
    const csvRes = await fetch(csvUrl, { redirect: 'follow' });
    if (csvRes.status === 200 && csvRes.headers.get('content-type')?.includes('text')) {
      const csvText = await csvRes.text();
      const parsed = parseGoogleSheetCsv(csvText);
      if (parsed.length > 0) {
        return { source: 'google-sheet-csv', applications: parsed };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export async function GET(req: NextRequest) {
  const webhookUrl =
    process.env.GOOGLE_SHEET_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL ||
    DEFAULT_WEBHOOK_URL;

  const action = req.nextUrl.searchParams.get('action');

  if (action === 'fetch' || action === 'fetchAll' || action === 'getApplications') {
    const fetched = await fetchFromWebhookOrCsv(webhookUrl);
    if (fetched) {
      return NextResponse.json({
        success: true,
        source: fetched.source,
        count: fetched.applications.length,
        applications: fetched.applications,
      });
    }

    return NextResponse.json({
      success: false,
      message:
        'Could not fetch applications from Google Sheet. Please ensure the Apps Script code is updated or Google Sheet link sharing is enabled.',
    });
  }

  return NextResponse.json({
    configured: Boolean(webhookUrl && webhookUrl.startsWith('http')),
    webhookUrl,
    sheetUrl: GOOGLE_SHEET_URL,
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    // Handle Saving Webhook URL permanently to .env.local
    if (body.action === 'saveWebhook') {
      const newUrl = typeof body.webhookUrl === 'string' ? body.webhookUrl.trim() : '';
      const envPath = path.join(process.cwd(), '.env.local');

      try {
        let existingContent = '';
        if (fs.existsSync(envPath)) {
          existingContent = fs.readFileSync(envPath, 'utf8');
        }

        // Replace or append GOOGLE_SHEET_WEBHOOK_URL
        if (existingContent.includes('GOOGLE_SHEET_WEBHOOK_URL=')) {
          existingContent = existingContent.replace(
            /GOOGLE_SHEET_WEBHOOK_URL=.*/,
            `GOOGLE_SHEET_WEBHOOK_URL=${newUrl}`
          );
        } else {
          existingContent += `\nGOOGLE_SHEET_WEBHOOK_URL=${newUrl}\n`;
        }

        fs.writeFileSync(envPath, existingContent.trim() + '\n', 'utf8');
        process.env.GOOGLE_SHEET_WEBHOOK_URL = newUrl;
        process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL = newUrl;

        console.log('[GoogleSheet API] Webhook URL permanently saved to .env.local');
        return NextResponse.json({
          success: true,
          message: 'Google Apps Script Webhook URL permanently saved to .env.local!',
          webhookUrl: newUrl,
        });
      } catch (fileErr) {
        console.error('Error saving to .env.local:', fileErr);
        process.env.GOOGLE_SHEET_WEBHOOK_URL = newUrl;
        return NextResponse.json({
          success: true,
          message: 'Saved to memory session.',
          webhookUrl: newUrl,
        });
      }
    }

    const rawWebhook = typeof body.webhookUrl === 'string' ? body.webhookUrl.trim() : '';
    const webhookUrl: string =
      rawWebhook ||
      process.env.GOOGLE_SHEET_WEBHOOK_URL ||
      process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL ||
      DEFAULT_WEBHOOK_URL;

    console.log(
      '[GoogleSheet API] Action:',
      body.action,
      '| Webhook configured:',
      Boolean(webhookUrl && webhookUrl.startsWith('http'))
    );

    // Handle fetch / fetchAll live records from Google Sheet
    if (body.action === 'fetchAll' || body.action === 'fetch' || body.action === 'get') {
      const fetched = await fetchFromWebhookOrCsv(webhookUrl);
      if (fetched) {
        return NextResponse.json({
          success: true,
          webhookConfigured: true,
          source: fetched.source,
          count: fetched.applications.length,
          applications: fetched.applications,
        });
      }

      return NextResponse.json({
        success: false,
        webhookConfigured: Boolean(webhookUrl && webhookUrl.startsWith('http')),
        message:
          'Could not fetch applications from Google Sheet. Deploy the updated Apps Script code in your Google Sheet to enable live reading.',
      });
    }

    // If webhook URL is configured, forward to Google Apps Script
    if (webhookUrl && webhookUrl.startsWith('http')) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          redirect: 'follow',
        });

        const result = await response.json().catch(() => null);

        // If Apps Script returned applications array
        if (result && Array.isArray(result.applications)) {
          return NextResponse.json({
            success: true,
            webhookConfigured: true,
            source: 'webhook',
            count: result.applications.length,
            applications: result.applications,
          });
        }

        return NextResponse.json({
          success: true,
          webhookConfigured: true,
          sheetUrl: GOOGLE_SHEET_URL,
          result: result || { message: 'Processed by Google Apps Script' },
        });
      } catch (forwardErr) {
        console.error('Error forwarding to Google Apps Script webhook:', forwardErr);
        return NextResponse.json(
          {
            success: false,
            webhookConfigured: true,
            sheetUrl: GOOGLE_SHEET_URL,
            error:
              'Google Apps Script webhook call failed. Check your Web App URL and permissions (Who has access must be set to "Anyone").',
          },
          { status: 502 }
        );
      }
    }

    // If webhook URL is not yet connected
    return NextResponse.json({
      success: false,
      webhookConfigured: false,
      sheetUrl: GOOGLE_SHEET_URL,
      action: body.action,
      message:
        'Google Sheet Webhook URL is not configured yet! Please deploy the Google Apps Script in your sheet and save the URL.',
    });
  } catch (error) {
    console.error('Google Sheet API Route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process Google Sheet request',
      },
      { status: 500 }
    );
  }
}
