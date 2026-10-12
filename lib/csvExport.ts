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

export function downloadCSV(csvContent: string, fileName = 'Monday_Club_Scholarship_Applications.csv'): boolean {
  try {
    // 1. Data URI method (works best across modern iframes and avoids blob URL origin mismatch)
    const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 500);
    return true;
  } catch (err) {
    console.warn('Data URI download failed, trying Blob method:', err);
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 500);
      return true;
    } catch (e) {
      console.error('All client download methods failed:', e);
      return false;
    }
  }
}
