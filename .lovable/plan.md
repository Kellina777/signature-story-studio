# Remove auth, gate results with email

## New flow

1. Visitor lands on `/` → clicks "begin" → goes straight to `/interview` (no login).
2. Answers 8 hybrid questions anonymously (session held in `localStorage` + DB row keyed by an anonymous session id).
3. After the final follow-up answer, an **email gate** appears: "where should we send your signature story?" — single field, single button.
4. On submit: blueprint is generated, saved with the email, and the user is redirected to `/blueprint/:slug` where they can read, copy sections, copy a share link, and **download as PDF**.
5. No password, no magic link, no account. Email is captured as a lead, full stop.

## Database changes (one migration)

- `interviews`: make `user_id` nullable; add `session_id text` (anonymous session token) and `email text`.
- `interview_messages`: make `user_id` nullable; add `session_id text`.
- `blueprints`: make `user_id` nullable; add `email text not null`.
- Replace RLS:
  - `interviews` / `interview_messages`: allow **anonymous insert/select/update/delete** scoped to a matching `session_id` passed in the row (RLS policy: `session_id is not null`). Since there's no auth, we rely on the unguessable session token + RLS allowing rows where `user_id is null`. (Acceptable for a lead-magnet flow; the only sensitive thing is the user's own draft answers, protected by an unguessable UUID held client-side.)
  - `blueprints`: keep public-read by `share_slug` (already true); allow anonymous insert when `user_id is null`.
- Drop the old "owner …" policies that require `auth.uid()`.

## Frontend changes

- **`src/pages/Interview.tsx`**: remove the auth gate. On mount, read/create a `signature_session_id` in `localStorage`; use it instead of `userId`. After step 8's follow-up answer, instead of generating immediately, set `phase = "email"` and render the email gate (one input, one button, copy: "we'll send a copy to this address. no spam, no account."). On submit → call `generate-blueprint` → insert blueprint with email + null user_id → navigate to `/blueprint/:slug`.
- **`src/pages/Blueprint.tsx`**: keep public read by slug; add **Download PDF** button (use `window.print()` with a print-friendly stylesheet — no new deps, prints clean to PDF from any browser). Keep copy-section and copy-share-link.
- **`src/pages/Index.tsx`**: change all CTAs to point to `/interview` (already do); remove any "sign in" link if present.
- **`src/App.tsx`**: keep `/auth` and `/reset-password` routes for now but unlinked (or remove — see Question 1 below).
- **`supabase/functions/generate-blueprint`**: no change needed; it doesn't depend on auth.
- **`supabase/functions/interview-followup`**: no change needed.

## What stays the same

- 8 core questions, hybrid flow, follow-ups, blueprint structure, design system.

## Open question

**Should we delete `/auth`, `/reset-password`, and the auth pages entirely?** They're unused after this change. I recommend deleting them to keep the surface clean — confirm in chat after approving the plan and I'll remove them in the same pass (or leave them if you want a future "save my story" upsell).

## Note on emailing the PDF

You said "give them the lead magnet which they can download." The plan above gives an in-browser download (print → PDF). If you also want the PDF *emailed* to the address they enter, that's a second step requiring email infrastructure setup (sender domain + transactional email). I've left it out of this plan; tell me if you want it and I'll add it as a follow-up.
