# Admin prototype restoration

The admin screens now use the original `prototype/admin.css`, scoped under `.crm` so public pages retain their styling. The source archive and illustrations are unchanged. Navigation artwork uses the original SVG paths from `admin.js`.

## Restored interface

- Original forest sidebar, monogram, active-link stripe, icons, badge shapes, footer controls and profile menu; 248px desktop sidebar, 72px collapsed sidebar, 272px mobile navigation and 64px header. Collapse is a UI preference; identity and access still come from Supabase Auth.
- Original cream/paper palette, Fraunces/Inter typography, compact controls, 16px cards, table headings, status/source pills, responsive table cards, drawer scrims and dialogs.
- Overview: eight KPI cards, 7/30/90-day and all-time windows, previous-period comparisons, source-stacked history chart, source bars, recent leads, follow-up checkboxes, inquiries, conversations and activity in the original grid arrangement.
- Leads: original expanded column order, search/source/status/agent/date filtering, sortable headers and CSV; original contact/pipeline/interests left column and notes/reminders/inquiries/conversations/timeline right column. Pipeline selectors autosave; contact edits patch contact fields separately. Delete uses the original-style confirmation dialog.
- Properties: four source-style KPI cards, compact filter/table layout and sliding right-side property drawer with backdrop, Escape and focus handling. Creation, editing, publication and Storage uploads/removal remain available.
- Conversations: original 380px list/transcript split, previews, avatars, handling badges, context chips, takeover/resume/close actions, transcript bubbles and compact reply/note rows; mobile list/detail navigation remains usable.
- Assistant, capture and company settings: original paired cards and switches. Activity tables, analytics and team management use the same visual system.

## Connected data and deliberate copy differences

The original layout runs on actual shared records. The source's demo badge/banner identify the authenticated CRM and live stored metrics. Fake actor switching and simulated-lead controls are not presented as real operations. An unrecorded score displays an em dash; recorded contact preference comes from inquiry context. Following the user's explicit request for dummy data, a separate repeatable seed now creates clearly labeled fictional records in Supabase. Metrics include those stored records; no synthetic performance numbers or scores are substituted in the UI. See DEMO_DATA.md for counts and removal.

Inquiries, Analytics and Team remain available as styled navigation extensions required by the master specification. The public site and all staff/admin/RLS checks remain connected. No new environment variables or database migrations are required for this visual restoration. The previously documented note-attribution migration 006 still needs to be applied to the hosted database independently.

## Verification approach

`tests/e2e/admin-design.spec.ts` creates only temporary marked staff/lead/conversation fixtures. It optionally opens the unmodified source admin through `PROTOTYPE_PREVIEW_URL`, compares computed sidebar/header/heading/card geometry, captures both versions, checks collapse persistence and mobile navigation, and captures every main admin screen. Real CRM CRUD/API and public-to-admin acceptance remain in the existing suites, with selectors updated for original-style dialogs, inline autosave and transcript/list previews. See TEST_RESULTS for executed results.

To run the side-by-side comparison locally, serve `prototype/` on a separate localhost port (for example `python3 -m http.server 4174 --directory prototype`), build Next.js, and run:

```sh
PROTOTYPE_PREVIEW_URL=http://localhost:4174 npx playwright test admin-design.spec.ts --workers=1
```

The reference server is a local testing aid and is not part of the production application. Screenshots are ignored workspace artifacts under `work/admin-parity/`.

Executed results: the final build, TypeScript, lint and 87 unit tests passed. Both desktop/mobile source-comparison and CRM/API cases passed; all 34 applicable unique browser cases passed across the recorded runs, with two configuration-only skips. Gemini returned intermittent 503 responses during repeated external-service cases; see TEST_RESULTS for the exact run boundaries.

After verification, a hosted check found no remaining temporary test Auth accounts, leads or property records. Timeout fixtures from an earlier test-harness run were removed using their exact test-name/email/slug markers; existing users and inventory were not modified. Immutable audit entries remain.

## Latest uploaded prototype and populated preview

The second `repomix-output.xml` upload was compared file by file: all ten files are identical to the archived original. The follow-up restores the original six suggested prompts and their Add/Remove/Restore controls, with validated persistence through the existing assistant settings JSON. Existing settings without a prompts field receive the original defaults; an explicitly empty array remains empty. The public assistant sends saved prompt selections through the real chat endpoint. Tone, instructions and handoff options remain available under Advanced settings.

Overview summaries now use saved last-message previews, compact relative dates and readable descriptions of immutable audit events. The public home page also regains its inline full inventory, functional neighborhood/price/bedroom/availability/search/sort controls, original selected-homes heading, Journal/telephone navigation, scroll cue and forest mobile drawer.

The user's preview address is `http://localhost:3000/admin`. That server runs in their own checkout; a GitHub push cannot refresh an existing local process. LOCAL_PREVIEW.md documents pulling `development`, restarting development or rebuilding production, and checking the public `/api/version` fingerprint (`prototype-parity-2`). This is separate from Supabase demo data, which is already persisted in the configured project. No hosting deployment is claimed.
