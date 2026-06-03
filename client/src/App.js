import React, { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Spin, notification } from 'antd';
import { getMe } from './features/auth/authThunks';

// --- Core Layouts and Authentication ---
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import WizardGuard from './components/WizardGuard';

// Lazy load page components
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const LeavePage = React.lazy(() => import('./pages/LeavePage'));
const MyExpensesPage = React.lazy(() => import('./pages/MyExpensesPage'));
const MyAttendancePage = React.lazy(() => import('./pages/MyAttendancePage'));
const TeamAttendancePage = React.lazy(() => import('./pages/TeamAttendancePage'));
const MySurveysPage = React.lazy(() => import('./pages/MySurveysPage'));
const SurveyTakerPage = React.lazy(() => import('./pages/SurveyTakerPage'));
const MyDocumentsPage = React.lazy(() => import('./pages/MyDocumentsPage'));
const DirectoryPage = React.lazy(() => import('./pages/DirectoryPage'));
const TeamPage = React.lazy(() => import('./pages/TeamPage'));
const ExpenseApprovalPage = React.lazy(() => import('./pages/ExpenseApprovalPage'));
const PerformancePage = React.lazy(() => import('./pages/PerformancePage'));
const TaskRouterPage = React.lazy(() => import('./pages/TaskRouterPage'));
const AdminUserPage = React.lazy(() => import('./pages/AdminUserPage'));
const DepartmentPage = React.lazy(() => import('./pages/DepartmentPage'));
const AdminLeavePage = React.lazy(() => import('./pages/AdminLeavePage'));
const AnnouncementAdminPage = React.lazy(() => import('./pages/AnnouncementAdminPage'));
const AssetAdminPage = React.lazy(() => import('./pages/AssetAdminPage'));
const ChecklistTemplatePage = React.lazy(() => import('./pages/ChecklistTemplatePage'));
const AdminExpensesPage = React.lazy(() => import('./pages/AdminExpensesPage'));
const AdminExpenseCategoriesPage = React.lazy(() => import('./pages/AdminExpenseCategoriesPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const AdminPerformancePage = React.lazy(() => import('./pages/AdminPerformancePage'));
const AdminSkillsPage = React.lazy(() => import('./pages/AdminSkillsPage'));
const AdminLeavePoliciesPage = React.lazy(() => import('./pages/AdminLeavePoliciesPage'));
const AdminSurveysPage = React.lazy(() => import('./pages/AdminSurveysPage'));
const SurveyResultsPage = React.lazy(() => import('./pages/SurveyResultsPage'));
const AdminDocumentsPage = React.lazy(() => import('./pages/AdminDocumentsPage'));
const AdminSettingsPage = React.lazy(() => import('./pages/AdminSettingsPage'));
const AdminOrgChartEditorPage = React.lazy(() => import('./pages/AdminOrgChartEditorPage'));
const AdminCustomFieldsPage = React.lazy(() => import('./pages/AdminCustomFieldsPage'));
const JobOpeningsPage = React.lazy(() => import('./pages/JobOpeningsPage'));
const AdminJobsPage = React.lazy(() => import('./pages/AdminJobsPage'));
const AdminReferralsPage = React.lazy(() => import('./pages/AdminReferralsPage'));
const AdminRolesPage = React.lazy(() => import('./pages/AdminRolesPage'));


function App() {
  const dispatch = useDispatch();
  const { token, user, tokenExpiryWarning } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
  }, [token, user, dispatch]);

  useEffect(() => {
    if (tokenExpiryWarning) {
      notification.warning({
        message: 'Session Expiring Soon',
        description: 'Your session will expire in less than 5 minutes. Please save your work.',
        duration: 10,
        key: 'token-expiry-warning',
      });
    }
  }, [tokenExpiryWarning]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* The WizardGuard intercepts new users */}
            <Route element={<WizardGuard />}>
              {/* All standard authenticated routes use the MainLayout */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<DashboardPage />} />
                
                {/* User & Manager Routes */}
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/leave" element={<LeavePage />} />
                <Route path="/expenses" element={<MyExpensesPage />} /> 
                <Route path="/team" element={<TeamPage />} />
                <Route path="/expenses/approvals" element={<ExpenseApprovalPage />} />
                <Route path="/tasks" element={<TaskRouterPage />} />
                <Route path="/directory" element={<DirectoryPage />} />
                <Route path="/performance" element={<PerformancePage />} />
                <Route path="/attendance" element={<MyAttendancePage />} />
                <Route path="/team/attendance" element={<TeamAttendancePage />} />    
                 <Route path="/documents" element={<MyDocumentsPage />} />

                 {/* --- NEW: Job Openings Route (for all users) --- */}
                <Route path="/jobs" element={<JobOpeningsPage />} />
                <Route path="/surveys" element={<MySurveysPage />} /> 
                <Route path="/surveys/:surveyId" element={<SurveyTakerPage />} /> 

                {/* Admin-Specific Routes */}
                <Route path="/admin/users" element={<AdminUserPage />} />
                <Route path="/admin/departments" element={<DepartmentPage />} />
                <Route path="/admin/leaves" element={<AdminLeavePage />} />
                 <Route path="/admin/expenses" element={<AdminExpensesPage />} />
                 <Route path="/admin/expense-categories" element={<AdminExpenseCategoriesPage />} />
                <Route path="/admin/announcements" element={<AnnouncementAdminPage />} />
                <Route path="/admin/assets" element={<AssetAdminPage />} />
                <Route path="/admin/checklist-templates" element={<ChecklistTemplatePage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/admin/reports&analytics" element={<AdminDashboardPage />} />
                <Route path="/admin/performance" element={<AdminPerformancePage />} />
                <Route path="/admin/jobs" element={<AdminJobsPage />} />
                <Route path="/admin/referrals" element={<AdminReferralsPage />} />
                <Route path="/admin/skills" element={<AdminSkillsPage />} />
                 <Route path="/admin/leave-policies" element={<AdminLeavePoliciesPage />} />
                 <Route path="/admin/surveys" element={<AdminSurveysPage />} />
                 <Route path="/admin/surveys/:surveyId/results" element={<SurveyResultsPage />}/>
                 <Route path="/admin/documents" element={<AdminDocumentsPage />} />
                 <Route path="/admin/roles" element={<AdminRolesPage/>} />
                  <Route path="/admin/settings" element={<AdminSettingsPage />} /> 
                  <Route path="/admin/org-chart-editor" element={<AdminOrgChartEditorPage />} />
                  <Route path="/admin/settings/custom-fields" element={<AdminCustomFieldsPage />} />              
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
