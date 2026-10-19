import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_SHEET_URL, DEFAULT_WEBHOOK_URL } from '@/lib/googleSheet';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const webhookUrl =
    process.env.GOOGLE_SHEET_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_GOOGLE_SHEET_WEBHOOK_URL ||
    DEFAULT_WEBHOOK_URL;

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
