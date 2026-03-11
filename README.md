# ClarityIQ - Setup Instructions

## Architecture Clarity (Frontend / Backend / Database)

- Frontend: React + Vite (`App.tsx`, `components/*`)
- Backend: Express server (`server.ts`) currently provides API utility routes (`/api/health`, `/api/info`) and hosts the frontend.
- Database + Storage: Supabase (`profiles`, `customers`, `meetings`, `calls`, and storage bucket `call-audio`).

### Current data path for voice uploads

1. User uploads an audio/text/json file in the frontend (`components/UploadProcessor.tsx`).
2. Frontend sends file to Gemini for analysis (`services/geminiService.ts`).
3. Frontend uploads the original file to Supabase Storage bucket `call-audio`.
4. Frontend writes analysis + metadata into Supabase table `calls`.

This means your app is connected to Supabase directly from the frontend for both file storage and database writes.
The Express backend is running, but it is not the component handling file upload or database write logic right now.

## Supabase Configuration

To ensure authentication works correctly in the AI Studio preview environment, you must configure the **Redirect URL** in your Supabase dashboard.

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **Authentication** > **URL Configuration**.
3. Add the following URL to the **Redirect URLs** list:
   - `https://ais-dev-ojtos2i6jj5ivjtpzk4dic-226004877493.asia-southeast1.run.app/` (Development URL)
   - `https://ais-pre-ojtos2i6jj5ivjtpzk4dic-226004877493.asia-southeast1.run.app/` (Shared URL)

## Environment Variables

Ensure the following environment variables are set:

- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key.
- `GEMINI_API_KEY`: Your Google Gemini API key.

Optional (frontend-prefixed equivalents):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Correct structure (single source of truth)

Use the workspace root env file:

1. Create `.env.local` in the project root (same level as `package.json`).
2. Put your real keys in `.env.local`.
3. Keep `.env.example` with placeholders only.

Recommended `.env.local`:

- `SUPABASE_URL=https://your-project-id.supabase.co`
- `SUPABASE_ANON_KEY=your-anon-key`
- `GEMINI_API_KEY=your-gemini-api-key`

Optional aliases (if needed):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_GEMINI_MODEL_ID`
- `VITE_DEMO_MODE` (`true` to force local demo session, otherwise real Supabase auth)

Runtime precedence used by this project:

- Supabase client: `VITE_SUPABASE_*` then `SUPABASE_*`
- Vite define mapping: `SUPABASE_*` then `VITE_SUPABASE_*`
- Gemini model: `VITE_GEMINI_MODEL_ID` then default `gemini-2.5-flash`

## Backend

The application now uses a full-stack Express + Vite setup.
- `server.ts`: Express server handling API routes and serving the Vite app.
- `vite.config.ts`: Configured to work with the Express server.

## Quick Connection Checks

1. Start app:
   - `npm install`
   - `npm run dev`
2. Backend health check:
   - Open `http://localhost:3000/api/health`
3. Login and upload a voice file.
4. Verify in Supabase:
   - Storage > bucket `call-audio` contains uploaded file.
   - Table `calls` has a new row with `file_url`, `file_name`, and analysis fields.

If 4(a) and 4(b) are true, your frontend → database/storage connection is working correctly for voice recording storage.

## Electron Desktop Build (Windows)

Use these commands to generate an updated desktop app like your existing `release-final` output:

1. Install dependencies:
   - `npm install`
2. Build and package desktop app to `release-final/win-unpacked`:
   - `npm run dist:final`
3. (Optional) Build installer into `release-final`:
   - `npm run dist:final:installer`

For local desktop development:

- `npm run electron-dev`
