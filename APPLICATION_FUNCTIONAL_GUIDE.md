# Breakdown Notification Application – Functional Guide

## 1. Purpose

This application is a frontend-only prototype for reporting, acknowledging, and resolving production-line breakdowns. It demonstrates the complete Phase 1 shop-floor workflow without a backend, database, or real messaging service.

The application keeps all information temporarily in the browser's memory. Refreshing or closing the page restores the original demonstration data.

## 2. How to Run the Application

```bash
npm install
npm run dev
```

Open the URL shown in the terminal, normally `http://localhost:5173`.

## 3. Main Workflow

An issue moves through the following stages:

```text
Login
  → Report Breakdown
  → Waiting for Acknowledgement
  → Acknowledged / Being Attended
  → Resolve Issue
  → Removed from Open Issues
```

## 4. Login

The user selects a production line and conveyor belt, then enters a username and password.

Available demonstration lines and belts:

| Line | Conveyor belts |
|---|---|
| Tata Ace | Belt 01, Belt 02, Belt 03 |
| Tata Magic | Belt 01, Belt 02 |
| Demo Line | Belt 01 |

This prototype accepts any non-empty username and password. It does not authenticate against a server.

### Example

- Line: `Tata Ace`
- Conveyor Belt: `Belt 03`
- Username: `operator1`
- Password: `demo123`

After login, the application displays the Open Issues dashboard for the selected line and belt.

## 5. Open Issues Dashboard

The dashboard shows every active breakdown, including:

- Automatically generated issue ID, such as `BD-1043`
- Responsible department
- Problem description
- Optional reporting remarks
- Breakdown type: Normal or NPD
- Current status
- Reported time
- Acknowledgement or resolution timer
- Employee attending the issue after acknowledgement

Two sample issues are shown when the application first opens:

- `BD-1042`: IT printer issue waiting for acknowledgement
- `BD-1041`: Store material issue already acknowledged by Amit Kumar

Resolved issues are removed from this screen. If all issues are resolved, the application displays `No open breakdowns`.

## 6. Reporting a Known Breakdown

Select **Report Breakdown**, then search for a known problem. The application searches by the problem name and related keywords.

Known problems are automatically mapped to departments:

| Problem | Department | Example search terms |
|---|---|---|
| Printer not working | IT | printer, print |
| Network not available | IT | network, internet, wifi |
| Computer not starting | IT | computer, PC, system |
| Power supply issue | Electrical | power, electricity, supply |
| Lighting issue | Electrical | light, lighting |
| Material unavailable | Store | material, stock, item |
| Consumable exhausted | Store | consumable, paper, stock |
| Machine abnormal noise | Maintenance | machine, noise |

Remarks are optional for known problems.

### Example

1. Search for `printer`.
2. Select `Printer not working`.
3. The application automatically assigns the IT department.
4. Enter optional remarks: `Label printer near Station 4 is offline.`
5. Keep the breakdown type as `NORMAL`.
6. Select **Report Breakdown**.

Result:

- A new issue such as `BD-1043` appears with status `Waiting for ACK`.
- A 10-minute acknowledgement countdown starts.
- A confirmation says `Message sent to IT Department`.

The message is simulated; no SMS, email, or external notification is sent.

## 7. Reporting an Unlisted Problem

If the required problem is not in the catalogue, select **Other / Can't Find Problem**.

For an Other problem:

- Department selection is mandatory.
- Remarks are mandatory.
- Available departments are IT, Electrical, Store, and Maintenance.

### Example

- Problem: `Other`
- Department: `Maintenance`
- Remarks: `Conveyor guard is loose and vibrating.`
- Breakdown type: `NORMAL`

The application creates the issue and displays a simulated confirmation that a message was sent to the Maintenance department.

## 8. Normal and NPD Breakdowns

### Normal

A Normal breakdown follows the standard reporting, acknowledgement, and resolution flow.

### NPD

NPD represents a high-priority condition where production is considered stopped.

When an NPD issue is active:

- A red `NPD ACTIVE – PRODUCTION STOPPED` banner is displayed.
- NPD issues are highlighted and moved to the top of the list.
- Normal issues are visually faded but remain available for acknowledgement and resolution.
- New Normal breakdowns cannot be submitted.
- Only additional NPD breakdowns can be reported.

Normal reporting becomes available again only after every active NPD issue has been resolved.

### Example

1. Report `Power supply issue` as NPD.
2. The Electrical NPD issue appears at the top in red.
3. Open Report Breakdown again; NPD is automatically selected and Normal is disabled.
4. Resolve the active NPD issue.
5. If no other NPD issue remains, Normal reporting is restored.

## 9. Acknowledging an Issue

Every newly reported issue starts in `Waiting for ACK` status with a 10-minute countdown.

If the countdown reaches zero, the timer changes to `ACK OVERDUE` and continues counting the overdue duration. The prototype displays this condition but does not perform escalation.

To acknowledge an issue:

1. Select **Acknowledge**.
2. Select the employee attending the issue.
3. Confirm acknowledgement.

Available demonstration employees:

- Amit Kumar
- Rahul Sharma
- Sachin Singh
- Neeraj Verma
- Pooja Mehta

### Example

- Issue: `BD-1043 – Printer not working`
- Attending employee: `Rahul Sharma`

Result:

- Status changes to `Acknowledged`.
- The acknowledgement countdown stops.
- A resolution timer starts from `00:00`.
- Rahul Sharma and the acknowledgement time appear on the issue card.

## 10. Resolving an Issue

Only an acknowledged issue can be resolved.

The resolution form requires:

- Employee who resolved the issue
- Resolution remarks

The application asks for final confirmation because resolving an issue removes it from Open Issues.

### Example

- Resolved by: `Rahul Sharma`
- Resolution remarks: `Reconnected the printer cable and restarted the printer.`

After selecting **Yes, Resolve**:

- The resolution timer stops.
- The issue is removed from Open Issues.
- A confirmation states that the issue was resolved.

The prototype does not preserve a resolved-issue history.

## 11. Form Protection and Validation

The application prevents incomplete submissions:

- Username and password cannot be empty.
- A known problem or Other must be selected.
- Other requires a department and remarks.
- Acknowledgement requires an attending employee.
- Resolution requires a resolving employee and resolution remarks.

If a user attempts to close a report or resolution form after entering information, the application asks whether to keep editing or discard the entered information.

Safe, untouched popups can be closed with the X button or by selecting outside the popup.

## 12. Logout

Selecting **Logout** ends the current browser session and returns to the login screen. Since this is a prototype, no server session or security token is involved.

## 13. Complete Example Scenario

1. An operator logs in to `Tata Ace – Belt 03` as `operator1`.
2. The operator reports `Network not available` with the remark `Station terminals cannot reach the production system`.
3. The application creates `BD-1043`, maps it to IT, and starts the 10-minute acknowledgement timer.
4. Neeraj Verma acknowledges `BD-1043`; the resolution timer starts.
5. Neeraj restores the network connection.
6. In Resolve Issue, he selects himself and enters `Restarted the network switch and verified terminal connectivity`.
7. He confirms resolution.
8. `BD-1043` disappears from Open Issues.

## 14. Prototype Boundaries

The following capabilities are intentionally not implemented:

- Backend or API
- Database or permanent storage
- Real user authentication or authorization
- Real SMS, email, or push notifications
- Real acknowledgement escalation or external notification delivery
- Calling integration
- Report generation or export
- Resolved ticket history
- Phase 2 ticket editing and notes

These boundaries keep the current version technically simple: one frontend application using HTML, CSS, and JavaScript, with Vite used only for local development and building.
