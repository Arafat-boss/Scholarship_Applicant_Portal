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

export const GOOGLE_APPS_SCRIPT_CODE = `// ==========================================================================
// Google Apps Script for The Monday Club Scholarship Portal
// Connected Spreadsheet ID: 1AHMFiMT6QsKECxJnUL1WqP0c0pOu6rWzPejKPlOwfgQ
// ==========================================================================
// INSTRUCTIONS:
// 1. In your Google Sheet, click "Extensions" > "Apps Script"
// 2. Delete everything and paste this entire code
// 3. Click "Deploy" > "New deployment"
// 4. Select type: "Web app"
// 5. Description: "Scholarship Portal Sync"
// 6. Execute as: "Me"
// 7. Who has access: "Anyone"
// 8. Click "Deploy" and copy the Web App URL (ends in /exec)
// 9. Paste that URL into the Google Sheet Settings in Reviewer Dashboard!
// ==========================================================================

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
    // 1. ADD / UPDATE APPLICATION
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
    // 2. DELETE APPLICATION
    // ----------------------------------------------------------------------
    if (data.action === "delete") {
      var appNumber = data.applicationNumber;
      var appId = data.id;
      var rows = sheet.getDataRange().getValues();
      var deleted = false;
      
      for (var k = rows.length - 1; k >= 1; k--) {
        if ((appNumber && String(rows[k][0]).trim() === String(appNumber).trim()) ||
            (appId && String(rows[k][20]).trim() === String(appId).trim())) {
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
    // 3. BULK SYNC ALL APPLICATIONS
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
  return ContentService.createTextOutput(JSON.stringify({
    status: "ok",
    message: "The Monday Club Google Sheet Webhook is active and listening!"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;
