'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  Send,
  Loader2,
  Eye,
  ArrowLeft,
  FileDown,
  X,
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
import { downloadScholarshipPDF } from '@/lib/pdfExport';

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

  // 2. Applicant (Page 1 of official physical form)
  const [firstName, setFirstName] = useState(initialAutofill ? 'Madison' : '');
  const [middleName, setMiddleName] = useState(initialAutofill ? 'Rae' : '');
  const [lastName, setLastName] = useState(initialAutofill ? 'Tymes' : '');
  const [streetAddress, setStreetAddress] = useState(initialAutofill ? '12 Whitehaven Drive' : '');
  const [city, setCity] = useState(initialAutofill ? 'New Castle' : '');
  const [stateVal, setStateVal] = useState('DE');
  const [zip, setZip] = useState(initialAutofill ? '19720' : '');
  const [telephone, setTelephone] = useState(initialAutofill ? '302-229-1408' : '');
  const [sex, setSex] = useState(initialAutofill ? 'F' : 'F');
  const [email, setEmail] = useState(initialAutofill ? 'maddietymes12@gmail.com' : '');
  const [dateOfBirth, setDateOfBirth] = useState(initialAutofill ? '2008-04-02' : '');

  // 3. Parent / Guardian (Page 1)
  const [parentName, setParentName] = useState(initialAutofill ? 'Shira Tymes' : '');
  const [parentPhone, setParentPhone] = useState(initialAutofill ? '302-229-1408' : '');
  const [parentEmail, setParentEmail] = useState(initialAutofill ? 'shiratymes@gmail.com' : '');

  // 4. School & Family (Page 1)
  const [currentHighSchool, setCurrentHighSchool] = useState(initialAutofill ? 'Padua Academy' : '');
  const [gpa, setGpa] = useState(initialAutofill ? '3.77' : '');
  const [numberOfSiblings, setNumberOfSiblings] = useState(initialAutofill ? '0' : '');
  const [immediateFamilyMembers, setImmediateFamilyMembers] = useState(initialAutofill ? '2' : '');
  const [familyMembersInCollege, setFamilyMembersInCollege] = useState(initialAutofill ? '1' : '');

  // 5. Dynamic Lists (Activities, Community Service, Employment, Colleges - Page 1 & 2)
  const [activities, setActivities] = useState<ClubActivity[]>(
    initialAutofill
      ? [
        { id: '1', activity: 'National Honor Society', role: 'Member', years: '11-12' },
        { id: '2', activity: 'Black Student Union', role: 'Officer', years: '10-12' },
        { id: '3', activity: 'Varsity Soccer (4yr)', role: 'Team Captain', years: '9-12' },
        { id: '4', activity: 'Varsity Flag Football', role: 'Player', years: '11-12' },
      ]
      : [{ id: '1', activity: '', role: '', years: '' }]
  );

  const [communityService, setCommunityService] = useState<CommunityService[]>(
    initialAutofill
      ? [
        { id: '1', organization: 'Habitat for Humanity Volunteer', description: 'Affordable home construction', totalHours: '40' },
        { id: '2', organization: 'Salsthon Fundraising Planning Committee', description: 'Charity event planning coordinator', totalHours: '35' },
        { id: '3', organization: 'Delaware Food Bank Volunteer', description: 'Food packaging & pantry distribution', totalHours: '25' },
        { id: '4', organization: 'Newark Rotary Volunteer', description: 'Community service outreach', totalHours: '20' },
      ]
      : [{ id: '1', organization: '', description: '', totalHours: '' }]
  );

  const [employment, setEmployment] = useState<EmploymentHistory[]>(
    initialAutofill
      ? [
        { id: '1', employer: 'Nothing Bundt Cakes', position: 'Cake Froster', dates: 'July 2023- October 2023' },
        { id: '2', employer: 'F. Brown Boys & Girls Club', position: 'Summer Counselor', dates: 'May 2024-Aug 2024, May 2025- Aug 2025' },
        { id: '3', employer: 'Columbus Inn', position: 'Hostess', dates: 'October 2025- Current' },
      ]
      : [{ id: '1', employer: '', position: '', dates: '' }]
  );

  const [colleges, setColleges] = useState<CollegePlan[]>(
    initialAutofill
      ? [
        { id: '1', college: 'Howard University', cityState: 'Washington DC', status: 'accepted' },
        { id: '2', college: 'Duquense University', cityState: 'Pittsburgh PA', status: 'applied' },
        { id: '3', college: "St. Joesph's University", cityState: 'Philadelphia PA', status: 'waiting' },
      ]
      : [{ id: '1', college: '', cityState: '', status: 'applied' }]
  );

  // 6. Referral Source (Page 2: How did you find out about this scholarship?)
  const [referralSources, setReferralSources] = useState<string[]>(
    initialAutofill ? ['Personal Friend', 'Family/Friend'] : []
  );
  const [mondayClubMemberName, setMondayClubMemberName] = useState('');

  // 7. Essay Submission (Page 3, Req #6: Minimum 200 words)
  const MADISON_SAMPLE_ESSAY = `Throughout my four years at Padua Academy, community involvement, athletic discipline, and academic dedication have shaped my commitment to civic service. Serving as Team Captain of our Varsity Soccer squad and competing in Varsity Flag Football instilled resilience and taught me the value of unifying peers toward common goals. In the classroom and through my leadership as an officer in the Black Student Union, alongside induction into the National Honor Society, I have actively championed diversity, peer mentorship, and student equity.

Giving back across Delaware is a fundamental priority for me. Through extensive volunteer efforts with the Delaware Food Bank, Newark Rotary, and the Salsthon Fundraising Planning Committee, as well as building homes with Habitat for Humanity, I have directly witnessed how coordinated community action creates real dignity for families experiencing hardship. Concurrently, balancing employment at Nothing Bundt Cakes, Columbus Inn, and serving as a Summer Counselor at the F. Brown Boys and Girls Club has strengthened my work ethic, patience, and compassion for youth development.

Over the next ten years, my goal is to earn a Bachelor's degree in Public Health and Healthcare Administration from a four-year institution, followed by graduate study in Health Policy. Ultimately, I aim to lead community health initiatives that eliminate systemic disparities across underserved neighborhoods in Delaware. Receiving The Monday Club Scholarship will provide crucial support to realize this vision and continue serving our community.`;

  const [essayText, setEssayText] = useState(initialAutofill ? MADISON_SAMPLE_ESSAY : '');

  // 8. Documents (Simulated file states with mock uploads)
  const [transcript, setTranscript] = useState<UploadedDocument | null>(
    initialAutofill
      ? {
        name: 'Official_Transcript_Madison_Rae_Tymes_2026.pdf',
        size: 2150000,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      }
      : null
  );

  const [studentAidReport, setStudentAidReport] = useState<UploadedDocument | null>(
    initialAutofill
      ? {
        name: 'Student_Aid_Report_2026_SAR_Processed.pdf',
        size: 1120000,
        type: 'application/pdf',
        uploadedAt: new Date().toISOString(),
      }
      : null
  );

  const [recLetters, setRecLetters] = useState<UploadedDocument[]>(
    initialAutofill
      ? [
        { name: 'Letter_Padua_Academy_Teacher.pdf', size: 450000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
        { name: 'Letter_Boys_Girls_Club_Director.pdf', size: 380000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
        { name: 'Letter_Community_Leader_Rotary.pdf', size: 420000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
      ]
      : []
  );

  const [extraDocs, setExtraDocs] = useState<UploadedDocument[]>(
    initialAutofill
      ? [{ name: 'Varsity_Soccer_Captain_Award.pdf', size: 680000, type: 'application/pdf', uploadedAt: new Date().toISOString() }]
      : []
  );

  // 9. Certification & Dual Signatures (Page 2: Applicant & Parent Signatures + Dates)
  const [rulesAcknowledged, setRulesAcknowledged] = useState(initialAutofill);
  const [isInfoAccurate, setIsInfoAccurate] = useState(initialAutofill);
  const [applicantSignature, setApplicantSignature] = useState(initialAutofill ? 'Madison Rae Tymes' : '');
  const [applicantSignatureDate, setApplicantSignatureDate] = useState(initialAutofill ? '2026-03-10' : '2026-03-10');
  const [parentGrantsPermission, setParentGrantsPermission] = useState(initialAutofill);
  const [parentSignature, setParentSignature] = useState(initialAutofill ? 'Shira Tymes' : '');
  const [parentSignatureDate, setParentSignatureDate] = useState(initialAutofill ? '2026-03-11' : '2026-03-11');

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<ScholarshipApplication | null>(null);
  const [showSubmittedForm, setShowSubmittedForm] = useState(false);
  const successContainerRef = React.useRef<HTMLDivElement>(null);

  // PDF Export Ready Toast
  const [pdfToast, setPdfToast] = useState<{ url: string; name: string } | null>(null);

  const handleDownloadPdf = (apps: ScholarshipApplication[]) => {
    downloadScholarshipPDF(apps);
  };

  // Smooth scroll directly to the confirmation view upon submission
  React.useEffect(() => {
    if (submittedApp && !showSubmittedForm) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      successContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [submittedApp, showSubmittedForm]);

  // Clean reset form for a fresh applicant
  const handleResetForm = () => {
    setIsDelawareSenior(false);
    setIsEligibleDescent(false);
    setIsMinGpa(false);

    setFirstName('');
    setMiddleName('');
    setLastName('');
    setStreetAddress('');
    setCity('');
    setStateVal('DE');
    setZip('');
    setTelephone('');
    setSex('F');
    setEmail('');
    setDateOfBirth('');

    setParentName('');
    setParentPhone('');
    setParentEmail('');

    setCurrentHighSchool('');
    setGpa('');
    setNumberOfSiblings('');
    setImmediateFamilyMembers('');
    setFamilyMembersInCollege('');

    setActivities([{ id: '1', activity: '', role: '', years: '' }]);
    setCommunityService([{ id: '1', organization: '', description: '', totalHours: '' }]);
    setEmployment([{ id: '1', employer: '', position: '', dates: '' }]);
    setColleges([{ id: '1', college: '', cityState: '', status: 'applied' }]);

    setReferralSources([]);
    setMondayClubMemberName('');
    setEssayText('');

    setTranscript(null);
    setStudentAidReport(null);
    setRecLetters([]);
    setExtraDocs([]);

    setRulesAcknowledged(false);
    setIsInfoAccurate(false);
    setApplicantSignature('');
    setApplicantSignatureDate('2026-03-10');
    setParentGrantsPermission(false);
    setParentSignature('');
    setParentSignatureDate('2026-03-11');

    setFormError(null);
    setSubmittedApp(null);
    setShowSubmittedForm(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Autofill realistic demo data matching the official physical Madison Rae Tymes form
  const handleAutofill = () => {
    setIsDelawareSenior(true);
    setIsEligibleDescent(true);
    setIsMinGpa(true);

    setFirstName('Madison');
    setMiddleName('Rae');
    setLastName('Tymes');
    setStreetAddress('12 Whitehaven Drive');
    setCity('New Castle');
    setStateVal('DE');
    setZip('19720');
    setTelephone('302-229-1408');
    setSex('F');
    setEmail('maddietymes12@gmail.com');
    setDateOfBirth('2008-04-02');

    setParentName('Shira Tymes');
    setParentPhone('302-229-1408');
    setParentEmail('shiratymes@gmail.com');

    setCurrentHighSchool('Padua Academy');
    setGpa('3.77');
    setNumberOfSiblings('0');
    setImmediateFamilyMembers('2');
    setFamilyMembersInCollege('1');

    setActivities([
      { id: '1', activity: 'National Honor Society', role: 'Member', years: '11-12' },
      { id: '2', activity: 'Black Student Union', role: 'Officer', years: '10-12' },
      { id: '3', activity: 'Varsity Soccer (4yr)', role: 'Team Captain', years: '9-12' },
      { id: '4', activity: 'Varsity Flag Football', role: 'Player', years: '11-12' },
    ]);

    setCommunityService([
      { id: '1', organization: 'Habitat for Humanity Volunteer', description: 'Affordable home construction', totalHours: '40' },
      { id: '2', organization: 'Salsthon Fundraising Planning Committee', description: 'Charity event planning coordinator', totalHours: '35' },
      { id: '3', organization: 'Delaware Food Bank Volunteer', description: 'Food packaging & pantry distribution', totalHours: '25' },
      { id: '4', organization: 'Newark Rotary Volunteer', description: 'Community service outreach', totalHours: '20' },
    ]);

    setEmployment([
      { id: '1', employer: 'Nothing Bundt Cakes', position: 'Cake Froster', dates: 'July 2023- October 2023' },
      { id: '2', employer: 'F. Brown Boys & Girls Club', position: 'Summer Counselor', dates: 'May 2024-Aug 2024, May 2025- Aug 2025' },
      { id: '3', employer: 'Columbus Inn', position: 'Hostess', dates: 'October 2025- Current' },
    ]);

    setColleges([
      { id: '1', college: 'Howard University', cityState: 'Washington DC', status: 'accepted' },
      { id: '2', college: 'Duquense University', cityState: 'Pittsburgh PA', status: 'applied' },
      { id: '3', college: "St. Joesph's University", cityState: 'Philadelphia PA', status: 'waiting' },
    ]);

    setReferralSources(['Personal Friend', 'Family/Friend']);
    setMondayClubMemberName('');
    setEssayText(MADISON_SAMPLE_ESSAY);

    setTranscript({
      name: 'Official_Transcript_Madison_Rae_Tymes_2026.pdf',
      size: 2150000,
      type: 'application/pdf',
      uploadedAt: new Date().toISOString(),
    });

    setStudentAidReport({
      name: 'Student_Aid_Report_2026_SAR_Processed.pdf',
      size: 1120000,
      type: 'application/pdf',
      uploadedAt: new Date().toISOString(),
    });

    setRecLetters([
      { name: 'Letter_Padua_Academy_Teacher.pdf', size: 450000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
      { name: 'Letter_Boys_Girls_Club_Director.pdf', size: 380000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
      { name: 'Letter_Community_Leader_Rotary.pdf', size: 420000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
    ]);

    setExtraDocs([
      { name: 'Varsity_Soccer_Captain_Award.pdf', size: 680000, type: 'application/pdf', uploadedAt: new Date().toISOString() },
    ]);

    setRulesAcknowledged(true);
    setIsInfoAccurate(true);
    setApplicantSignature('Madison Rae Tymes');
    setApplicantSignatureDate('2026-03-10');
    setParentGrantsPermission(true);
    setParentSignature('Shira Tymes');
    setParentSignatureDate('2026-03-11');
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

    const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).filter(Boolean).length : 0;
    if (!essayText.trim()) {
      setFormError('Please enter your essay (Requirement #6: minimum 200 words required).');
      return;
    }
    if (wordCount < 200) {
      setFormError(`Your essay is currently ${wordCount} words. Requirement #6 specifies a minimum of 200 words.`);
      return;
    }

    if (!rulesAcknowledged) {
      setFormError('Please acknowledge The Monday Club Scholarship Rules and Regulations.');
      return;
    }

    if (!isInfoAccurate || !applicantSignature.trim()) {
      setFormError('Please provide the applicant certification and legal signature.');
      return;
    }

    if (!parentGrantsPermission || !parentSignature.trim()) {
      setFormError('Please provide the parent/guardian permission and legal signature.');
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
            middleName: middleName.trim() || undefined,
            lastName: lastName.trim(),
            streetAddress: streetAddress.trim(),
            city: city.trim(),
            state: stateVal.trim() || 'DE',
            zip: zip.trim(),
            telephone: telephone.trim(),
            sex: sex || 'F',
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
            immediateFamilyMembers: immediateFamilyMembers.trim() || '2',
            familyMembersInCollege: familyMembersInCollege.trim() || '0',
          },
          activities: activities.filter((a) => a.activity.trim()),
          communityService: communityService.filter((c) => c.organization.trim()),
          employment: employment.filter((e) => e.employer.trim()),
          colleges: colleges.filter((c) => c.college.trim()),
          referral: {
            sources: referralSources,
            mondayClubMemberName: mondayClubMemberName.trim() || undefined,
          },
          essay: {
            text: essayText.trim(),
            wordCount,
          },
          documents: {
            transcript: transcript || undefined,
            studentAidReport: studentAidReport || undefined,
            recommendationLetters: recLetters,
            extraDocuments: extraDocs,
          },
          certification: {
            isInfoAccurate,
            rulesAcknowledged,
            applicantSignature: applicantSignature.trim(),
            applicantSignatureDate: applicantSignatureDate.trim() || '2026-03-10',
            parentGrantsPermission,
            parentSignature: parentSignature.trim(),
            parentSignatureDate: parentSignatureDate.trim() || '2026-03-11',
          },
        });

        setIsSubmitting(false);
        setSubmittedApp(saved);
        onSuccessSubmit(saved);
      } catch (err) {
        console.error(err);
        setIsSubmitting(false);
        setFormError('An error occurred during submission. Please try again.');
      }
    }, 1200);
  };

  // ----------------------------------------------------
  // SUBMISSION SUCCESS VIEW (In-viewport, zero scrolling required on Wix / iframes)
  // ----------------------------------------------------
  if (submittedApp && !showSubmittedForm) {
    return (
      <div
        ref={successContainerRef}
        id="submission-success-view"
        className="mx-auto max-w-2xl px-3 sm:px-6 py-6 sm:py-10 animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="relative rounded-2xl border border-emerald-500/50 bg-gradient-to-b from-[#131f37] via-[#0f172a] to-[#090d16] p-5 sm:p-8 text-center text-slate-100 shadow-2xl">
          {/* Animated Glowing Success Icon */}
          <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 mb-4 shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-3.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-700/60 mb-3">
            <span>Application ID: {submittedApp.applicationNumber}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Application Submitted Successfully!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            Thank you, <strong className="text-white">{submittedApp.applicant.firstName} {submittedApp.applicant.lastName}</strong>. Your application has been logged for The Monday Club scholarship review committee.
          </p>

          {/* AI Rubric Evaluation Card */}
          <div className="my-5 rounded-xl border border-blue-800/80 bg-blue-950/40 p-4 sm:p-5 text-left shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-300">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>AI Rubric Evaluation</span>
              </span>
              <span className="font-mono text-sm sm:text-base font-extrabold text-white bg-blue-900/90 px-3 py-1 rounded-md border border-blue-600 shadow-sm">
                {submittedApp.aiScoring.totalScore} / 50 pts
              </span>
            </div>
            <div className="inline-block mb-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/50">
              Tier Category: {submittedApp.aiScoring.ratingCategory}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {submittedApp.aiScoring.summary}
            </p>
            <div className="mt-3 pt-2.5 border-t border-blue-900/50 text-[11px] text-slate-400 italic">
              * Note: The AI rubric score evaluates GPA, volunteer hours, leadership, and household metrics to assist the selection committee.
            </div>
          </div>

          {/* Key Submission Details Snapshot */}
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-left text-xs space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Submission Summary
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Applicant:</span>
              <span className="font-semibold text-white">{submittedApp.applicant.firstName} {submittedApp.applicant.lastName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">High School:</span>
              <span className="font-semibold text-white">{submittedApp.schoolFamily.currentHighSchool}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Cumulative GPA:</span>
              <span className="font-semibold text-white">{submittedApp.schoolFamily.gpa}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Submitted At:</span>
              <span className="font-semibold text-slate-300">{new Date(submittedApp.submittedAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Google Sheet Status:</span>
              <span className="font-semibold text-emerald-400">✓ Logged &amp; Synchronized</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto w-full pt-1">
            <button
              type="button"
              onClick={handleResetForm}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition cursor-pointer"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Submit Another Application</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSubmittedForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition cursor-pointer shadow-md"
            >
              <Eye className="h-4 w-4 shrink-0" />
              <span>Review Submitted Form</span>
            </button>
          </div>

          {pdfToast && (
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500 text-slate-100 text-xs shadow-xl animate-in fade-in text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 shrink-0">
                  <FileDown className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Application PDF Ready!</span>
                  <span className="text-slate-300 ml-1.5 hidden sm:inline">If your browser blocked the new window:</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf([submittedApp])}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white hover:bg-blue-500 transition shadow-sm cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Click to Open &amp; Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfToast(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-3 sm:px-6 py-6 sm:py-8">
      {/* Submitted Application Banner when reviewing */}
      {submittedApp && showSubmittedForm && (
        <>
          <div className="mb-4 rounded-2xl border border-emerald-500/60 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 p-4 sm:p-5 text-slate-100 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white text-sm sm:text-base">
                  Application {submittedApp.applicationNumber} Submitted!
                </div>
                <div className="text-xs text-slate-300">
                  AI Score: <strong className="text-white">{submittedApp.aiScoring.totalScore}/50 pts</strong> ({submittedApp.aiScoring.ratingCategory}) • Synced with Google Sheet
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleDownloadPdf([submittedApp])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition cursor-pointer shadow-md shadow-emerald-600/30"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSubmittedForm(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 transition cursor-pointer shadow-md shadow-blue-600/30"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Confirmation</span>
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Application</span>
              </button>
            </div>
          </div>

          {pdfToast && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border border-blue-500 text-slate-100 text-xs shadow-xl animate-in fade-in text-left">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 shrink-0">
                  <FileDown className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-white">Application PDF Ready!</span>
                  <span className="text-slate-300 ml-1.5 hidden sm:inline">If your browser blocked the new window:</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPdf([submittedApp])}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white hover:bg-blue-500 transition shadow-sm cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  <span>Click to Open &amp; Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfToast(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Title & Organization Header matching Client Mockup with Logo */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-[#090f1d] p-5 sm:p-7 shadow-2xl text-slate-100">
        {/* Top Row: Logo + Org Info (Left) & Pre-fill Sample Button (Right) */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center sm:items-start gap-4">
            {/* Logo Container */}
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border border-slate-700/60 bg-[#0d1629] p-2 shrink-0 shadow-md">
              <Image
                src="/Logo.png"
                alt="The Monday Club Logo"
                width={96}
                height={96}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            {/* Organization Identity */}
            <div className="flex flex-col justify-center">
              <h1 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white">
                THE MONDAY CLUB, INC.
              </h1>
              <p className="text-xs sm:text-sm font-serif italic text-amber-400 mt-0.5">
                &ldquo;Spanning Three Centuries!&rdquo;
              </p>
              <div className="mt-1 text-xs sm:text-sm font-semibold tracking-wide text-slate-200 leading-snug">
                <p>4020 NEW CASTLE AVENUE</p>
                <p>WILMINGTON, DE 19720</p>
              </div>
            </div>
          </div>

          {/* Pre-fill Sample Data Button */}
          <div className="flex items-center shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={handleAutofill}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-500/40 bg-blue-950/40 px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-blue-300 shadow-sm shadow-blue-950/40 hover:bg-blue-900/60 hover:text-white transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Pre-fill Sample Data (Madison Rae Tymes)</span>
            </button>
          </div>
        </div>

        {/* Bottom Section: Scholarship Names & Application Badge */}
        <div className="mt-6">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
            Senator Herman M. Holloway Sr. / Dr. Woodrow Wilson / James H. Sills, Jr. / Delaware State University / The Monday Club Scholarship
          </h2>
          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            <span className="rounded-md border border-blue-600/70 bg-blue-950/80 px-3 py-1 font-mono text-xs font-black tracking-wider text-blue-300 uppercase shadow-inner">
              SCHOLARSHIP APPLICATION &ndash; 2026
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-400">
              &bull; Official Delaware Senior Scholarship Entry
            </span>
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
            <span>Scholarship Eligibility (Checklist Requirements #1, #2, #5)</span>
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
                <strong>1.</strong> Applicant(s) must be a senior attending a public/private/parochial/vocational high school in the State of Delaware. The applicant must be admitted to or seeking admission into a four-year college or university.
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
                <strong>2.</strong> The applicant must be of African American, Hispanic or Native American descent.
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
                <strong>5.</strong> The applicant must have a grade point average of at least 2.75 on a 4.00 scale (official transcript through first semester required).
              </span>
            </label>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. APPLICANT (Page 1) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-4 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30 shrink-0">
              2
            </span>
            <span>Applicant Information (Form Page 1)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">First Name</label>
              <input
                id="applicant-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Madison"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Middle Name</label>
              <input
                id="applicant-middle-name"
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="e.g. Rae"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Last Name</label>
              <input
                id="applicant-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Tymes"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5">Street Address</label>
              <input
                id="applicant-street-address"
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="e.g. 12 Whitehaven Drive"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">City, State and Zip Code</label>
              <div className="grid grid-cols-5 gap-1.5">
                <input
                  id="applicant-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="col-span-2 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                  required
                />
                <input
                  id="applicant-state"
                  type="text"
                  value={stateVal}
                  onChange={(e) => setStateVal(e.target.value)}
                  placeholder="DE"
                  className="col-span-1 rounded-lg px-2 py-2 text-xs sm:text-sm text-white text-center bg-slate-950 border border-slate-800"
                  required
                />
                <input
                  id="applicant-zip"
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="Zip"
                  className="col-span-2 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Telephone Number</label>
              <input
                id="applicant-telephone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="e.g. 302-229-1408"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Sex</label>
              <select
                id="applicant-sex"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
              >
                <option value="F">F (Female)</option>
                <option value="M">M (Male)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Email Address</label>
              <input
                id="applicant-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. maddietymes12@gmail.com"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-400 font-medium mb-1.5">Date of Birth (mm/dd/yyyy)</label>
              <input
                id="applicant-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full sm:w-1/3 rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. PARENT / GUARDIAN (Page 1) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              3
            </span>
            <span>Parent(s) / Guardian(s) Information (Form Page 1)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Parent(s)/Guardian(s) Name</label>
              <input
                id="parent-name"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="e.g. Shira Tymes"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Parent Telephone Number</label>
              <input
                id="parent-phone"
                type="tel"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="e.g. 302-229-1408"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Parent Email Address</label>
              <input
                id="parent-email"
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="e.g. shiratymes@gmail.com"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. SCHOOL & FAMILY CONTEXT (Page 1) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              4
            </span>
            <span>School & Family Demographics (Form Page 1)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Current High School Attending</label>
              <input
                id="school-name"
                type="text"
                value={currentHighSchool}
                onChange={(e) => setCurrentHighSchool(e.target.value)}
                placeholder="e.g. Padua Academy"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Grade Point Average (as of 1/31/2026)</label>
              <input
                id="school-gpa"
                type="text"
                value={gpa}
                onChange={(e) => setGpa(e.target.value)}
                placeholder="e.g. 3.77"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Number of Siblings</label>
              <input
                id="siblings-count"
                type="number"
                min="0"
                value={numberOfSiblings}
                onChange={(e) => setNumberOfSiblings(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5">Number of Immediate Family Members (including yourself)</label>
              <input
                id="family-members-count"
                type="number"
                min="1"
                value={immediateFamilyMembers}
                onChange={(e) => setImmediateFamilyMembers(e.target.value)}
                placeholder="e.g. 2"
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5">
                Number of Immediate Family Members (including yourself) attending college/university for the 2025-2026 academic year
              </label>
              <input
                id="family-in-college"
                type="number"
                min="0"
                value={familyMembersInCollege}
                onChange={(e) => setFamilyMembersInCollege(e.target.value)}
                placeholder="e.g. 1"
                className="w-full sm:w-1/2 rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 5. ACTIVITIES, SERVICE, EMPLOYMENT & COLLEGES */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
                5
              </span>
              <span>Activities, Community Service, Employment & Colleges</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Directly aligned with Page 1 and Page 2 of the official physical form.
            </p>
          </div>

          {/* School Clubs/Activities */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              School Clubs/Activities in which you participate (include leadership positions held)
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
                      placeholder="e.g. Varsity Soccer (4yr)"
                      value={item.activity}
                      onChange={(e) => {
                        const updated = [...activities];
                        updated[index].activity = e.target.value;
                        setActivities(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="e.g. Team Captain / Officer"
                      value={item.role}
                      onChange={(e) => {
                        const updated = [...activities];
                        updated[index].role = e.target.value;
                        setActivities(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
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
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                    {activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setActivities(activities.filter((_, i) => i !== index))}
                        className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Remove"
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
              <span>Add activity/club</span>
            </button>
          </div>

          {/* Community Service/Church/Volunteer Activities */}
          <div className="pt-3 border-t border-slate-800/80">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Community Service/Church/Volunteer Activities
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
                      placeholder="Organization / church (e.g. Habitat for Humanity)"
                      value={item.organization}
                      onChange={(e) => {
                        const updated = [...communityService];
                        updated[index].organization = e.target.value;
                        setCommunityService(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Description of volunteer role"
                      value={item.description}
                      onChange={(e) => {
                        const updated = [...communityService];
                        updated[index].description = e.target.value;
                        setCommunityService(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-3">
                    <input
                      type="number"
                      placeholder="Hours"
                      value={item.totalHours}
                      onChange={(e) => {
                        const updated = [...communityService];
                        updated[index].totalHours = e.target.value;
                        setCommunityService(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                    {communityService.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCommunityService(communityService.filter((_, i) => i !== index))}
                        className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Remove"
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
              <span>Add volunteer activity</span>
            </button>
          </div>

          {/* Applicant's Employment History */}
          <div className="pt-3 border-t border-slate-800/80">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              Applicant&apos;s Employment History (Employers, Positions, Dates of Employment)
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
                      placeholder="Employer (e.g. Nothing Bundt Cakes)"
                      value={item.employer}
                      onChange={(e) => {
                        const updated = [...employment];
                        updated[index].employer = e.target.value;
                        setEmployment(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Position (e.g. Cake Froster / Hostess)"
                      value={item.position}
                      onChange={(e) => {
                        const updated = [...employment];
                        updated[index].position = e.target.value;
                        setEmployment(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Dates (e.g. July 2023 - Oct 2023)"
                      value={item.dates}
                      onChange={(e) => {
                        const updated = [...employment];
                        updated[index].dates = e.target.value;
                        setEmployment(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                    {employment.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setEmployment(employment.filter((_, i) => i !== index))}
                        className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Remove"
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
              <span>Add employer</span>
            </button>
          </div>

          {/* Colleges and Universities applied, accepted and/or waiting */}
          <div className="pt-3 border-t border-slate-800/80">
            <label className="block text-xs sm:text-sm font-semibold text-slate-300 mb-2">
              List the colleges and universities to which you have applied, have been accepted and/or are waiting for acceptance
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
                      placeholder="College / University (e.g. Howard University)"
                      value={item.college}
                      onChange={(e) => {
                        const updated = [...colleges];
                        updated[index].college = e.target.value;
                        setColleges(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="City/State (e.g. Washington DC)"
                      value={item.cityState}
                      onChange={(e) => {
                        const updated = [...colleges];
                        updated[index].cityState = e.target.value;
                        setColleges(updated);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
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
                      className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white capitalize bg-slate-950 border border-slate-800"
                    >
                      <option value="applied">Applied</option>
                      <option value="accepted">Accepted</option>
                      <option value="waiting">Waiting for acceptance</option>
                    </select>
                    {colleges.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setColleges(colleges.filter((_, i) => i !== index))}
                        className="p-2 shrink-0 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Remove"
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
        {/* 6. REFERRAL SOURCE (Page 2) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              6
            </span>
            <span>How did you find out about this scholarship? (Check all that apply &ndash; Page 2)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Select all sources where you learned about The Monday Club Scholarship.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs text-slate-300">
            {[
              'High School',
              'Church',
              'Personal Friend',
              'Another Organization',
              'Parent/Guardian',
              'Family/Friend',
              'Recreation/Community Center',
              'Member of THE MONDAY CLUB',
            ].map((source) => (
              <label
                key={source}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900 transition cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={referralSources.includes(source)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setReferralSources([...referralSources, source]);
                    } else {
                      setReferralSources(referralSources.filter((s) => s !== source));
                    }
                  }}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span className="font-medium text-slate-200">{source}</span>
              </label>
            ))}
          </div>

          {referralSources.includes('Member of THE MONDAY CLUB') && (
            <div className="mt-4 pt-3 border-t border-slate-800/60 max-w-md animate-in fade-in">
              <label className="block text-slate-400 text-xs font-medium mb-1.5">
                Member of THE MONDAY CLUB (Name of member):
              </label>
              <input
                type="text"
                value={mondayClubMemberName}
                onChange={(e) => setMondayClubMemberName(e.target.value)}
                placeholder="Name of Monday Club member"
                className="w-full rounded-lg px-3 py-2 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800"
              />
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 7. ESSAY SUBMISSION (Requirement #6, Page 3: Min 200 Words) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
                7
              </span>
              <span>Essay Submission (Requirement #6 &ndash; Minimum 200 words)</span>
            </h3>
            {/* Live Word Count Indicator */}
            {(() => {
              const count = essayText.trim() ? essayText.trim().split(/\s+/).filter(Boolean).length : 0;
              const isMet = count >= 200;
              return (
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${isMet
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                    : 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                    }`}
                >
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isMet ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>{count} / 200 words required {isMet ? '(Criteria Met)' : `(${200 - count} words left)`}</span>
                </span>
              );
            })()}
          </div>

          <div className="rounded-lg bg-blue-950/30 border border-blue-900/50 p-3 mb-4 text-xs text-slate-300 leading-relaxed">
            <strong className="text-blue-300">Requirement #6 Guidelines (from Form Page 3):</strong>
            <p className="mt-1">
              The applicant is to describe his/her community involvement (church, volunteering &amp; tutorial efforts), school activities (student government, honor society, band, sports, etc.) and proposed goals the applicant wants to accomplish in the next 10 years. The essay must be typed, double-spaced and in 12-point font. The essay will be evaluated on clarity, language usage, content, organization, and topic development. The essays will not be returned.
            </p>
          </div>

          <div>
            <textarea
              id="essay-text"
              rows={9}
              value={essayText}
              onChange={(e) => setEssayText(e.target.value)}
              placeholder="Type your minimum 200-word essay here describing your community involvement, school activities, and 10-year aspirations..."
              className="w-full rounded-lg px-3.5 py-3 text-xs sm:text-sm text-white bg-slate-950 border border-slate-800 leading-relaxed focus:border-blue-500 font-sans"
              required
            />
          </div>
        </div>

        {/* ======================================================== */}
        {/* 8. SUPPORTING DOCUMENTS & CHECKLIST (Page 3) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              8
            </span>
            <span>Supporting Documents &amp; Official Checklist (Form Page 3)</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Upload digital files or verify that documents will be submitted with your completed application packet.
          </p>

          <div className="space-y-4 text-xs sm:text-sm">
            {/* Official transcript */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="block text-slate-300 font-semibold mb-1">
                Requirement #5: Official copy of your transcript through 1st semester (Jan 2026)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">Must verify GPA of at least 2.75 on a 4.00 scale.</p>
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
                <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Attached: {transcript.name}</span>
                </div>
              )}
            </div>

            {/* Student Aid Report */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="block text-slate-300 font-semibold mb-1">
                Requirement #7: Completed and processed copy of the Student Aid Report (SAR) (if available)
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
                <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Attached: {studentAidReport.name}</span>
                </div>
              )}
            </div>

            {/* Three recommendation letters */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="block text-slate-300 font-semibold mb-1">
                Requirement #4: Three letters of recommendation (two from non-relatives)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">Each with signature of the sender/writer over the flap of envelope.</p>
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
                <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{recLetters.length} recommendation letter(s) attached</span>
                </div>
              )}
            </div>

            {/* Extra Documents */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <label className="block text-slate-300 font-semibold mb-1">
                Supplemental Documents &amp; Certificates (Optional)
              </label>
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
                <div className="mt-1.5 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{extraDocs.length} supplemental document(s) uploaded</span>
                </div>
              )}
            </div>

            {/* Official Contact & Mailing Notice */}
            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-900/60 text-xs text-slate-300 space-y-1">
              <div className="font-bold text-blue-300">Physical &amp; Email Delivery Instructions:</div>
              <p>
                All application materials must be emailed to <strong className="text-white">TheMCscholarships@gmail.com</strong> or mailed to <strong className="text-white">4020 New Castle Ave, Wilmington, DE 19720</strong>.
              </p>
              <p className="text-[11px] text-slate-400">
                Questions? Contact Mr. Ken Snell: (302) 521-3798 &bull; Winners notified by May 1, 2026.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 9. THE MONDAY CLUB RULES AND REGULATIONS & DUAL SIGNATURES (Page 2) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-slate-800 bg-[#0f172a] p-5 sm:p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400 border border-blue-500/30">
              9
            </span>
            <span>THE MONDAY CLUB Scholarship Rules and Regulations &amp; Official Signatures (Page 2)</span>
          </h3>

          {/* Rules Statement verbatim from physical form */}
          <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2 mb-4">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              The Monday Club Scholarship Rules and Regulations:
            </div>
            <p>
              The signatures of the persons below indicate accurate and honest information has been submitted and that the completion of this application and the accompanying materials are the work of the applicant. Furthermore, the applicant understands that if selected for a scholarship, the scholarship monies will be disbursed after August 15, 2026. All scholarship checks will be made payable to and sent directly to the college/university where the recipient will be admitted and enrolled, to matriculate. A notation on the scholarship check will indicate the name of the student to which the scholarship money is to be credited and the institution of attendance. Each scholarship recipient will be requested to supply the complete name, address, and telephone number of the business or bursar&apos;s office of the college/university that the recipient will be attending in Fall 2026 to The Monday Club.
            </p>
          </div>

          {/* Acknowledgement Checkboxes */}
          <div className="space-y-3 text-xs sm:text-sm text-slate-300 mb-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="cert-rules"
                type="checkbox"
                checked={rulesAcknowledged}
                onChange={(e) => setRulesAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                I have read, understood, and agree to The Monday Club Scholarship Rules and Regulations.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="cert-accurate"
                type="checkbox"
                checked={isInfoAccurate}
                onChange={(e) => setIsInfoAccurate(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                Accurate and honest information has been submitted and the completion of this application is my own work.
              </span>
            </label>
          </div>

          {/* Applicant Signature & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5 text-xs sm:text-sm">
                Applicant&apos;s Signature (Type Full Legal Name)
              </label>
              <input
                id="applicant-signature"
                type="text"
                value={applicantSignature}
                onChange={(e) => setApplicantSignature(e.target.value)}
                placeholder="e.g. Madison Rae Tymes"
                className="w-full rounded-lg px-3 py-2 text-sm text-white font-mono bg-slate-950 border border-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5 text-xs sm:text-sm">
                Date (Applicant)
              </label>
              <input
                id="applicant-signature-date"
                type="date"
                value={applicantSignatureDate}
                onChange={(e) => setApplicantSignatureDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
          </div>

          {/* Parent/Guardian Permission Statement */}
          <div className="rounded-lg bg-slate-950 p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed mb-4">
            <div className="font-bold text-white uppercase tracking-wider text-[11px] mb-1">
              Parent/Guardian Verification Statement:
            </div>
            <p>
              &ldquo;I hereby verify that I am the parent(s)/guardian(s) of this student and grant permission for his/her participation in this competition and understand the rules above and that the decision of the judges is FINAL.&rdquo;
            </p>
          </div>

          <div className="mb-4 text-xs sm:text-sm text-slate-300">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="cert-permission"
                type="checkbox"
                checked={parentGrantsPermission}
                onChange={(e) => setParentGrantsPermission(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <span className="leading-relaxed">
                I hereby verify that I am the parent(s)/guardian(s) of this student and grant permission for his/her participation in this competition and understand that the decision of the judges is FINAL.
              </span>
            </label>
          </div>

          {/* Parent Signature & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1.5 text-xs sm:text-sm">
                Parent/Guardian&apos;s Signature (Type Full Legal Name)
              </label>
              <input
                id="parent-signature"
                type="text"
                value={parentSignature}
                onChange={(e) => setParentSignature(e.target.value)}
                placeholder="e.g. Shira Tymes"
                className="w-full rounded-lg px-3 py-2 text-sm text-white font-mono bg-slate-950 border border-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 font-medium mb-1.5 text-xs sm:text-sm">
                Date (Parent/Guardian)
              </label>
              <input
                id="parent-signature-date"
                type="date"
                value={parentSignatureDate}
                onChange={(e) => setParentSignatureDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white bg-slate-950 border border-slate-800"
                required
              />
            </div>
          </div>

          {/* Centered Footer Motto from Physical Form */}
          <div className="text-center py-2 text-xs font-serif italic text-amber-300/80 border-t border-slate-800/80 mb-5">
            &ldquo;Spanning Three Centuries!&rdquo;
          </div>

          {/* Submit Action & Validation Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-slate-800/80">
            <button
              id="btn-submit-application"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Evaluating AI Rubric &amp; Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Official Application</span>
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


    </div>
  );
}
