# Yazaki Notification – Phase 1 Prototype

Frontend-only working prototype for the Yazaki shop-floor breakdown notification workflow.

## Included

- Login with Line, Conveyor Belt, Username and Password
- Line/Belt prefilled but selectable
- Open Issues landing screen
- 10-minute acknowledgement countdown
- Acknowledge popup with employee selection
- Resolution timer after acknowledgement
- Resolve popup with resolver + mandatory resolution remarks
- Resolve confirmation before ticket closure
- Resolved issues disappear from Open Issues
- Report Breakdown popup with searchable known problems
- Known problems automatically map to a department
- `Other` requires department selection and mandatory remarks
- Normal / NPD breakdown types
- Active NPD issue is highlighted in red; non-NPD issues are faded
- While any NPD is active, only additional NPD issues can be submitted
- Normal reporting returns only after every active NPD issue is resolved
- Message confirmation such as `Message sent to IT Department`
- Report/Resolve forms warn before discarding entered information
- Popups close using X or outside click when safe
- Incident and department SLA timers
- Simulated department escalation matrix
- Department reassignment with a continuous ticket timeline
- Plant Admin and department-specific HOD dashboards
- Filterable incident table with an in-place details drawer
- Read-only `/tv` display with automatic 10-second pagination
- Dummy role switching for Operator, Plant Admin and department HODs

## Intentionally mocked / not built yet

- No backend/database
- No real SMS provider (message delivery is simulated)
- Escalations are displayed as a frontend simulation only
- No calling integration
- No report generation or export
- No Phase 2 historical-ticket login/edit/add-note flow

## Run from terminal

Install the development dependency and start the app:

```bash
npm install
npm run dev
```

Then open the URL printed in the terminal (normally):

```text
http://localhost:5173
```

Prototype login accepts any non-empty username/password.

## Files

- `index.html` – page shell
- `styles.css` – UI styling
- `app.js` – mock data + workflow logic

The application remains a frontend-only, framework-free prototype. Vite is used only as the local development server and production build tool; there is no backend, API layer, or database.
