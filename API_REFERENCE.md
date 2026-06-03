# Orion HRMS – API Reference (Frontend Guide)

> Base URL: `http://localhost:5000/api/v1`

---

## Response Conventions

### Success
```json
{ "success": true, "data": { ... } }
```
Paginated responses:
```json
{ "success": true, "data": [...], "pagination": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 } }
```

### Error
```json
{ "success": false, "message": "Error description" }
```

---

## Auth (No `writeLimiter` on login/refresh)

### Login
`POST /auth/login`
```
Body:  { email, password }
Res:   { success: true, data: { user: {...}, accessToken, refreshToken } }
```

### Refresh Token
`POST /auth/refresh`
```
Body:  { refreshToken }
Res:   { success: true, data: { accessToken, refreshToken } }
```

### Logout
`POST /auth/logout` — `[protect]`
```
Body:  { refreshToken }
Res:   { success: true, message: "Logged out" }
```

### Forgot Password
`POST /auth/forgot-password`
```
Body:  { email }
Res:   { success: true, message: "Email sent" }
```

### Reset Password
`PUT /auth/reset-password/:token`
```
Body:  { password }
Res:   { success: true, message: "Password reset" }
```

### Change Password
`PUT /auth/change-password` — `[protect]`
```
Body:  { currentPassword, newPassword }
Res:   { success: true, message: "Password changed" }
```

### 2FA
`POST /auth/2fa/generate` — `[protect]` → `{ success: true, data: { secret, qrCodeUrl } }`
`POST /auth/2fa/verify` — `[protect]` → `{ code }` → `{ success: true, message: "2FA enabled" }`
`POST /auth/2fa/disable` — `[protect]` → `{ code }` → `{ success: true, message: "2FA disabled" }`

---

## Users

**Base:** `/users` — all `[protect]`

| Method | Path | Permission | Body / Query | Response `data` |
|--------|------|------------|-------------|----------------|
| GET | `/profile` | — | — | `{ user }` (current user full profile) |
| PUT | `/profile` | — | `{ name, phone, address, ... }` | `{ user }` |
| POST | `/profile/skills` | — | `{ skillId, proficiency }` | `{ skills: [...] }` |
| DELETE | `/profile/skills/:skillId` | — | — | `{ skills: [...] }` |
| PUT | `/complete-wizard` | — | — | `{ message }` |
| GET | `/managers` | MANAGE_USERS | — | `[{ name, email, _id }]` (all manager/hr/super-admin) |
| GET | `/export` | MANAGE_USERS | — | CSV file download |
| GET | `/` | VIEW_ALL_USERS | `?page&limit&search&role&status&department` | `[{ user }]` paginated |
| POST | `/` | MANAGE_USERS | `{ name, email, password, systemRole, ... }` | `{ user }` |
| GET | `/:id` | VIEW_ALL_USERS | — | `{ user }` (full profile) |
| PUT | `/:id` | MANAGE_USERS | `{ name, email, systemRole, ... }` | `{ user }` |
| DELETE | `/:id` | MANAGE_USERS | — | `{ message }` (deactivates + offboarding) |
| PUT | `/:id/reactivate` | MANAGE_USERS | — | `{ user }` |
| POST | `/:userId/skills/:skillId/endorse` | — | — | `{ skills: [...] }` |
| GET | `/:id/checklist-instances` | VIEW_USER_CHECKLISTS | — | `[{ checklistInstance }]` |

---

## Leave

**Base:** `/leave` — all `[protect]`

| Method | Path | Permission | Body / Query | Response `data` |
|--------|------|------------|-------------|----------------|
| POST | `/` | — | `{ leavePolicyId, startDate, endDate, reason }` | `{ leave }` |
| GET | `/my-history` | — | `?page&limit&status` | `[{ leave }]` paginated |
| GET | `/summary` | — | — | `{ used, remaining, pending }` per policy |
| GET | `/summary/:employeeId` | MANAGE_LEAVE_POLICIES | — | same as above for any user |
| GET | `/team` | — | `?page&limit&status` | `[{ leave }]` of **entire reporting tree** |
| GET | `/admin` | MANAGE_LEAVE_POLICIES | `?page&limit&status` | `[{ leave }]` all leaves |
| PUT | `/:id/withdraw` | — | — | `{ leave }` |
| PUT | `/:id/review` | — | `{ action: "Approved"/"Denied", managerNotes }` | `{ leave }` |
| GET | `/export` | MANAGE_LEAVE_POLICIES | `?status&startDate&endDate` | CSV download |

### Leave Policy

**Base:** `/leave-policies` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ leavePolicy }]` |
| POST | `/` | MANAGE_LEAVE_POLICIES | `{ leavePolicy }` |
| PUT | `/:id` | MANAGE_LEAVE_POLICIES | `{ leavePolicy }` |
| DELETE | `/:id` | MANAGE_LEAVE_POLICIES | archive it |
| PATCH | `/:id/unarchive` | MANAGE_LEAVE_POLICIES | unarchive |

**LeavePolicy fields:** `{ name, description, daysPerYear, requiresAttachment, maxConsecutiveDays, isArchived }`

### Leave Balances

**Base:** `/leave-balances` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/my-balances` | — | `[{ balance with policy info }]` |
| GET | `/admin` | MANAGE_LEAVE_POLICIES | `[{ all balances }]` |
| POST | `/` | MANAGE_LEAVE_POLICIES | `{ userId, policyId, year }` |
| POST | `/bulk` | MANAGE_LEAVE_POLICIES | `{ userIds, policyId, year }` |

**LeaveBalance fields:** `{ user, leavePolicy, year, totalDays, usedDays, remainingDays }`

### Manager (Team Leave Requests)

**Base:** `/manager` — all `[protect]` + requires manager permissions

| Method | Path | Response `data` |
|--------|------|----------------|
| GET | `/team-leave-requests` | `[{ leave }]` paginated — entire reporting tree |
| GET | `/leave-request/:id` | `{ leave }` with full details |
| PUT | `/leave-request/:id` | `{ status, managerNotes }` → approve/deny |
| GET | `/my-team` | `[{ user }]` — direct reports only |

---

## Attendance

**Base:** `/attendance` — all `[protect]`

| Method | Path | Permission | Body / Query | Response `data` |
|--------|------|------------|-------------|----------------|
| POST | `/clock-in` | — | — | `{ attendance }` |
| POST | `/clock-out` | — | — | `{ attendance }` |
| GET | `/my-records` | — | `?startDate&endDate` | `[{ attendance }]` |
| GET | `/my-summary` | — | `?startDate&endDate` | `{ totalHours, totalDays, ... }` |
| GET | `/team-records` | VIEW_TEAM_ATTENDANCE | `?startDate&endDate` | `[{ attendance }]` — entire reporting tree |
| PUT | `/:id` | MANAGE_USERS | `{ clockInTime, clockOutTime, status }` | `{ attendance }` |

**Attendance fields:** `{ employee, date, clockInTime, clockOutTime, status (Present/On Leave/Holiday/Absent), totalHours, notes }`

---

## Tasks

**Base:** `/tasks` — all `[protect]`

| Method | Path | Permission | Body / Query | Response `data` |
|--------|------|------------|-------------|----------------|
| GET | `/my-tasks` | — | `?page&limit&status&priority&search` | `[{ task }]` paginated |
| GET | `/my-summary` | — | — | `{ total, byStatus, byPriority }` |
| GET | `/dashboard` | — | — | `{ totalTasks, completedLast30Days, overdueTasks, totalTimeSpent, byPriority, byStatus, weeklyCompletions }` |
| GET | `/board` | — | — | Kanban board data |
| GET | `/created-by-me` | — | `?page&limit` | `[{ task }]` paginated |
| GET | `/team-tasks` | VIEW_TEAM_TASKS | `?page&limit&status&priority&search` | `[{ task }]` — entire reporting tree |
| GET | `/all` | EDIT_ALL_TASKS | `?page&limit&status` | `[{ task }]` all tasks |
| GET | `/export` | — | query filters | CSV download |
| POST | `/` | CREATE_TASKS | `{ title, description, priority, assignees, dueDate, ... }` | `{ task }` |
| POST | `/bulk/status` | — | `{ taskIds, status }` | `{ modifiedCount }` |
| POST | `/bulk/assign` | — | `{ taskIds, assigneeId }` | `{ modifiedCount }` |
| POST | `/bulk/delete` | — | `{ taskIds }` | `{ modifiedCount }` |
| GET | `/:id` | — | — | `{ task }` with comments, timeLogs, etc. |
| PUT | `/:id` | — | `{ title, description, status, ... }` | `{ task }` |
| DELETE | `/:id` | DELETE_ALL_TASKS | — | `{ message }` |
| PUT | `/:id/status` | — | `{ status }` | `{ task }` |
| POST | `/:id/comments` | — | `{ text }` | `{ comments: [...] }` |
| POST | `/:id/attachments` | — | `{ fileUrl, title }` | `{ attachments: [...] }` |
| POST | `/:id/subscribe` | — | — | `{ message }` toggle |
| POST | `/:id/reopen-requests` | — | `{ reason }` | `{ message }` |
| POST | `/:id/log-time` | — | `{ timeSpent, notes, date }` | `{ task }` |
| PUT | `/:id/dependencies` | — | `{ dependsOn, blocking }` | `{ task }` |
| PUT | `/:id/recurrence` | — | `{ isRecurring, recurrenceInterval }` | `{ task }` |
| POST | `/:id/subtasks` | — | `{ title, ... }` | `{ subTask }` |
| GET | `/:id/activity` | — | — | `[{ activity }]` audit log |
| PUT | `/reopen-requests/:requestId` | — | `{ action: "Approved"/"Denied" }` | `{ message }` |

**Task fields:** `{ title, description, status, priority, assignees, creator, dueDate, isRecurring, recurrenceInterval, timeEstimate, totalTimeSpent, subscribers, timeLogs, attachments, comments, parentTask, subTasks, dependsOn, blocking, checklistInstance, customFieldValues }`

### Task Templates

**Base:** `/task-templates` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ taskTemplate }]` |
| GET | `/:id` | — | `{ taskTemplate }` |
| POST | `/` | MANAGE_CHECKLIST_TEMPLATES | `{ taskTemplate }` |
| PUT | `/:id` | MANAGE_CHECKLIST_TEMPLATES | `{ taskTemplate }` |
| DELETE | `/:id` | MANAGE_CHECKLIST_TEMPLATES | `{ result }` |
| POST | `/:id/apply` | — | `{ task }` creates a task from template |

**TaskTemplate fields:** `{ title, description, priority, category, isActive, defaultAssignee: { assigneeType, roleId }, dueDays, createdBy }`

### Checklist Templates

**Base:** `/checklist-templates` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | MANAGE_CHECKLIST_TEMPLATES | `[{ checklistTemplate }]` |
| POST | `/` | MANAGE_CHECKLIST_TEMPLATES | `{ checklistTemplate }` |
| POST | `/apply` | APPLY_CHECKLISTS | `{ checklistInstance }` |
| GET | `/:id` | — | `{ checklistTemplate }` |
| PUT | `/:id` | MANAGE_CHECKLIST_TEMPLATES | `{ checklistTemplate }` |
| DELETE | `/:id` | MANAGE_CHECKLIST_TEMPLATES | `{ result }` |

**ChecklistTemplate fields:** `{ name, description, tasks: [ObjectId TaskTemplate] }`

### Checklist Instances

**Base:** `/checklist-instances` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/active` | VIEW_USER_CHECKLISTS | `[{ instance }]` — user's / team's active |
| GET | `/:id` | — | `{ instance }` |
| PUT | `/:id/complete` | APPLY_CHECKLISTS | `{ instance }` |
| POST | `/auto-complete` | — | `{ instance }` auto-complete by system |

**ChecklistInstance fields:** `{ template, targetUser, status (In Progress/Completed), startDate, completionDate, generatedTasks, createdBy }`

---

## Expenses

**Base:** `/expenses` — all `[protect]`

| Method | Path | Permission | Body / Query | Response `data` |
|--------|------|------------|-------------|----------------|
| POST | `/` | — | `{ date, category, amount, currency, description, ... }` | `{ expense }` |
| GET | `/my-expenses` | — | `?page&limit&status` | `[{ expense }]` paginated |
| GET | `/my-summary` | — | — | `{ total, byStatus, byCategory }` |
| GET | `/my-summary/:employeeId` | MANAGE_EXPENSES | — | summary for any user |
| GET | `/team-expenses` | VIEW_TEAM_EXPENSES | `?page&limit&status` | `[{ expense }]` — entire reporting tree |
| GET | `/all` | MANAGE_EXPENSES | `?page&limit&status` | `[{ expense }]` all |
| GET | `/export` | VIEW_EXPENSES | query filters | CSV download |
| POST | `/:id/receipt` | — | `FormData: receipt (file)` | `{ expense }` |
| PUT | `/:id/status` | MANAGE_EXPENSES | `{ status, managerNotes }` | `{ expense }` |
| POST | `/:id/reimburse` | MANAGE_EXPENSES | — | `{ expense }` |
| DELETE | `/:id` | MANAGE_EXPENSES | — | `{ message }` |

**Expense fields:** `{ employee, date, category, categoryName, amount, currency, description, status (Pending/ManagerApproved/AdminApproved/Approved/Denied), approvalChain, receiptUrl, publicId, expenseReport, isRecurring, reimbursedAt }`

### Expense Categories

**Base:** `/expense-categories` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ category }]` |
| GET | `/:id` | — | `{ category }` |
| POST | `/` | MANAGE_EXPENSES | `{ category }` |
| PUT | `/:id` | MANAGE_EXPENSES | `{ category }` |
| DELETE | `/:id` | MANAGE_EXPENSES | `{ category }` |

**ExpenseCategory fields:** `{ name, description, isActive, sortOrder }`

### Expense Reports

**Base:** `/expense-reports` — all `[protect]`

| Method | Path | Response `data` |
|--------|------|----------------|
| POST | `/` | `{ report }` |
| GET | `/` | `[{ report }]` my reports |
| GET | `/:id` | `{ report }` |
| PUT | `/:id/submit` | `{ report }` (submit for approval) |

**ExpenseReport fields:** `{ employee, title, description, totalAmount, currency, status (Draft/Submitted/Approved/Denied) }`

### Expense Budgets

**Base:** `/expense-budgets` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| POST | `/` | MANAGE_EXPENSES | `{ budget }` |
| GET | `/:departmentId` | — | `{ budget }` |
| GET | `/:departmentId/summary` | — | `{ summary }` |

**ExpenseBudget fields:** `{ department, year, month, amount, spent, currency, notes }` — **Virtual:** `remaining`

### Expense Policies

**Base:** `/expense-policies` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ policy }]` |
| POST | `/` | MANAGE_EXPENSES | `{ policy }` |
| PUT | `/:id` | MANAGE_EXPENSES | `{ policy }` |
| DELETE | `/:id` | MANAGE_EXPENSES | `{ policy }` |

**ExpensePolicy fields:** `{ name, description, maxAmount, requiresReceipt, requiresManagerApproval, requiresAdminApproval, adminApprovalThreshold, allowedCategories, maxPerMonth, isActive }`

---

## Assets

**Base:** `/assets` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/my-assets` | — | `[{ asset }]` |
| GET | `/summary` | MANAGE_ASSETS | `{ byType, total, assigned, available }` |
| GET | `/licenses/summary` | MANAGE_ASSETS | license usage summary |
| GET | `/export` | MANAGE_ASSETS | CSV download |
| GET | `/` | MANAGE_ASSETS | `[{ asset }]` paginated |
| POST | `/` | MANAGE_ASSETS | `{ asset }` |
| GET | `/:id` | MANAGE_ASSETS | `{ asset }` |
| PUT | `/:id` | MANAGE_ASSETS | `{ asset }` |
| DELETE | `/:id` | MANAGE_ASSETS | `{ asset }` |
| GET | `/:id/history` | MANAGE_ASSETS | `[{ history }]` |
| GET | `/:id/depreciation` | MANAGE_ASSETS | depreciation schedule |
| POST | `/:id/attachments` | MANAGE_ASSETS | `FormData: file` |
| DELETE | `/:id/attachments/:documentId` | MANAGE_ASSETS | — |

**Asset fields:** `{ name, assetType (Hardware/Software/License/Other), serialNumber, purchaseDate, warrantyEndDate, status (Available/Assigned/In Repair/Retired), assignedTo, notes, maintenanceLastDate, maintenanceNextDate, licenseKey, seatsTotal, seatsUsed, licenseExpiryDate, purchasePrice, salvageValue, location, custodian, attachments }`

### Asset Requests

**Base:** `/asset-requests` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| POST | `/` | — | `{ assetRequest }` |
| GET | `/my-requests` | — | `[{ assetRequest }]` |
| GET | `/` | MANAGE_ASSETS | `[{ assetRequest }]` |
| PUT | `/:id/approve` | MANAGE_ASSETS | `{ assetRequest }` |
| PUT | `/:id/reject` | MANAGE_ASSETS | `{ assetRequest }` |
| PUT | `/:id/fulfill` | MANAGE_ASSETS | `{ assetRequest }` (creates linked asset) |

**AssetRequest fields:** `{ employee, assetType, justification, preferredAsset, status (Pending/Approved/Rejected/Fulfilled), reviewedBy, rejectionReason, linkedAsset }`

---

## Announcements

**Base:** `/announcements` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ announcement }]` published only |
| GET | `/all` | MANAGE_ANNOUNCEMENTS | `[{ announcement }]` all (incl. drafts) |
| GET | `/export` | MANAGE_ANNOUNCEMENTS | CSV download |
| POST | `/` | MANAGE_ANNOUNCEMENTS | `{ announcement }` |
| GET | `/:id` | — | `{ announcement }` |
| PUT | `/:id` | MANAGE_ANNOUNCEMENTS | `{ announcement }` |
| DELETE | `/:id` | MANAGE_ANNOUNCEMENTS | `{ message }` |

**Announcement fields:** `{ title, content, author, status (Draft/Published) }`

---

## Departments

**Base:** `/departments` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ department }]` |
| GET | `/export` | MANAGE_DEPARTMENTS | CSV download |
| POST | `/` | MANAGE_DEPARTMENTS | `{ department }` |
| GET | `/:id` | — | `{ department }` |
| PUT | `/:id` | MANAGE_DEPARTMENTS | `{ department }` |
| DELETE | `/:id` | MANAGE_DEPARTMENTS | `{ message }` |

**Department fields:** `{ name, description, manager }`

---

## Documents

**Base:** `/documents` — all `[protect]` | Feature flag: `documentManagement`

| Method | Path | Permission | Body / Query | Response `data` |
|--------|------|------------|-------------|----------------|
| GET | `/my-documents` | — | `?page&limit` | `[{ document }]` |
| GET | `/my-favorites` | — | — | `[{ document }]` |
| GET | `/pending-acknowledgements` | — | — | `[{ document }]` |
| GET | `/dashboard/stats` | MANAGE_DOCUMENTS | — | `{ totalDocs, activeDocs, expiredDocs, ... }` |
| GET | `/export` | MANAGE_DOCUMENTS | query | CSV download |
| GET | `/download/:id` | — | — | file stream (proxy to Cloudinary) |
| POST | `/` | MANAGE_DOCUMENTS | `{ title, fileUrl, category, ... }` | `{ document }` |
| GET | `/` | MANAGE_DOCUMENTS | `?page&limit&category&tags` | `[{ document }]` |
| POST | `/bulk/move` | MANAGE_DOCUMENTS | `{ documentIds, folderId }` | `{ modifiedCount }` |
| POST | `/bulk/delete` | MANAGE_DOCUMENTS | `{ documentIds }` | `{ modifiedCount }` |
| POST | `/bulk/tag` | MANAGE_DOCUMENTS | `{ documentIds, tags }` | `{ modifiedCount }` |
| GET | `/:id` | — | — | `{ document }` |
| PUT | `/:id` | MANAGE_DOCUMENTS | `{ title, category, ... }` | `{ document }` |
| DELETE | `/:id` | MANAGE_DOCUMENTS | — | soft delete |
| PUT | `/:id/restore` | MANAGE_DOCUMENTS | — | `{ document }` |
| POST | `/:id/acknowledge` | — | — | `{ document }` |
| PUT | `/:id/move` | — | `{ folderId }` | `{ document }` |
| POST | `/:id/favorite` | — | — | toggle favorite |
| GET | `/:id/versions` | — | — | `[{ version }]` |
| POST | `/:id/versions/:version/restore` | MANAGE_DOCUMENTS | — | `{ document }` |
| GET | `/:id/activity` | — | — | `[{ activity }]` |

### Document Folders

**Base:** `/documents/folders` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| POST | `/` | MANAGE_DOCUMENTS | `{ folder }` |
| GET | `/` | — | `[{ folder }]` |
| GET | `/:id` | — | `{ folder }` |
| PUT | `/:id` | MANAGE_DOCUMENTS | `{ folder }` |
| DELETE | `/:id` | MANAGE_DOCUMENTS | `{ message }` |

**Document fields:** `{ title, description, fileUrl, publicId, fileSize, mimeType, category, tags, folder, uploadedBy, currentVersion, acknowledgementRequired, acknowledgedBy, expiryDate, isActive }`

**DocumentFolder fields:** `{ name, parent, description, createdBy, isActive }`

---

## Uploads

**Base:** `/upload` — `[protect]` | Accepts: `jpeg, jpg, png, pdf` (max 10MB)

| Method | Path | Response |
|--------|------|---------|
| POST | `/` | `{ success: true, filePath, public_id }` — send `FormData` with field `file` |
| DELETE | `/` | `{ success: true, message }` — body: `{ publicId }` |

> Uploads go to Cloudinary. Set env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

---

## Chat

**Base:** `/chat` — all `[protect]` | Feature flag: `chat`

| Method | Path | Body / Query | Response `data` |
|--------|------|-------------|----------------|
| GET | `/conversations` | — | `[{ conversation }]` |
| GET | `/conversations/:conversationId/messages` | `?page&limit` | `[{ message }]` paginated |
| POST | `/conversations` | `{ participantId }` | `{ conversation }` DM or existing |
| POST | `/conversations/:conversationId/read` | — | `{ message }` mark read |
| POST | `/groups` | `{ name, participantIds }` | `{ conversation }` group |
| POST | `/groups/:conversationId/participants` | `{ userId }` | `{ conversation }` |
| DELETE | `/groups/:conversationId/participants` | `{ userId }` | `{ conversation }` |
| POST | `/upload` | `FormData: file` | `{ fileUrl, publicId, ... }` |
| PUT | `/messages/:messageId` | `{ text }` | `{ message }` |
| DELETE | `/messages/:messageId` | — | `{ message }` soft delete |
| POST | `/messages/:messageId/reactions` | `{ emoji }` | `{ message }` toggle reaction |
| POST | `/block/:userId` | — | `{ message }` |
| DELETE | `/block/:userId` | — | `{ message }` |
| GET | `/blocked` | — | `[{ user }]` |
| POST | `/conversations/:conversationId/mute` | — | `{ message }` toggle mute |
| GET | `/search` | `?q&page&limit` | `[{ message }]` search across conversations |
| GET | `/conversations/:conversationId/export` | — | JSON file |
| GET | `/online` | — | `[{ userId, name }]` online users |

**Conversation fields:** `{ participants, isGroup, groupName, groupAvatar, groupDescription, createdBy, admins, mutedBy, lastMessage: { text, sender, createdAt, messageType } }`

**Message fields:** `{ conversationId, sender, text, messageType (text/image/file/system), attachments, isRead, readBy, editedAt, deleted, deletedFor, reactions, parentMessage }`

---

## Notifications

**Base:** `/notifications` — all `[protect]` | Rate limit: general (not writeLimiter)

| Method | Path | Body / Query | Response `data` |
|--------|------|-------------|----------------|
| GET | `/` | `?page&limit&type` | `[{ notification }]` paginated |
| GET | `/unread-count` | — | `{ count }` |
| GET | `/preferences` | — | `{ preferences }` |
| PUT | `/preferences` | `{ types: { Leave, Task, ... }, email, push }` | `{ preferences }` |
| PUT | `/:id/read` | — | `{ notification }` |
| PUT | `/read-all` | — | `{ message }` |

**Notification fields:** `{ recipient, sender, message, type (Leave/Task/Expense/Announcement/General/Kudos/Document/Asset/System), priority, isRead, link }`

**NotificationPreference fields:** `{ user, types: { Leave, Task, Expense, Announcement, General, Kudos, Document, Asset, System } each Boolean, email, push }`

---

## Performance Reviews

### Reviews

**Base:** `/reviews` — all `[protect]`

| Method | Path | Permission | Body / Query | Response `data` |
|--------|------|------------|-------------|----------------|
| GET | `/my-reviews` | — | `?page&limit` | `[{ review }]` paginated |
| GET | `/team-reviews` | VIEW_TEAM_REVIEWS | `?page&limit` | `[{ review }]` — entire reporting tree |
| GET | `/history/:employeeId` | — | — | `[{ review }]` |
| GET | `/export` | MANAGE_REVIEWS | query | CSV download |
| POST | `/initiate-cycle` | MANAGE_REVIEWS | `{ cycleName, employeeIds, templateId }` | `{ reviews }` |
| GET | `/:id` | — | — | `{ review }` full detail |
| PUT | `/:id/self-assessment` | — | `{ strengths, areasForImprovement, feedback }` | `{ review }` |
| PUT | `/:id/manager-review` | MANAGE_REVIEWS | `{ overallPerformance, goalsForNextCycle, managerFeedback }` | `{ review }` |
| PUT | `/:id/approve` | MANAGE_REVIEWS | — | `{ review }` |
| PUT | `/:id/archive` | MANAGE_REVIEWS | — | `{ review }` |
| PUT | `/:id/goals` | — | `{ goal, targetDate }` | `{ review }` |
| PUT | `/:id/goals/:goalId` | — | `{ achieved: true/false }` | `{ review }` |

**Review fields:** `{ employee, manager, template, cycleName, status (Pending Self-Assessment/Pending Manager Review/Pending Approval/Complete/Archived), rating, weightedScore, selfAssessment: { strengths, areasForImprovement, feedback }, managerReview: { overallPerformance, goalsForNextCycle, managerFeedback }, goals: [{ goal, targetDate, achieved }], criteria: [{ name, weight, score }], approvedBy, approvedAt }`

### Review Templates

**Base:** `/review-templates` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ template }]` |
| GET | `/:id` | — | `{ template }` |
| POST | `/` | MANAGE_REVIEWS | `{ template }` |
| PUT | `/:id` | MANAGE_REVIEWS | `{ template }` |
| DELETE | `/:id` | MANAGE_REVIEWS | `{ result }` |

**ReviewTemplate fields:** `{ name, description, criteria: [{ name, weight, description }], selfAssessmentQuestions, isActive, createdBy }`

### Review Schedules

**Base:** `/review-schedules` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ schedule }]` |
| POST | `/` | MANAGE_REVIEWS | `{ schedule }` |
| PUT | `/:id` | MANAGE_REVIEWS | `{ schedule }` |
| DELETE | `/:id` | MANAGE_REVIEWS | `{ result }` |

**ReviewSchedule fields:** `{ cycleName, frequency (quarterly/annual), department, startDate, selfAssessmentDeadline, managerDeadline, template, isActive, lastRun, nextRun, createdBy }`

### Peer Reviews

**Base:** `/peer-reviews` — all `[protect]`

| Method | Path | Response `data` |
|--------|------|----------------|
| POST | `/request` | `{ peerReviews }` |
| GET | `/:reviewId` | `[{ peerReview }]` |
| PUT | `/:id/submit` | `{ peerReview }` |

**PeerReview fields:** `{ review, reviewer, relationship (peer/subordinate/other), rating (1-5), feedback, strengths, areasForImprovement, status (Pending/Submitted) }`

---

## Skills

**Base:** `/skills` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ skill }]` |
| GET | `/export` | MANAGE_SKILLS | CSV download |
| POST | `/` | MANAGE_SKILLS | `{ skill }` |
| GET | `/:id` | — | `{ skill }` |
| PUT | `/:id` | MANAGE_SKILLS | `{ skill }` |
| DELETE | `/:id` | MANAGE_SKILLS | archive |

**Skill fields:** `{ name, category, createdBy, isArchived }`

---

## Kudos

**Base:** `/kudos` — all `[protect]` | Feature flag: `kudos`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| POST | `/` | — | `{ kudos }` |
| GET | `/` | — | `[{ kudos }]` |
| GET | `/user/:userId` | — | `[{ kudos }]` for a user |
| GET | `/export` | MANAGE_KUDOS | CSV download |
| DELETE | `/:id` | — | `{ message }` |

**Kudos fields:** `{ sender, recipient, message (max 280), companyValue }`

---

## Surveys

**Base:** `/surveys` — all `[protect]` | Feature flag: `surveys`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/my-surveys` | — | `[{ survey }]` assigned to me |
| POST | `/` | MANAGE_SURVEYS | `{ survey }` |
| GET | `/` | MANAGE_SURVEYS | `[{ survey }]` |
| GET | `/export` | MANAGE_SURVEYS | CSV download |
| GET | `/:id` | VIEW_SURVEYS | `{ survey }` |
| PUT | `/:id` | MANAGE_SURVEYS | `{ survey }` |
| DELETE | `/:id` | MANAGE_SURVEYS | `{ message }` |
| POST | `/:id/responses` | — | `{ answers: [...] }` |
| GET | `/:id/results` | MANAGE_SURVEYS | aggregated results |

**Survey fields:** `{ title, description, creator, questions: [{ questionText, questionType, options }], recipients, status (draft/active/closed), isAnonymous }`

---

## Jobs & Referrals

### Jobs

**Base:** `/jobs` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `[{ job }]` |
| GET | `/export` | MANAGE_JOBS | CSV download |
| POST | `/` | MANAGE_JOBS | `{ job }` |
| GET | `/:id` | — | `{ job }` |
| PUT | `/:id` | MANAGE_JOBS | `{ job }` |
| DELETE | `/:id` | MANAGE_JOBS | `{ message }` |

**Job fields:** `{ title, department, location (In Office/Remote/Hybrid), description, status (Open/Closed/On Hold), postedBy }`

### Referrals

**Base:** `/referrals` — all `[protect]` | Feature flag: `referrals`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| POST | `/` | — | `{ referral }` |
| GET | `/my-referrals` | — | `[{ referral }]` |
| GET | `/export` | MANAGE_REFERRALS | CSV download |
| GET | `/` | MANAGE_REFERRALS | `[{ referral }]` |
| GET | `/:id` | — | `{ referral }` |
| PUT | `/:id` | MANAGE_REFERRALS | `{ referral }` update status |

**Referral fields:** `{ job, candidateName, candidateEmail, candidatePhone, referredBy, status (Submitted/In Review/Interviewing/Hired/Not a Fit), resumeUrl }`

---

## Roles & Permissions

**Base:** `/roles` — all `[protect]` + `MANAGE_ROLES_PERMISSIONS`

| Method | Path | Response `data` |
|--------|------|----------------|
| GET | `/` | `[{ role }]` |
| POST | `/` | `{ role }` |
| POST | `/:id/clone` | `{ role }` (deep clone with permissions) |
| GET | `/:id` | `{ role }` |
| PUT | `/:id` | `{ role }` |
| DELETE | `/:id` | `{ result }` (cannot delete system roles) |

**Role fields:** `{ name, description, permissions: [String], isSystemRole }`

> Permission strings are defined in `config/permissions.js` — list of 40+ permissions like `manage_users`, `view_team_tasks`, etc.

---

## Settings

**Base:** `/settings` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/` | — | `{ settings }` entire settings doc |
| PUT | `/` | MANAGE_SYSTEM_SETTINGS | `{ ... }` update flat fields |
| GET | `/groups/:group` | — | `{ group }` e.g. `/groups/features`, `/groups/leave`, `/groups/attendance`, `/groups/security`, `/groups/notifications` |
| PUT | `/groups/:group` | MANAGE_SYSTEM_SETTINGS | `{ ... }` update a config group |

**Settings groups:**
- `features` — `{ chatEnabled, kudosEnabled, surveysEnabled, referralsEnabled, documentManagementEnabled }`
- `leave` — `{ carryOverEnabled, carryOverDays, carryOverExpiryMonths, proRataEnabled, managerApprovalRequired, hrCanApproveLeave, allowHalfDayRequests, minNoticeDays, maxPendingRequests }`
- `attendance` — `{ gracePeriodMinutes, autoClockoutMinutes, workStartTime, workEndTime, workingDays, requireLocation, allowOvertime, weeklyHoursCap }`
- `security` — `{ passwordMinLength, passwordRequireSpecialChar, passwordExpiryDays, sessionTimeoutMinutes, maxLoginAttempts, lockoutDurationMinutes, twoFactorRequired, twoFactorEnforcedRoles }`
- `notifications` — `{ emailNotificationsEnabled, pushNotificationsEnabled, dailyDigestEnabled, digestTime, quietHoursEnabled, quietHoursStart, quietHoursEnd }`

---

## Sensitive Data

**Base:** `/sensitive-data` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/:userId` | VIEW_SENSITIVE_DATA | `{ sensitiveData }` |
| PUT | `/:userId` | MANAGE_SENSITIVE_DATA | `{ salary, bankInfo, nationalId }` |

**SensitiveData fields:** `{ user, salary (encrypted), bankInfo: { accountNumber, bankName, routingNumber } (encrypted), nationalId (encrypted) }`

---

## Custom Fields

**Base:** `/custom-fields` — all `[protect]` + `MANAGE_CUSTOM_FIELDS`

| Method | Path | Response `data` |
|--------|------|----------------|
| GET | `/` | `[{ customField }]` |
| POST | `/` | `{ customField }` |
| PUT | `/:id` | `{ customField }` |
| DELETE | `/:id` | `{ message }` |

**CustomField fields:** `{ name, fieldType (Text/Number/Date/Select/MultiSelect), appliesTo (Task/User/Expense), options, isRequired, order }`

---

## Reports

**Base:** `/reports` — all `[protect]` + `VIEW_REPORTS`

| Method | Path | Response `data` |
|--------|------|----------------|
| GET | `/leave-by-department` | `[{ department, leaves }]` aggregated |
| GET | `/expenses-by-category` | `[{ category, totalAmount, count }]` aggregated |

---

## Dashboard

**Base:** `/dashboard` — all `[protect]`

| Method | Path | Permission | Response `data` |
|--------|------|------------|----------------|
| GET | `/data-health` | VIEW_ALL_USERS | `{ missingManager, missingDepartment, ... }` |
| GET | `/task-metrics` | CREATE_TASKS | `{ total, byStatus, byPriority, overdue }` |
| GET | `/leave-metrics` | VIEW_TEAM_LEAVE | `{ approved, pending, byType, ... }` |

---

## Directory

**Base:** `/directory` — all `[protect]`

| Method | Path | Response `data` |
|--------|------|----------------|
| GET | `/chat-directory` | `[{ user }]` users available for chat |

---

## Admin

**Base:** `/admin` — all `[protect]` + `MANAGE_USERS`

| Method | Path | Response `data` |
|--------|------|----------------|
| GET | `/leave-requests` | `[{ leave }]` all leave requests (HR view) |

---

## Common Query Parameters (for paginated endpoints)

| Param | Type | Default | Example |
|-------|------|---------|---------|
| `page` | Number | 1 | `?page=2` |
| `limit` | Number | 10 | `?limit=20` |
| `status` | String | — | `?status=Pending` |
| `search` | String | — | `?search=john` |

---

## Rate Limiting

| Limiter | Applied On | Window | Max Requests |
|---------|-----------|--------|-------------|
| `loginLimiter` | POST /auth/login | 15 min | 10 |
| `refreshLimiter` | POST /auth/refresh | 15 min | 20 |
| `sensitiveActionLimiter` | 2FA endpoints | 15 min | 5 |
| `clockLimiter` | clock-in/out | 1 min | 10 |
| `writeLimiter` | All mutation routes | 15 min | 100 |

---

## Common Headers

```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

For file uploads: `Content-Type: multipart/form-data`

---

## Auth Flow

1. `POST /auth/login` → get `{ accessToken, refreshToken }`
2. Send `Authorization: Bearer <accessToken>` on every request
3. When access token expires (1h), call `POST /auth/refresh` with `{ refreshToken }` → get new tokens
4. On logout: `POST /auth/logout` with `{ refreshToken }`

> `req.user` on backend always contains: `{ id, name, email, systemRole, roles, permissions, profilePictureUrl }`
