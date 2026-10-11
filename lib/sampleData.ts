import { ScholarshipApplication } from '@/types/scholarship';
import { evaluateApplicationWithAI } from './aiScoring';

const rawSample1 = {
  id: 'app-001',
  applicationNumber: 'MC-2026-001',
  submittedAt: '2026-02-14T14:32:00.000Z',
  eligibility: {
    isDelawareSenior: true,
    isEligibleDescent: true,
    isMinGpa: true,
  },
  applicant: {
    firstName: 'Maya',
    lastName: 'Jenkins',
    streetAddress: '142 North State Street',
    city: 'Dover',
    state: 'DE',
    zip: '19901',
    telephone: '(302) 555-0184',
    email: 'maya.jenkins@students.k12.de.us',
    dateOfBirth: '2008-04-12',
  },
  parentGuardian: {
    fullName: 'Evelyn Jenkins',
    phone: '(302) 555-0199',
    email: 'evelyn.jenkins@gmail.com',
  },
  schoolFamily: {
    currentHighSchool: 'Caesar Rodney High School',
    gpa: '3.92',
    numberOfSiblings: '3',
    immediateFamilyMembers: '5',
    familyMembersInCollege: '2',
  },
  activities: [
    { id: 'act-1', activity: 'National Honor Society', role: 'Vice President', years: '10-12' },
    { id: 'act-2', activity: 'Black Student Union', role: 'President & Founder', years: '11-12' },
    { id: 'act-3', activity: 'STEM Academic Bowl Team', role: 'Lead Captain', years: '9-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Dover Interfaith Community Shelter', description: 'Weekend meal distribution & reading program coordinator', totalHours: '75' },
    { id: 'cs-2', organization: 'Bethel AME Church Youth Ministry', description: 'Sunday School peer tutor and event planner', totalHours: '45' },
  ],
  employment: [
    { id: 'emp-1', organization: 'Dover Public Library', employer: 'Dover Public Library', position: 'Student Assistant & Archive Aide', dates: 'June 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Howard University', cityState: 'Washington, DC', status: 'accepted' as const },
    { id: 'col-3', college: 'University of Delaware', cityState: 'Newark, DE', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'Official_Transcript_Maya_Jenkins.pdf', size: 2450000, type: 'application/pdf', uploadedAt: '2026-02-14T14:28:00.000Z' },
    studentAidReport: { name: 'SAR_Report_2026_FAFSA.pdf', size: 1200000, type: 'application/pdf', uploadedAt: '2026-02-14T14:29:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_AP_Chem_Teacher_Mr_Harris.pdf', size: 450000, type: 'application/pdf', uploadedAt: '2026-02-14T14:30:00.000Z' },
      { name: 'Letter_2_Guidance_Counselor_Dr_Patel.pdf', size: 520000, type: 'application/pdf', uploadedAt: '2026-02-14T14:30:30.000Z' },
      { name: 'Letter_3_Shelter_Director_Rev_Collins.pdf', size: 480000, type: 'application/pdf', uploadedAt: '2026-02-14T14:31:00.000Z' },
    ],
    extraDocuments: [
      { name: 'Delaware_State_Science_Fair_Award.pdf', size: 890000, type: 'application/pdf', uploadedAt: '2026-02-14T14:31:30.000Z' },
    ],
  },
  certification: {
    isInfoAccurate: true,
    parentGrantsPermission: true,
    applicantSignature: 'Maya Lynn Jenkins',
  },
};

const rawSample2 = {
  id: 'app-002',
  applicationNumber: 'MC-2026-002',
  submittedAt: '2026-02-18T10:15:00.000Z',
  eligibility: {
    isDelawareSenior: true,
    isEligibleDescent: true,
    isMinGpa: true,
  },
  applicant: {
    firstName: 'Marcus',
    lastName: 'Washington',
    streetAddress: '708 Vandever Avenue',
    city: 'Wilmington',
    state: 'DE',
    zip: '19802',
    telephone: '(302) 555-0421',
    email: 'm.washington@nccvt.k12.de.us',
    dateOfBirth: '2007-11-20',
  },
  parentGuardian: {
    fullName: 'Derrick Washington',
    phone: '(302) 555-0422',
    email: 'dwashington@verizon.net',
  },
  schoolFamily: {
    currentHighSchool: 'Howard High School of Technology',
    gpa: '3.52',
    numberOfSiblings: '2',
    immediateFamilyMembers: '4',
    familyMembersInCollege: '1',
  },
  activities: [
    { id: 'act-1', activity: 'SkillsUSA Career & Tech', role: 'Team Captain', years: '11-12' },
    { id: 'act-2', activity: 'Robotics & Automation Club', role: 'Hardware Lead', years: '10-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Urban League of Delaware', description: 'Computer lab mentor for senior citizens and middle schoolers', totalHours: '60' },
  ],
  employment: [
    { id: 'emp-1', organization: 'Walgreens Pharmacy', employer: 'Walgreens Pharmacy', position: 'Customer Service & Inventory Clerk', dates: 'Sept 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Morgan State University', cityState: 'Baltimore, MD', status: 'waiting' as const },
  ],
  documents: {
    transcript: { name: 'Howard_Tech_Transcript_Marcus_W.pdf', size: 1980000, type: 'application/pdf', uploadedAt: '2026-02-18T10:10:00.000Z' },
    studentAidReport: { name: 'SAR_FAFSA_Marcus_Washington.pdf', size: 1100000, type: 'application/pdf', uploadedAt: '2026-02-18T10:11:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_Vocational_Dept_Chair.pdf', size: 410000, type: 'application/pdf', uploadedAt: '2026-02-18T10:12:00.000Z' },
      { name: 'Letter_2_Work_Supervisor_Walgreens.pdf', size: 390000, type: 'application/pdf', uploadedAt: '2026-02-18T10:13:00.000Z' },
      { name: 'Letter_3_Howard_Tech_Principal.pdf', size: 470000, type: 'application/pdf', uploadedAt: '2026-02-18T10:14:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: {
    isInfoAccurate: true,
    parentGrantsPermission: true,
    applicantSignature: 'Marcus T. Washington',
  },
};

const rawSample3 = {
  id: 'app-003',
  applicationNumber: 'MC-2026-003',
  submittedAt: '2026-02-21T16:45:00.000Z',
  eligibility: {
    isDelawareSenior: true,
    isEligibleDescent: true,
    isMinGpa: true,
  },
  applicant: {
    firstName: 'Sofia',
    lastName: 'Hernandez',
    streetAddress: '2301 Lancaster Avenue',
    city: 'Wilmington',
    state: 'DE',
    zip: '19805',
    telephone: '(302) 555-0879',
    email: 'sofia.hernandez@redclay.k12.de.us',
    dateOfBirth: '2008-01-19',
  },
  parentGuardian: {
    fullName: 'Maria Hernandez',
    phone: '(302) 555-0880',
    email: 'mhernandez@latinode.org',
  },
  schoolFamily: {
    currentHighSchool: 'Cab Calloway School of the Arts',
    gpa: '3.78',
    numberOfSiblings: '4',
    immediateFamilyMembers: '6',
    familyMembersInCollege: '1',
  },
  activities: [
    { id: 'act-1', activity: 'Model United Nations', role: 'Committee Chair', years: '10-12' },
    { id: 'act-2', activity: 'Hispanic Heritage Student Caucus', role: 'President', years: '11-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Latin American Community Center (LACC)', description: 'Bilingual ESL tutor & citizenship workshop aide', totalHours: '90' },
  ],
  employment: [
    { id: 'emp-1', organization: 'Local Family Bakery', employer: 'Panaderia San Jose', position: 'Weekend Cashier & Barista', dates: 'Jan 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'University of Delaware', cityState: 'Newark, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'Cab_Calloway_Transcript_Sofia_H.pdf', size: 2100000, type: 'application/pdf', uploadedAt: '2026-02-21T16:40:00.000Z' },
    studentAidReport: { name: 'SAR_Summary_Sofia_Hernandez.pdf', size: 980000, type: 'application/pdf', uploadedAt: '2026-02-21T16:41:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_Spanish_Dept_Head.pdf', size: 450000, type: 'application/pdf', uploadedAt: '2026-02-21T16:42:00.000Z' },
      { name: 'Letter_2_LACC_Executive_Director.pdf', size: 520000, type: 'application/pdf', uploadedAt: '2026-02-21T16:43:00.000Z' },
      { name: 'Letter_3_AP_Literature_Teacher.pdf', size: 430000, type: 'application/pdf', uploadedAt: '2026-02-21T16:44:00.000Z' },
    ],
    extraDocuments: [
      { name: 'Delaware_Governors_School_Diploma.pdf', size: 750000, type: 'application/pdf', uploadedAt: '2026-02-21T16:44:30.000Z' },
    ],
  },
  certification: {
    isInfoAccurate: true,
    parentGrantsPermission: true,
    applicantSignature: 'Sofia Elena Hernandez',
  },
};

export const sampleApplications: ScholarshipApplication[] = [
  {
    ...rawSample1,
    aiScoring: evaluateApplicationWithAI(rawSample1),
    committeeReview: {
      status: 'Approved',
      reviewerScore: 48,
      reviewerName: 'Dr. James H. Sills Committee',
      committeeNotes: 'Unanimous selection. Stellar GPA, deeply committed to Delaware community, verified 3.92 GPA and SAR confirms financial need.',
      reviewedAt: '2026-02-16T11:00:00.000Z',
    },
  },
  {
    ...rawSample2,
    aiScoring: evaluateApplicationWithAI(rawSample2),
    committeeReview: {
      status: 'Shortlisted',
      reviewerScore: 42,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Very strong candidate from Howard Tech. Working while maintaining 3.52 GPA in vocational robotics. Solid fit.',
      reviewedAt: '2026-02-19T14:20:00.000Z',
    },
  },
  {
    ...rawSample3,
    aiScoring: evaluateApplicationWithAI(rawSample3),
    committeeReview: {
      status: 'Shortlisted',
      reviewerScore: 45,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Exemplary service hours at LACC (90 hours) and great bilingual mentorship. Excellent candidate for DSU / UD scholarship.',
      reviewedAt: '2026-02-22T09:30:00.000Z',
    },
  },
];
