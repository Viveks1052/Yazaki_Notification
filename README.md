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

## Intentionally mocked / not built yet

- No backend/database
- No real SMS provider (message delivery is simulated)
- No escalation implementation yet
- No calling integration
- No TV dashboard
- No admin/export/reporting screen
- No Phase 2 historical-ticket login/edit/add-note flow

## Run from terminal

### Simplest option

Open `index.html` directly in a browser.

### Recommended local server

If Node.js is installed:

```bash
npx http-server . -p 5173
```

Or with Python:

```bash
python -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

Prototype login accepts any non-empty username/password.

## Files

- `index.html` – page shell
- `styles.css` – UI styling
- `app.js` – mock data + workflow logic

This is deliberately dependency-free so the first prototype can be run immediately. It can be migrated to React/Vite once the Phase 1 flow is approved.
