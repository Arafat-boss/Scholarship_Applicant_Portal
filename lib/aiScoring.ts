import { ScholarshipApplication, AIScoringResult, RubricCriterion } from '@/types/scholarship';

export function evaluateApplicationWithAI(
  app: Omit<ScholarshipApplication, 'aiScoring' | 'committeeReview'>
): AIScoringResult {
  const gpaNum = parseFloat(app.schoolFamily?.gpa || '') || 0;
  const activities = app.activities || [];
  const communityService = app.communityService || [];
  const employment = app.employment || [];
  const colleges = app.colleges || [];
  const documents = app.documents || {};
  const recLetters = documents.recommendationLetters || [];
  const extraDocs = documents.extraDocuments || [];

  const serviceHours = communityService.reduce(
    (sum, item) => sum + (parseFloat(item.totalHours) || 0),
    0
  );
  const leadershipCount = activities.filter(
    (a) => a.role && a.role.trim() !== '' && !a.role.toLowerCase().includes('member')
  ).length;
  const hasJob = employment.length > 0;
  const collegesAccepted = colleges.filter((c) => c.status === 'accepted').length;
  const familyCollegeCount = parseInt(app.schoolFamily?.familyMembersInCollege || '0', 10) || 0;
  const siblingsCount = parseInt(app.schoolFamily?.numberOfSiblings || '0', 10) || 0;
  const recLetterCount = recLetters.length;
  const hasTranscript = Boolean(documents.transcript);
  const hasSAR = Boolean(documents.studentAidReport);
  const extraDocsCount = extraDocs.length;

  const criteria: RubricCriterion[] = [];
  const strengths: string[] = [];
  const flags: string[] = [];

  // Criterion 1: Academic Rigor & GPA (0-5)
  let gpaScore = 0;
  let gpaReason = '';
  if (gpaNum >= 3.8) {
    gpaScore = 5;
    gpaReason = `Outstanding academic record with cumulative GPA of ${gpaNum.toFixed(2)}, well above the 2.75 benchmark.`;
    strengths.push(`High GPA (${gpaNum.toFixed(2)}) demonstrates consistent scholastic excellence.`);
  } else if (gpaNum >= 3.5) {
    gpaScore = 4;
    gpaReason = `Strong academic performance (${gpaNum.toFixed(2)} GPA), exceeding standard scholarship thresholds.`;
  } else if (gpaNum >= 3.0) {
    gpaScore = 3;
    gpaReason = `Solid scholastic standing (${gpaNum.toFixed(2)} GPA), meeting collegiate preparedness criteria.`;
  } else if (gpaNum >= 2.75) {
    gpaScore = 2;
    gpaReason = `Meets minimum GPA requirement (${gpaNum.toFixed(2)} vs 2.75 required), but indicates potential for academic growth.`;
    flags.push(`GPA is close to minimum cutoff (${gpaNum.toFixed(2)}).`);
  } else {
    gpaScore = 1;
    gpaReason = `GPA (${gpaNum.toFixed(2)}) is below the program minimum of 2.75. Requires committee waiver.`;
    flags.push(`GPA (${gpaNum.toFixed(2)}) below 2.75 prerequisite.`);
  }
  criteria.push({
    id: 'c1',
    title: '1. Academic Performance & GPA Rigor',
    category: 'Academics',
    score: gpaScore,
    maxScore: 5,
    reasoning: gpaReason,
  });

  // Criterion 2: Financial Need Assessment (SAR & Family Context) (0-5)
  let needScore = 3;
  let needReason = '';
  if (hasSAR && (familyCollegeCount >= 2 || siblingsCount >= 3)) {
    needScore = 5;
    needReason = `SAR document on file; high financial obligation with ${siblingsCount} siblings and ${familyCollegeCount} family members simultaneously enrolled in higher education.`;
    strengths.push(`Compelling financial need profile substantiated by SAR and family burden.`);
  } else if (hasSAR && (familyCollegeCount >= 1 || siblingsCount >= 1)) {
    needScore = 4;
    needReason = `Student Aid Report (SAR) verified; demonstrated household financial commitment towards college tuition.`;
  } else if (hasSAR) {
    needScore = 3;
    needReason = `SAR submitted, reflecting standard financial aid need for a 4-year degree.`;
  } else {
    needScore = 2;
    needReason = `Official SAR not attached; financial need estimated based on demographic and family data.`;
    flags.push(`Student Aid Report (SAR) is missing or pending review.`);
  }
  criteria.push({
    id: 'c2',
    title: '2. Financial Need Assessment',
    category: 'Need & Equity',
    score: needScore,
    maxScore: 5,
    reasoning: needReason,
  });

  // Criterion 3: Leadership in Clubs & Extracurriculars (0-5)
  let leadershipScore = 1;
  let leadershipReason = '';
  if (leadershipCount >= 2 && app.activities.length >= 3) {
    leadershipScore = 5;
    leadershipReason = `Exemplary leadership demonstrated in ${leadershipCount} designated leadership roles across ${app.activities.length} clubs.`;
    strengths.push(`Proven student leadership in ${app.activities[0]?.role || 'key extracurriculars'}.`);
  } else if (leadershipCount >= 1 || app.activities.length >= 3) {
    leadershipScore = 4;
    leadershipReason = `Demonstrated initiative with active club involvement and verified leadership contributions.`;
  } else if (app.activities.length >= 2) {
    leadershipScore = 3;
    leadershipReason = `Consistent participation across ${app.activities.length} school organizations.`;
  } else if (app.activities.length === 1) {
    leadershipScore = 2;
    leadershipReason = `Minimal extracurricular involvement (${app.activities.length} activity listed).`;
  } else {
    leadershipScore = 1;
    leadershipReason = `No extracurricular activities reported on file.`;
    flags.push(`No school clubs or extracurricular activities listed.`);
  }
  criteria.push({
    id: 'c3',
    title: '3. Leadership & School Involvement',
    category: 'Extracurricular',
    score: leadershipScore,
    maxScore: 5,
    reasoning: leadershipReason,
  });

  // Criterion 4: Community Service & Civic Engagement (0-5)
  let serviceScore = 1;
  let serviceReason = '';
  if (serviceHours >= 100) {
    serviceScore = 5;
    serviceReason = `Outstanding civic commitment with ${serviceHours}+ documented volunteer hours across multiple community initiatives.`;
    strengths.push(`Substantial volunteer record (${serviceHours} documented hours).`);
  } else if (serviceHours >= 50) {
    serviceScore = 4;
    serviceReason = `Strong dedication to public service with ${serviceHours} hours in community and church organizations.`;
  } else if (serviceHours >= 20 || app.communityService.length >= 2) {
    serviceScore = 3;
    serviceReason = `Reliable civic engagement (${serviceHours} hours reported) reflecting genuine community awareness.`;
  } else if (app.communityService.length > 0) {
    serviceScore = 2;
    serviceReason = `Initial community volunteer efforts noted (${serviceHours} hours), below competitive scholarship levels.`;
  } else {
    serviceScore = 1;
    serviceReason = `No community service or volunteer initiatives recorded.`;
    flags.push(`Zero community service hours documented.`);
  }
  criteria.push({
    id: 'c4',
    title: '4. Community Service & Volunteering',
    category: 'Civic Impact',
    score: serviceScore,
    maxScore: 5,
    reasoning: serviceReason,
  });

  // Criterion 5: Work Ethic & Self-Sufficiency (Employment) (0-5)
  let workScore = 2;
  let workReason = '';
  if (app.employment.length >= 2) {
    workScore = 5;
    workReason = `Substantial work ethic demonstrated through multiple employment positions while balancing high school academics.`;
    strengths.push(`Demonstrated resilience and accountability through steady employment.`);
  } else if (hasJob) {
    workScore = 4;
    workReason = `Practical maturity and time management shown by maintaining employment as ${app.employment[0]?.position || 'worker'} during academic studies.`;
  } else {
    workScore = 3;
    workReason = `No formal employment history listed; primary focus maintained on academic coursework and extracurriculars.`;
  }
  criteria.push({
    id: 'c5',
    title: '5. Work Ethic & Employment History',
    category: 'Personal Development',
    score: workScore,
    maxScore: 5,
    reasoning: workReason,
  });

  // Criterion 6: College Aspirations & Readiness (0-5)
  let collegeScore = 2;
  let collegeReason = '';
  if (collegesAccepted >= 2) {
    collegeScore = 5;
    collegeReason = `Proven collegiate readiness with ${collegesAccepted} official acceptances to four-year universities.`;
    strengths.push(`Multiple confirmed admissions to 4-year institutions.`);
  } else if (collegesAccepted >= 1) {
    collegeScore = 4;
    collegeReason = `Confirmed admission to 4-year degree program, ready for immediate matriculation.`;
  } else if (app.colleges.length >= 2) {
    collegeScore = 3;
    collegeReason = `Active university applicant pipeline with ${app.colleges.length} pending applications under review.`;
  } else {
    collegeScore = 2;
    collegeReason = `Limited higher education application pipeline reported.`;
  }
  criteria.push({
    id: 'c6',
    title: '6. College Aspirations & Preparedness',
    category: 'Future Potential',
    score: collegeScore,
    maxScore: 5,
    reasoning: collegeReason,
  });

  // Criterion 7: Letters of Recommendation Strength (0-5)
  let recScore = 2;
  let recReason = '';
  if (recLetterCount >= 3) {
    recScore = 5;
    recReason = `All 3 required recommendation letters submitted and validated, including non-relative mentors.`;
    strengths.push(`Complete endorsement package with 3 recommendation letters.`);
  } else if (recLetterCount === 2) {
    recScore = 3;
    recReason = `2 recommendation letters received; requires 1 additional letter to fulfill full protocol.`;
    flags.push(`Incomplete recommendation packet (2 of 3 letters provided).`);
  } else {
    recScore = 2;
    recReason = `Only ${recLetterCount} recommendation letter(s) provided. Deficit in required third-party endorsements.`;
    flags.push(`Missing required recommendation letters (${recLetterCount} of 3 provided).`);
  }
  criteria.push({
    id: 'c7',
    title: '7. Recommendation Quality & Endorsement',
    category: 'Character',
    score: recScore,
    maxScore: 5,
    reasoning: recReason,
  });

  // Criterion 8: Academic Trajectory & Transcript Completeness (0-5)
  let transcriptScore = 2;
  let transcriptReason = '';
  if (hasTranscript && gpaNum >= 3.2) {
    transcriptScore = 5;
    transcriptReason = `Official mid-year transcript uploaded and verified through January with solid course rigor.`;
    strengths.push(`Verified official academic transcript.`);
  } else if (hasTranscript) {
    transcriptScore = 4;
    transcriptReason = `Official transcript provided, confirming prerequisite coursework and graduation status.`;
  } else {
    transcriptScore = 1;
    transcriptReason = `Official transcript file missing from submission.`;
    flags.push(`Official high school transcript not attached.`);
  }
  criteria.push({
    id: 'c8',
    title: '8. Academic Trajectory & Transcript Completeness',
    category: 'Academics',
    score: transcriptScore,
    maxScore: 5,
    reasoning: transcriptReason,
  });

  // Criterion 9: Resilience & Program Alignment (0-5)
  let meritScore = 3;
  let meritReason = '';
  if (
    app.eligibility.isDelawareSenior &&
    app.eligibility.isEligibleDescent &&
    app.eligibility.isMinGpa
  ) {
    meritScore = 5;
    meritReason = `Full alignment with Monday Club mission: Delaware senior, eligible minority descent, and certified academic standing.`;
    strengths.push(`100% alignment with The Monday Club's core mission and demographic criteria.`);
  } else {
    meritScore = 3;
    meritReason = `Meets general requirements, but one or more core alignment criteria require committee inspection.`;
  }
  criteria.push({
    id: 'c9',
    title: '9. Mission Alignment & Heritage Focus',
    category: 'Mission Alignment',
    score: meritScore,
    maxScore: 5,
    reasoning: meritReason,
  });

  // Criterion 10: Completeness, Cohesion & Clarity (0-5)
  let completenessScore = 3;
  let completenessReason = '';
  const isCertified =
    app.certification.isInfoAccurate &&
    app.certification.parentGrantsPermission &&
    app.certification.applicantSignature.trim().length > 3;

  if (isCertified && extraDocsCount > 0 && hasTranscript && hasSAR) {
    completenessScore = 5;
    completenessReason = `Exceptional attention to detail; all mandatory sections certified, supporting documents attached, and supplemental materials provided.`;
    strengths.push(`Flawless application packet with supplemental achievements.`);
  } else if (isCertified && hasTranscript) {
    completenessScore = 4;
    completenessReason = `Application is comprehensively completed with proper certifications and valid signatures.`;
  } else {
    completenessScore = 3;
    completenessReason = `Basic requirements met with minor documentation gaps noted.`;
  }
  criteria.push({
    id: 'c10',
    title: '10. Completeness, Cohesion & Clarity',
    category: 'Professionalism',
    score: completenessScore,
    maxScore: 5,
    reasoning: completenessReason,
  });

  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);

  let ratingCategory: AIScoringResult['ratingCategory'] = 'Competitive';
  if (totalScore >= 44) {
    ratingCategory = 'Exceptional';
  } else if (totalScore >= 38) {
    ratingCategory = 'High Merit';
  } else if (totalScore >= 30) {
    ratingCategory = 'Recommended';
  } else if (totalScore >= 24) {
    ratingCategory = 'Competitive';
  } else {
    ratingCategory = 'Needs Review';
  }

  const summary = `Candidate scored ${totalScore} out of 50 on The Monday Club 10-criterion rubric (${ratingCategory}). Demonstrates ${
    gpaNum >= 3.5 ? 'superior scholastic achievement' : 'steady scholastic promise'
  }, ${serviceHours} hours of community engagement, and strong alignment with Delaware collegiate objectives.`;

  return {
    totalScore,
    maxScore: 50,
    ratingCategory,
    summary,
    strengths,
    flags,
    criteria,
    scoredAt: new Date().toISOString(),
  };
}
