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
    { id: 'emp-1', employer: 'Dover Public Library', position: 'Student Assistant & Archive Aide', dates: 'June 2024 - Present' },
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
    { id: 'emp-1', employer: 'Walgreens Pharmacy', position: 'Customer Service & Inventory Clerk', dates: 'Sept 2024 - Present' },
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
    { id: 'emp-1', employer: 'Panaderia San Jose', position: 'Weekend Cashier & Barista', dates: 'Jan 2024 - Present' },
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

const rawSample4 = {
  id: 'app-004',
  applicationNumber: 'MC-2026-004',
  submittedAt: '2026-02-22T11:20:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Jordan',
    lastName: 'Taylor',
    streetAddress: '450 West 4th Street',
    city: 'Wilmington',
    state: 'DE',
    zip: '19801',
    telephone: '(302) 555-0392',
    email: 'jordan.taylor@redclay.k12.de.us',
    dateOfBirth: '2008-03-25',
  },
  parentGuardian: {
    fullName: 'Patricia Taylor',
    phone: '(302) 555-0393',
    email: 'ptaylor@comcast.net',
  },
  schoolFamily: {
    currentHighSchool: 'William Penn High School',
    gpa: '3.84',
    numberOfSiblings: '2',
    immediateFamilyMembers: '4',
    familyMembersInCollege: '1',
  },
  activities: [
    { id: 'act-1', activity: 'National Technical Honor Society', role: 'President', years: '11-12' },
    { id: 'act-2', activity: 'Black Youth Leadership Council', role: 'Ambassador', years: '10-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Kingswood Community Center', description: 'Youth STEM mentor & after-school tutor', totalHours: '85' },
    { id: 'cs-2', organization: 'Sunday Breakfast Mission', description: 'Food pantry packaging volunteer', totalHours: '30' },
  ],
  employment: [
    { id: 'emp-1', employer: 'CVS Health Wilmington', position: 'Pharmacy Tech Assistant', dates: 'June 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'University of Delaware', cityState: 'Newark, DE', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'Official_Transcript_Jordan_Taylor_2026.pdf', size: 2150000, type: 'application/pdf', uploadedAt: '2026-02-22T11:15:00.000Z' },
    studentAidReport: { name: 'Student_Aid_Report_2026_FAFSA.pdf', size: 1120000, type: 'application/pdf', uploadedAt: '2026-02-22T11:16:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_AP_Biology_Teacher.pdf', size: 450000, type: 'application/pdf', uploadedAt: '2026-02-22T11:17:00.000Z' },
      { name: 'Letter_Kingswood_Director.pdf', size: 380000, type: 'application/pdf', uploadedAt: '2026-02-22T11:18:00.000Z' },
      { name: 'Letter_Counselor_Recommendation.pdf', size: 420000, type: 'application/pdf', uploadedAt: '2026-02-22T11:19:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Jordan Taylor' },
};

const rawSample5 = {
  id: 'app-005',
  applicationNumber: 'MC-2026-005',
  submittedAt: '2026-02-23T14:10:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Aaliyah',
    lastName: 'Brooks',
    streetAddress: '512 Governors Avenue',
    city: 'Dover',
    state: 'DE',
    zip: '19904',
    telephone: '(302) 555-0711',
    email: 'aaliyah.brooks@capital.k12.de.us',
    dateOfBirth: '2008-05-14',
  },
  parentGuardian: {
    fullName: 'Robert & Cheryl Brooks',
    phone: '(302) 555-0712',
    email: 'cbrooks@yahoo.com',
  },
  schoolFamily: {
    currentHighSchool: 'Dover High School',
    gpa: '3.65',
    numberOfSiblings: '1',
    immediateFamilyMembers: '3',
    familyMembersInCollege: '1',
  },
  activities: [
    { id: 'act-1', activity: 'Future Business Leaders of America', role: 'Vice President', years: '10-12' },
    { id: 'act-2', activity: 'Dover High Debate Team', role: 'Varsity Debater', years: '11-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Modern Maturity Center', description: 'Senior wellness companion and dining assistant', totalHours: '65' },
  ],
  employment: [
    { id: 'emp-1', employer: 'Chick-fil-A North Dover', position: 'Team Leader', dates: 'Aug 2023 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Hampton University', cityState: 'Hampton, VA', status: 'waiting' as const },
  ],
  documents: {
    transcript: { name: 'Dover_High_Transcript_Aaliyah_B.pdf', size: 1850000, type: 'application/pdf', uploadedAt: '2026-02-23T14:05:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Aaliyah_Brooks.pdf', size: 920000, type: 'application/pdf', uploadedAt: '2026-02-23T14:06:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_FBLA_Advisor.pdf', size: 410000, type: 'application/pdf', uploadedAt: '2026-02-23T14:07:00.000Z' },
      { name: 'Letter_2_English_Dept_Head.pdf', size: 440000, type: 'application/pdf', uploadedAt: '2026-02-23T14:08:00.000Z' },
      { name: 'Letter_3_Pastor_Johnson.pdf', size: 390000, type: 'application/pdf', uploadedAt: '2026-02-23T14:09:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Aaliyah Danielle Brooks' },
};

const rawSample6 = {
  id: 'app-006',
  applicationNumber: 'MC-2026-006',
  submittedAt: '2026-02-24T09:30:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Elijah',
    lastName: 'Bennett',
    streetAddress: '104 Broadmeadow Drive',
    city: 'Middletown',
    state: 'DE',
    zip: '19709',
    telephone: '(302) 555-0932',
    email: 'elijah.bennett@nccvt.k12.de.us',
    dateOfBirth: '2007-09-30',
  },
  parentGuardian: {
    fullName: 'Sandra Bennett',
    phone: '(302) 555-0933',
    email: 'sbennett@aol.com',
  },
  schoolFamily: {
    currentHighSchool: 'St. Georges Technical High School',
    gpa: '3.48',
    numberOfSiblings: '3',
    immediateFamilyMembers: '5',
    familyMembersInCollege: '0',
  },
  activities: [
    { id: 'act-1', activity: 'Athletic Council', role: 'Varsity Track Captain', years: '9-12' },
    { id: 'act-2', activity: 'Automotive Technology Guild', role: 'Member', years: '10-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Middletown Volunteer Fire Dept', description: 'Junior cadet and community safety educator', totalHours: '55' },
  ],
  employment: [
    { id: 'emp-1', employer: 'AutoZone Middletown', position: 'Parts Sales Specialist', dates: 'Feb 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Delaware Technical Community College', cityState: 'Stanton, DE', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'St_Georges_Transcript_Elijah_B.pdf', size: 1950000, type: 'application/pdf', uploadedAt: '2026-02-24T09:20:00.000Z' },
    studentAidReport: { name: 'SAR_FAFSA_Elijah_Bennett.pdf', size: 890000, type: 'application/pdf', uploadedAt: '2026-02-24T09:21:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_Auto_Tech_Instructor.pdf', size: 420000, type: 'application/pdf', uploadedAt: '2026-02-24T09:22:00.000Z' },
      { name: 'Letter_2_Track_Coach_Williams.pdf', size: 450000, type: 'application/pdf', uploadedAt: '2026-02-24T09:23:00.000Z' },
      { name: 'Letter_3_Fire_Captain_Miller.pdf', size: 430000, type: 'application/pdf', uploadedAt: '2026-02-24T09:24:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Elijah Marcus Bennett' },
};

const rawSample7 = {
  id: 'app-007',
  applicationNumber: 'MC-2026-007',
  submittedAt: '2026-02-25T13:45:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Destiny',
    lastName: 'Robinson',
    streetAddress: '1903 North Market Street',
    city: 'Wilmington',
    state: 'DE',
    zip: '19802',
    telephone: '(302) 555-0644',
    email: 'destiny.robinson@bsd.k12.de.us',
    dateOfBirth: '2008-02-08',
  },
  parentGuardian: {
    fullName: 'Monique Robinson',
    phone: '(302) 555-0645',
    email: 'mrobinson@comcast.net',
  },
  schoolFamily: {
    currentHighSchool: 'Mount Pleasant High School',
    gpa: '3.95',
    numberOfSiblings: '2',
    immediateFamilyMembers: '4',
    familyMembersInCollege: '2',
  },
  activities: [
    { id: 'act-1', activity: 'International Baccalaureate Student Committee', role: 'President', years: '11-12' },
    { id: 'act-2', activity: 'Black Excellence Youth League', role: 'Secretary', years: '10-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Wilmington Public Library Homework Help', description: 'Elementary mathematics and literacy tutor', totalHours: '110' },
  ],
  employment: [
    { id: 'emp-1', employer: 'Barnes & Noble Wilmington', position: 'Bookseller & Children’s Storytime Lead', dates: 'June 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Howard University', cityState: 'Washington, DC', status: 'accepted' as const },
    { id: 'col-3', college: 'Spelman College', cityState: 'Atlanta, GA', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'Mount_Pleasant_IB_Transcript_Destiny_R.pdf', size: 2600000, type: 'application/pdf', uploadedAt: '2026-02-25T13:38:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Destiny_Robinson.pdf', size: 1150000, type: 'application/pdf', uploadedAt: '2026-02-25T13:39:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_IB_Coordinator.pdf', size: 480000, type: 'application/pdf', uploadedAt: '2026-02-25T13:40:00.000Z' },
      { name: 'Letter_2_Library_Branch_Manager.pdf', size: 510000, type: 'application/pdf', uploadedAt: '2026-02-25T13:41:00.000Z' },
      { name: 'Letter_3_AP_Calc_Teacher.pdf', size: 460000, type: 'application/pdf', uploadedAt: '2026-02-25T13:42:00.000Z' },
    ],
    extraDocuments: [{ name: 'National_Merit_Commendation.pdf', size: 620000, type: 'application/pdf', uploadedAt: '2026-02-25T13:43:00.000Z' }],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Destiny Nicole Robinson' },
};

const rawSample8 = {
  id: 'app-008',
  applicationNumber: 'MC-2026-008',
  submittedAt: '2026-02-26T15:00:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Mateo',
    lastName: 'Morales',
    streetAddress: '314 Academy Street',
    city: 'Newark',
    state: 'DE',
    zip: '19711',
    telephone: '(302) 555-0819',
    email: 'mateo.morales@csd.k12.de.us',
    dateOfBirth: '2007-12-11',
  },
  parentGuardian: {
    fullName: 'Carlos Morales',
    phone: '(302) 555-0820',
    email: 'cmorales@gmail.com',
  },
  schoolFamily: {
    currentHighSchool: 'Newark High School',
    gpa: '3.25',
    numberOfSiblings: '3',
    immediateFamilyMembers: '5',
    familyMembersInCollege: '1',
  },
  activities: [
    { id: 'act-1', activity: 'Hispanic Student Union', role: 'Treasurer', years: '11-12' },
    { id: 'act-2', activity: 'Varsity Soccer', role: 'Midfielder', years: '9-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Newark Area Welfare Committee', description: 'Food pantry organization & holiday gift distribution', totalHours: '35' },
  ],
  employment: [
    { id: 'emp-1', employer: 'Newark Natural Foods', position: 'Store Associate', dates: 'Oct 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'University of Delaware', cityState: 'Newark, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Delaware State University', cityState: 'Dover, DE', status: 'waiting' as const },
  ],
  documents: {
    transcript: { name: 'Newark_High_Transcript_Mateo_M.pdf', size: 1750000, type: 'application/pdf', uploadedAt: '2026-02-26T14:50:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Mateo_Morales.pdf', size: 850000, type: 'application/pdf', uploadedAt: '2026-02-26T14:51:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_Soccer_Coach.pdf', size: 390000, type: 'application/pdf', uploadedAt: '2026-02-26T14:52:00.000Z' },
      { name: 'Letter_2_History_Teacher.pdf', size: 410000, type: 'application/pdf', uploadedAt: '2026-02-26T14:53:00.000Z' },
      { name: 'Letter_3_Store_Manager.pdf', size: 370000, type: 'application/pdf', uploadedAt: '2026-02-26T14:54:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Mateo Morales' },
};

const rawSample9 = {
  id: 'app-009',
  applicationNumber: 'MC-2026-009',
  submittedAt: '2026-02-27T10:30:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Kendra',
    lastName: 'Washington',
    streetAddress: '208 Market Street',
    city: 'Georgetown',
    state: 'DE',
    zip: '19947',
    telephone: '(302) 555-0955',
    email: 'kendra.washington@irsd.k12.de.us',
    dateOfBirth: '2008-04-03',
  },
  parentGuardian: {
    fullName: 'Denise Washington',
    phone: '(302) 555-0956',
    email: 'denise.wash@verizon.net',
  },
  schoolFamily: {
    currentHighSchool: 'Sussex Central High School',
    gpa: '3.72',
    numberOfSiblings: '2',
    immediateFamilyMembers: '4',
    familyMembersInCollege: '1',
  },
  activities: [
    { id: 'act-1', activity: 'FFA (Future Farmers of America)', role: 'Chapter Secretary', years: '10-12' },
    { id: 'act-2', activity: 'National Honor Society', role: 'Member', years: '11-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Georgetown Boys & Girls Club', description: 'After-school reading buddy & sports coach', totalHours: '70' },
  ],
  employment: [
    { id: 'emp-1', employer: 'Redner’s Warehouse Markets', position: 'Cashier & Front End Lead', dates: 'May 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'North Carolina A&T State University', cityState: 'Greensboro, NC', status: 'waiting' as const },
  ],
  documents: {
    transcript: { name: 'Sussex_Central_Transcript_Kendra_W.pdf', size: 1920000, type: 'application/pdf', uploadedAt: '2026-02-27T10:20:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Kendra_Washington.pdf', size: 970000, type: 'application/pdf', uploadedAt: '2026-02-27T10:21:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_FFA_Advisor.pdf', size: 430000, type: 'application/pdf', uploadedAt: '2026-02-27T10:22:00.000Z' },
      { name: 'Letter_2_Guidance_Counselor.pdf', size: 460000, type: 'application/pdf', uploadedAt: '2026-02-27T10:23:00.000Z' },
      { name: 'Letter_3_Boys_Girls_Club_Director.pdf', size: 410000, type: 'application/pdf', uploadedAt: '2026-02-27T10:24:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Kendra Washington' },
};

const rawSample10 = {
  id: 'app-010',
  applicationNumber: 'MC-2026-010',
  submittedAt: '2026-02-28T09:15:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Tariq',
    lastName: 'Jackson',
    streetAddress: '75 South Main Street',
    city: 'Smyrna',
    state: 'DE',
    zip: '19977',
    telephone: '(302) 555-0318',
    email: 'tariq.jackson@smyrna.k12.de.us',
    dateOfBirth: '2008-06-22',
  },
  parentGuardian: {
    fullName: 'Marcus Jackson',
    phone: '(302) 555-0319',
    email: 'mjackson@smyrnalogistics.com',
  },
  schoolFamily: {
    currentHighSchool: 'Smyrna High School',
    gpa: '2.95',
    numberOfSiblings: '1',
    immediateFamilyMembers: '3',
    familyMembersInCollege: '0',
  },
  activities: [
    { id: 'act-1', activity: 'Smyrna Marching Band', role: 'Drumline Section Leader', years: '9-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Smyrna Opera House Volunteer Guild', description: 'Event set-up and community ushering', totalHours: '25' },
  ],
  employment: [
    { id: 'emp-1', employer: 'Food Lion Smyrna', position: 'Stock Associate', dates: 'June 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'waiting' as const },
    { id: 'col-2', college: 'Wesley College / DSU Downtown', cityState: 'Dover, DE', status: 'applied' as const },
  ],
  documents: {
    transcript: { name: 'Smyrna_High_Transcript_Tariq_J.pdf', size: 1650000, type: 'application/pdf', uploadedAt: '2026-02-28T09:05:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Tariq_Jackson.pdf', size: 820000, type: 'application/pdf', uploadedAt: '2026-02-28T09:06:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_Band_Director.pdf', size: 390000, type: 'application/pdf', uploadedAt: '2026-02-28T09:07:00.000Z' },
      { name: 'Letter_2_Work_Manager_FoodLion.pdf', size: 360000, type: 'application/pdf', uploadedAt: '2026-02-28T09:08:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Tariq Lamar Jackson' },
};

const rawSample11 = {
  id: 'app-013',
  applicationNumber: 'MC-2026-013',
  submittedAt: '2026-03-02T10:15:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Marcus',
    lastName: 'Vance',
    streetAddress: '712 West 8th Street',
    city: 'Wilmington',
    state: 'DE',
    zip: '19801',
    telephone: '(302) 555-0812',
    email: 'marcus.vance@newcastle.k12.de.us',
    dateOfBirth: '2008-05-14',
  },
  parentGuardian: {
    fullName: 'Brenda Vance',
    phone: '(302) 555-0819',
    email: 'bvance@verizon.net',
  },
  schoolFamily: {
    currentHighSchool: 'Howard High School of Technology',
    gpa: '3.82',
    numberOfSiblings: '2',
    immediateFamilyMembers: '4',
    familyMembersInCollege: '1',
  },
  activities: [
    { id: 'act-1', activity: 'Robotics & Engineering Team', role: 'Lead Programmer', years: '10-12' },
    { id: 'act-2', activity: 'Black Student Union', role: 'Treasurer', years: '11-12' },
    { id: 'act-3', activity: 'Varsity Track & Field', role: 'Team Captain', years: '9-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Food Bank of Delaware', description: 'Warehouse food distribution coordinator', totalHours: '85' },
    { id: 'cs-2', organization: 'Wilmington Youth Literacy Project', description: 'Reading tutor for elementary students', totalHours: '40' },
  ],
  employment: [
    { id: 'emp-1', employer: 'AutoZone', position: 'Retail & Parts Associate', dates: 'June 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Drexel University', cityState: 'Philadelphia, PA', status: 'accepted' as const },
    { id: 'col-3', college: 'University of Delaware', cityState: 'Newark, DE', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'Howard_Tech_Transcript_Marcus_Vance.pdf', size: 2150000, type: 'application/pdf', uploadedAt: '2026-03-02T10:10:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Marcus_Vance.pdf', size: 1100000, type: 'application/pdf', uploadedAt: '2026-03-02T10:11:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_Robotics_Advisor.pdf', size: 450000, type: 'application/pdf', uploadedAt: '2026-03-02T10:12:00.000Z' },
      { name: 'Letter_2_Math_Teacher.pdf', size: 420000, type: 'application/pdf', uploadedAt: '2026-03-02T10:13:00.000Z' },
      { name: 'Letter_3_Food_Bank_Coordinator.pdf', size: 480000, type: 'application/pdf', uploadedAt: '2026-03-02T10:14:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Marcus Vance' },
};

const rawSample12 = {
  id: 'app-014',
  applicationNumber: 'MC-2026-014',
  submittedAt: '2026-03-03T11:45:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Sophia',
    lastName: 'Morales',
    streetAddress: '3405 Washington Street Extension',
    city: 'Wilmington',
    state: 'DE',
    zip: '19802',
    telephone: '(302) 555-0341',
    email: 'sophia.morales@brandywine.k12.de.us',
    dateOfBirth: '2008-08-20',
  },
  parentGuardian: {
    fullName: 'Carlos Morales',
    phone: '(302) 555-0349',
    email: 'cmorales@comcast.net',
  },
  schoolFamily: {
    currentHighSchool: 'Mount Pleasant High School',
    gpa: '3.91',
    numberOfSiblings: '1',
    immediateFamilyMembers: '3',
    familyMembersInCollege: '0',
  },
  activities: [
    { id: 'act-1', activity: 'Latin American Student Alliance', role: 'President & Founder', years: '10-12' },
    { id: 'act-2', activity: 'National Honor Society', role: 'Member', years: '11-12' },
    { id: 'act-3', activity: 'Model United Nations', role: 'Delegate', years: '10-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'American Red Cross Delmarva Chapter', description: 'Blood drive youth coordinator & disaster readiness', totalHours: '90' },
    { id: 'cs-2', organization: "St. Paul's Catholic Church", description: 'Bilingual community outreach volunteer', totalHours: '50' },
  ],
  employment: [
    { id: 'emp-1', employer: 'CVS Pharmacy', position: 'Cashier & Pharmacy Clerk', dates: 'Sept 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Temple University', cityState: 'Philadelphia, PA', status: 'accepted' as const },
    { id: 'col-3', college: 'Villanova University', cityState: 'Villanova, PA', status: 'waiting' as const },
  ],
  documents: {
    transcript: { name: 'Mount_Pleasant_Transcript_Sophia_M.pdf', size: 1980000, type: 'application/pdf', uploadedAt: '2026-03-03T11:40:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Sophia_Morales.pdf', size: 940000, type: 'application/pdf', uploadedAt: '2026-03-03T11:41:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_AP_Spanish_Teacher.pdf', size: 440000, type: 'application/pdf', uploadedAt: '2026-03-03T11:42:00.000Z' },
      { name: 'Letter_2_Guidance_Counselor.pdf', size: 470000, type: 'application/pdf', uploadedAt: '2026-03-03T11:43:00.000Z' },
      { name: 'Letter_3_Red_Cross_Coordinator.pdf', size: 430000, type: 'application/pdf', uploadedAt: '2026-03-03T11:44:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Sophia Morales' },
};

const rawSample13 = {
  id: 'app-015',
  applicationNumber: 'MC-2026-015',
  submittedAt: '2026-03-04T09:20:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'DeAndre',
    lastName: 'Washington',
    streetAddress: '418 Basin Road',
    city: 'New Castle',
    state: 'DE',
    zip: '19720',
    telephone: '(302) 555-0726',
    email: 'deandre.washington@colonial.k12.de.us',
    dateOfBirth: '2008-02-18',
  },
  parentGuardian: {
    fullName: 'Denise Washington',
    phone: '(302) 555-0730',
    email: 'denise.wash@aol.com',
  },
  schoolFamily: {
    currentHighSchool: 'William Penn High School',
    gpa: '3.68',
    numberOfSiblings: '3',
    immediateFamilyMembers: '5',
    familyMembersInCollege: '2',
  },
  activities: [
    { id: 'act-1', activity: 'Speech & Debate League', role: 'Varsity Debater', years: '10-12' },
    { id: 'act-2', activity: 'Future Business Leaders of America', role: 'Vice President', years: '11-12' },
    { id: 'act-3', activity: 'Math League', role: 'Team Member', years: '9-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'New Castle Senior Center', description: 'Tech literacy tutor for senior citizens', totalHours: '65' },
    { id: 'cs-2', organization: 'Sunday School Youth Ministry', description: 'Junior Counselor & tutor', totalHours: '45' },
  ],
  employment: [
    { id: 'emp-1', employer: 'ShopRite of River Road', position: 'Customer Service & Stock', dates: 'July 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Morgan State University', cityState: 'Baltimore, MD', status: 'accepted' as const },
    { id: 'col-3', college: 'Lincoln University', cityState: 'Lincoln University, PA', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'William_Penn_Transcript_DeAndre_W.pdf', size: 1850000, type: 'application/pdf', uploadedAt: '2026-03-04T09:15:00.000Z' },
    studentAidReport: { name: 'SAR_Report_DeAndre_Washington.pdf', size: 890000, type: 'application/pdf', uploadedAt: '2026-03-04T09:16:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_FBLA_Advisor.pdf', size: 410000, type: 'application/pdf', uploadedAt: '2026-03-04T09:17:00.000Z' },
      { name: 'Letter_2_Debate_Coach.pdf', size: 450000, type: 'application/pdf', uploadedAt: '2026-03-04T09:18:00.000Z' },
      { name: 'Letter_3_Pastor_Youth_Ministry.pdf', size: 420000, type: 'application/pdf', uploadedAt: '2026-03-04T09:19:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'DeAndre Washington' },
};

const rawSample14 = {
  id: 'app-016',
  applicationNumber: 'MC-2026-016',
  submittedAt: '2026-03-05T14:10:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Jasmine',
    lastName: 'Alston',
    streetAddress: '1900 South College Avenue',
    city: 'Newark',
    state: 'DE',
    zip: '19713',
    telephone: '(302) 555-0955',
    email: 'jasmine.alston@christina.k12.de.us',
    dateOfBirth: '2007-11-09',
  },
  parentGuardian: {
    fullName: 'Cheryl Alston',
    phone: '(302) 555-0960',
    email: 'calston@yahoo.com',
  },
  schoolFamily: {
    currentHighSchool: 'Glasgow High School',
    gpa: '3.96',
    numberOfSiblings: '1',
    immediateFamilyMembers: '4',
    familyMembersInCollege: '1',
  },
  activities: [
    { id: 'act-1', activity: 'Key Club International', role: 'President', years: '11-12' },
    { id: 'act-2', activity: 'Science Olympiad', role: 'Team Medalist', years: '9-12' },
    { id: 'act-3', activity: 'Peer Mentorship Council', role: 'Lead Mentor', years: '10-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Christiana Care Hospital', description: 'Junior Volunteer in Pediatric Wing', totalHours: '110' },
    { id: 'cs-2', organization: 'Newark Free Library', description: 'Summer reading camp leader & tutor', totalHours: '55' },
  ],
  employment: [
    { id: 'emp-1', employer: 'Barnes & Noble', position: 'Sales Associate & Cashier', dates: 'August 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'University of Delaware', cityState: 'Newark, DE', status: 'accepted' as const },
    { id: 'col-3', college: 'Hampton University', cityState: 'Hampton, VA', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'Glasgow_High_Transcript_Jasmine_A.pdf', size: 2300000, type: 'application/pdf', uploadedAt: '2026-03-05T14:05:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Jasmine_Alston.pdf', size: 1050000, type: 'application/pdf', uploadedAt: '2026-03-05T14:06:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_AP_Bio_Teacher.pdf', size: 480000, type: 'application/pdf', uploadedAt: '2026-03-05T14:07:00.000Z' },
      { name: 'Letter_2_Hospital_Volunteer_Director.pdf', size: 490000, type: 'application/pdf', uploadedAt: '2026-03-05T14:08:00.000Z' },
      { name: 'Letter_3_Key_Club_Advisor.pdf', size: 440000, type: 'application/pdf', uploadedAt: '2026-03-05T14:09:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Jasmine Alston' },
};

const rawSample15 = {
  id: 'app-017',
  applicationNumber: 'MC-2026-017',
  submittedAt: '2026-03-06T16:30:00.000Z',
  eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
  applicant: {
    firstName: 'Carlos',
    lastName: 'Mendoza',
    streetAddress: '824 Academy Street',
    city: 'Newark',
    state: 'DE',
    zip: '19711',
    telephone: '(302) 555-0488',
    email: 'carlos.mendoza@christina.k12.de.us',
    dateOfBirth: '2008-01-30',
  },
  parentGuardian: {
    fullName: 'Rosa Mendoza',
    phone: '(302) 555-0492',
    email: 'rmendoza@gmail.com',
  },
  schoolFamily: {
    currentHighSchool: 'Newark High School',
    gpa: '3.75',
    numberOfSiblings: '2',
    immediateFamilyMembers: '5',
    familyMembersInCollege: '0',
  },
  activities: [
    { id: 'act-1', activity: 'DECA', role: 'Chapter Officer', years: '11-12' },
    { id: 'act-2', activity: 'Student Government Association', role: 'Class Representative', years: '10-12' },
    { id: 'act-3', activity: 'Varsity Soccer', role: 'Team Captain', years: '9-12' },
  ],
  communityService: [
    { id: 'cs-1', organization: 'Western Family YMCA', description: 'Youth soccer coach & summer camp counselor', totalHours: '80' },
    { id: 'cs-2', organization: 'Newark Community Garden', description: 'Harvest & food pantry distribution volunteer', totalHours: '35' },
  ],
  employment: [
    { id: 'emp-1', employer: 'Wawa', position: 'Customer Service Associate', dates: 'June 2024 - Present' },
  ],
  colleges: [
    { id: 'col-1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' as const },
    { id: 'col-2', college: 'Salisbury University', cityState: 'Salisbury, MD', status: 'accepted' as const },
    { id: 'col-3', college: 'West Chester University', cityState: 'West Chester, PA', status: 'accepted' as const },
  ],
  documents: {
    transcript: { name: 'Newark_High_Transcript_Carlos_M.pdf', size: 1950000, type: 'application/pdf', uploadedAt: '2026-03-06T16:25:00.000Z' },
    studentAidReport: { name: 'SAR_Report_Carlos_Mendoza.pdf', size: 910000, type: 'application/pdf', uploadedAt: '2026-03-06T16:26:00.000Z' },
    recommendationLetters: [
      { name: 'Letter_1_DECA_Advisor.pdf', size: 420000, type: 'application/pdf', uploadedAt: '2026-03-06T16:27:00.000Z' },
      { name: 'Letter_2_Varsity_Soccer_Coach.pdf', size: 450000, type: 'application/pdf', uploadedAt: '2026-03-06T16:28:00.000Z' },
      { name: 'Letter_3_YMCA_Program_Director.pdf', size: 410000, type: 'application/pdf', uploadedAt: '2026-03-06T16:29:00.000Z' },
    ],
    extraDocuments: [],
  },
  certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: 'Carlos Mendoza' },
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
  {
    ...rawSample4,
    aiScoring: evaluateApplicationWithAI(rawSample4),
    committeeReview: {
      status: 'Approved',
      reviewerScore: 46,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Outstanding technical leadership as NTHS President. Multiple DSU & UD acceptances with proven work ethic.',
      reviewedAt: '2026-02-23T10:00:00.000Z',
    },
  },
  {
    ...rawSample5,
    aiScoring: evaluateApplicationWithAI(rawSample5),
    committeeReview: {
      status: 'Under Review',
      reviewerScore: 41,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Active debater and FBLA officer. Solid 3.65 GPA with strong community service in Dover.',
      reviewedAt: '2026-02-24T12:00:00.000Z',
    },
  },
  {
    ...rawSample6,
    aiScoring: evaluateApplicationWithAI(rawSample6),
    committeeReview: {
      status: 'Under Review',
      reviewerScore: 39,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Strong hands-on profile with volunteer cadet service and automotive trade balance. First-generation collegiate aspirant.',
      reviewedAt: '2026-02-25T11:30:00.000Z',
    },
  },
  {
    ...rawSample7,
    aiScoring: evaluateApplicationWithAI(rawSample7),
    committeeReview: {
      status: 'Approved',
      reviewerScore: 49,
      reviewerName: 'Dr. Woodrow Wilson Memorial Panel',
      committeeNotes: 'Highest academic merit in pool: 3.95 GPA in IB program with 110 documented library tutoring hours. Exceptional fit.',
      reviewedAt: '2026-02-26T16:00:00.000Z',
    },
  },
  {
    ...rawSample8,
    aiScoring: evaluateApplicationWithAI(rawSample8),
    committeeReview: {
      status: 'Waitlisted',
      reviewerScore: 34,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Reliable varsity athlete and club treasurer. Recommending interview round if additional funding opens.',
      reviewedAt: '2026-02-27T14:00:00.000Z',
    },
  },
  {
    ...rawSample9,
    aiScoring: evaluateApplicationWithAI(rawSample9),
    committeeReview: {
      status: 'Shortlisted',
      reviewerScore: 43,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Great representation from Sussex County. Active agricultural leadership and proven community volunteer hours.',
      reviewedAt: '2026-02-28T11:00:00.000Z',
    },
  },
  {
    ...rawSample10,
    aiScoring: evaluateApplicationWithAI(rawSample10),
    committeeReview: {
      status: 'Under Review',
      reviewerScore: 28,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Artistic talent as Drumline leader. GPA close to cutoff (2.95); requires committee review for DSU matriculation aid.',
      reviewedAt: '2026-03-01T09:00:00.000Z',
    },
  },
  {
    ...rawSample11,
    aiScoring: evaluateApplicationWithAI(rawSample11),
    committeeReview: {
      status: 'Under Review',
      reviewerScore: 44,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Strong STEM profile with outstanding robotics leadership and food bank volunteer hours.',
      reviewedAt: '2026-03-02T14:00:00.000Z',
    },
  },
  {
    ...rawSample12,
    aiScoring: evaluateApplicationWithAI(rawSample12),
    committeeReview: {
      status: 'Under Review',
      reviewerScore: 46,
      reviewerName: 'Selection Committee',
      committeeNotes: 'High academic rigor (3.91 GPA) and dedicated bilingual volunteer leadership with Red Cross.',
      reviewedAt: '2026-03-03T15:30:00.000Z',
    },
  },
  {
    ...rawSample13,
    aiScoring: evaluateApplicationWithAI(rawSample13),
    committeeReview: {
      status: 'Under Review',
      reviewerScore: 42,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Solid debate achievements, proven employment balance, and active church youth service.',
      reviewedAt: '2026-03-04T13:00:00.000Z',
    },
  },
  {
    ...rawSample14,
    aiScoring: evaluateApplicationWithAI(rawSample14),
    committeeReview: {
      status: 'Under Review',
      reviewerScore: 48,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Exceptional GPA (3.96) and over 160 volunteer hours at Christiana Hospital and local library.',
      reviewedAt: '2026-03-05T16:00:00.000Z',
    },
  },
  {
    ...rawSample15,
    aiScoring: evaluateApplicationWithAI(rawSample15),
    committeeReview: {
      status: 'Under Review',
      reviewerScore: 43,
      reviewerName: 'Selection Committee',
      committeeNotes: 'Demonstrated athletic leadership and active community involvement at YMCA. Strong collegiate preparedness.',
      reviewedAt: '2026-03-06T18:00:00.000Z',
    },
  },
];
