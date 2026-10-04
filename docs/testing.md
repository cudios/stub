# Manual test checklist

Run on real devices: an Android phone with Chrome and a laptop with Chrome. Mark each row and attach a screenshot where useful.

| # | Scenario | Steps | Expected | Result |
|---|---|---|---|---|
| 1 | Create event | Create an event covering today | Codes sheet shows manager and volunteer codes | |
| 2 | Join by code | Second device enters the volunteer code | Event opens as Volunteer, Passes tab is read-only | |
| 3 | Add attendee | Add "Any 2 days" pass | Pass card with QR appears, download works | |
| 4 | Valid scan | Scan the pass on Today | Green "Valid entry, Day 1 of 2" with beep | |
| 5 | Duplicate on one device | Scan the same pass again | Red "Already entered today" with first entry time and device | |
| 6 | Re-entry | Pass with re-entry on, scan twice | Second scan green "Valid re-entry" | |
| 7 | Fixed day | Fixed-days pass not covering today | Red "Not valid today" listing valid days | |
| 8 | Unknown pass | Type a random pass ID | Red "Unknown pass" | |
| 9 | Wrong QR | Scan any non-Stub QR code | Hint says it isn't a pass from this app, camera keeps scanning | |
| 10 | Offline indicator | Turn on airplane mode | Sync bar turns black: "Offline" | |
| 11 | Offline scan queue | Scan 3 passes offline | Counter shows changes waiting, entries tagged "Not synced" | |
| 12 | Offline reload | Close and reopen the app while offline | App loads with data and pending scans intact | |
| 13 | Sync on reconnect | Turn the network back on | Counter drains to zero, "All changes synced" | |
| 14 | Two-device duplicate | Both devices offline, scan the same pass on each, reconnect | Conflict alert on both, side-by-side card in Conflicts | |
| 15 | Online duplicate | Both online, scan on A then on B | B rejects immediately with A's device name | |
| 16 | Overuse | "Any 1 day" pass used offline on two days on two devices | "More days used than allowed" conflict | |
| 17 | Cancel vs offline scan | Cancel a pass on A while B scans it offline, reconnect | "Cancelled pass let in" conflict | |
| 18 | Edit conflict | Two offline managers rename the same attendee, reconnect | "Conflicting edits" card, latest edit shown everywhere | |
| 19 | Mark reviewed | Mark a conflict reviewed | Moves to Reviewed on every device | |
| 20 | Undo | Undo an entry, scan the pass again | Entry crossed out, new scan is valid | |
| 21 | Volunteer permissions | Toggle "Volunteers can undo scans" | Undo appears or disappears on the volunteer device | |
| 22 | Camera denied | Block camera permission, tap Scan pass | Clear instruction plus manual entry option | |
| 23 | Install | Use "Install app" or Add to Home screen | Opens full screen from the home screen icon, works offline | |

## Automated tests

```bash
npm test
```

Covers the pass rule engine and the conflict detector (16 tests).
