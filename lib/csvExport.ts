import { ScholarshipApplication } from '@/types/scholarship';

export function convertApplicationsToCSV(applications: ScholarshipApplication[]): string {
  const headers = [
    'Application ID',
    'Submission Date',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Street Address',
    'City',
    'State',
    'Zip',
    'High School',
    'GPA',
    'Siblings',
    'Immediate Family Count',
    'Family in College',
    'Activities Count',
    'Volunteer Hours',
    'Colleges Applied',
    'Accepted Colleges',
    'Transcript Uploaded',
    'SAR Uploaded',
    'Recommendation Letters Count',
    'AI Rubric Score (out of 50)',
    'AI Rating Tier',
    'AI Criteria 1 (GPA)',
    'AI Criteria 2 (Need)',
    'AI Criteria 3 (Leadership)',
    'AI Criteria 4 (Service)',
    'AI Criteria 5 (Work)',
    'AI Criteria 6 (College)',
    'AI Criteria 7 (Recs)',
    'AI Criteria 8 (Transcript)',
    'AI Criteria 9 (Mission)',
    'AI Criteria 10 (Completeness)',
    'Committee Score (out of 50)',
    'Committee Status',
    'Reviewer Name',
    'Committee Notes',
  ];

  const escapeCSV = (str: string | number | undefined | null): string => {
    if (str === undefined || str === null) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows = applications.map((app) => {
    const totalVolunteerHours = app.communityService.reduce(
      (sum, cs) => sum + (parseFloat(cs.totalHours) || 0),
      0
    );
    const collegesList = app.colleges.map((c) => `${c.college} (${c.status})`).join('; ');
    const acceptedCount = app.colleges.filter((c) => c.status === 'accepted').length;

    const cMap = new Map(app.aiScoring.criteria.map((c) => [c.id, c.score]));

    return [
      escapeCSV(app.applicationNumber),
      escapeCSV(new Date(app.submittedAt).toLocaleDateString()),
      escapeCSV(app.applicant.firstName),
      escapeCSV(app.applicant.lastName),
      escapeCSV(app.applicant.email),
      escapeCSV(app.applicant.telephone),
      escapeCSV(app.applicant.streetAddress),
      escapeCSV(app.applicant.city),
      escapeCSV(app.applicant.state),
      escapeCSV(app.applicant.zip),
      escapeCSV(app.schoolFamily.currentHighSchool),
      escapeCSV(app.schoolFamily.gpa),
      escapeCSV(app.schoolFamily.numberOfSiblings),
      escapeCSV(app.schoolFamily.immediateFamilyMembers),
      escapeCSV(app.schoolFamily.familyMembersInCollege),
      escapeCSV(app.activities.length),
      escapeCSV(totalVolunteerHours),
      escapeCSV(collegesList),
      escapeCSV(acceptedCount),
      escapeCSV(app.documents.transcript ? 'Yes' : 'No'),
      escapeCSV(app.documents.studentAidReport ? 'Yes' : 'No'),
      escapeCSV(app.documents.recommendationLetters.length),
      escapeCSV(app.aiScoring.totalScore),
      escapeCSV(app.aiScoring.ratingCategory),
      escapeCSV(cMap.get('c1') ?? 0),
      escapeCSV(cMap.get('c2') ?? 0),
      escapeCSV(cMap.get('c3') ?? 0),
      escapeCSV(cMap.get('c4') ?? 0),
      escapeCSV(cMap.get('c5') ?? 0),
      escapeCSV(cMap.get('c6') ?? 0),
      escapeCSV(cMap.get('c7') ?? 0),
      escapeCSV(cMap.get('c8') ?? 0),
      escapeCSV(cMap.get('c9') ?? 0),
      escapeCSV(cMap.get('c10') ?? 0),
      escapeCSV(app.committeeReview.reviewerScore ?? 'Pending'),
      escapeCSV(app.committeeReview.status),
      escapeCSV(app.committeeReview.reviewerName || 'N/A'),
      escapeCSV(app.committeeReview.committeeNotes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

export function isInsideIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    // Cross-origin access restriction indicates an embedded iframe
    return true;
  }
}

export async function copyCSVToClipboard(csvContent: string): Promise<boolean> {
  // 1. Try modern Async Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(csvContent);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText blocked in iframe, trying execCommand fallback:', err);
    }
  }

  // 2. Fallback using temporary textarea (works inside restricted iframes and older browsers)
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = csvContent;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0.01';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      if (document.body.contains(textArea)) {
        document.body.removeChild(textArea);
      }
      return successful;
    } catch (err) {
      console.error('execCommand copy failed:', err);
      return false;
    }
  }

  return false;
}

export function downloadCSV(csvContent: string, fileName = 'Monday_Club_Scholarship_Applications.csv'): boolean {
  try {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1000);
    return true;
  } catch (err) {
    console.error('Blob download failed:', err);
    return false;
  }
}

