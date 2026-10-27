'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Send,
  Loader2,
} from 'lucide-react';
import {
  ClubActivity,
  CommunityService,
  EmploymentHistory,
  CollegePlan,
  UploadedDocument,
  ScholarshipApplication,
} from '@/types/scholarship';
import { saveNewApplication } from '@/lib/storage';
import { sendApplicationToGoogleSheet } from '@/lib/googleSheet';

interface ApplicantPortalProps {
  onSuccessSubmit: (app: ScholarshipApplication) => void;
  initialAutofill?: boolean;
}

export default function ApplicantPortal({
  onSuccessSubmit,
  initialAutofill = false,
}: ApplicantPortalProps) {
  // 1. Eligibility
  const [isDelawareSenior, setIsDelawareSenior] = useState(initialAutofill);
  const [isEligibleDescent, setIsEligibleDescent] = useState(initialAutofill);
  const [isMinGpa, setIsMinGpa] = useState(initialAutofill);

  // 2. Applicant
  const [firstName, setFirstName] = useState(initialAutofill ? 'Jordan' : '');
  const [lastName, setLastName] = useState(initialAutofill ? 'Taylor' : '');
  const [streetAddress, setStreetAddress] = useState(initialAutofill ? '450 West 4th Street' : '');
  const [city, setCity] = useState(initialAutofill ? 'Wilmington' : '');
  const [stateVal, setStateVal] = useState('DE');
  const [zip, setZip] = useState(initialAutofill ? '19801' : '');
  const [telephone, setTelephone] = useState(initialAutofill ? '(302) 555-0392' : '');
  const [email, setEmail] = useState(initialAutofill ? 'jordan.taylor@redclay.k12.de.us' : '');
  const [dateOfBirth, setDateOfBirth] = useState(initialAutofill ? '2008-03-25' : '');

  // 3. Parent / Guardian
  const [parentName, setParentName] = useState(initialAutofill ? 'Patricia Taylor' : '');
  const [parentPhone, setParentPhone] = useState(initialAutofill ? '(302) 555-0393' : '');
  const [parentEmail, setParentEmail] = useState(initialAutofill ? 'ptaylor@comcast.net' : '');

  // 4. School & Family
  const [currentHighSchool, setCurrentHighSchool] = useState(initialAutofill ? 'Howard High School of Technology' : '');
  const [gpa, setGpa] = useState(initialAutofill ? '3.84' : '');
  const [numberOfSiblings, setNumberOfSiblings] = useState(initialAutofill ? '2' : '');
  const [immediateFamilyMembers, setImmediateFamilyMembers] = useState(initialAutofill ? '4' : '');
  const [familyMembersInCollege, setFamilyMembersInCollege] = useState(initialAutofill ? '1' : '');

  // 5. Dynamic Lists
  const [activities, setActivities] = useState<ClubActivity[]>(
    initialAutofill
      ? [
          { id: '1', activity: 'National Technical Honor Society', role: 'President', years: '11-12' },
          { id: '2', activity: 'Black Youth Leadership Council', role: 'Student Ambassador', years: '10-12' },
        ]
      : [{ id: '1', activity: '', role: '', years: '' }]
  );

  const [communityService, setCommunityService] = useState<CommunityService[]>(
    initialAutofill
      ? [
          { id: '1', organization: 'Kingswood Community Center', description: 'Youth STEM mentor & after-school tutor', totalHours: '85' },
          { id: '2', organization: 'Sunday Breakfast Mission', description: 'Food pantry packaging volunteer', totalHours: '30' },
        ]
      : [{ id: '1', organization: '', description: '', totalHours: '' }]
  );

  const [employment, setEmployment] = useState<EmploymentHistory[]>(
    initialAutofill
      ? [{ id: '1', employer: 'CVS Health Wilmington', position: 'Pharmacy Tech Assistant', dates: 'June 2024 - Present' }]
      : [{ id: '1', employer: '', position: '', dates: '' }]
  );

  const [colleges, setColleges] = useState<CollegePlan[]>(
    initialAutofill
      ? [
          { id: '1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' },
          { id: '2', college: 'University of Delaware', cityState: 'Newark, DE', status: 'accepted' },
          { id: '3', college: 'Howard University', cityState: 'Washington, DC', status: 'waiting' },
        ]
      : [{ id: '1', college: '', cityState: '', status: 'applied' }]
  );

  // 6 & 7. Documents (Simulated file states with mock uploads)
  const [transcript, setTranscript] = useState<UploadedDocument | null>(
    initialAutofill
      ? {
          name: 'Official_Transcript_Jordan_Taylor_2026.pdf',
          size: 2150000,
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
        }
      : null
  );

  const [studentAidReport, setStudentAidReport] = useState<UploadedDocument | null>(
    initialAutofill
      ? {
          name: 'Student_Aid_Report_2026_FAFSA.pdf',
          size: 1120000,
          type: 'application/pdf',
          uploadedAt: new Date().toISOString(),
        }
      : null
  );

  const [recLetters, setRecLetters] = useState<UploadedDocument[]>(
    initialAutofill
      ? [
          { name: 'Letter_AP_Biology_Teacher.pdf', size: 450000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
          { name: 'Letter_Kingswood_Director.pdf', size: 380000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
          { name: 'Letter_Counselor_Recommendation.pdf', size: 420000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
        ]
      : []
  );

  const [extraDocs, setExtraDocs] = useState<UploadedDocument[]>(
    initialAutofill
      ? [{ name: 'Delaware_State_Merit_Award.pdf', size: 680000, type: 'application/pdf', uploadedAt: new Date().toISOString() }]
      : []
  );

  // 8. Certification
  const [isInfoAccurate, setIsInfoAccurate] = useState(initialAutofill);
  const [parentGrantsPermission, setParentGrantsPermission] = useState(initialAutofill);
  const [applicantSignature, setApplicantSignature] = useState(initialAutofill ? 'Jordan Taylor' : '');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<ScholarshipApplication | null>(null);

  // Autofill realistic demo data
  const handleAutofill = () => {
    setIsDelawareSenior(true);
    setIsEligibleDescent(true);
    setIsMinGpa(true);

    setFirstName('Jordan');
    setLastName('Taylor');
    setStreetAddress('450 West 4th Street');
    setCity('Wilmington');
    setStateVal('DE');
    setZip('19801');
    setTelephone('(302) 555-0392');
    setEmail('jordan.taylor@redclay.k12.de.us');
    setDateOfBirth('2008-03-25');

    setParentName('Patricia Taylor');
    setParentPhone('(302) 555-0393');
    setParentEmail('ptaylor@comcast.net');

    setCurrentHighSchool('Howard High School of Technology');
    setGpa('3.84');
    setNumberOfSiblings('2');
    setImmediateFamilyMembers('4');
    setFamilyMembersInCollege('1');

    setActivities([
      { id: '1', activity: 'National Technical Honor Society', role: 'President', years: '11-12' },
      { id: '2', activity: 'Black Youth Leadership Council', role: 'Student Ambassador', years: '10-12' },
    ]);

    setCommunityService([
      { id: '1', organization: 'Kingswood Community Center', description: 'Youth STEM mentor & after-school tutor', totalHours: '85' },
      { id: '2', organization: 'Sunday Breakfast Mission', description: 'Food pantry packaging volunteer', totalHours: '30' },
    ]);

    setEmployment([
      { id: '1', employer: 'CVS Health Wilmington', position: 'Pharmacy Tech Assistant', dates: 'June 2024 - Present' },
    ]);

    setColleges([
      { id: '1', college: 'Delaware State University', cityState: 'Dover, DE', status: 'accepted' },
      { id: '2', college: 'University of Delaware', cityState: 'Newark, DE', status: 'accepted' },
      { id: '3', college: 'Howard University', cityState: 'Washington, DC', status: 'waiting' },
    ]);

    setTranscript({
      name: 'Official_Transcript_Jordan_Taylor_2026.pdf',
      size: 2150000,
      type: 'application/pdf',
      uploadedAt: new Date().toISOString(),
    });

    setStudentAidReport({
      name: 'Student_Aid_Report_2026_FAFSA.pdf',
      size: 1120000,
      type: 'application/pdf',
      uploadedAt: new Date().toISOString(),
    });

    setRecLetters([
      { name: 'Letter_AP_Biology_Teacher.pdf', size: 450000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
      { name: 'Letter_Kingswood_Director.pdf', size: 380000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
      { name: 'Letter_Counselor_Recommendation.pdf', size: 420000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
    ]);

    setExtraDocs([
      { name: 'Delaware_State_Merit_Award.pdf', size: 680000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
    ]);

    setIsInfoAccurate(true);
    setParentGrantsPermission(true);
    setApplicantSignature('Jordan Taylor');
    setFormError(null);
  };

  // Form Validation & Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation checks
    if (!isDelawareSenior || !isEligibleDescent || !isMinGpa) {
      setFormError('Please verify all 3 eligibility requirements to proceed.');
      return;
    }

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !streetAddress.trim() ||
      !city.trim() ||
      !zip.trim() ||
      !telephone.trim() ||
      !email.trim() ||
      !dateOfBirth
    ) {
      setFormError('Please complete all required fields in the Applicant section.');
      return;
    }

    if (!parentName.trim() || !parentPhone.trim() || !parentEmail.trim()) {
      setFormError('Please complete all Parent / Guardian details.');
      return;
    }

    if (!currentHighSchool.trim() || !gpa.trim()) {
      setFormError('Please enter current high school and cumulative GPA.');
      return;
    }

    if (!isInfoAccurate || !parentGrantsPermission || !applicantSignature.trim()) {
      setFormError('Please sign and accept all certification declarations.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        const saved = saveNewApplication({
          eligibility: {
            isDelawareSenior,
            isEligibleDescent,
            isMinGpa,
          },
          applicant: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            streetAddress: streetAddress.trim(),
            city: city.trim(),
            state: stateVal.trim() || 'DE',
            zip: zip.trim(),
            telephone: telephone.trim(),
            email: email.trim(),
            dateOfBirth,
          },
          parentGuardian: {
            fullName: parentName.trim(),
            phone: parentPhone.trim(),
            email: parentEmail.trim(),
          },
          schoolFamily: {
            currentHighSchool: currentHighSchool.trim(),
            gpa: gpa.trim(),
            numberOfSiblings: numberOfSiblings.trim() || '0',
            immediateFamilyMembers: immediateFamilyMembers.trim() || '1',
            familyMembersInCollege: familyMembersInCollege.trim() || '0',
          },
          activities: activities.filter((a) => a.activity.trim()),
          communityService: communityService.filter((c) => c.organization.trim()),
          employment: employment.filter((e) => e.employer.trim()),
          colleges: colleges.filter((c) => c.college.trim()),
          documents: {
            transcript: transcript || undefined,
            studentAidReport: studentAidReport || undefined,
            recommendationLetters: recLetters,
            extraDocuments: extraDocs,
          },
          certification: {
            isInfoAccurate,
            parentGrantsPermission,
            applicantSignature: applicantSignature.trim(),
          },
        });

        setIsSubmitting(false);
        setSubmittedApp(saved);
        onSuccessSubmit(saved);

        // Sync application directly to Google Sheet in background
        sendApplicationToGoogleSheet(saved).catch((err) => {
          console.warn('Background Google Sheet sync notice:', err);
        });
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        setFormError('An error occurred during submission. Please try again.');
      }
    }, 1200);
  };

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-6 sm:py-8">
      {/* Title & Organization Header matching Client Mockup */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-gradient-to-b from-[#131b2e] to-[#0f172a] p-4 sm:p-6 shadow-xl text-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-800/60 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span>Official 2026 Application Form</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-white">
              The Monday Club Scholarship
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
              Holloway St. / Dr. Woodrow Wilson / James H. Sills, Jr. / Delaware State University
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAutofill}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg border border-blue-600/40 bg-blue-950/60 px-3.5 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-900/60 hover:text-white transition shadow-sm cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Pre-fill Sample Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Application Form */}
      <form onSubmit={handleSubmit} className="space-y-6 text-slate-200">
        {/* ======================================================== */}
        {/* 1. ELIGIBILITY */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30 shrink-0">
              1
            </span>
            <span>Eligibility</span>
          </h3>

          <div className="space-y-3 text-xs sm:text-sm text-slate-300">
            <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-900/60 transition cursor-pointer border border-transparent hover:border-slate-800">
              <input
                id="eligibility-senior"
                type="checkbox"
                checked={isDelawareSenior}
                onChange={(e) => setIsDelawareSenior(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                I am a senior at a high school in Delaware and am admitted to, or seeking admission to, a four-year college or university.
              </span>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-900/60 transition cursor-pointer border border-transparent hover:border-slate-800">
              <input
                id="eligibility-descent"
                type="checkbox"
                checked={isEligibleDescent}
                onChange={(e) => setIsEligibleDescent(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                I am of African-American, Hispanic or Native American descent.
              </span>
            </label>

            <label className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-900/60 transition cursor-pointer border border-transparent hover:border-slate-800">
              <input
                id="eligibility-gpa"
                type="checkbox"
                checked={isMinGpa}
                onChange={(e) => setIsMinGpa(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                My cumulative GPA is at least 2.75 on a 4.00 scale.
              </span>
            </label>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. APPLICANT */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30 shrink-0">
              2
            </span>
            <span>Applicant</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">First name</label>
              <input
                id="applicant-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Last name</label>
              <input
                id="applicant-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Street address</label>
              <input
                id="applicant-street-address"
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Street address"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">City, State, Zip</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  id="applicant-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
                <input
                  id="applicant-state"
                  type="text"
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  placeholder="State (e.g. DE)"
                  className="w-full rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
                <input
                  id="applicant-zip"
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="Zip code"
                  className="w-full rounded-lg px-3 py-2 text-sm text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Telephone</label>
              <input
                id="applicant-telephone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="(302) 555-0100"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Email</label>
              <input
                id="applicant-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5">Date of birth (mm/dd/yyyy)</label>
              <input
                id="applicant-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full sm:w-1/2 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. PARENT / GUARDIAN */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              3
            </span>
            <span>Parent / Guardian</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Parent/Guardian full name</label>
              <input
                id="parent-name"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Parent/Guardian full name"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Parent/Guardian phone</label>
              <input
                id="parent-phone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="(302) 555-0200"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5">Parent/Guardian email</label>
              <input
                id="parent-email"
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full sm:w-1/2 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. SCHOOL & FAMILY */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              4
            </span>
            <span>School & family</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Current high school</label>
              <input
                id="school-name"
                type="text"
                value={currentHighSchool}
                onChange={(e) => setCurrentHighSchool(e.target.value)}
                placeholder="High school name"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">GPA (as of Jan 31)</label>
              <input
                id="school-gpa"
                type="text"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder="e.g. 3.80"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Number of siblings</label>
              <input
                id="siblings-count"
                type="number"
                min="0"
                value={numberOfSiblings}
                onChange={(e) => setNumberOfSiblings(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Immediate family members (incl. you)</label>
              <input
                id="family-members-count"
                type="number"
                min="1"
                value={immediateFamilyMembers}
                onChange={(e) => setImmediateFamilyMembers(e.target.value)}
                placeholder="e.g. 4"
                className="w-full rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5">Family members in college this year</label>
              <input
                id="family-in-college"
                type="number"
                min="0"
                value={familyMembersInCollege}
                onChange={(e) => setFamilyMembersInCollege(e.target.value)}
                placeholder="0"
                className="w-full sm:w-1/2 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. ACTIVITIES, WORK & COLLEGES (Dynamic Lists) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
                5
              </span>
              <span>Activities, work & colleges</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Add one line per item. Use the + button for more.
            </p>
          </div>

          {/* Subsection: School clubs & activities */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              School clubs & activities (include leadership positions)
            </label>
            <div className="space-y-3">
              {activities.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 sm:p-0 rounded-xl sm:rounded-none bg-slate-900/60 sm:bg-transparent border border-slate-800/80 sm:border-0"
                >
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Activity / club"
                      value={item.activity}
                      onChange={(e) => {
                        const updated = [...activities];
                        updated[index].activity = e.target.value;
                        setActivities(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Leadership role (if any)"
                      value={item.role}
                      onChange={(e) => {
                        const updated = [...activities];
                        updated[index].role = e.target.value;
                        setActivities(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Years (e.g. 9-12)"
                      value={item.years}
                      onChange={(e) => {
                        const updated = [...activities];
                        updated[index].years = e.target.value;
                        setActivities(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                    {activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setActivities(activities.filter((_, i) => i !== index))}
                        className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setActivities([...activities, { id: String(Date.now()), activity: '', role: '', years: '' }])
              }
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add activity</span>
            </button>
          </div>

          {/* Subsection: Community service, church & volunteering */}
          <div className="pt-3 border-t border-slate-800/80">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Community service, church & volunteering
            </label>
            <div className="space-y-3">
              {communityService.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 sm:p-0 rounded-xl sm:rounded-none bg-slate-900/60 sm:bg-transparent border border-slate-800/80 sm:border-0"
                >
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Organization / church"
                      value={item.organization}
                      onChange={(e) => {
                        const updated = [...communityService];
                        updated[index].organization = e.target.value;
                        setCommunityService(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="What you did"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...communityService];
                        updated[index].description = e.target.value;
                        setCommunityService(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-3">
                    <input
                      type="number"
                      placeholder="Total hours"
                      value={item.totalHours}
                      onChange={(e) => {
                        const updated = [...communityService];
                        updated[index].totalHours = e.target.value;
                        setCommunityService(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                    {communityService.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCommunityService(communityService.filter((_, i) => i !== index))}
                        className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setCommunityService([
                  ...communityService,
                  { id: String(Date.now()), organization: '', description: '', totalHours: '' },
                ])
              }
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add service</span>
            </button>
          </div>

          {/* Subsection: Employment history */}
          <div className="pt-3 border-t border-slate-800/80">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Employment history
            </label>
            <div className="space-y-3">
              {employment.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 sm:p-0 rounded-xl sm:rounded-none bg-slate-900/60 sm:bg-transparent border border-slate-800/80 sm:border-0"
                >
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Employer"
                      value={item.employer}
                      onChange={(e) => {
                        const updated = [...employment];
                        updated[index].employer = e.target.value;
                        setEmployment(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Position"
                      value={item.position}
                      onChange={(e) => {
                        const updated = [...employment];
                        updated[index].position = e.target.value;
                        setEmployment(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Dates"
                      value={item.dates}
                      onChange={(e) => {
                        const updated = [...employment];
                        updated[index].dates = e.target.value;
                        setEmployment(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                    {employment.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEmployment(employment.filter((_, i) => i !== index))}
                        className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setEmployment([
                  ...employment,
                  { id: String(Date.now()), employer: '', position: '', dates: '' },
                ])
              }
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-slate-800 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add job</span>
            </button>
          </div>

          {/* Subsection: Colleges & universities */}
          <div className="pt-3 border-t border-slate-800/80">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Colleges & universities (applied, accepted, or waiting)
            </label>
            <div className="space-y-3">
              {colleges.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 sm:p-0 rounded-xl sm:rounded-none bg-slate-900/60 sm:bg-transparent border border-slate-800/80 sm:border-0"
                >
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="College / university"
                      value={item.college}
                      onChange={(e) => {
                        const updated = [...colleges];
                        updated[index].college = e.target.value;
                        setColleges(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="City, State"
                      value={item.cityState}
                      onChange={(e) => {
                        const updated = [...colleges];
                        updated[index].cityState = e.target.value;
                        setColleges(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-3">
                    <select
                      value={item.status}
                      onChange={(e) => {
                        const updated = [...colleges];
                        updated[index].status = e.target.value as CollegePlan['status'];
                        setColleges(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white capitalize"
                    >
                      <option value="applied">Applied</option>
                      <option value="accepted">Accepted</option>
                      <option value="waiting">Waiting</option>
                    </select>
                    {colleges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setColleges(colleges.filter((_, i) => i !== index))}
                        className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Remove line"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setColleges([
                  ...colleges,
                  { id: String(Date.now()), college: '', cityState: '', status: 'applied' },
                ])
              }
              className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-slate-800 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add college</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 6. DOCUMENTS */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              6
            </span>
            <span>Documents</span>
          </h3>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Official transcript */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Official transcript (through Jan)
              </label>
              <input
                id="file-transcript"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setTranscript({
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      uploadedAt: new Date().toISOString(),
                    });
                  }
                }}
                className="w-full text-slate-400 text-xs"
              />
              {transcript && (
                <div className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Attached: {transcript.name}</span>
                </div>
              )}
            </div>

            {/* Student Aid Report */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Student Aid Report (SAR)
              </label>
              <input
                id="file-sar"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setStudentAidReport({
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      uploadedAt: new Date().toISOString(),
                    });
                  }
                }}
                className="w-full text-slate-400 text-xs"
              />
              {studentAidReport && (
                <div className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Attached: {studentAidReport.name}</span>
                </div>
              )}
            </div>

            {/* Three recommendation letters */}
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Three recommendation letters (two from non-relatives)
              </label>
              <input
                id="file-recommendations"
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    const mapped: UploadedDocument[] = files.map((f) => ({
                      name: f.name,
                      size: f.size,
                      type: f.type,
                      uploadedAt: new Date().toISOString(),
                    }));
                    setRecLetters(mapped);
                  }
                }}
                className="w-full text-slate-400 text-xs"
              />
              {recLetters.length > 0 && (
                <div className="mt-1 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{recLetters.length} recommendation letter(s) attached</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 7. EXTRA DOCUMENTS */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              7
            </span>
            <span>Extra documents</span>
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Extra documents (optional, any number)
          </p>

          <input
            id="file-extra"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              if (files.length > 0) {
                const mapped: UploadedDocument[] = files.map((f) => ({
                  name: f.name,
                  size: f.size,
                  type: f.type,
                  uploadedAt: new Date().toISOString(),
                }));
                setExtraDocs(mapped);
              }
            }}
            className="w-full text-slate-400 text-xs"
          />
          {extraDocs.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{extraDocs.length} supplemental document(s) uploaded</span>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 8. CERTIFICATION */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              8
            </span>
            <span>Certification</span>
          </h3>

          <div className="space-y-3 text-xs sm:text-sm text-slate-300 mb-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="cert-accurate"
                type="checkbox"
                checked={isInfoAccurate}
                onChange={(e) => setIsInfoAccurate(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">The information is accurate and the work is my own.</span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="cert-permission"
                type="checkbox"
                checked={parentGrantsPermission}
                onChange={(e) => setParentGrantsPermission(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                Parent/guardian grants permission and understands the decision of the judges is final.
              </span>
            </label>
          </div>

          <div className="mb-6">
            <label className="block text-slate-400 font-medium mb-1.5 text-xs sm:text-sm">
              Applicant signature (type full name)
            </label>
            <input
              id="applicant-signature"
              type="text"
              value={applicantSignature}
              onChange={(e) => setApplicantSignature(e.target.value)}
              placeholder="Type your full legal name"
              className="w-full sm:w-2/3 rounded-lg px-3 py-2.5 text-sm text-white font-mono"
              required
            />
          </div>

          {/* Submit Action & Validation Banner matching Client Screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-slate-800/80">
            <button
              id="btn-submit-application"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Evaluating & Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit application</span>
                </>
              )}
            </button>

            {formError && (
              <span className="text-xs font-medium text-red-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </span>
            )}
          </div>
        </div>
      </form>

      {/* Success Modal with AI Rubric Score teaser */}
      {submittedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-blue-500/40 bg-[#0f172a] p-4 sm:p-8 text-center text-slate-100 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <span className="rounded-full bg-blue-950 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-800/60">
              Application ID: {submittedApp.applicationNumber}
            </span>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-3">
              Application Submitted Successfully!
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Thank you, <strong className="text-white">{submittedApp.applicant.firstName}</strong>. Your application has been logged for The Monday Club scholarship review committee.
            </p>

            {/* AI Rubric Preliminary Feedback Banner */}
            <div className="my-5 rounded-xl border border-blue-800/80 bg-blue-950/40 p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-300">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  <span>AI Rubric Evaluation</span>
                </span>
                <span className="font-mono text-sm font-extrabold text-white bg-blue-900/80 px-2 py-0.5 rounded border border-blue-700">
                  {submittedApp.aiScoring.totalScore} / 50 pts
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {submittedApp.aiScoring.summary}
              </p>
              <div className="mt-2 text-[11px] text-slate-400 italic">
                * Note: AI scores serve as an initial rubric calculation to assist the human selection committee.
              </div>
            </div>

            <button
              onClick={() => setSubmittedApp(null)}
              className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
            >
              Close & View Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
