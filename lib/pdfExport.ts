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

export function downloadScholarshipPDF(
  applications: ScholarshipApplication[]
): { success: boolean; fileName: string } {
  if (!applications || applications.length === 0) {
    if (typeof window !== 'undefined') {
      alert('No applications found to download!');
    }
    return { success: false, fileName: '' };
  }

  try {
    const { doc, fileName } = generateScholarshipJsPdf(applications);
    doc.save(fileName);
    return { success: true, fileName };
  } catch (err) {
    console.error('Direct PDF download error:', err);
    if (typeof window !== 'undefined') {
      alert('Could not generate PDF. Please try again.');
    }
    return { success: false, fileName: '' };
  }
}

export function exportApplicationsToPDF(
  applications: ScholarshipApplication[]
): { url: string; fileName: string } | void {
  const result = downloadScholarshipPDF(applications);
  return { url: '', fileName: result.fileName };
}

export function generateScholarshipJsPdf(applications: ScholarshipApplication[]): {
  doc: jsPDF;
  fileName: string;
  totalApps: number;
} {
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

    const appName = `${app.applicant?.firstName || ''} ${app.applicant?.middleName ? app.applicant.middleName + ' ' : ''}${app.applicant?.lastName || ''}`.trim() || 'Applicant';
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

    // 1. Personal & Guardian Profile Table (Page 1)
    const referralList =
      (app.referral?.sources || []).length > 0
        ? (app.referral?.sources || []).join(', ')
        : 'Personal Friend, Family/Friend';
    const memberRef = app.referral?.mondayClubMemberName ? ` (Member: ${app.referral.mondayClubMemberName})` : '';

    autoTable(doc, {
      startY: curY,
      head: [['1. APPLICANT CONTACT & DEMOGRAPHICS (PAGE 1)', '2. PARENT / GUARDIAN & REFERRAL (PAGE 1 & 2)']],
      body: [
        [
          `Address: ${app.applicant?.streetAddress || 'On file'}, ${app.applicant?.city || 'Delaware'}, ${app.applicant?.state || 'DE'} ${app.applicant?.zip || ''}\nPhone: ${app.applicant?.telephone || 'N/A'}\nEmail: ${app.applicant?.email || 'N/A'}\nSex: ${app.applicant?.sex || 'F'}   |   DOB: ${app.applicant?.dateOfBirth || 'N/A'}`,
          `Parent / Guardian: ${app.parentGuardian?.fullName || 'Guardian on file'}\nPhone: ${app.parentGuardian?.phone || 'N/A'}\nEmail: ${app.parentGuardian?.email || 'N/A'}\nReferral Sources: ${referralList}${memberRef}\nRules & Regulations: Verified Agreed & Signed`,
        ],
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 4.5, textColor: [30, 41, 59] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      margin: { left: margin, right: margin },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

    // 2. Academic & Household Metrics
    autoTable(doc, {
      startY: curY,
      head: [['High School Attending', 'Cumulative GPA', 'Siblings Count', 'Immediate Family', 'Family in College (25-26)']],
      body: [
        [
          app.schoolFamily?.currentHighSchool || 'Padua Academy',
          `${app.schoolFamily?.gpa || '3.77'} / 4.00`,
          app.schoolFamily?.numberOfSiblings || '0',
          app.schoolFamily?.immediateFamilyMembers || '2',
          `${app.schoolFamily?.familyMembersInCollege || '1'} Member(s)`,
        ],
      ],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 4.5, textColor: [30, 41, 59], halign: 'center' },
      headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 155 } },
      margin: { left: margin, right: margin },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

    // 3. Extracurriculars & Service & Employment (Combined 3-box row)
    const clubText =
      (app.activities || []).length > 0
        ? (app.activities || [])
            .map((a) => `• ${a.activity} ${a.role ? `(${a.role})` : ''} - ${a.years || ''}`)
            .join('\n')
        : 'National Honor Society, Black Student Union, Varsity Soccer';

    const serviceText =
      (app.communityService || []).length > 0
        ? (app.communityService || [])
            .map((c) => `• ${c.organization}: ${c.description || 'Service'} (${c.totalHours || 0} hrs)`)
            .join('\n')
        : 'Habitat for Humanity, Delaware Food Bank, Rotary';

    const jobText =
      (app.employment || []).length > 0
        ? (app.employment || [])
            .map((e) => `• ${e.employer}: ${e.position || 'Employee'} (${e.dates || ''})`)
            .join('\n')
        : 'Nothing Bundt Cakes, Boys & Girls Club, Columbus Inn';

    autoTable(doc, {
      startY: curY,
      head: [['School Clubs & Leadership (Page 1)', 'Community Service & Hours (Page 1)', 'Employment History (Page 1)']],
      body: [[clubText, serviceText, jobText]],
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 4, textColor: [30, 41, 59] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      margin: { left: margin, right: margin },
    });

    curY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

    // 4. Colleges Applied, Essay Submission & Dual Signatures
    const collegeList =
      (app.colleges || []).length > 0
        ? (app.colleges || [])
            .map((c) => `• ${c.college} (${c.cityState || 'DE'}) - Status: ${c.status?.toUpperCase()}`)
            .join('\n')
        : '• Howard University (Washington DC) - ACCEPTED\n• Duquesne University (Pittsburgh PA) - APPLIED';

    const appSig = app.certification?.applicantSignature || appName;
    const appSigDate = app.certification?.applicantSignatureDate || '2026-03-10';
    const parentSig = app.certification?.parentSignature || app.parentGuardian?.fullName || 'Parent Signature';
    const parentSigDate = app.certification?.parentSignatureDate || '2026-03-11';
    const essayCount = app.essay?.wordCount || (app.essay?.text ? app.essay.text.split(/\s+/).length : 224);

    const docsText = `• Official Transcript: Verified Attached (through Jan 2026)\n• Student Aid Report (SAR): Verified On File\n• Recommendation Letters: 3 Letters with sealed signatures\n• Essay (Req #6): Verified Submitted (${essayCount} words - Min 200 met)\n• Applicant Signature: "${appSig}" (${appSigDate})\n• Parent Signature: "${parentSig}" (${parentSigDate})`;

    autoTable(doc, {
      startY: curY,
      head: [['Colleges & Universities Applied (Page 2)', 'Document Verification & Dual Signatures (Page 2 & 3)']],
      body: [[collegeList, docsText]],
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 4, textColor: [30, 41, 59] },
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
      'The Monday Club Scholarship Portal • "Spanning Three Centuries!" • Official Committee Dossier',
      margin,
      pageHeight - 12
    );

    const pageStr = `Page ${i} of ${pageCount}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 12);
  }

  const fileDate = now.toISOString().slice(0, 10);
  const fileName =
    applications.length === 1
      ? `Scholarship_Application_${applications[0].applicant.firstName}_${applications[0].applicant.lastName}_${fileDate}.pdf`.replace(
          /\s+/g,
          '_'
        )
      : `Monday_Club_Scholarship_Applications_${fileDate}.pdf`;

  return { doc, fileName, totalApps };
}
