# Feedback Drawer Modularization & Admin Access

## Overview
The in-product feedback drawer was modularized to improve maintainability and enable future admin tooling. This document captures the current architecture, how to view submissions, and next steps for production admin access.

---

## Architecture

### Module Structure
```
client/src/components/feedback/FeedbackDrawer/
├── index.tsx                     # Entrypoint re-export
├── types.ts                      # Types + constants (FormValues, defaultValues, UNSET_OPTION, etc.)
├── useFeedbackDrawer.ts          # Drawer open/close state + bus subscription
├── buildFeedbackPayload.ts       # Normalizes form + context → API payload
├── submitFeedbackWithToast.ts    # API call + toast handling
├── components/
│   ├── DrawerFooter.tsx          # Footer CTAs + step indicator
│   ├── StepOneBasic.tsx          # Step 1 UI (rating/goal/issue/freeform/submit)
│   └── StepTwoDetails.tsx        # Step 2 UI (persona/pricing/watermark/testimonial)
└── FeedbackDrawer.tsx            # Thin shell: Sheet + form wrapper + step rendering
```

### Key Separations
- **State**: `useFeedbackDrawer` owns `isOpen`, `step`, and bus subscription.
- **Form**: React Hook Form lives in the shell; values are passed down.
- **Payload**: `buildFeedbackPayload` centralizes normalization + context merge.
- **Submit**: `submitFeedbackWithToast` wraps API call + toast + success callback.
- **UI**: `StepOneBasic` and `StepTwoDetails` are pure UI components.

---

## Viewing Feedback Submissions

### Development
- URL: `http://localhost:5173/dev/feedback`
- Fetches: `GET /api/feedback` (dev-only)
- Features:
  - Filters: min rating, testimonial consent, email presence.
  - Paginated list (up to 200 records, newest first).
  - Row click → full payload dialog.

### Production
- **Current**: Not exposed. GET `/api/feedback` returns 404 in production.
- **Workaround**: Query `feedback_submissions` table directly (e.g., via pgAdmin).

---

## API Endpoints

| Method | Path            | Environment | Description                               |
|--------|-----------------|-------------|-------------------------------------------|
| POST   | `/api/feedback` | All         | Submit feedback (used by drawer).         |
| GET    | `/api/feedback` | Dev only    | List up to 200 feedback submissions.      |

### Schema (feedback_submissions table)
```sql
-- See migrations/0001_create_feedback_submissions.sql
id (uuid, pk)
created_at (timestamptz)
user_id (int, nullable)
email (text, nullable)
source (text, default 'nav_tab')
rating (int, not null)
goal (text, not null)
issue (text, nullable)
requested_feature (text, nullable)
persona (text, nullable)
usage_frequency (text, nullable)
pricing_preference (text, nullable)
willingness_to_pay_range (text, nullable)
watermark_preference (text, nullable)
watermark_text_preference (text, nullable)
freeform_feedback (text, nullable)
can_publish_testimonial (boolean, default false)
testimonial_name (text, nullable)
testimonial_company (text, nullable)
can_share_before_after (boolean, default false)
job_id (text, nullable)
plan_type (text, nullable)
room_type (text, nullable)
style_selected (text, nullable)
device_type (text, nullable)
country (text, nullable)
```

---

## Next Steps: Production Admin Access

### Option 1: Simple Auth Guard
- Add a lightweight auth check (e.g., shared secret or admin token) to GET `/api/feedback`.
- Remove the `process.env.NODE_ENV === 'production'` guard.
- Keep the same UI (`/dev/feedback`) but make it available in production.

### Option 2: Full Admin UI
- Build a dedicated admin route (e.g., `/admin/feedback`).
- Add session-based auth middleware.
- Add pagination, search, and export.
- Optionally add moderation actions (mark reviewed, archive).

### Security Considerations
- Never expose PII without auth.
- Consider rate-limiting the list endpoint.
- Log access to feedback data.

---

## Development Notes

### How to Extend
- **New step fields**: Add to `FormValues` in `types.ts`, update `StepTwoDetails.tsx`, and extend `buildFeedbackPayload.ts`.
- **New validation**: Add Zod schema in `server/routes.ts` (`feedbackSchema`).
- **New UI components**: Keep them under `components/` and pass minimal props.

### Testing
- Manual smoke checklist:
  - Drawer opens from `FeedbackTabButton`.
  - Step 1 submit disabled until rating + goal.
  - “Tell us more” → Step 2.
  - Watermark text dropdown follows preference.
  - Testimonial section only for rating ≥ 4.
  - Footer back link and review button gating.
  - Close resets form.

### Build Hygiene
- `npm run build` and `npx tsc --noEmit` should pass.
- No unused imports after extraction (FeedbackDrawer.tsx ~131 lines).

---

## Related Files
- `client/src/api/feedback.ts` – client-side API wrapper
- `client/src/pages/FeedbackInbox.tsx` – dev-only list UI
- `server/routes.ts` – POST/GET `/api/feedback` handlers
- `shared/schema.ts` – Drizzle table definition
- `migrations/0001_create_feedback_submissions.sql` – DB migration

---

**Prepared by:** Modularization sweep (2025‑01‑24)  
**Status:** Ready for production admin hardening.
