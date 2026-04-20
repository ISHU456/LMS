import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Star, UserCircle, LogOut, Menu, X, LayoutDashboard, GraduationCap, Building2, Megaphone, Home, Flame, Award, Edit, Bot, ArrowLeft, FileText, CheckCircle, TrendingUp, Terminal, ShieldCheck, MapPin, Code, ClipboardList, Trophy, Coins } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { getGamificationState } from '../utils/gamificationStore';
import axios from 'axios';

const Navbar = ({ darkMode, toggleDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [gamification, setGamification] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/public/settings');
        setSettings(data);
      } catch (err) {
        console.error("Failed to load global broadcast settings.");
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const dept = localStorage.getItem('selectedDepartment');
    if (dept) setSelectedDept(JSON.parse(dept));

    const handleDeptUpdate = (e) => {
      setSelectedDept(e.detail);
    };

    window.addEventListener('smartlms:department_selected', handleDeptUpdate);
    return () => window.removeEventListener('smartlms:department_selected', handleDeptUpdate);
  }, []);

  useEffect(() => {
    if (user?._id) {
      const state = getGamificationState(user._id);
      setGamification(state);
    }

    const handleUpdate = (e) => {
      if (e.detail && e.detail.studentId === user?._id) {
        setGamification(e.detail);
      }
    };

    window.addEventListener('smartlms:gamification_update', handleUpdate);
    return () => window.removeEventListener('smartlms:gamification_update', handleUpdate);
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('selectedDepartment');
    setSelectedDept(null);
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'admin': return '/admin-dashboard';
      case 'student': return '/dashboard';
      case 'librarian': return '/librarian-dashboard';
      case 'hod': return '/hod-dashboard';
      case 'parent': return '/parent-dashboard';
      case 'teacher': return '/faculty-dashboard';
      default: return '/dashboard';
    }
  };

  const isAIModePage = location.pathname === '/ai-mode';

  const navLinks = (isAIModePage && !user) ? [
    { name: 'Return to Hub', path: '/', icon: <ArrowLeft size={18} /> },
    { name: 'Departments', path: '/departments', icon: <Building2 size={18} /> },
  ] : [
    { name: 'Home', path: (user && (user.role === 'admin' || user.role === 'teacher')) ? getDashboardLink() : '/', icon: <Home size={18} /> },
    
    // Academic Pillar
    { name: 'Courses', path: '/courses', icon: <GraduationCap size={18} /> },
    { name: 'Announcements', path: '/community', icon: <Megaphone size={18} /> },

    { name: 'Arena', path: '/arena', icon: <Trophy size={18} /> },

    ...(user ? [
      ...(user.role === 'student' ? [
        { name: 'Result Page', path: '/results/my', icon: <FileText size={18} /> },
        { name: 'Attendance', path: '/daily-attendance', icon: <ShieldCheck size={18} /> }
      ] : []),

      ...(user.role === 'teacher' ? [{ name: 'Evaluation', path: '/results/entry', icon: <Edit size={18} /> }] : []),
      ...(user.role === 'admin' || user.role === 'hod' ? [
        { name: 'Verification', path: '/results/verify', icon: <CheckCircle size={18} /> },
        ...(user.role === 'admin' ? [
          { name: 'Geofence', path: '/admin/gps-config', icon: <MapPin size={18} /> }
        ] : [])
      ] : [])
    ] : []),
    { name: 'AI Mode', path: '/ai-mode', icon: <Bot size={18} /> },
  ];


  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[999] bg-app-bg/80 backdrop-blur-xl border-b border-app-border transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-amber-500 text-white p-2 rounded-xl shadow-lg shadow-amber-500/20">
              <Star size={18} className="fill-white/20" />
            </div>
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-400 dark:to-orange-400 uppercase tracking-tighter">
              SmartLMS
            </span>
          </Link>
          
          {/* Desktop Nav - Main Links (Justified Right) */}
          <div className="hidden xl:flex flex-1 justify-end items-center gap-2 mr-6">
            <div className="flex items-center">
              {navLinks.map((link) => {
              const isAdminLink = ['Dashboard', 'HOD Dashboard', 'Faculty Dashboard', 'Admin Dashboard'].includes(link.name);
              if (isAdminLink && user?.role === 'student') return null;

              const isArena = link.name === 'Arena';
              const isAIMode = link.name === 'AI Mode';

              // CUSTOM LOGIC: Swap Courses for Departments if NOT logged in
              let finalLink = { ...link };
              if (!user && link.name === 'Courses') {
                finalLink = { name: 'Departments', path: '/departments' };
              }

              return (
                <Link
                  key={finalLink.path}
                  to={finalLink.path}
                  className={`relative px-4 py-1.5 group flex items-center justify-center transition-all duration-300 min-h-[32px] ${isAIMode ? 'border-2 border-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-origin-border [background-clip:padding-box,border-box] [background-image:linear-gradient(var(--app-bg),var(--app-bg)),linear-gradient(to_right,#1d4ed8,#4338ca,#7e22ce)] animate-gradient-x hover:scale-105 active:scale-95 ml-2 shadow-lg shadow-indigo-500/10 rounded-lg' : 'rounded-lg hover:bg-app-surface/50'}`}
                >
                  <span className={`relative z-10 text-[9px] uppercase tracking-[0.2em] transition-colors duration-300 text-center flex items-center justify-center ${
                    isAIMode 
                      ? 'font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700'
                      : location.pathname === finalLink.path 
                        ? 'font-bold text-app-text' 
                        : 'font-medium text-app-muted group-hover:text-app-text'
                  }`}>
                    {finalLink.name}
                  </span>
                  
                  {location.pathname === finalLink.path && !isAIMode && (
                    <motion.div 
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-[1.5px] rounded-full bg-app-text"
                    />
                  )}
                </Link>
              );
            })}
            
            {/* Display Semester on every page for students */}
            {user?.role === 'student' && user?.semester && (
              <div className="flex items-center gap-1.5 ml-3">
                <Link to={`/courses?semester=${user.semester || 4}`} className="px-3 py-1.5 rounded-lg border-2 border-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-origin-border [background-clip:padding-box,border-box] [background-image:linear-gradient(var(--app-bg),var(--app-bg)),linear-gradient(to_right,#4f46e5,#2563eb,#4f46e5)] animate-gradient-x hover:scale-105 active:scale-95 flex items-center justify-center transition-all shadow-xl shadow-indigo-500/10">
                  <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <GraduationCap size={16} className="text-indigo-600" />
                    Sem {user.semester || 4}
                  </div>
                </Link>
                <Link to="/arena" className="px-3 py-1.5 rounded-lg border-2 border-amber-500 bg-white text-amber-600 flex items-center justify-center hover:bg-amber-50 transition-all shadow-lg shadow-amber-500/10">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-amber-500 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                      {user.coins || 0}
                    </span>
                  </div>
                </Link>
              </div>
            )}
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-app-surface text-app-muted transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="flex items-center gap-3 pl-3 border-l border-app-border relative">
              {user ? (
                <>
                  {user?.role === 'student' && (
                    <Link to={getDashboardLink()} className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-lg border-2 border-rose-600 mr-2 shadow-xl shadow-rose-500/10 transition-all group">
                      <Flame size={16} className={ (user?.streak || gamification?.streakDays) > 0 ? 'fill-current text-rose-500 animate-pulse' : 'opacity-40'} />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                        {(user?.streak || gamification?.streakDays) || 0}D
                      </span>
                    </Link>
                  )}

                  {/* Profile Trigger - Avatar Only */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isProfileOpen ? 'bg-primary-500/10 ring-2 ring-primary-500/20' : 'bg-app-surface hover:bg-app-surface/80'}`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-primary-500/20 shadow-sm shrink-0">
                        {user?.profilePic ? (
                          <img src={user.profilePic} alt="Me" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-primary-500 flex items-center justify-center text-white">
                            <UserCircle size={16} />
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Profile Dropdown */}
                    <AnimatePresence>
                      {isProfileOpen && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-3 w-60 rounded-2xl bg-app-surface shadow-2xl border border-app-border p-2 z-[1000]"
                        >
                          <div className="px-3 py-3 border-b border-app-border mb-1">
                             <p className="text-[9px] font-black text-app-muted uppercase tracking-widest mb-1 opacity-60">Verified Identity</p>
                             <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black text-app-text uppercase truncate">{user.name}</p>
                                <div className="flex items-center gap-1">
                                   {user.role === 'student' && user.section && (
                                      <span className="text-[8px] px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg font-black uppercase whitespace-nowrap border border-indigo-500/10">SEC {user.section}</span>
                                   )}
                                   <span className="text-[8px] px-2 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg font-black uppercase whitespace-nowrap border border-primary-500/10">{user.role}</span>
                                </div>
                             </div>
                          </div>
                          
                          <div className="py-1.5 space-y-1">
                            {/* 1st - Profile */}
                            <Link 
                                onClick={() => setIsProfileOpen(false)}
                                to="/profile" 
                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-app-surface/50 text-[10px] font-black text-app-text uppercase tracking-widest transition-all group"
                              >
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <UserCircle size={14} />
                              </div>
                              Identity Settings
                            </Link>

                            {/* 2nd - Dashboard */}
                            <Link 
                                onClick={() => setIsProfileOpen(false)}
                                to={getDashboardLink()} 
                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary-500/10 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest transition-all group border border-transparent hover:border-primary-500/20"
                              >
                              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                                <LayoutDashboard size={14} />
                              </div>
                              {user.role === 'admin' ? 'Admin Home' : user.role === 'teacher' ? 'Faculty Home' : 'System Dashboard'}
                            </Link>

                            <Link 
                                onClick={() => setIsProfileOpen(false)}
                                to="/departments" 
                                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-app-surface/50 text-[10px] font-black text-app-text uppercase tracking-widest transition-all group"
                              >
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <Building2 size={14} />
                              </div>
                              Domain Registry
                            </Link>

                          </div>

                          <div className="mt-2 pt-2 border-t border-app-border">
                            <button 
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all shadow-sm"
                            >
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white">
                                <LogOut size={14} />
                              </div>
                              Terminate Session
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Link to="/login" className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all">
                  <UserCircle size={14} />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-3 rounded-2xl bg-app-surface text-app-muted hover:bg-primary-500/10 hover:text-primary-600 transition-all border border-transparent hover:border-primary-500/20"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[998] lg:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-[300px] bg-white dark:bg-[#0f172a] z-[999] shadow-2xl border-l border-gray-100 dark:border-gray-800 lg:hidden flex flex-col p-8"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-2.5">
                  <div className="bg-amber-500 text-white p-2 rounded-xl">
                    <Star size={18} className="fill-white/20" />
                  </div>
                  <span className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">SmartLMS</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Main Navigation</span>
                {navLinks.map((link) => {
                  const isAdminLink = ['Dashboard', 'HOD Dashboard', 'Faculty Dashboard', 'Admin Dashboard'].includes(link.name);
                  if (isAdminLink && user?.role === 'student') return null;

                  // CUSTOM LOGIC: Swap Courses for Departments if NOT logged in
                  let finalLink = { ...link };
                  if (!user && link.name === 'Courses') {
                    finalLink = { name: 'Departments', path: '/departments', icon: <Building2 size={20} /> };
                  }

                  const isAIMode = finalLink.name === 'AI Mode';

                  return (
                    <Link
                      key={finalLink.path}
                      to={finalLink.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-start gap-4 p-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                        isAIMode 
                          ? 'border-2 border-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-origin-border [background-clip:padding-box,border-box] [background-image:linear-gradient(white,white),linear-gradient(to_right,#1d4ed8,#4338ca,#7e22ce)] dark:[background-image:linear-gradient(#0f172a,#0f172a),linear-gradient(to_right,#1d4ed8,#4338ca,#7e22ce)] shadow-lg animate-gradient-x' 
                          : location.pathname === finalLink.path 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      {isAIMode ? (
                         <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 flex items-center justify-center gap-4">
                            {finalLink.icon}
                            {finalLink.name}
                         </span>
                      ) : (
                        <>
                          <div className="flex items-center justify-center w-6">{finalLink.icon}</div>
                          {finalLink.name}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-auto space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-2">Account Control</span>
                {user ? (
                  <>
                    <Link to={getDashboardLink()} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-primary-600 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-primary-500/20">
                      <LayoutDashboard size={20} />
                      {user.role === 'admin' || user.role === 'teacher' ? 'Home' : 'Dashboard'}
                    </Link>
                    <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-black text-sm uppercase tracking-widest">
                      <UserCircle size={20} />
                      My Profile
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 font-black text-sm uppercase tracking-widest text-left">
                      <LogOut size={20} />
                      Terminate Session
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="flex items-center gap-4 p-4 rounded-2xl bg-primary-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-primary-500/20">
                    <UserCircle size={20} />
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

// Adding custom styles for the AI Mode button gradient animation
const style = document.createElement('style');
style.textContent = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient-x {
    animation: gradient-x 2s ease infinite;
    background-size: 200% 100%;
  }
  .group:hover .animate-gradient-x, 
  a:hover.animate-gradient-x {
    animation-duration: 1s;
    transform: scale(1.02);
  }
`;
document.head.appendChild(style);
