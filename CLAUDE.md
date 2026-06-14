@AGENTS.md

# Clerkship — Pediatric Case Builder

Mobile-first PWA: a clinical clerk picks a chief complaint, taps chip answers through a
timeline-aware interview, and the app drafts a **verified** clerkship-format report.
Pediatrics first; data-driven for future specialties.

## Run

Node is portable at `C:\Users\Aaron\node-portable\node-v24.16.0-win-x64` (not on the
global PATH for some tool hosts). In Bash: `export PATH="/c/Users/Aaron/node-portable/node-v24.16.0-win-x64:$PATH"`.

- `npm run dev` — dev server on :3000
- `npm run build` / `npx tsc --noEmit` — build / typecheck
- `node scripts/test-pipeline.mjs` — end-to-end pipeline smoke test (server must be running)

### Runs with zero config (demo mode)
- **No `ANTHROPIC_API_KEY`** → generation + verification run in deterministic **mock** mode.
- **No Supabase env** → cases persist in the browser (`localStorage`, see `src/lib/store.ts`).
Add keys in `.env.local` (see `.env.example`) to enable real Claude + cloud storage.

## Pipeline (the 5 agreed steps)
1. **Complaint select** — `src/app/cases/new`; seed list in `src/lib/domain/complaints.ts`; unlisted → AI-generated-then-cached (`src/lib/ai/questionset.ts`).
2. **Chip interview** — `ChipQuestion` (single/multi/slider + per-question key notes). HPI uses a per-interval **template** cloned onto each timeline event (`TimelineEditor`). Standard pediatric modules (ROS by organ system, birth, family, etc.) in `src/lib/domain/standardModules.ts`. Objective PE entered in `PhysicalExamForm` (math via `src/lib/calc`, never the AI).
3. **Chip→narrative** — `POST /api/narrative` → `generateNarrative` (Sonnet) → JSON sections. `serializeCase` feeds the model ONLY captured data (no fabrication).
4. **Report** — `POST /api/report` → `generateReport` (Opus) → full Markdown report.
5. **Verification** — hybrid: `lib/verify/deterministic.ts` (structure) + `lib/verify/judge.ts` (Haiku LLM-judge vs `lib/domain/rubric.ts`). Below threshold → regenerate once → warn + allow override.

## Grounding
The rubric, ROS systems, developmental milestones, HPI structure, and PE parts are
transcribed from **Physical_Diagnosis_Manual_in_Pediatrics.pdf** (see `src/lib/domain/*`).
The sample report is a STYLE reference, not a rigid template.

## Model mix (`src/lib/ai/models.ts`)
Haiku = question-set augmentation + judge · Sonnet = narrative · Opus = report.

## Data model & privacy
`CaseRecord` in `src/lib/domain/types.ts`. De-identified by default; full names only with
the toggle off (local export). Cloud schema in `supabase/schema.sql`: private-by-default
cases, explicit `case_shares`, append-only `audit_log`, all enforced by RLS.

## Not yet wired (next steps)
- Google sign-in + middleware session refresh; swap `localStorage` store for a Supabase adapter (`src/lib/supabase/*` helpers exist).
- Additional curated complaints (only `cough-colds` is curated; others fall back to AI/generic).
- PNG PWA icons (currently SVG); WHO growth tables beyond the embedded sample.
