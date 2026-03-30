import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, Star, UserCircle, LogOut, Menu, X, LayoutDashboard, GraduationCap, Building2, Megaphone, Home, Flame, Award, Edit, Bot, ArrowLeft, FileText, CheckCircle, TrendingUp, Terminal, ShieldCheck, MapPin } from 'lucide-react';
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
    { name: 'Back to Hub', path: '/', icon: <ArrowLeft size={18} /> },
    { name: 'Browse Courses', path: '/departments', icon: <Building2 size={18} /> },
  ] : [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'Courses', path: '/courses', icon: <GraduationCap size={18} /> },
    { name: 'Announcements', path: '/community', icon: <Megaphone size={18} /> },
    { name: 'Achievements', path: '/achievements', icon: <Award size={18} /> },
    ...(user ? [
      ...(user.role === 'student' ? [
        { name: 'Results', path: '/results/my', icon: <FileText size={18} /> },
        { name: 'Attendance', path: '/daily-attendance', icon: <ShieldCheck size={18} /> }
      ] : []),
      ...(user.role === 'teacher' ? [{ name: 'Mark Entry', path: '/results/entry', icon: <Edit size={18} /> }] : []),
      ...(user.role === 'admin' || user.role === 'hod' ? [
        { name: 'Results', path: '/results/verify', icon: <CheckCircle size={18} /> },
        { name: 'Analytics', path: '/results/analytics', icon: <TrendingUp size={18} /> },
        ...(user.role === 'admin' ? [{ name: 'GPS Config', path: '/admin/gps-config', icon: <MapPin size={18} /> }] : [])
      ] : [])
    ] : []),
    { name: 'AI Mode', path: '/ai-mode', icon: <Bot size={18} /> },
  ];

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-[999] bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50 transition-all duration-300">
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

              // CUSTOM LOGIC: Swap Courses for Departments if NOT logged in
              let finalLink = { ...link };
              if (!user && link.name === 'Courses') {
                finalLink = { name: 'Departments', path: '/departments' };
              }

              return (
                <Link
                  key={finalLink.path}
                  to={finalLink.path}
                  className={`relative px-4 py-2 group`}
                >
                  <span className={`relative z-10 text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${location.pathname === finalLink.path ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                    {finalLink.name}
                  </span>
                  
                  {/* Premium Hover Interaction */}
                  <div className={`absolute inset-0 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 -z-0`} />
                  
                  {location.pathname === finalLink.path && (
                    <motion.div 
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-500 rounded-full"
                    />
                  )}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary-500/40 rounded-full group-hover:w-1/2 transition-all duration-300" />
                </Link>
              );
            })}
            
            {/* Display Semester on every page for students */}
            {user?.role === 'student' && user?.semester && (
              <div className="ml-4 px-3 py-1.5 rounded-xl border border-primary-500/20 bg-primary-500/10 text-primary-600 dark:text-primary-400">
                <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <GraduationCap size={14} className="opacity-70" />
                  Semester {user.semester}
                </div>
              </div>
            )}
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={toggleDarkMode}
              className="p-2 sm:p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="flex items-center gap-3 pl-3 border-l border-gray-100 dark:border-gray-800 relative">
              {user ? (
                <>
                  {/* Streak Compact */}
                  <div className="hidden lg:flex items-center gap-1 px-2 py-1.5 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-lg border border-orange-100 dark:border-orange-900/20 mr-1">
                    <Flame size={12} className={gamification?.streakDays > 0 ? 'fill-current' : 'opacity-40'} />
                    <span className="text-[10px] font-black">{gamification?.streakDays || 0}</span>
                  </div>

                  {/* Profile Trigger - Avatar Only */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isProfileOpen ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/20' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
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
                          className="absolute right-0 mt-3 w-60 rounded-2xl bg-white dark:bg-[#0f172a] shadow-2xl border border-gray-100 dark:border-gray-800 p-2 z-[1000]"
                        >
                          <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-800/50 mb-1">
                             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Verified Identity</p>
                             <div className="flex items-center justify-between">
                                <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase truncate">{user.name}</p>
                                <span className="text-[8px] px-2 py-0.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg font-black uppercase whitespace-nowrap border border-primary-500/10">{user.role}</span>
                             </div>
                          </div>
                          
                          <div className="py-1.5 space-y-1">
                            {/* 1st - Profile */}
                            <Link 
                              onClick={() => setIsProfileOpen(false)}
                              to="/profile" 
                              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest transition-all group"
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
                              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/20 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest transition-all group border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-all">
                                <LayoutDashboard size={14} />
                              </div>
                              System Dashboard
                            </Link>

                            <Link 
                              onClick={() => setIsProfileOpen(false)}
                              to="/departments" 
                              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest transition-all group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Building2 size={14} />
                              </div>
                              Domain Registry
                            </Link>

                          </div>

                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/50">
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
              className="lg:hidden p-3 rounded-2xl bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30"
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

                  return (
                    <Link
                      key={finalLink.path}
                      to={finalLink.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-4 p-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${location.pathname === finalLink.path ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                    >
                      {finalLink.icon}
                      {finalLink.name}
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
                      Dashboard
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
