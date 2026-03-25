# ClaimScope

A mobile-first web application that helps contractors generate insurance damage inspection reports from photos taken on-site.

Contractors can complete a full inspection in under 3 minutes: create a claim, take structured photos, record voice notes, and generate a professional PDF report — all from their phone.

## Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui-style components
- **Backend:** Next.js API routes
- **Database & Auth:** Supabase (PostgreSQL, Auth, Storage)
- **Automation:** OpenAI APIs for image analysis, report generation, and voice transcription
- **PDF:** @react-pdf/renderer for downloadable reports
- **PWA:** Installable on mobile devices

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An automation API key (OpenAI)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd claimscope
npm install
```

### 2. Configure Environment Variables

Copy `.env.local` and fill in your keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
OPENAI_API_KEY=sk-your_openai_key_here
```

### 3. Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-schema.sql` and run it
4. This creates all tables (users, claims, photos, reports), RLS policies, storage buckets, and the user creation trigger

### 4. Configure Supabase Auth

1. In Supabase dashboard, go to **Authentication → Providers**
2. Ensure **Email** provider is enabled
3. (Optional) Disable email confirmation for development under **Authentication → Settings**

### 5. Configure Supabase Storage

The SQL schema creates a `claim-photos` bucket automatically. If it doesn't:

1. Go to **Storage** in Supabase dashboard
2. Create a new bucket called `claim-photos`
3. Set it to **Public**

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial ClaimScope MVP"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and import your repository
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
3. Deploy

### 3. Update Supabase

Add your Vercel deployment URL to:
- **Authentication → URL Configuration → Site URL**
- **Authentication → URL Configuration → Redirect URLs**

## Core Workflow

1. **Login** — Contractor signs in with email/password
2. **Create Claim** — Enter property address and optional notes
3. **Inspection** — Add any number of photos and optional tags
4. **Voice Notes** — Record voice notes (transcribed automatically)
5. **Photo Analysis** — Photos are analyzed for damage type, severity, and materials
6. **Report Generation** — Generate a professional inspection report
7. **Edit & Review** — Contractor can edit the report text
8. **Download PDF** — Export a formatted PDF with photo evidence

## Project Structure

```
src/
├── app/
│   ├── api/ai/          # Automation API routes (analyze, transcribe, report, pdf)
│   ├── claims/
│   │   ├── new/         # New claim creation
│   │   └── [id]/
│   │       ├── inspection/  # Guided photo capture workflow
│   │       └── report/      # Report viewing and editing
│   ├── dashboard/       # Claims list
│   └── login/           # Authentication
├── components/
│   ├── ui/              # Reusable UI components (Button, Input, Card, etc.)
│   ├── bottom-nav.tsx   # Mobile bottom navigation
│   ├── page-header.tsx  # Page header with back button
│   ├── photo-capture.tsx # Camera capture component
│   └── voice-recorder.tsx # Voice recording + transcription
├── lib/
│   ├── supabase/        # Supabase client (browser, server, middleware)
│   ├── types.ts         # TypeScript types and constants
│   └── utils.ts         # Utility functions
└── services/
    ├── ai.ts            # Automation service functions
    ├── claims.ts        # Claims CRUD operations
    └── pdf.tsx          # PDF document template
```

## Database Schema

| Table    | Key Columns                                          |
|----------|------------------------------------------------------|
| users    | id, email, created_at                                |
| claims   | id, user_id, address, notes, status, created_at      |
| photos   | id, claim_id, photo_type, file_url, analysis         |
| reports  | id, claim_id, report_text, pdf_url, created_at       |

## License

MIT
