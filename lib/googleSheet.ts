import { ScholarshipApplication } from '@/types/scholarship';

export const GOOGLE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1AHMFiMT6QsKECxJnUL1WqP0c0pOu6rWzPejKPlOwfgQ/edit?usp=sharing';
export const GOOGLE_SHEET_ID = '1AHMFiMT6QsKECxJnUL1WqP0c0pOu6rWzPejKPlOwfgQ';

export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbyrPJ7VK5FDb5dgWCBiZaYZWvssJIbslLwA-U7p8X0YMSHHhuF4fwQs8adxqd9Ske0/exec';

const WEBHOOK_STORAGE_KEY = 'mc_google_sheet_webhook_url';

export function getStoredWebhookUrl(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(WEBHOOK_STORAGE_KEY) || DEFAULT_WEBHOOK_URL;
  }
  return DEFAULT_WEBHOOK_URL;
}

export async function saveStoredWebhookUrl(url: string) {
  const trimmed = url.trim();
  if (typeof window !== 'undefined') {
    if (trimmed) {
      localStorage.setItem(WEBHOOK_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(WEBHOOK_STORAGE_KEY);
    }
  }

  try {
    const res = await fetch('/api/google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveWebhook', webhookUrl: trimmed }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to save webhook to server:', err);
    return { success: false };
  }
}

export async function sendApplicationToGoogleSheet(
  app: ScholarshipApplication
): Promise<{ success: boolean; message: string; webhookConfigured?: boolean }> {
  try {
    const webhookUrl = getStoredWebhookUrl();
    const res = await fetch('/api/google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        application: app,
        webhookUrl: webhookUrl || undefined,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to sync to Google Sheet:', err);
    return {
      success: false,
      message: 'Network error communicating with Google Sheet API',
    };
  }
}

export async function deleteApplicationFromGoogleSheet(
  applicationNumber: string,
  id: string
): Promise<{ success: boolean; message: string; deleted?: boolean; webhookConfigured?: boolean }> {
  try {
    const webhookUrl = getStoredWebhookUrl();
    const res = await fetch('/api/google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        applicationNumber,
        id,
        webhookUrl: webhookUrl || undefined,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to delete from Google Sheet:', err);
    return {
      success: false,
      message: 'Network error deleting from Google Sheet',
    };
  }
}

export async function syncAllToGoogleSheet(
  applications: ScholarshipApplication[]
): Promise<{ success: boolean; message: string; count?: number; webhookConfigured?: boolean }> {
  try {
    const webhookUrl = getStoredWebhookUrl();
    const res = await fetch('/api/google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAll',
        applications,
        webhookUrl: webhookUrl || undefined,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to sync all to Google Sheet:', err);
    return {
      success: false,
      message: 'Network error syncing all to Google Sheet',
    };
  }
}

export async function fetchApplicationsFromGoogleSheet(): Promise<{
  success: boolean;
  applications?: ScholarshipApplication[];
  count?: number;
  message?: string;
  source?: string;
}> {
  try {
    const webhookUrl = getStoredWebhookUrl();
    const res = await fetch('/api/google-sheet?action=fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fetchAll',
        webhookUrl: webhookUrl || undefined,
      }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Failed to fetch applications from Google Sheet:', err);
    return {
      success: false,
      message: 'Network error communicating with Google Sheet API',
    };
  }
}

export function parseGoogleSheetCsv(csvText: string): ScholarshipApplication[] {
  const p: string[][] = [];
  let row: string[] = [''];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') {
        i++;
      }
      p.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') {
    p.push(row);
  }

  if (p.length <= 1) return [];

  const applications: ScholarshipApplication[] = [];

  for (let i = 1; i < p.length; i++) {
    const r = p[i];
    if (!r[0] || !r[0].trim()) continue;

    const appNumber = r[0].trim();
    const subDate = r[1] ? new Date(r[1]).toISOString() : new Date().toISOString();
    const firstName = r[2]?.trim() || '';
    const lastName = r[3]?.trim() || '';
    const email = r[4]?.trim() || '';
    const phone = r[5]?.trim() || '';
    const highSchool = r[6]?.trim() || '';
    const gpa = r[7]?.trim() || '3.00';
    const siblings = r[8]?.trim() || '0';
    const inCollege = r[9]?.trim() || '0';
    const serviceHours = r[11]?.trim() || '0';
    const collegesRaw = r[12]?.trim() || '';
    const aiScore = parseInt(r[14]?.trim() || '0', 10) || 0;
    const aiTier = (r[15]?.trim() || 'RECOMMENDED') as ScholarshipApplication['aiScoring']['ratingCategory'];
    const status = (r[16]?.trim() || 'Under Review') as ScholarshipApplication['committeeReview']['status'];
    const reviewerScore = parseInt(r[17]?.trim() || '0', 10) || aiScore;
    const reviewerName = r[18]?.trim() || 'Selection Committee';
    const committeeNotes = r[19]?.trim() || '';
    const appId = r[20]?.trim() || `app-${i}`;

    applications.push({
      id: appId,
      applicationNumber: appNumber,
      submittedAt: subDate,
      eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
      applicant: {
        firstName,
        lastName,
        streetAddress: 'Address on file',
        city: 'Delaware',
        state: 'DE',
        zip: '19801',
        telephone: phone,
        email,
        dateOfBirth: '2008-01-01',
      },
      parentGuardian: {
        fullName: `Guardian of ${firstName}`,
        phone,
        email,
      },
      schoolFamily: {
        currentHighSchool: highSchool,
        gpa,
        numberOfSiblings: siblings,
        immediateFamilyMembers: '3',
        familyMembersInCollege: inCollege,
      },
      activities: [],
      communityService: [
        {
          id: 'cs-1',
          organization: 'Community Service',
          description: 'Documented volunteer hours',
          totalHours: serviceHours,
        },
      ],
      employment: [],
      colleges: collegesRaw
        ? collegesRaw.split(';').map((c, idx) => ({
            id: `col-${idx}`,
            college: c.trim(),
            cityState: 'DE',
            status: 'accepted' as const,
          }))
        : [],
      documents: {
        transcript: { name: 'Transcript_on_file.pdf', size: 1500000, type: 'application/pdf', uploadedAt: subDate },
        studentAidReport: { name: 'SAR_Report_on_file.pdf', size: 900000, type: 'application/pdf', uploadedAt: subDate },
        recommendationLetters: [
          { name: 'Recommendation_Letter_1.pdf', size: 400000, type: 'application/pdf', uploadedAt: subDate },
        ],
        extraDocuments: [],
      },
      certification: {
        isInfoAccurate: true,
        parentGrantsPermission: true,
        applicantSignature: `${firstName} ${lastName}`,
      },
      aiScoring: {
        totalScore: aiScore,
        maxScore: 50,
        ratingCategory: aiTier,
        summary: `Applicant from ${highSchool} with ${gpa} GPA and ${serviceHours} community service hours.`,
        strengths: [`Strong academic performance: ${gpa} GPA`, `Dedicated volunteer: ${serviceHours} service hours`],
        flags: [],
        criteria: [
          { id: 'c1', title: '1. Academic Performance & GPA Rigor', category: 'Academics', score: Math.min(5, Math.max(1, Math.round(parseFloat(gpa) * 1.25))), maxScore: 5, reasoning: `Cumulative GPA: ${gpa}` },
          { id: 'c4', title: '4. Community Service & Civic Impact', category: 'Community', score: Math.min(5, Math.max(1, Math.round(parseFloat(serviceHours) / 30))), maxScore: 5, reasoning: `${serviceHours} documented volunteer hours.` },
        ],
        scoredAt: subDate,
      },
      committeeReview: {
        status,
        reviewerScore,
        reviewerName,
        committeeNotes,
        reviewedAt: subDate,
      },
    });
  }

  return applications;
}

export const GOOGLE_APPS_SCRIPT_CODE = `// ==========================================================================
// Google Apps Script for The Monday Club Scholarship Portal
// Connected Spreadsheet ID: 1AHMFiMT6QsKECxJnUL1WqP0c0pOu6rWzPejKPlOwfgQ
// ==========================================================================
// INSTRUCTIONS FOR 2-WAY LIVE SYNC:
// 1. In your Google Sheet, click "Extensions" > "Apps Script"
// 2. Select All and Delete existing code, then Paste this entire code
// 3. Click "Deploy" > "Manage deployments" > Click the Pencil Edit icon
// 4. Select Version: "New version"
// 5. Click "Deploy"
// Now, your Google Sheet and Reviewer Portal are 100% in sync!
// ==========================================================================

function getSheetApplications(sheet) {
  var rows = sheet.getDataRange().getValues();
  var apps = [];
  if (!rows || rows.length <= 1) return apps;
  
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] || String(r[0]).trim() === "") continue;
    
    var appNumber = String(r[0]).trim();
    var subDate = r[1] ? new Date(r[1]).toISOString() : new Date().toISOString();
    var firstName = String(r[2] || "").trim();
    var lastName = String(r[3] || "").trim();
    var email = String(r[4] || "").trim();
    var phone = String(r[5] || "").trim();
    var highSchool = String(r[6] || "").trim();
    var gpa = String(r[7] || "3.00").trim();
    var siblings = String(r[8] || "0").trim();
    var inCollege = String(r[9] || "0").trim();
    var serviceHours = String(r[11] || "0").trim();
    var collegesRaw = String(r[12] || "").trim();
    var aiScore = parseInt(r[14], 10) || 0;
    var aiTier = String(r[15] || "RECOMMENDED").trim();
    var status = String(r[16] || "Under Review").trim();
    var reviewerScore = parseInt(r[17], 10) || aiScore;
    var reviewerName = String(r[18] || "Selection Committee").trim();
    var notes = String(r[19] || "").trim();
    var appId = String(r[20] || ("app-" + i)).trim();
    
    apps.push({
      id: appId,
      applicationNumber: appNumber,
      submittedAt: subDate,
      eligibility: { isDelawareSenior: true, isEligibleDescent: true, isMinGpa: true },
      applicant: {
        firstName: firstName,
        lastName: lastName,
        streetAddress: "Address on file",
        city: "Delaware",
        state: "DE",
        zip: "19801",
        telephone: phone,
        email: email,
        dateOfBirth: "2008-01-01"
      },
      parentGuardian: {
        fullName: "Guardian of " + firstName,
        phone: phone,
        email: email
      },
      schoolFamily: {
        currentHighSchool: highSchool,
        gpa: gpa,
        numberOfSiblings: siblings,
        immediateFamilyMembers: "3",
        familyMembersInCollege: inCollege
      },
      activities: [],
      communityService: [
        { id: "cs-1", organization: "Community Service", description: "Verified service hours", totalHours: serviceHours }
      ],
      employment: [],
      colleges: collegesRaw ? collegesRaw.split(";").map(function(c, idx) {
        return { id: "col-" + idx, college: c.trim(), cityState: "DE", status: "accepted" };
      }) : [],
      documents: { recommendationLetters: [], extraDocuments: [] },
      certification: { isInfoAccurate: true, parentGrantsPermission: true, applicantSignature: firstName + " " + lastName },
      aiScoring: {
        totalScore: aiScore,
        ratingCategory: aiTier,
        summary: "Applicant from " + highSchool + " with " + gpa + " GPA and " + serviceHours + " service hours.",
        criteria: [
          { id: "c1", title: "1. Academic Performance & GPA Rigor", category: "Academics", score: Math.min(5, Math.max(1, Math.round(parseFloat(gpa) * 1.25))), maxScore: 5, reasoning: "GPA: " + gpa },
          { id: "c4", title: "4. Community Service & Civic Impact", category: "Community", score: Math.min(5, Math.max(1, Math.round(parseFloat(serviceHours) / 30))), maxScore: 5, reasoning: serviceHours + " documented hours." }
        ]
      },
      committeeReview: {
        status: status,
        reviewerScore: reviewerScore,
        reviewerName: reviewerName,
        committeeNotes: notes,
        reviewedAt: subDate
      }
    });
  }
  return apps;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Ensure header row exists with styling
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Application Number", "Submitted Date", "First Name", "Last Name",
        "Email", "Telephone", "High School", "GPA", "Siblings",
        "Family in College", "Clubs Count", "Service Hours", "Colleges Applied",
        "Colleges Accepted", "AI Score (0-50)", "AI Tier", "Committee Status",
        "Committee Score", "Reviewer Name", "Committee Notes", "ID"
      ]);
      var headerRange = sheet.getRange(1, 1, 1, 21);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0f172a");
      headerRange.setFontColor("#60a5fa");
      sheet.setFrozenRows(1);
    }
    
    // ----------------------------------------------------------------------
    // 1. FETCH ALL APPLICATIONS (Return all rows from Google Sheet)
    // ----------------------------------------------------------------------
    if (data.action === "fetchAll" || data.action === "get" || data.action === "fetch") {
      var allApps = getSheetApplications(sheet);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: allApps.length,
        applications: allApps
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ----------------------------------------------------------------------
    // 2. ADD / UPDATE APPLICATION
    // ----------------------------------------------------------------------
    if (data.action === "add") {
      var app = data.application;
      var rows = sheet.getDataRange().getValues();
      var existingRowIndex = -1;
      
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == app.applicationNumber || rows[i][20] == app.id) {
          existingRowIndex = i + 1;
          break;
        }
      }
      
      var serviceHours = 0;
      if (app.communityService && app.communityService.length > 0) {
        serviceHours = app.communityService.reduce(function(acc, cs){
          return acc + (parseFloat(cs.totalHours) || 0);
        }, 0);
      }
      
      var collegesList = "";
      var acceptedCount = 0;
      if (app.colleges && app.colleges.length > 0) {
        collegesList = app.colleges.map(function(c){ return c.college + " (" + c.status + ")"; }).join("; ");
        acceptedCount = app.colleges.filter(function(c){ return c.status === "accepted"; }).length;
      }
      
      var rowData = [
        app.applicationNumber,
        app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : new Date().toLocaleDateString(),
        app.applicant ? app.applicant.firstName : "",
        app.applicant ? app.applicant.lastName : "",
        app.applicant ? app.applicant.email : "",
        app.applicant ? app.applicant.telephone : "",
        app.schoolFamily ? app.schoolFamily.currentHighSchool : "",
        app.schoolFamily ? app.schoolFamily.gpa : "",
        app.schoolFamily ? app.schoolFamily.numberOfSiblings : "",
        app.schoolFamily ? app.schoolFamily.familyMembersInCollege : "",
        app.activities ? app.activities.length : 0,
        serviceHours,
        collegesList,
        acceptedCount,
        app.aiScoring ? app.aiScoring.totalScore : 0,
        app.aiScoring ? app.aiScoring.ratingCategory : "",
        app.committeeReview ? app.committeeReview.status : "Under Review",
        app.committeeReview && app.committeeReview.reviewerScore !== undefined ? app.committeeReview.reviewerScore : "",
        app.committeeReview ? (app.committeeReview.reviewerName || "") : "",
        app.committeeReview ? (app.committeeReview.committeeNotes || "") : "",
        app.id || ""
      ];
      
      if (existingRowIndex > 0) {
        sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Successfully added/updated in Google Sheet"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ----------------------------------------------------------------------
    // 3. DELETE APPLICATION
    // ----------------------------------------------------------------------
    if (data.action === "delete") {
      var appNumber = data.applicationNumber;
      var appId = data.id;
      var dRows = sheet.getDataRange().getValues();
      var deleted = false;
      
      for (var k = dRows.length - 1; k >= 1; k--) {
        if ((appNumber && String(dRows[k][0]).trim() === String(appNumber).trim()) ||
            (appId && String(dRows[k][20]).trim() === String(appId).trim())) {
          sheet.deleteRow(k + 1);
          deleted = true;
          break;
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        deleted: deleted,
        message: deleted ? "Row successfully deleted from Google Sheet" : "Row not found in Google Sheet"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ----------------------------------------------------------------------
    // 4. BULK SYNC ALL APPLICATIONS
    // ----------------------------------------------------------------------
    if (data.action === "syncAll") {
      var apps = data.applications || [];
      if (sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
      }
      
      for (var j = 0; j < apps.length; j++) {
        var a = apps[j];
        var sh = 0;
        if (a.communityService && a.communityService.length > 0) {
          sh = a.communityService.reduce(function(acc, cs){
            return acc + (parseFloat(cs.totalHours) || 0);
          }, 0);
        }
        var cl = "";
        var ac = 0;
        if (a.colleges && a.colleges.length > 0) {
          cl = a.colleges.map(function(c){ return c.college + " (" + c.status + ")"; }).join("; ");
          ac = a.colleges.filter(function(c){ return c.status === "accepted"; }).length;
        }
        sheet.appendRow([
          a.applicationNumber,
          a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : new Date().toLocaleDateString(),
          a.applicant ? a.applicant.firstName : "",
          a.applicant ? a.applicant.lastName : "",
          a.applicant ? a.applicant.email : "",
          a.applicant ? a.applicant.telephone : "",
          a.schoolFamily ? a.schoolFamily.currentHighSchool : "",
          a.schoolFamily ? a.schoolFamily.gpa : "",
          a.schoolFamily ? a.schoolFamily.numberOfSiblings : "",
          a.schoolFamily ? a.schoolFamily.familyMembersInCollege : "",
          a.activities ? a.activities.length : 0,
          sh,
          cl,
          ac,
          a.aiScoring ? a.aiScoring.totalScore : 0,
          a.aiScoring ? a.aiScoring.ratingCategory : "",
          a.committeeReview ? a.committeeReview.status : "Under Review",
          a.committeeReview && a.committeeReview.reviewerScore !== undefined ? a.committeeReview.reviewerScore : "",
          a.committeeReview ? (a.committeeReview.reviewerName || "") : "",
          a.committeeReview ? (a.committeeReview.committeeNotes || "") : "",
          a.id || ""
        ]);
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        count: apps.length,
        message: "All " + apps.length + " records synced to Google Sheet"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Unrecognized action: " + data.action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var apps = getSheetApplications(sheet);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      count: apps.length,
      applications: apps
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
`;
