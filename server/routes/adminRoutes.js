import express from 'express';
import { 
    getUsers, 
    updateUser, 
    deleteUser, 
    getTeachersWithAttendance, 
    markTeacherAttendance,
    getTeacherDetails,
    updateTeacherAssignments,
    getStudentDetails,
    updateStudentEnrollment,
    updateUserRole,
    getAllCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getAdminDashboardStats,
    getAttendanceHistory,
    getAnnualAttendanceReport,
    getSystemSettings,
    updateSystemSettings,
    sendBroadcast,
    getBroadcasts,
    getDepartments,
    getEligibleStudentsForCourse,
    finalizeCourseBatch,
    unlockCourseResults,
    approveCourseResults,
    rejectCourseResults,
    notifyFaculty,
    getPendingTeachers,
    authorizeTeacher
} from '../controllers/adminController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// All routes are protected by admin check
router.use(protect);
router.use(admin);

// USER MANAGEMENT
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// TEACHER ATTENDANCE
router.get('/teachers/attendance', getTeachersWithAttendance);
router.post('/teachers/attendance', markTeacherAttendance);

// TEACHER & COURSE MGMT
router.get('/teachers/pending', getPendingTeachers);
router.post('/teachers/pending/:id/authorize', authorizeTeacher);
router.get('/teachers/:id', getTeacherDetails);
router.put('/teachers/:teacherId/assignments', updateTeacherAssignments);
router.get('/students/:id', getStudentDetails);
router.put('/students/:studentId/enrollment', updateStudentEnrollment);
router.put('/users/:userId/role', updateUserRole);
router.get('/courses', getAllCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);
router.get('/courses/eligible-students', getEligibleStudentsForCourse);
router.post('/courses/:courseId/finalize-batch', finalizeCourseBatch);
router.post('/results/unlock', unlockCourseResults);
router.post('/results/approve', approveCourseResults);
router.post('/results/reject', rejectCourseResults);
router.post('/results/notify-faculty', notifyFaculty);

// DASHBOARD STATS
router.get('/stats', getAdminDashboardStats);

// ATTENDANCE ANALYTICS
router.get('/attendance/history', getAttendanceHistory);
router.get('/attendance/annual-report', getAnnualAttendanceReport);

// SYSTEM SETTINGS
router.get('/settings', getSystemSettings);
router.put('/settings', updateSystemSettings);

// BROADCASTS
router.get('/broadcasts', getBroadcasts);
router.post('/broadcasts', sendBroadcast);

export default router;
