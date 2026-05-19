# Signature Story — MC-style interview revamp

Replace the open-text interview with the 5 narrative questions below, presented as **multiple-choice in a lifted/floating panel** styled in DM Sans (matching the rest of the site).

## The 5 questions

1. Who do you help and what problem do you solve?
2. Why does this work matter to YOU personally?
3. What do most people in your world get wrong?
4. What's the one transformation you create?
5. If your work disappeared tomorrow, who would suffer most — and why?

## The MC challenge (and the fix)

These questions don't have pre-set answers — they're personal. To stay "as close to MC as possible" without losing the story, options are **AI-generated per question** from the answers so far:

- Q1 is the only one with no prior context, so it gets a small typed line (1 sentence) — this seeds everything else.
- Q2–Q5: a new edge function (`generate-options`) takes the prior answers and produces **4 distinct, plausible options** the user can click. Each card is a full sentence in their voice, not a label.
- Every question also includes **"None of these — let me say it myself"** which opens a small text field.
- The AI follow-up ("a deeper look") is dropped — the chosen option *is* the answer, keeps friction low.

## The panel UI

A single centered, lifted card on a soft backdrop — not a chat thread.

```text
   ─ question 2 of 5 ──────── progress ███████░░░░░░░ ─
  ┌──────────────────────────────────────────────────┐
  │                                                  │
  │  Why does this work matter to YOU personally?   │
  │  the real reason — what made this your mission?  │
  │                                                  │
  │  ┌────────────────────────────────────────────┐  │
  │  │  ◯  Option A — full sentence in your voice │  │
  │  └────────────────────────────────────────────┘  │
  │  ┌────────────────────────────────────────────┐  │
  │  │  ◯  Option B …                             │  │
  │  └────────────────────────────────────────────┘  │
  │  ┌────────────────────────────────────────────┐  │
  │  │  ◯  Option C …                             │  │
  │  └────────────────────────────────────────────┘  │
  │  ┌────────────────────────────────────────────┐  │
  │  │  ◯  Option D …                             │  │
  │  └────────────────────────────────────────────┘  │
  │  ┌────────────────────────────────────────────┐  │
  │  │  ✎  None of these — let me say it myself   │  │
  │  └────────────────────────────────────────────┘  │
  │                                                  │
  │                              [ back ]  [ next ] │
  └──────────────────────────────────────────────────┘
```

- DM Sans throughout (already the site font).
- Cream card, soft drop shadow + subtle lift on hover, rounded-3xl.
- One question on screen at a time; smooth fade between questions.
- Progress bar stays at the top; orange accent for the selected card.
- The email gate after Q5 stays exactly as it is today.

## What changes in code

- `src/lib/interviewQuestions.ts` — replace the 8 questions with these 5; mark Q1 as `type: "text"`, Q2–Q5 as `type: "choice"`.
- `src/pages/Interview.tsx` — rewrite as a single-panel stepper (no chat transcript, no textarea-first flow). Lifted card, radio-style option list, "say it myself" expander.
- New edge function `supabase/functions/generate-options/index.ts` — given `{ question, priorAnswers }` returns `{ options: string[] }` (4 items) using Lovable AI (`google/gemini-2.5-flash`).
- `supabase/functions/interview-followup` — no longer called; leave the file in place (unused) or delete in a follow-up.
- `supabase/functions/generate-blueprint` — unchanged; it already takes the transcript and the chosen options read just like answers.
- DB: no schema change needed. The chosen option text is stored in `interview_messages.content` as today.

## Out of scope

- No changes to the landing page, email gate, blueprint page, or theme tokens.
- No login. Session ID + email gate stays.
