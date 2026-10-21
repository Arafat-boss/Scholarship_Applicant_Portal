import { NextRequest, NextResponse } from 'next/server';
import { sampleApplications } from '@/lib/sampleData';
import { convertApplicationsToCSV } from '@/lib/csvExport';

export async function GET(req: NextRequest) {
  try {
    const csvData = convertApplicationsToCSV(sampleApplications);
    const fileName = `Monday_Club_Scholarship_Applications_${new Date().toISOString().split('T')[0]}.csv`;
    const isRaw = req.nextUrl.searchParams.get('raw') === 'true';

    // If explicit raw download requested
    if (isRaw) {
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Standalone Interactive Download Page (Never shows a blank screen!)
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Download CSV - The Monday Club Scholarship</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 32px;
      max-width: 540px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-block;
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
      border: 1px solid rgba(59, 130, 246, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 14px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      margin: 0 0 8px 0;
      color: #ffffff;
    }
    p {
      color: #94a3b8;
      font-size: 13px;
      margin: 0 0 22px 0;
      line-height: 1.5;
    }
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      box-sizing: border-box;
      margin-bottom: 12px;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    .btn-secondary:hover {
      background: #334155;
      color: #ffffff;
    }
    .preview {
      background: #0b1120;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 12px;
      font-family: monospace;
      font-size: 11px;
      color: #64748b;
      max-height: 120px;
      overflow-y: auto;
      text-align: left;
      white-space: pre-wrap;
      word-break: break-all;
      margin-top: 16px;
    }
    .toast {
      display: none;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 10px;
      border-radius: 8px;
      font-size: 12px;
      margin-bottom: 12px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">The Monday Club &bull; Review Committee</div>
    <h1>Application CSV Export</h1>
    <p>Your scholarship applicant data and 10-criterion AI scores are compiled and ready.</p>
    
    <div id="toast" class="toast">✓ Copied to clipboard! Open Excel or Google Sheets and press Ctrl+V.</div>

    <a id="downloadBtn" href="data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}" download="${fileName}" class="btn btn-primary">
      <span>📥 Download CSV File</span>
    </a>
    
    <button onclick="copyData()" class="btn btn-secondary">
      <span>📋 Copy to Clipboard (For Excel / Google Sheets)</span>
    </button>
    
    <div class="preview">${csvData.slice(0, 320)}...</div>
  </div>

  <script>
    // Trigger download automatically
    window.addEventListener('DOMContentLoaded', () => {
      try {
        const btn = document.getElementById('downloadBtn');
        if (btn) btn.click();
      } catch (e) {
        console.warn('Auto-click thwarted:', e);
      }
    });

    function copyData() {
      const raw = ${JSON.stringify(csvData)};
      navigator.clipboard.writeText(raw).then(() => {
        const toast = document.getElementById('toast');
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 5000);
      });
    }
  </script>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'digest' in error &&
      typeof (error as { digest?: string }).digest === 'string' &&
      (error as { digest: string }).digest.startsWith('NEXT_')
    ) {
      throw error;
    }
    console.error('CSV Export Error:', error);
    return NextResponse.json({ error: 'Failed to generate CSV export' }, { status: 500 });
  }
}
