# Persistent CRM demo data

Run these commands from the application root against the intended Supabase project:

```sh
npm run seed:demo
```

The script uses the server-only `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL`, from the process environment or ignored `.env.local`. It never runs automatically during a build or deployment. In managed environments where Node must use the inherited HTTP proxy, run `NODE_USE_ENV_PROXY=1 npm run seed:demo`.

It creates a small, deliberately fictional set of persistent records:

| Records | Count | Examples |
| --- | ---: | --- |
| Leads | 6 | New, Contacted, Qualified, Appointment Scheduled, Nurturing, Converted |
| Inquiries | 6 | Property question, showing request, valuation, general, chatbot handoff |
| Conversations | 3 | Bot, human handling, resolved |
| Saved transcript messages | 9 | Visitor, assistant, and system messages |
| Follow-up tasks | 4 | Overdue, due now, upcoming, completed |
| Interested-property links | 4 | Links between the demo buyers and demo homes |
| Draft properties | 2 | Fictional Creekstone and Oak Terrace homes |

Names, addresses, messages and task titles have a `[DEMO]` label. Emails use reserved `example.com` addresses and phone numbers use fictional `555-01xx` numbers. No real contact submission or privacy consent is implied. The saved assistant messages are explicitly labeled sample transcripts; the script does not call Gemini or claim that an agent replied. There are no demo authentication accounts, role changes, agent assignments, notes with fabricated authors, outgoing messages, or company-setting changes.

Open `/admin` with an authorized staff account to view the populated dashboard, leads, inquiries, properties, follow-ups, inbox, analytics, and audit activity. Demo records contribute to the actual database metrics. The two new properties are **unpublished drafts** and are not returned by the public catalog or chatbot property search. They use the prototype's existing SVG artwork. The original sixteen imported prototype drafts and all other records are preserved.

The script is idempotent: it uses fixed namespaced IDs and inserts missing rows without overwriting edits. Rerunning it does not duplicate leads, inquiries, conversations or tasks and does not reset statuses or publish properties. Sample dates are chosen when each record is first inserted. If a reserved demo ID, email or slug belongs to a different identity, the script aborts instead of changing that record. Database errors can leave a partial set; correcting the error and rerunning safely creates the remaining rows.

To deliberately remove this demo set and its dependent history:

```sh
npm run remove:demo
```

Removal validates the exact namespaced record identities, deletes only the demo conversations, leads and properties, and lets foreign-key cascades remove their messages, inquiries, tasks, and interests. Any extra notes or tasks you add to a demo lead are also removed with that lead. References from other records to a removed demo property are cleared according to the existing foreign keys. Immutable audit records remain, as required by the CRM audit policy. The command does not remove unrelated records, original prototype drafts, staff accounts, storage objects, or application settings.

## Executed verification — 2026-10-27

The hosted database was populated with the counts above. Removal was exercised on this newly created demo set, all six dependent entity tables were verified empty for the reserved IDs, and the final set was recreated. A second seed inserted zero records; a complete before/after comparison confirmed that every existing demo value was unchanged. Inquiry, conversation, message and task references were checked against their expected parent records.

Using the anonymous publishable-key client, the two draft properties returned zero rows and the protected leads, inquiries, conversations, messages and tasks returned permission-denied errors. No demo contact data was exposed. The final persistent set remains available in the CRM; these are actual database checks, separate from the application's browser tests.
