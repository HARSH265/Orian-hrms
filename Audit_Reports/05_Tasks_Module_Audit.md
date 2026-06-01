# Tasks Module Audit Report

**Date:** June 2, 2026
**Status:** Complete — All critical/high fixes implemented

## Module Summary
- **Total files analyzed:** 15
- **Server endpoints:** 17
- **Client components:** 8 (TeamTasks, MyTasksList, TaskDetailsModal, KanbanBoard, GanttView, etc.)

## Fixes Applied

### CRITICAL
| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | Route ordering: `PUT /reopen-requests/:requestId` unreachable (Express matches as `:id`) | `taskRoutes.js:32` | Moved before `/:id` routes |
| 2 | `updateTask` requires `EDIT_ALL_TASKS` at route level but service allows creator | `taskRoutes.js:45` | Removed route-level permission check, service handles auth |
| 3 | Status enum `'blocked'` (lowercase) vs code uses `'Blocked'` (PascalCase) | `task.model.js:38` | Changed to `'Blocked'` |
| 4 | `updateTask` passes raw `req.body` (mass assignment vulnerability) | `taskService.js:291` | Added field whitelisting |

### HIGH
| # | Issue | File | Fix |
|---|-------|------|-----|
| 5 | `getTaskById` doesn't populate `manager` on assignees — managers can't see tasks | `taskService.js:165` | Added `manager` to populate select |
| 6 | No circular dependency detection — users can deadlock tasks | `taskController.js:444` | Added BFS cycle detection |
| 7 | No subtask nesting depth limit — infinite recursion possible | `taskService.js:122` | Added max depth check (3 levels) |
| 8 | `logTimeToTask` has no validation on `timeSpent` | `taskController.js:505` | Added 0-24h range + future date check |

### MEDIUM
| # | Issue | File | Fix |
|---|-------|------|-----|
| 9 | `task.remove()` deprecated in Mongoose 7+ | `taskService.js:326` | Changed to `Task.findByIdAndDelete()` |
| 10 | Missing compound indexes | `task.model.js` | Added 3 compound indexes |

## Known Issues (Future)
- `buildTaskQuery` duplicated in controller and service
- `getTasksCreatedByMe` inline in controller (not in service layer)
- Inconsistent error handling in thunks (some use extractErrorMessage, some don't)
- Kanban optimistic UI never reverts on failure
- Gantt progress hardcoded (ignores timeEstimate)
- No task activity/history log
- No bulk task operations
- No rich text in task descriptions
