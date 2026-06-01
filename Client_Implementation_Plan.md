# Orion HRMS – Client-Side Implementation Plan

**Objective**: Fix critical issues, improve code quality, add responsiveness, and prepare for production.

---

## Phase 1: Critical Fixes (Week 1) 🔴

### 1.1 Remove Dead Code & Fix Naming
- [ ] Delete `components/Navbar.js` (orphaned)
- [ ] Delete `components/directory/OrgChart.js` (orphaned, broken import)
- [ ] Delete `components/tasks/MyTasks.js` (superseded by MyTasksPage)
- [ ] Rename `HighLevelTasksPage.js.js` → `HighLevelTasksPage.js`
- [ ] Remove ~807 lines of commented-out code from:
  - `AdminUserPage.js` (408 lines)
  - `DashboardPage.js` (133 lines)
  - `TeamTasks.js` (130 lines)
  - `LeavePage.js` (136 lines)

### 1.2 Remove Unused Packages
- [ ] Remove `saas` from package.json
- [ ] Remove `@ant-design/pro-components` from package.json
- [ ] Remove `web-vitals` from package.json
- [ ] Remove `dotenv` from package.json
- [ ] Remove `styled-components` from package.json
- [ ] Migrate 3 `moment.js` usages to `dayjs`, then remove `moment`

### 1.3 Fix Security & Critical Bugs
- [ ] Remove `console.log` that logs access token (`authThunks.js` line 20)
- [ ] Fix hardcoded `http://localhost:5004` in `MyExpensesPage.js` line 61
- [ ] Add API timeout (30s) to axios instance in `api.js`
- [ ] Fix `undefined` error messages on network failure (standardize error extraction in all thunks)

### 1.4 Error Handling Hardening
- [ ] Add ErrorBoundary wrappers around individual pages in `App.js`
- [ ] Fix WizardGuard infinite spinner on `getMe` failure
- [ ] Add error feedback to `WelcomeWizardPage.handleFinishWizard`
- [ ] Add Socket.IO `connect_error` handler in `SocketContext.js`

---

## Phase 2: Code Quality & Reusability (Week 2) 🟡

### 2.1 Extract Shared Components
- [ ] Create `components/common/TaskCreateModal.js` (replace 5 duplicates)
- [ ] Create `components/common/FilterBar.js` (replace 4 duplicates)
- [ ] Create `components/common/StatusTag.js` (replace 4 duplicates)
- [ ] Create `components/common/CustomFieldInput.js` (replace 2 duplicates)

### 2.2 Create Custom Hooks
- [ ] Create `hooks/useDebouncedFilter.js` (replace 5+ debounce patterns)
- [ ] Create `hooks/useCrudModal.js` (replace 10+ modal state patterns)
- [ ] Create `hooks/usePaginatedFetch.js` (replace 5+ pagination patterns)

### 2.3 Standardize Error Handling
- [ ] Create `utils/errorExtractor.js` with robust error extraction
- [ ] Update all 30+ thunks to use consistent error pattern:
  ```js
  const message = error.response?.data?.message || error.message || 'An error occurred';
  return rejectWithValue(message);
  ```

### 2.4 Split Large Components
- [ ] Split `TaskDetailsModal.js` (389 lines) into 8 tab sub-components
- [ ] Split `AdminUserPage.js` into focused components
- [ ] Split `ProfilePage.js` into section components

---

## Phase 3: Responsiveness (Week 3) 🟡

### 3.1 Fix Critical Responsive Issues
- [ ] Make `ChatWidget` responsive (max-width: 100vw, max-height: 80vh)
- [ ] Make `LoginPage` card responsive (width: min(400px, 90vw))
- [ ] Make `GanttView` sidebar responsive (collapse on mobile)
- [ ] Make `KanbanBoard` scroll horizontally on mobile

### 3.2 Mobile Navigation
- [ ] Add hamburger menu toggle in `Header.js` for mobile
- [ ] Add Ant Design `Drawer` for mobile sidebar navigation
- [ ] Use `useBreakpoint` hook to detect mobile viewports

### 3.3 Responsive Utilities
- [ ] Create `styles/responsive.js` with breakpoints and media query helpers
- [ ] Add responsive mixins for common patterns (stack on mobile, side-by-side on desktop)

---

## Phase 4: Performance (Week 4) 🟢

### 4.1 React Optimizations
- [ ] Add `React.memo()` to presentational components:
  - `ViewSwitcher.js`, `KanbanCard.js`, `KudosCard.js`, `OrgChartNode.js`
  - Dashboard widgets (`MyOpenTasks`, `PendingApprovals`, `ClockWidget`)
- [ ] Add `useMemo`/`useCallback` where missing in large components
- [ ] Implement `React.lazy()` for route-level code splitting

### 4.2 Redux Optimizations
- [ ] Lazy-load Redux slices for infrequent features (reports, referrals, reviews)
- [ ] Use `createEntityAdapter` for normalized data in high-frequency slices

### 4.3 Loading States
- [ ] Add Ant Design `<Skeleton>` components for:
  - Dashboard page initial load
  - Profile page sections
  - Table-based pages (replace empty table flash)

---

## Phase 5: Accessibility (Week 5) 🟢

### 5.1 Keyboard Navigation
- [ ] Add `tabIndex` and `onKeyDown` handlers to interactive elements
- [ ] Implement focus trapping in modals
- [ ] Add skip-to-content link
- [ ] Add keyboard shortcuts for common actions

### 5.2 ARIA & Screen Reader
- [ ] Add `aria-label` to all icon-only buttons
- [ ] Add `aria-live` regions for dynamic content (toasts, loading states)
- [ ] Add `role` attributes where needed
- [ ] Add `alt` text to all images/avatars

### 5.3 Color & Contrast
- [ ] Fix chat timestamp contrast issue
- [ ] Ensure all text meets WCAG AA contrast ratios
- [ ] Add focus-visible styles

---

## Phase 6: Production Hardening (Week 6) 🟢

### 6.1 Environment Configuration
- [ ] Create `.env.development`, `.env.staging`, `.env.production`
- [ ] Remove hardcoded localhost URLs
- [ ] Configure proper CORS origins per environment

### 6.2 Monitoring & Error Tracking
- [ ] Integrate Sentry or similar error tracking
- [ ] Add performance monitoring (Web Vitals)
- [ ] Add user session recording (optional)

### 6.3 Final Cleanup
- [ ] Run `npm audit fix` for client dependencies
- [ ] Remove all `console.log` statements (replace with error tracking)
- [ ] Verify all components handle loading/error/empty states
- [ ] Test on mobile devices (iOS Safari, Chrome Android)

---

## Success Criteria

| Criteria | Target |
|----------|--------|
| Dead code removed | 0 commented-out blocks, 0 orphaned files |
| Unused packages removed | 6 packages removed |
| Error messages | 100% show meaningful text (no `undefined`) |
| API timeout | 30s timeout on all requests |
| Shared components | 4 common components extracted |
| Custom hooks | 3 custom hooks created |
| Responsive | All components work on 320px+ screens |
| Accessibility | WCAG AA compliance |
| Bundle size | 20% reduction via code splitting |
| Console statements | 0 in production build |

---

*Prepared by OpenCode – client-side implementation roadmap*
