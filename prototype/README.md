# The Ellison Group — redesign prototype + lead-capture admin (demo)

Static prototype. No backend, no real Google OAuth, no AI API, no email. Everything is mock data in localStorage.

## Run
Open `index.html` directly, or serve the folder (recommended so both pages share storage):
    python3 -m http.server 8000   # then http://localhost:8000/index.html

## Where things are
- `index.html`  public site (existing design, now with lead capture, inquiry flow, chatbot)
- `admin.html`  admin dashboard, hash routes: #/ #/leads #/leads/:id #/properties #/conversations #/assistant #/lead-capture #/activity #/settings
- `store.js`    shared data layer: properties, seeded leads/inquiries/conversations/activity, settings, persistence, reset
- `widgets.js` / `widgets.css`  capture modal, simulated Google chooser, inquiry dialog, toast
- `chat.js`     simulated assistant (intent + entity matching over the listing data) and chat widget
- `admin.js` / `admin-pages.js` / `admin.css`  dashboard

## Simulated
Google sign-in (sample profiles), AI replies (local rules), emails/bookings/agent notifications (none sent), analytics (mock records), admin auth (none).
Reset: banner "Reset demo" on the public site, or Settings > Reset demo data in admin.
