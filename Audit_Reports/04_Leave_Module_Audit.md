# Leave Module Audit Report

**Date:** June 2, 2026
**Status:** Complete — All critical/high fixes implemented

## Module Summary
- **Total files analyzed:** 14
- **Server endpoints:** 13 (leave CRUD, policies, balances, manager actions, admin view)
- **Client pages:** 3 (LeavePage, AdminLeavePage, AdminLeavePoliciesPage)
- **Models:** 3 (Leave, LeavePolicy, LeaveBalance)

## Fixes Applied

### CRITICAL
| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Admin leave route mismatch (`leave-requests` plural vs `leave-request` singular) — admin status updates were 404ing | `adminLeavesThunks.js:31` | Changed to singular `/manager/leave-request/` |
| 2 | `managerNotes` not sent in admin update — admins could never deny leave | `adminLeavesThunks.js:28` | Added `managerNotes` to destructuring and payload |
| 3 | No self-approval prevention — managers could approve their own leave | `managerService.js:32` | Added check: `leaveRequest.employee === loggedInUser.id` |

### HIGH
| # | Issue | File | Fix |
|---|-------|------|-----|
| 4 | Balance deduction race condition (TOCTOU) | `managerService.js:44-48` | Atomic `findOneAndUpdate` with `$expr` balance check |
| 5 | No past-date validation | `leaveService.js:18-20` | Reject if `startDate < today` |
| 6 | No overlapping leave validation | `leaveService.js` | Query for existing Pending/Approved leaves with date overlap |

### MEDIUM
| # | Issue | File | Fix |
|---|-------|------|-----|
| 7 | Missing indexes on Leave model | `leave.model.js` | Added `{ employee: 1, createdAt: -1 }` and `{ status: 1, startDate: 1, endDate: 1 }` |

## Known Issues (Future)
- No pagination on getAllLeaveRequests, getMyLeaveHistory, getTeamLeaveRequests
- Half-day leave not supported (schema + UI)
- No leave carry-over logic
- No accrual support
- No blackout date enforcement
- No leave calendar view
- No CSV export
- `getAllLeaveRequests` returns unbounded results
- Error handling uses string matching instead of error codes
