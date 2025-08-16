import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; 
import leaveReducer from '../features/leave/leaveSlice';
import managerReducer from '../features/manager/managerSlice'
import adminReducer from '../features/admin/adminSlice';
import departmentReducer from '../features/department/departmentSlice';
import adminLeavesReducer from '../features/admin-leaves/adminLeavesSlice';
import announcementReducer from '../features/announcement/announcementSlice'; 
import assetReducer from '../features/asset/assetSlice';
import taskReducer from '../features/task/taskSlice'; 
import checklistReducer from '../features/checklist/checklistSlice'
import expenseReducer from '../features/expense/expenseSlice'
import jobReducer from '../features/job/jobSlice'; 
import referralReducer from '../features/referral/referralSlice';
import notificationReducer from '../features/notification/notificationSlice';
import reportReducer from '../features/report/reportSlice';
import directoryReducer from '../features/directory/directorySlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
     leave: leaveReducer,
      manager: managerReducer,
      admin: adminReducer,
      department: departmentReducer,
      adminLeaves: adminLeavesReducer,
      announcement: announcementReducer,
      asset: assetReducer,
      task: taskReducer,
      checklist: checklistReducer, 
       expense: expenseReducer,
       job: jobReducer,
        referral: referralReducer,
        notification: notificationReducer,
        report: reportReducer,
        directory: directoryReducer,
        dashboard: dashboardReducer,
  },
});