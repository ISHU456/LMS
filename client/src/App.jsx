import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Layout
import Navbar from './components/Navbar';


import AchievementToaster from './components/AchievementToaster';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import ScrollToTop from './components/ScrollToTop';
import LockedOverlay from './components/LockedOverlay';
import GlobalAlertMarquee from './components/GlobalAlertMarquee';
import ActivityTracker from './components/ActivityTracker';

// Auth pages
import Login from './pages/auth/Login';
import RoleLogin from './pages/auth/RoleLogin';

// Dashboard pages
import AdminDashboard from './pages/dashboards/AdminDashboard';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import FacultyDashboard from './pages/dashboards/FacultyDashboard';
import HODDashboard from './pages/dashboards/HODDashboard';
import LibrarianDashboard from './pages/dashboards/LibrarianDashboard';
import ParentDashboard from './pages/dashboards/ParentDashboard';

// Course pages
import Courses from './pages/courses/Courses';
import CourseDetail from './pages/courses/CourseDetail';
import UploadCenter from './pages/courses/UploadCenter';
import QuickSchedulePage from './pages/courses/schedule/QuickSchedulePage';

// Announcements
import Announcements from './pages/announcements/Announcements';

// Live
import LiveClass from './pages/live/LiveClass';

// General pages
import Home from './pages/general/Home';
import Profile from './pages/general/Profile';
import Achievements from './pages/general/Achievements';
import AITutor from './pages/general/AITutor';
import AIMode from './pages/general/AIMode';
import DepartmentSelection from './pages/general/DepartmentSelection';
import Departments from './pages/general/Departments';
import DepartmentDetail from './pages/departments/DepartmentDetail';
import Assignments from './pages/general/Assignments';

// Admin pages
import AdminAiManagement from './pages/admin/AdminAiManagement';
import AdminUserAiDetail from './pages/admin/AdminUserAiDetail';

// Result pages
import ResultEntry from './pages/results/ResultEntry';
import ResultVerification from './pages/results/ResultVerification';
import StudentResults from './pages/results/StudentResults';
import ResultsAnalytics from './pages/results/ResultsAnalytics';
import MasterArena from './pages/student/MasterArena';
import QuizeWorkspace from './pages/general/QuizeWorkspace';
import Notifications from './pages/general/Notifications';





import NotificationListener from './components/NotificationListener';
import { MFAProvider } from './modules/mfa/MFAContext';
import MFAVerify from './pages/auth/MFAVerify';
import FaceRegistrationPage from './pages/auth/FaceRegistrationPage';
import SelfAttendance from './pages/attendance/SelfAttendance';
import DailyAttendance from './pages/attendance/DailyAttendance';
import GPSConfigPage from './pages/admin/GPSConfigPage';
import AdminQuizeArena from './pages/admin/AdminQuizeArena';

// Protected Route Component for Role-based Access Control
const DashboardRedirect = () => {
    const { user } = useSelector((state) => state.auth);
    if (!user) return <Navigate to="/login" replace />;
    
    switch (user.role) {
        case 'admin': return <Navigate to="/admin-dashboard" replace />;
        case 'teacher': return <Navigate to="/faculty-dashboard" replace />;
        case 'student': return <Navigate to="/student-dashboard" replace />;
        case 'hod': return <Navigate to="/hod-dashboard" replace />;
        case 'librarian': return <Navigate to="/librarian-dashboard" replace />;
        case 'parent': return <Navigate to="/parent-dashboard" replace />;
        default: return <Navigate to="/student-dashboard" replace />;
    }
};

const ProtectedRoute = ({ children, allowedRoles, checkDept = true }) => {

  const { user } = useSelector((state) => state.auth);
  const selectedDept = JSON.parse(localStorage.getItem('selectedDepartment'));

  if (!user) {
    return <LockedOverlay />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <LockedOverlay 
        title="Unauthorized Access" 
        message="Your current role clearance does not permit entry to this sector." 
      />
    );
  }

  // Redirect to face registration for students, admins, and teachers if not yet done
  if ((user.role === 'student' || user.role === 'admin' || user.role === 'teacher') && !user.faceRegistered) {
     const currentPath = window.location.pathname;
     if (currentPath !== '/face-registration' && !currentPath.includes('/login') && currentPath !== '/') {
        return <Navigate to="/face-registration" replace />;
     }
  }

  // Redirect to department selection if not admin and department not selected in DB and localStorage
  const hasDepartment = user.department || selectedDept;

  if (checkDept && user.role !== 'admin' && !hasDepartment) {
    return <Navigate to="/select-department" replace />;
  }

  return children;
};

// Wrapper for Footer visibility logic
const AppContent = () => {
  const location = useLocation();
  const isAIMode = location.pathname === '/ai-mode';
  const { user } = useSelector((state) => state.auth);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [quizGenOpen, setQuizGenOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/public/settings');
        if (data) {
          if (data.maintenanceMode) {
            setMaintenanceMode(true);
          }
          // Apply background colors to CSS variables
          if (data.lightModeBgColor) {
            document.documentElement.style.setProperty('--bg-light', data.lightModeBgColor);
          }
          if (data.darkModeBgColor) {
            document.documentElement.style.setProperty('--bg-dark', data.darkModeBgColor);
          }

          // Personal Theme Override - Subverts institutional default if user has specified a preference
          const personalTheme = localStorage.getItem('personal_theme');
          if (personalTheme) {
              try {
                  const theme = JSON.parse(personalTheme);
                  document.documentElement.style.setProperty('--bg-light', theme.light);
                  document.documentElement.style.setProperty('--bg-dark', theme.dark);
              } catch (e) {
                  console.error("Personal theme corruption detected.");
              }
          }
        }
      } catch (err) {
        console.error("Failed to check maintenance status");
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync department from user profile to localStorage if missing
  useEffect(() => {
    const storedDept = localStorage.getItem('selectedDepartment');
    if (user && user.department && !storedDept) {
      const fetchAndSyncDept = async () => {
        try {
          const res = await axios.get('http://localhost:5001/api/departments');
          const dept = res.data.find(d => d.code === user.department);
          if (dept) {
            localStorage.setItem('selectedDepartment', JSON.stringify(dept));
            window.dispatchEvent(new CustomEvent('smartlms:department_selected', { detail: dept }));
          }
        } catch (err) {
          console.error('Failed to sync department', err);
        }
      };
      fetchAndSyncDept();
    }
  }, [user]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Maintenance Lockdown Interception
  if (!isSettingsLoading && maintenanceMode && user && user.role !== 'admin') {
    return (
      <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-10 relative overflow-hidden">
        <LockedOverlay 
          title="Institutional Lockdown Active" 
          message="The digital grid is currently offline for critical administrative maintenance. Service will restore momentarily." 
        />
        <div className="absolute top-10 flex items-center gap-3">
           <div className="w-10 h-1 bg-red-600 rounded-full" />
           <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-500 italic">Security Protocol v4.2.0</span>
        </div>
      </div>
    );
  }

  const isAuthPage = location.pathname.startsWith('/login') || location.pathname === '/face-registration' || location.pathname === '/verify-mfa' || location.pathname === '/select-department';

  return (
    <div className="h-screen flex flex-col bg-transparent transition-colors duration-300 overflow-hidden">
      <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <ActivityTracker />
      
      {/* Restrict Global Marquee to Student and Faculty Dashboards only */}
      {(location.pathname === '/student-dashboard' || location.pathname === '/dashboard' || location.pathname === '/faculty-dashboard') && (
        <GlobalAlertMarquee />
      )}
      <main className="flex-grow relative w-full smooth-scroll custom-scrollbar bg-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="flex-grow flex flex-col"
          >
            <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/:roleType" element={<RoleLogin />} />
          
          <Route path="/select-department" element={
            <ProtectedRoute checkDept={false}>
              <DepartmentSelection />
            </ProtectedRoute>
          } />
          <Route path="/departments" element={<Departments />} />
          <Route path="/department/:code" element={<DepartmentDetail />} />
          <Route path="/courses" element={
            <ProtectedRoute checkDept={false}>
              <Courses />
            </ProtectedRoute>
          } />
          <Route path="/course-inner/:courseId" element={
            <ProtectedRoute>
               <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/courses/:courseId/upload" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin', 'hod']}>
               <UploadCenter />
            </ProtectedRoute>
          } />
          <Route path="/courses/:courseId/quick-schedule" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin', 'hod']}>
               <QuickSchedulePage />
            </ProtectedRoute>
          } />
          <Route path="/community" element={
            <ProtectedRoute checkDept={false}>
              <Announcements />
            </ProtectedRoute>
          } />

          {/* Role-Based Dashboard Redirector */}
          <Route path="/dashboard" element={
            <ProtectedRoute checkDept={false}>
              <DashboardRedirect />
            </ProtectedRoute>
          } />

          <Route path="/student-dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />


          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard /> 
            </ProtectedRoute>
          } />
          <Route path="/admin/ai-management" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminAiManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/ai-user/:userId" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUserAiDetail />
            </ProtectedRoute>
          } />

          <Route path="/faculty-dashboard" element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <FacultyDashboard /> 
            </ProtectedRoute>
          } />

          <Route path="/hod-dashboard" element={
            <ProtectedRoute allowedRoles={['hod']}>
              <HODDashboard /> 
            </ProtectedRoute>
          } />

          <Route path="/librarian-dashboard" element={
            <ProtectedRoute allowedRoles={['librarian']}>
              <LibrarianDashboard /> 
            </ProtectedRoute>
          } />

          <Route path="/parent-dashboard" element={
            <ProtectedRoute allowedRoles={['parent']}>
              <ParentDashboard /> 
            </ProtectedRoute>
          } />

          {/* Universal Protected Live Class Route */}
          <Route path="/live-class/:classId" element={
            <ProtectedRoute>
              <LiveClass />
            </ProtectedRoute>
          } />

          <Route path="/assignments" element={
            <ProtectedRoute>
              <Assignments />
            </ProtectedRoute>
          } />

          {/* Universal Protected Profile Page */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          <Route path="/achievements" element={
            <ProtectedRoute>
              <Achievements />
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/quiz-arena" element={<Navigate to="/arena" replace />} />
          <Route path="/quiz-arena/:quizId" element={<Navigate to="/arena" replace />} />

          <Route path="/arena" element={
            <ProtectedRoute checkDept={false}>
              <MasterArena />
            </ProtectedRoute>
          } />

          <Route path="/quize-arena" element={<Navigate to="/arena" replace />} />
          <Route path="/quize-arena/:id" element={
            <ProtectedRoute checkDept={false}>
              <QuizeWorkspace />
            </ProtectedRoute>
          } />

          {/* Legacy Redirects */}
          <Route path="/coding-arena" element={<Navigate to="/quize-arena" replace />} />
          <Route path="/coding-arena/:id" element={<Navigate to="/quize-arena/:id" replace />} />




          
          <Route path="/ai-tutor" element={
            <ProtectedRoute>
              <AITutor />
            </ProtectedRoute>
          } />
          
          <Route path="/ai-mode" element={
            <ProtectedRoute checkDept={false}>
              <AIMode />
            </ProtectedRoute>
          } />
          
          <Route path="/results/entry" element={
            <ProtectedRoute allowedRoles={['teacher', 'admin', 'hod']}>
              <ResultEntry />
            </ProtectedRoute>
          } />

          <Route path="/results/verify" element={
            <ProtectedRoute allowedRoles={['admin', 'hod']}>
              <ResultVerification />
            </ProtectedRoute>
          } />

          <Route path="/results/my" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentResults />
            </ProtectedRoute>
          } />
          
          <Route path="/honor-arena" element={<Navigate to="/arena" replace />} />


          <Route path="/results/analytics" element={
            <ProtectedRoute allowedRoles={['admin', 'hod']}>
              <ResultsAnalytics />
            </ProtectedRoute>
          } />

          <Route path="/unauthorized" element={
             <div className="flex-1 flex items-center justify-center">
               <h1 className="text-3xl font-bold uppercase">
 403 - Unauthorized Access</h1>
             </div>
          } />
          <Route path="/verify-mfa" element={<MFAVerify />} />
          <Route path="/face-registration" element={
            <ProtectedRoute checkDept={false}>
              <FaceRegistrationPage />
            </ProtectedRoute>
          } />
          <Route path="/self-attendance/:courseId" element={
            <ProtectedRoute allowedRoles={['student']}>
              <SelfAttendance />
            </ProtectedRoute>
          } />
          <Route path="/daily-attendance" element={
            <ProtectedRoute allowedRoles={['student']}>
              <DailyAttendance />
            </ProtectedRoute>
          } />
          <Route path="/admin/gps-config" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <GPSConfigPage />
            </ProtectedRoute>
          } />
        </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      {(!isAIMode && !isAuthPage) && <Footer />}
      <NotificationListener />
      <AchievementToaster />
      {(!isAIMode && !isAuthPage) && <Chatbot />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <MFAProvider>
        <ScrollToTop />

        <AppContent />
      </MFAProvider>
    </Router>
  );
}

export default App;
