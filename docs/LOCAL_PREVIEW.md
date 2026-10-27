# Viewing the updated prototype interface locally

`http://localhost:3000/admin` is served by the process running on your computer. Pushing GitHub changes does not update that process or a separate local checkout.

Stop the current server with Ctrl+C, then run these commands from your local **ellison-group project directory**:

```sh
git fetch origin
git switch development
git pull --ff-only origin development
npm ci
npm run dev
```

Keep your existing `.env.local`; it is intentionally ignored by Git. Open <http://localhost:3000/admin> and sign in with your existing authorized administrator. A normal Google visitor account still needs administrator provisioning before it can access the CRM.

If you use `npm run start` rather than the development server, stop it, pull and install as above, then run:

```sh
npm run build
npm run start
```

`npm run start` serves the last production build. It does not rebuild after pulling source changes. If port 3000 is already occupied, stop the previous server; verify the new terminal actually reports port 3000 rather than opening the old process in your browser.

Open <http://localhost:3000/api/version> to confirm the running code. This update returns `interfaceRevision: "prototype-parity-2"` plus the short Git commit captured when the server configuration was loaded or built. A 404 or missing revision indicates an older checkout/build. The endpoint exposes no configuration or credentials.

The admin uses the original cream and forest palette, Fraunces/Inter typography, eight overview cards, compact tables, split inbox, settings cards and mobile navigation. Labeled demo records are shared Supabase records, so once seeded they appear in every checkout connected to the same project. See [DEMO_DATA.md](DEMO_DATA.md) for counts, repeatable seeding and removal.
