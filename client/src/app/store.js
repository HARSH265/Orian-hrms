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
import reviewReducer from '../features/review/reviewSlice';
import attendanceReducer from '../features/attendance/attendanceSlice';
import skillReducer from '../features/skill/skillSlice';
import leavePolicyReducer from '../features/leave-policy/leavePolicySlice'; // <-- IMPORT
import kudosReducer from '../features/kudos/kudosSlice';
import surveyReducer from '../features/survey/surveySlice';
import documentReducer from '../features/document/documentSlice';
import settingsReducer from '../features/settings/settingsSlice';
import chatReducer from '../features/chat/chatSlice';
import customFieldReducer from '../features/customFields/customFieldSlice'; 
import roleReducer from '../features/roles/roleSlice'; 
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
        review: reviewReducer,
        attendance: attendanceReducer,
        skill: skillReducer,
        leavePolicy: leavePolicyReducer,
        kudos: kudosReducer,
         survey: surveyReducer,
         document: documentReducer,
         settings: settingsReducer,
         chat: chatReducer,
          customFields: customFieldReducer,
           roles: roleReducer,
  },
});