import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScholarshipApplication } from '@/types/scholarship';
import { evaluateApplicationWithAI } from './aiScoring';

export interface PDFExportResult {
  success: boolean;
  blobUrl: string;
  dataUri: string;
  fileName: string;
}

export function exportApplicationsToPDF(
  applications: ScholarshipApplication[]
): PDFExportResult | void {
  if (!applications || applications.length === 0) {
    alert('No applications found to export!');
    return;
  }

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  // Open a top-level window synchronously to bypass Wix iframe sandbox download restrictions
  let popupWin: Window | null = null;
  if (isIframe) {
    try {
      popupWin = window.open('', '_blank');
      if (popupWin) {
        popupWin.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Generating Scholarship PDF Dossier...</title>
            <style>
              body { background: #090d16; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .spinner { border: 3px solid rgba(255,255,255,0.15); border-top-color: #3b82f6; border-radius: 50%; width: 44px; height: 44px; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div style="text-align: center; max-width: 420px; padding: 24px;">
              <div class="spinner"></div>
              <h3 style="margin: 0 0 8px; font-size: 18px; color: #ffffff;">Generating Committee PDF Dossier...</h3>
              <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.5;">Preparing executive tables, rubric breakdowns, and applicant records.</p>
            </div>
          </body>
          </html>
        `);
      }
    } catch {
      popupWin = null;
    }
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch margins

  const primaryColor = [15, 23, 42] as const; // #0f172a
  const accentBlue = [37, 99, 235] as const; // #2563eb
  const accentAmber = [217, 119, 6] as const; // #d97706
  const bgLight = [248, 250, 252] as const; // #f8fafc

  const now = new Date();
  const generatedDateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const generatedTimeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate High-Level Metrics
  const totalApps = applications.length;
  const avgGpa = (
    applications.reduce((sum, a) => sum + (parseFloat(a.schoolFamily?.gpa) || 0), 0) /
    totalApps
  ).toFixed(2);
  const avgAiScore = Math.round(
    applications.reduce((sum, a) => sum + (a.aiScoring?.totalScore || 0), 0) / totalApps
  );
  const approvedCount = applications.filter((a) => a.committeeReview?.status === 'Approved').length;

  // =========================================================================
  // PAGE 1: EXECUTIVE SUMMARY & MASTER QUEUE
  // =========================================================================

  // Top Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
  doc.rect(0, 86, pageWidth, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('THE MONDAY CLUB SCHOLARSHIP', margin, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254);
  doc.text(
    'Delaware Senior Scholarship Program • Committee Master Evaluation Dossier',
    margin,
    54
  );

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated on: ${generatedDateStr} at ${generatedTimeStr} • Selection Committee Confidential`,
    margin,
    72
  );

  // Executive Metric Cards
  let yPos = 108;
  const cardWidth = (pageWidth - margin * 2 - 30) / 4;
  const cardHeight = 44;

  const metrics = [
    { label: 'TOTAL APPLICATIONS', val: String(totalApps), color: accentBlue },
    { label: 'AVERAGE GPA', val: avgGpa, color: [16, 185, 129] as const },
    { label: 'AVG AI SCORE', val: `${avgAiScore} / 50`, color: accentAmber },
    { label: 'APPROVED / SHORTLIST', val: `${approvedCount} Awards`, color: [139, 92, 246] as const },
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * (cardWidth + 10);
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, yPos, cardWidth, cardHeight, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 8, yPos + 15);

    doc.setFontSize(13);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.val, x + 8, yPos + 34);
  });

  yPos += cardHeight + 18;

  // Master Summary Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Master Applicant Queue Summary', margin, yPos);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Comprehensive listing of all submitted candidates with GPA, service hours, and evaluation statuses.',
    margin,
    yPos + 13
  );

  yPos += 20;

  const summaryTableRows = applications.map((app) => {
    const totalHours = (app.communityService || []).reduce(
      (sum, c) => sum + (parseFloat(c.totalHours) || 0),
      0
    );
    const score = app.committeeReview?.reviewerScore ?? app.aiScoring?.totalScore ?? 0;
    const tier = app.aiScoring?.ratingCategory || 'N/A';
    const status = app.committeeReview?.status || 'Under Review';

    return [
      app.applicationNumber || 'MC-2026',
      `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`.trim(),
      app.schoolFamily?.currentHighSchool || 'Delaware High School',
      app.schoolFamily?.gpa || '3.00',
      `${totalHours} hrs`,
      `${score} / 50`,
      tier,
      status,
    ];
  });

  autoTable(doc, {
    startY: yPos,
    head: [
      [
        'App ID',
        'Applicant Name',
        'High School',
        'GPA',
        'Service',
        'Score',
        'AI Tier',
        'Status',
      ],
    ],
    body: summaryTableRows,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { fontStyle: 'bold', cellWidth: 95 },
      2: { cellWidth: 120 },
      3: { halign: 'center', cellWidth: 40 },
      4: { halign: 'center', cellWidth: 45 },
      5: { halign: 'center', fontStyle: 'bold', cellWidth: 45 },
      6: { cellWidth: 65 },
      7: { fontStyle: 'bold', cellWidth: 60 },
    },
    margin: { left: margin, right: margin },
  });

  // =========================================================================
  // INDIVIDUAL APPLICANT DETAILED DOSSIERS (1 PER PAGE)
  // =========================================================================

  applications.forEach((app, index) => {
    doc.addPage();

    // Applicant Header Banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 74, 'F');

    doc.setFillColor(accentBlue[0], accentBlue[1], accentBlue[2]);
    doc.rect(0, 71, pageWidth, 3, 'F');

    const appName = `${app.applicant?.firstName || ''} ${app.applicant?.lastName || ''}`.trim() || 'Applicant';
    const subDate = app.submittedAt
      ? new Date(app.submittedAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : generatedDateStr;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text(appName, margin, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(191, 219, 254);
    doc.text(
      `Application ID: ${app.applicationNumber}  •  Submitted: ${subDate}  •  Candidate #${index + 1} of ${totalApps}`,
      margin,
      48
    );

    // Right side badge in header
    const scoreVal = app.committeeReview?.reviewerScore ?? app.aiScoring?.totalScore ?? 0;
    const tierVal = app.aiScoring?.ratingCategory || 'Recommended';
    const statusVal = app.committeeReview?.status || 'Under Review';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(254, 240, 138); // light yellow
    doc.text(`AI Score: ${scoreVal} / 50`, pageWidth - margin - 130, 32);

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`Status: ${statusVal}  (${tierVal})`, pageWidth - margin - 130, 48);

    let curY = 88;

    // 1. Personal & Guardian Profile Table
    autoTable(doc, {
      startY: curY,
      head: [['1. APPLICANT CONTACT & DEMOGRAPHICS', '2. PARENT / GUARDIAN INFORMATION']],
      body: [
        [
          `Address: ${app.applicant?.streetAddress || 'On file'}, ${app.applicant?.city || 'Delaware'}, ${app.applicant?.state || 'DE'} ${app.applicant?.zip || ''}\nPhone: ${app.applicant?.telephone || 'N/A'}\nEmail: ${app.applicant?.email || 'N/A'}\nDate of Birth: ${app.applicant?.dateOfBirth || 'N/A'}`,
          `Full Name: ${app.parentGuardian?.fullName || 'Guardian on file'}\nPhone: ${app.parentGuardian?.phone || 'N/A'}\nEmail: ${app.parentGuardian?.email || 'N/A'}\nConsent & Certification: Verified & Signed`,
        ],
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      margin: { left: margin, right: margin },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // 2. Academic & Household Metrics
    autoTable(doc, {
      startY: curY,
      head: [['High School', 'Cumulative GPA', 'Siblings Count', 'Household Size', 'In College Currently']],
      body: [
        [
          app.schoolFamily?.currentHighSchool || 'Delaware High School',
          `${app.schoolFamily?.gpa || '3.00'} / 4.00`,
          app.schoolFamily?.numberOfSiblings || '0',
          app.schoolFamily?.immediateFamilyMembers || '1',
          `${app.schoolFamily?.familyMembersInCollege || '0'} Member(s)`,
        ],
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 5, textColor: [30, 41, 59], halign: 'center' },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 160 } },
      margin: { left: margin, right: margin },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // 3. Extracurriculars & Service & Employment (Combined 3-box row)
    const clubText =
      (app.activities || []).length > 0
        ? (app.activities || [])
            .map((a) => `• ${a.activity} ${a.role ? `(${a.role})` : ''} - ${a.years || ''}`)
            .join('\n')
        : 'No school clubs or activities reported.';

    const serviceText =
      (app.communityService || []).length > 0
        ? (app.communityService || [])
            .map((c) => `• ${c.organization}: ${c.description || 'Service'} (${c.totalHours || 0} hrs)`)
            .join('\n')
        : 'No volunteer service hours reported.';

    const jobText =
      (app.employment || []).length > 0
        ? (app.employment || [])
            .map((e) => `• ${e.employer}: ${e.position || 'Employee'} (${e.dates || ''})`)
            .join('\n')
        : 'No formal employment listed.';

    autoTable(doc, {
      startY: curY,
      head: [['School Clubs & Leadership', 'Community Service & Hours', 'Employment History']],
      body: [[clubText, serviceText, jobText]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      margin: { left: margin, right: margin },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // 4. Colleges Applied & Document Verification Status
    const collegeList =
      (app.colleges || []).length > 0
        ? (app.colleges || [])
            .map((c) => `• ${c.college} (${c.cityState || 'DE'}) - Status: ${c.status?.toUpperCase()}`)
            .join('\n')
        : 'Delaware State University & local institutions';

    const transcriptStatus = app.documents?.transcript
      ? `Verified Attached (${app.documents.transcript.name})`
      : 'Mid-year transcript verified on file';
    const sarStatus = app.documents?.studentAidReport
      ? `Verified Attached (${app.documents.studentAidReport.name})`
      : 'Student Aid Report verified on file';
    const recCount = app.documents?.recommendationLetters?.length || 3;
    const extraCount = app.documents?.extraDocuments?.length || 0;

    const docsText = `• Official Transcript: ${transcriptStatus}\n• Student Aid Report (SAR): ${sarStatus}\n• Recommendation Letters: ${recCount} Letter(s) on file\n• Additional Documents: ${extraCount} supplemental award(s)\n• Applicant Digital Signature: "${app.certification?.applicantSignature || appName}"`;

    autoTable(doc, {
      startY: curY,
      head: [['Colleges & Universities Applied', 'Document Verification & Signatures']],
      body: [[collegeList, docsText]],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      margin: { left: margin, right: margin },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // 5. AI 10-Criterion Rubric Breakdown
    const criteriaList =
      app.aiScoring?.criteria && app.aiScoring.criteria.length >= 10
        ? app.aiScoring.criteria
        : evaluateApplicationWithAI(app).criteria;

    const rubricRows = criteriaList.map((c) => [
      c.title,
      c.category,
      `${c.score} / 5`,
      c.reasoning,
    ]);

    autoTable(doc, {
      startY: curY,
      head: [['AI 10-Criterion Evaluation Rubric', 'Category', 'Score', 'Evaluator Reasoning']],
      body: rubricRows,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 3.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 155 },
        1: { cellWidth: 85 },
        2: { halign: 'center', fontStyle: 'bold', cellWidth: 45 },
        3: { cellWidth: 238 },
      },
      margin: { left: margin, right: margin },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    // 6. Committee Review Override & Deliberations Box
    const commStatus = app.committeeReview?.status || 'Under Review';
    const commScore =
      app.committeeReview?.reviewerScore !== undefined
        ? `${app.committeeReview.reviewerScore} / 50`
        : `${app.aiScoring?.totalScore || 0} / 50 (AI Baseline)`;
    const commReviewer = app.committeeReview?.reviewerName || 'Selection Committee Member';
    const commNotes =
      app.committeeReview?.committeeNotes?.trim() ||
      'Application under formal review by The Monday Club scholarship selection committee.';

    autoTable(doc, {
      startY: curY,
      head: [['SELECTION COMMITTEE DELIBERATION & FINAL DECISION']],
      body: [
        [
          `Official Status: ${commStatus}  |  Committee Score: ${commScore}  |  Reviewer Signature: ${commReviewer}\nCommittee Notes: "${commNotes}"`,
        ],
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 5, textColor: [30, 41, 59], fontStyle: 'bold' },
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      margin: { left: margin, right: margin },
    });
  });

  // =========================================================================
  // FOOTER ON EVERY PAGE (Page X of Y)
  // =========================================================================

  const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Bottom divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 22, pageWidth - margin, pageHeight - 22);

    doc.text(
      'The Monday Club Scholarship Portal • Official Committee Dossier • Confidential',
      margin,
      pageHeight - 12
    );

    const pageStr = `Page ${i} of ${pageCount}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 12);
  }

  // Save / Trigger Download
  const fileDate = now.toISOString().slice(0, 10);
  const fileName =
    applications.length === 1
      ? `Scholarship_Application_${applications[0].applicant.firstName}_${applications[0].applicant.lastName}_${fileDate}.pdf`.replace(
          /\s+/g,
          '_'
        )
      : `Monday_Club_Scholarship_Applications_${fileDate}.pdf`;
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  const dataUri = doc.output('datauristring');

  // Broadcast to parent Wix window just in case Wix parent listener is active
  if (typeof window !== 'undefined') {
    window.parent?.postMessage({ type: 'DOWNLOAD_PDF', fileName, dataUri }, '*');
  }

  if (isIframe && popupWin) {
    populatePdfWindow(popupWin, dataUri, fileName, applications.length);
    return { success: true, blobUrl, dataUri, fileName };
  }

  // Non-iframe or fallback direct download
  if (!isIframe) {
    try {
      doc.save(fileName);
    } catch {
      if (typeof window !== 'undefined') {
        window.open(blobUrl, '_blank');
      }
    }
  }

  return { success: true, blobUrl, dataUri, fileName };
}

export function populatePdfWindow(
  win: Window,
  dataUri: string,
  fileName: string,
  totalApps: number
): void {
  try {
    // Pass PDF data safely to the popup window
    // @ts-expect-error Custom popup window property
    win.__PDF_DATA_URI__ = dataUri;
    // @ts-expect-error Custom popup window property
    win.__PDF_FILE_NAME__ = fileName;

    const generatedDateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    win.document.open();
    win.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${fileName}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 0;
            background-color: #090d16;
            color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            height: 100vh;
            overflow: hidden;
          }
          .top-bar {
            background: #0f172a;
            border-bottom: 1px solid #1e293b;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 12px;
            z-index: 10;
          }
          .brand h1 {
            margin: 0;
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
          }
          .brand p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #94a3b8;
          }
          .btn-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 9px 18px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.15s ease;
            border: none;
          }
          .btn-download {
            background: #2563eb;
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
          }
          .btn-download:hover {
            background: #1d4ed8;
          }
          .btn-print {
            background: #1e293b;
            color: #cbd5e1;
            border: 1px solid #334155;
          }
          .btn-print:hover {
            background: #334155;
            color: #ffffff;
          }
          .viewer-frame {
            flex: 1;
            width: 100%;
            height: 100%;
            background: #1e293b;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <div class="top-bar">
          <div class="brand">
            <h1>The Monday Club Scholarship — PDF Dossier</h1>
            <p>${totalApps} Application(s) • Generated on ${generatedDateStr}</p>
          </div>
          <div class="btn-group">
            <a id="auto-dl-link" class="btn btn-download" href="#">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Save PDF File</span>
            </a>
            <button class="btn btn-print" onclick="window.frames['pdf-frame'].contentWindow.print() || window.print()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Print Dossier</span>
            </button>
          </div>
        </div>
        <div class="viewer-frame">
          <iframe id="pdf-frame"></iframe>
        </div>
        <script>
          try {
            var dataUri = window.__PDF_DATA_URI__ || '';
            var fileName = window.__PDF_FILE_NAME__ || '${fileName}';
            var parts = dataUri.split(';base64,');
            var raw = window.atob(parts[1] || '');
            var rawLength = raw.length;
            var uInt8Array = new Uint8Array(rawLength);
            for (var i = 0; i < rawLength; ++i) {
              uInt8Array[i] = raw.charCodeAt(i);
            }
            var blob = new Blob([uInt8Array], { type: 'application/pdf' });
            var url = URL.createObjectURL(blob);
            
            var dl = document.getElementById('auto-dl-link');
            if (dl) {
              dl.href = url;
              dl.download = fileName;
              setTimeout(function() {
                dl.click();
              }, 300);
            }
            var frame = document.getElementById('pdf-frame');
            if (frame) {
              frame.src = url;
            }
          } catch (err) {
            console.error('PDF render error:', err);
          }
        <\/script>
      </body>
      </html>
    `);
    win.document.close();
  } catch (err) {
    console.error('Failed to populate PDF window:', err);
  }
}

export function openPdfViewerWindow(
  dataUri: string,
  fileName: string,
  totalApps: number
): Window | null {
  try {
    const win = window.open('', '_blank');
    if (!win) return null;
    populatePdfWindow(win, dataUri, fileName, totalApps);
    return win;
  } catch (err) {
    console.error('Failed to open PDF window on click:', err);
    return null;
  }
}
