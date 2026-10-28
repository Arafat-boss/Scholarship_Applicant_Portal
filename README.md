# Scholarship_Applicant_Portal

Official **The Monday Club Scholarship Portal** — Custom Full-Stack Web Application built with Next.js 16 (Turbopack), React 19, and Tailwind CSS v4.

## 🚀 Key Features

- **8-Section Comprehensive Applicant Form**:
  1. Eligibility Check (Delaware High School Senior, Minority descent, Min 2.75 GPA)
  2. Applicant Details (Contact, Address, DOB)
  3. Parent / Guardian Info
  4. School & Family Need Metrics (GPA, Siblings, Family in College)
  5. Dynamic List Items (School Clubs & Leadership, Community Service & Hours, Employment History, Colleges & Universities with live `+ Add` / remove)
  6. Document Uploads (Transcript, Student Aid Report [SAR], Recommendation Letters)
  7. Extra Supporting Documents
  8. Certification, Parental Consent & Digital Signature
- **AI-Assisted 10-Criterion Rubric Scoring (0–50 Scale)**:
  - Automatically analyzes application data against 10 specific criteria (0–5 pts each, 50 pts total)
  - Provides clear evaluation summary, strengths, and flags to assist the selection committee.
- **Reviewer & Committee Dashboard**:
  - **Passcode Protection**: Restricted committee access gate (default demo passcode: `monday2026`) with session persistence and quick session-locking.
  - Real-time KPI metrics (Total Applications, Under Review, Approved, Avg GPA, Avg AI Score)
  - Search by Name, High School, or Email
  - Filter by Status and AI Tier
  - Full Application Inspection modal with side-by-side profile view & AI breakdown
  - Human reviewer score override (0–50) and committee deliberation notes
- **Google Sheet Live Sync**:
  - Automatically records applicant submissions, committee decisions, and real-time deletion synchronization directly to Google Sheets.
- **Wix & Embed-Ready Architecture**:
  - Headerless & footerless clean widget style for seamless iFrame embedding into Wix or external sites.

## 🛠️ Tech Stack

- **Framework**: Next.js 16.4.3 (App Router & Turbopack)
- **UI Library**: React 19.3.0
- **Styling**: Tailwind CSS v4 (CSS-first engine)
- **Icons**: Lucide React
- **Language**: TypeScript 5

## 🏁 Getting Started

```bash
# Install dependencies
npm install

# Run development server (on port 4000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
