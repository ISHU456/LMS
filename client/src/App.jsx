import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

// Layout
import Navbar from './components/Navbar';
import FluidBackground from './components/FluidBackground';
import AchievementToaster from './components/AchievementToaster';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import ScrollToTop from './components/ScrollToTop';

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

// Result pages
import ResultEntry from './pages/results/ResultEntry';
import ResultVerification from './pages/results/ResultVerification';
import StudentResults from './pages/results/StudentResults';
import ResultsAnalytics from './pages/results/ResultsAnalytics';

import LockedOverlay from './components/LockedOverlay';
import NotificationListener from './components/NotificationListener';

// Protected Route Component for Role-based Access Control
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

  // Redirect to department selection if not admin and department not selected
  if (checkDept && user.role !== 'admin' && !selectedDept) {
    return <Navigate to="/select-department" replace />;
  }

  return children;
};

// Wrapper for Footer visibility logic
const AppContent = () => {
  const location = useLocation();
  const isAIMode = location.pathname === '/ai-mode';
  const { user } = useSelector((state) => state.auth);

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

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <div className="h-screen flex flex-col bg-gray-50/50 dark:bg-dark-bg/50 transition-colors duration-300 overflow-hidden">
      {!isAIMode && <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />}
      <main className="flex-grow flex flex-col relative w-full overflow-y-auto smooth-scroll min-h-0">
        <Routes>
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

          {/* Secure Isolated Dashboards */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />

          <Route path="/admin-dashboard" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard /> 
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
        </Routes>
      </main>
      {!isAIMode && <Footer />}
      <NotificationListener />
      <AchievementToaster />
      {!isAIMode && <Chatbot />}
    </div>
  );
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <FluidBackground />
      <AppContent />
    </Router>
  );
}

export default App;
