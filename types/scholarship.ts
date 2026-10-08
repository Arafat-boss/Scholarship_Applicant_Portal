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

  // 1. Eligibility
  eligibility: {
    isDelawareSenior: boolean;
    isEligibleDescent: boolean;
    isMinGpa: boolean;
  };

  // 2. Applicant
  applicant: {
    firstName: string;
    lastName: string;
    streetAddress: string;
    city: string;
    state: string;
    zip: string;
    telephone: string;
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
    gpa: string; // e.g. "3.85"
    numberOfSiblings: string;
    immediateFamilyMembers: string;
    familyMembersInCollege: string;
  };

  // 5. Activities, work & colleges
  activities: ClubActivity[];
  communityService: CommunityService[];
  employment: EmploymentHistory[];
  colleges: CollegePlan[];

  // 6 & 7. Documents
  documents: {
    transcript?: UploadedDocument;
    studentAidReport?: UploadedDocument;
    recommendationLetters: UploadedDocument[];
    extraDocuments: UploadedDocument[];
  };

  // 8. Certification
  certification: {
    isInfoAccurate: boolean;
    parentGrantsPermission: boolean;
    applicantSignature: string;
  };

  // AI & Review
  aiScoring: AIScoringResult;
  committeeReview: CommitteeReview;
}
