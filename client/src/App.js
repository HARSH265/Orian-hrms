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
import DirectoryPage from './pages/DirectoryPage'; 


// --- Manager Pages ---
import TeamPage from './pages/TeamPage';
import ExpenseApprovalPage from './pages/ExpenseApprovalPage';

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

// --- NEW: Job Openings & Referrals Pages ---
import JobOpeningsPage from './pages/JobOpeningsPage';
import AdminJobsPage from './pages/AdminJobsPage';
import AdminReferralsPage from './pages/AdminReferralsPage';

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
            
             {/* --- NEW: Job Openings Route (for all users) --- */}
            <Route path="/jobs" element={<JobOpeningsPage />} />

            {/* Admin-Specific Routes */}
            <Route path="/admin/users" element={<AdminUserPage />} />
            <Route path="/admin/departments" element={<DepartmentPage />} />
            <Route path="/admin/leaves" element={<AdminLeavePage />} />
            <Route path="/admin/expenses" element={<AdminExpensesPage />} /> 
            <Route path="/admin/announcements" element={<AnnouncementAdminPage />} />
            <Route path="/admin/assets" element={<AssetAdminPage />} />
            <Route path="/admin/checklist-templates" element={<ChecklistTemplatePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
             {/* --- NEW: Admin Job & Referral Routes --- */}
            <Route path="/admin/jobs" element={<AdminJobsPage />} />
            <Route path="/admin/referrals" element={<AdminReferralsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;