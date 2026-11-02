/**
 * Utility for dynamic scholarship cycle dates and years.
 * Automatically computes all academic years, checklist titles, and deadlines
 * based on the current calendar year, eliminating the need to manually update them every year.
 */

export interface ScholarshipDateConfig {
  currentYear: number;
  previousYear: number;
  academicYear: string;         // e.g. "2025–2026" or "2026–2027"
  transcriptDate: string;       // e.g. "January 2026" or "January 2027"
  transcriptSemesterShort: string; // e.g. "Jan 2026" or "Jan 2027"
  notificationDate: string;     // e.g. "May 1, 2026" or "May 1, 2027"
  gpaAsOfDate: string;          // e.g. "1/31/2026" or "1/31/2027"
  disbursementDate: string;     // e.g. "August 15, 2026" or "August 15, 2027"
  collegeTerm: string;          // e.g. "Fall 2026" or "Fall 2027"
  checklistTitle: string;       // e.g. "Scholarship Requirements and Checklist 2026"
  applicationHeader: string;    // e.g. "SCHOLARSHIP APPLICATION – 2026"
}

export function getScholarshipDates(targetYear?: number): ScholarshipDateConfig {
  const currentYear = targetYear ?? new Date().getFullYear();
  const previousYear = currentYear - 1;

  return {
    currentYear,
    previousYear,
    academicYear: `${previousYear}–${currentYear}`,
    transcriptDate: `January ${currentYear}`,
    transcriptSemesterShort: `Jan ${currentYear}`,
    notificationDate: `May 1, ${currentYear}`,
    gpaAsOfDate: `1/31/${currentYear}`,
    disbursementDate: `August 15, ${currentYear}`,
    collegeTerm: `Fall ${currentYear}`,
    checklistTitle: `Scholarship Requirements and Checklist ${currentYear}`,
    applicationHeader: `SCHOLARSHIP APPLICATION – ${currentYear}`,
  };
}

