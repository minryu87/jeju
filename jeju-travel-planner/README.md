# Jeju Travel Planner

A Next.js app integrated with Supabase to explore Jeju travel places and categories. Includes ETL scripts to parse `/workspace/uploads/jeju.txt` into normalized tables and upload to Supabase.

## Quick Start

- Install
  - npm install
- Development
  - npm run dev
- Production build
  - npm run build
  - npm start

## Environment Variables

Create `.env.local` at project root:

```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Notes:
- The app’s Supabase client is created only with `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- If the client detects a `service_role` key in the browser environment, it blocks all network calls and shows a security banner.

## Security

- Do NOT expose the service role key to the browser or commit it to source control.
- The service role key is powerful and bypasses RLS. It must be used only on the server or in ETL scripts.
- Client guard:
  - The app detects if `NEXT_PUBLIC_SUPABASE_ANON_KEY` decodes to `"role":"service_role"`.
  - If detected, the client will log `Service role key detected in client env; blocked` and disable Supabase calls in the UI.
- Recommended usage:
  - Use `SUPABASE_SERVICE_ROLE` only for ETL (server-side).
  - Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for frontend.

## ETL

Script: `scripts/etl_from_jeju_txt.mjs`

- Parses `/workspace/uploads/jeju.txt` and writes:
  - `supabase/seed/from_jeju_txt.json`
  - `supabase/schema.sql`
  - `docs/data_mapping.md`
  - `logs/etl_validation.log`
- DDL execution is skipped programmatically; apply DDL/policies in Supabase Studio SQL Editor or via a secure server.
- RLS considerations:
  - Categories upsert may require an UPDATE policy. See `supabase/policies/categories_update.sql`.

## Frontend UX and Logging

- On mount, the app performs a health-check: `categories.select('key').limit(1)`
- Errors log with details: `code`, `message`, `details`, `hint`
- UI banners:
  - 401/403/42501 (RLS or auth): shows an explanatory banner
  - 23503 (FK violation): “카테고리 키를 먼저 생성/선택하세요”
  - 409 (conflict): “충돌이 발생했습니다(중복 등)”
- If writes fail, the app falls back to in-memory add with inline notice.

## Files of Interest

- `components/JejuTravelPlanner.tsx`: UI with health-check, banners, and insert fallback
- `lib/supabaseClient.ts`: env checks, security guard (service_role detection), and error logger
- `scripts/etl_from_jeju_txt.mjs`: ETL logic and validation logging
- `scripts/perm_check.mjs`: Permission diagnostics

## License

MIT