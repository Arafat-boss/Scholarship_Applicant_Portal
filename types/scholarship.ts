export interface ClubActivity {
  id: string;
  activity: string;
  role: string;
  years: string;
}

export interface CommunityService {
  id: string;
  organization: string;
  description: string;
  totalHours: string;
}

export interface EmploymentHistory {
  id: string;
  employer: string;
  position: string;
  dates: string;
}

export interface CollegePlan {
  id: string;
  college: string;
  cityState: string;
  status: 'applied' | 'accepted' | 'waiting';
}

export interface UploadedDocument {
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  url?: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  category: string;
  score: number; // 0 to 5
  maxScore: 5;
  reasoning: string;
}

export interface AIScoringResult {
  totalScore: number; // 0 to 50
  maxScore: 50;
  ratingCategory: 'Exceptional' | 'High Merit' | 'Recommended' | 'Competitive' | 'Needs Review';
  summary: string;
  strengths: string[];
  flags: string[];
  criteria: RubricCriterion[];
  scoredAt: string;
}

export interface CommitteeReview {
  reviewerScore?: number; // 0 to 50 (human override)
  status: 'Under Review' | 'Shortlisted' | 'Approved' | 'Waitlisted' | 'Rejected';
  reviewerName?: string;
  committeeNotes?: string;
  reviewedAt?: string;
}

export interface ScholarshipApplication {
  id: string;
  applicationNumber: string; // e.g. "MC-2026-001"
  submittedAt: string;

  // 1. Scholarship Requirements & Checklist (Official 2026 Sheet - 10 Items)
  eligibility: {
    isDelawareSenior: boolean; // #1: DE senior attending high school & 4-year college/university admission
    isEligibleDescent: boolean; // #2: African American, Hispanic or Native American descent
    isTypedLegibly?: boolean; // #3: Application typed or printed legibly
    isRecLettersSubmitted?: boolean; // #4: 3 recommendation letters (2 non-relatives) in sealed envelope
    isMinGpa: boolean; // #5: GPA >= 2.75 on 4.00 scale & Jan 2026 official transcript
    isEssayAcknowledged?: boolean; // #6: Essay submission (min 200 words, community, activities, 10-yr goals)
    isSarAcknowledged?: boolean; // #7: Submission of Student Aid Report (SAR) if available
    isInterviewAgreed?: boolean; // #8: Virtual interview participation with Monday Club committee
    isWinnerNotificationUnderstood?: boolean; // #9: Winners notified by May 1, 2026 & materials property of Club
    isContactAndMailingAcknowledged?: boolean; // #10: Questions contact Mr. Ken Snell & mailing instructions
  };

  // 2. Applicant
  applicant: {
    firstName: string;
    middleName?: string;
    lastName: string;
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
    telephone: string;
    sex?: 'F' | 'M' | 'Other' | string;
    email: string;
    dateOfBirth: string;
  };

  // 3. Parent / Guardian
  parentGuardian: {
    fullName: string;
    phone: string;
    email: string;
  };

  // 4. School & Family
  schoolFamily: {
    currentHighSchool: string;
    gpa: string; // Grade Point Average (as of 1/31/2026)
    numberOfSiblings: string;
    immediateFamilyMembers: string; // including yourself
    familyMembersInCollege: string; // attending college/university 2025-2026
  };

  // 5. Activities, work & colleges
  activities: ClubActivity[];
  communityService: CommunityService[];
  employment: EmploymentHistory[];
  colleges: CollegePlan[];

  // 6. Referral Source (How did you find out about this scholarship?)
  referral?: {
    sources: string[]; // High School, Church, Personal Friend, Another Organization, Parent/Guardian, Family/Friend, Recreation/Community Center, Member of THE MONDAY CLUB
    mondayClubMemberName?: string;
  };

  // 7. Essay Submission (minimum 200 words)
  essay?: {
    text: string;
    wordCount: number;
    document?: UploadedDocument;
  };

  // 8. Documents
  documents: {
    transcript?: UploadedDocument;
    studentAidReport?: UploadedDocument;
    recommendationLetters: UploadedDocument[];
    extraDocuments: UploadedDocument[];
  };

  // 9. Certification & Signatures
  certification: {
    isInfoAccurate: boolean;
    rulesAcknowledged?: boolean;
    applicantSignature: string;
    applicantSignatureDate?: string;
    parentGrantsPermission: boolean;
    parentSignature?: string;
    parentSignatureDate?: string;
  };

  // AI & Review
  aiScoring: AIScoringResult;
  committeeReview: CommitteeReview;
}
