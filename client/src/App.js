import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// --- Core Layouts and Authentication ---
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
//import WelcomeWizardPage from './pages/WelcomeWizardPage'; // <-- THIS IMPORT IS NOW CORRECTLY ADDED BACK
import WizardGuard from './components/WizardGuard';

// --- Standard User Pages ---
import ProfilePage from './pages/ProfilePage';
import LeavePage from './pages/LeavePage';
import MyExpensesPage from './pages/MyExpensesPage';
import MyAttendancePage from './pages/MyAttendancePage';
import TeamAttendancePage from './pages/TeamAttendancePage';
import MySurveysPage from './pages/MySurveysPage'; 
import SurveyTakerPage from './pages/SurveyTakerPage'; 
import MyDocumentsPage from './pages/MyDocumentsPage';
import DirectoryPage from './pages/DirectoryPage';

// --- Manager Pages ---
import TeamPage from './pages/TeamPage';
import ExpenseApprovalPage from './pages/ExpenseApprovalPage';
import PerformancePage from './pages/PerformancePage'; 

// --- Task Management Pages ---
import TaskRouterPage from './pages/TaskRouterPage';

// --- Admin Pages ---
import AdminUserPage from './pages/AdminUserPage';
import DepartmentPage from './pages/DepartmentPage';
import AdminLeavePage from './pages/AdminLeavePage';
import AnnouncementAdminPage from './pages/AnnouncementAdminPage';
import AssetAdminPage from './pages/AssetAdminPage';
import ChecklistTemplatePage from './pages/ChecklistTemplatePage';
import AdminExpensesPage from './pages/AdminExpensesPage';
import ReportsPage from './pages/ReportsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminPerformancePage from './pages/AdminPerformancePage';
import AdminSkillsPage from './pages/AdminSkillsPage';
import AdminLeavePoliciesPage from './pages/AdminLeavePoliciesPage';
import AdminSurveysPage from './pages/AdminSurveysPage';
import SurveyResultsPage from './pages/SurveyResultsPage';
import AdminDocumentsPage from './pages/AdminDocumentsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminOrgChartEditorPage from './pages/AdminOrgChartEditorPage';
import AdminCustomFieldsPage from './pages/AdminCustomFieldsPage'
// --- NEW: Job Openings & Referrals Pages ---
import JobOpeningsPage from './pages/JobOpeningsPage';
import AdminJobsPage from './pages/AdminJobsPage';
import AdminReferralsPage from './pages/AdminReferralsPage';
import AdminRolePage from './pages/AdminRolesPage'

// --- Redux Thunks ---
import { getMe } from './features/auth/authThunks';

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(getMe());
    }
  }, [token, user, dispatch]);

  return (
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
             <Route path="/admin/roles" element={<AdminRolePage/>} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} /> 
              <Route path="/admin/org-chart-editor" element={<AdminOrgChartEditorPage />} />
              <Route path="/admin/settings/custom-fields" element={<AdminCustomFieldsPage />} />              
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;