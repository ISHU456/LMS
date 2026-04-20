import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../features/auth/authSlice';
import {
  Brain,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  Home,
  Trophy,
  Video,
  Sparkles,
  Target,
  FileText,
  LayoutDashboard,
  Users,
  ChevronRight,
  ChevronLeft,
  Zap,
  X,
  Palette,
  RefreshCw,
  ArrowRight,
  Check,
  Layers,
} from 'lucide-react';
import MonthlyRegister from '../../components/teacher/MonthlyRegister';
import CoinIcon from '../../components/CoinIcon';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import QuizCenter from '../../components/student/QuizCenter';
import QuizArena from '../../components/student/QuizArena';
import { useGamification } from '../../hooks/useGamification';
import {
  ASSIGNMENTS_SEED,
  QUIZZIES_BY_COURSE,
  STUDENT_COURSE_CATALOG,
  getQuizById,
} from '../../data/learningCatalog';
import { getCourseProgressSummary, getTodayKey } from '../../utils/gamificationStore';

const MomentumSidebarTracker = ({ user, isInline }) => {
    const [secondsActive, setSecondsActive] = useState(() => {
        if (!user?._id) return 0;
        const saved = sessionStorage.getItem(`lms_active_sec_${user._id}`);
        return saved ? parseInt(saved, 10) : 0;
    });
    
    const [isRecorded, setIsRecorded] = useState(() => {
        if (!user?.lastStreakedAt) return false;
        const today = new Date().setHours(0,0,0,0);
        const last = new Date(user.lastStreakedAt).setHours(0,0,0,0);
        return last === today;
    });

    useEffect(() => {
        if (isRecorded || !user?._id) return;

        const handleUpdate = (e) => {
            if (e.detail.userId === user._id) {
                setSecondsActive(e.detail.seconds);
                if (e.detail.seconds >= 600) {
                    setIsRecorded(true);
                }
            }
        };

        window.addEventListener('smartlms:active_seconds_update', handleUpdate);
        return () => window.removeEventListener('smartlms:active_seconds_update', handleUpdate);
    }, [user?._id, isRecorded]);

    if (isRecorded || secondsActive >= 600) {
        if (isInline) {
            return (
                <div className="flex items-center gap-1.5 px-3 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <Zap size={10} className="text-emerald-500 fill-current" />
                    <span className="text-xs font-black text-emerald-600 uppercase tracking-widest italic">Streak</span>
                </div>
            );
        }
        return (
            <div className="p-4 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 mt-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Zap size={16} fill="white" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 leading-none">Momentum Stabilized</p>
                       <p className="text-[8px] font-bold text-emerald-500/60 uppercase tracking-widest mt-1">Daily Reward Claimed</p>
                    </div>
                </div>
            </div>
        );
    }

    const progress = (secondsActive / 600) * 100;
    const minutesLeft = Math.ceil((600 - secondsActive) / 60);

    if (isInline) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-orange-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">Momentum</span>
                        </div>
                        <span className="text-xs font-black text-orange-600 dark:text-orange-400 italic">{minutesLeft}m Left</span>
                    </div>
                    <div className="h-1.5 w-28 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25 mt-2 overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-primary-600 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Momentum Build</span>
                </div>
                <span className="text-[10px] font-black text-primary-600 italic">{minutesLeft}m Left</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-primary-600 to-indigo-600"
                />
            </div>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mt-2 text-center group-hover:text-primary-500 transition-colors">
                Stay active for 10 min to earn coins
            </p>
        </div>
    );
};

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const studentId = user?._id;
  const { gamification, level, markAttendance, submitQuizAttempt } = useGamification(studentId);

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('student_active_tab') || 'overview');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSem, setSelectedSem] = useState(() => Number(user?.semester) || Number(localStorage.getItem('student_selected_sem')) || 1);
  const [leaderboardSem, setLeaderboardSem] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('student_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('student_leaderboard_sem', leaderboardSem);
  }, [leaderboardSem]);

  useEffect(() => {
    localStorage.setItem('student_selected_sem', selectedSem);
  }, [selectedSem]);
  const [isMounted, setIsMounted] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [semesterCourses, setSemesterCourses] = useState([]);

  const [resourceMetaByCourseId, setResourceMetaByCourseId] = useState({});
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourseAtt, setSelectedCourseAtt] = useState(null);
  const [dailyAttendanceData, setDailyAttendanceData] = useState({ records: [], dailyRecords: [], students: [] });
  const [isAttHistoryLoading, setIsAttHistoryLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    
    // Sync latest profile data on mount to ensure semester/details are fresh
    const syncProfile = async () => {
       try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const res = await axios.get('http://localhost:5001/api/auth/profile', config);
          if (res.data) {
             dispatch(updateProfile(res.data));
          }
       } catch (err) {
          console.error("Profile sync failed", err);
       }
    };
    if (user?.token) syncProfile();

    return () => clearTimeout(timer);
  }, [activeTab, user?.token, dispatch]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`http://localhost:5001/api/courses`, config);
        
        // Filter by selected semester and department
        const studentCourses = res.data.filter(c => 
          c.semester === selectedSem && 
          (c.department?.name === user?.department || c.department?.code === user?.department)
        ).map(c => ({
          _id: c._id,
          id: c.code,
          name: c.name,
          accent: '#4361ee',
          excludedStudents: c.excludedStudents || []
        }));

        if (!cancelled) setSemesterCourses(studentCourses);

        // Fetch resources for each course to compute total counts
        const map = {};
        await Promise.all(
          studentCourses.map(async (course) => {
            try {
              const rRes = await axios.get(`http://localhost:5001/api/resources?courseId=${course.id}`);
              const resources = rRes.data || [];
              const totalLectures = resources.length;
              const totalVideos = resources.filter((r) => r.type === 'youtube' || r.type === 'yt').length;
              map[course.id] = {
                totalLectures,
                totalVideos,
                totalDocs: Math.max(0, totalLectures - totalVideos),
              };
            } catch {
              map[course.id] = { totalLectures: 0, totalVideos: 0, totalDocs: 0 };
            }
          })
        );
        if (!cancelled) setResourceMetaByCourseId(map);
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    };

    load();
    fetchLeaderboard();

    const interval = setInterval(() => {
      fetchLeaderboard();
      load(); 
    }, 60000); 

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?._id, user?.token, selectedSem, user?.department]);

  const fetchLeaderboard = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/gamification/leaderboard', config);
      setGlobalLeaderboard(res.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard");
    }
  };

  const [gamifiedStats, setGamifiedStats] = useState({ earned: [], all: [], stats: { coins: 0, streak: 0, learningTime: 0 } });
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [selectedQuizLeaderboard, setSelectedQuizLeaderboard] = useState(null);
  const [quizLeaderboardData, setQuizLeaderboardData] = useState([]);

  useEffect(() => {
    const fetchGamification = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const resStats = await axios.get('http://localhost:5001/api/gamification/achievements', config);
        setGamifiedStats(resStats.data);
        const resQuizzes = await axios.get('http://localhost:5001/api/gamification/quizzes', config);
        setAvailableQuizzes(resQuizzes.data);
      } catch (e) {
        console.error(e);
      }
    };
    if (user?.token) fetchGamification();
  }, [user?.token, activeTab]);

  const viewQuizLeaderboard = async (quizId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5001/api/gamification/quizzes/${quizId}/leaderboard`, config);
      setQuizLeaderboardData(res.data);
      setSelectedQuizLeaderboard(availableQuizzes.find(q => q._id === quizId));
    } catch (err) {
      console.error(err);
    }
  };

   const fetchDailyAttendance = async () => {
    if (!selectedCourseAtt || !selectedCourseAtt._id) return;
    setIsAttHistoryLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Use the same endpoint pattern as AttendanceManager
      const res = await axios.get(`http://localhost:5001/api/attendance/course/${selectedCourseAtt._id}?startDate=${attendanceDate}&endDate=${attendanceDate}&semester=${selectedSem}&section=${user.section || 'A'}`, config);
      
      // Also fetch students for this course to ensure identity matrix is complete
      const studentsRes = await axios.get(`http://localhost:5001/api/courses/${selectedCourseAtt.code}/students?semester=${selectedSem}&section=${user.section || 'A'}`, config);
      
      setDailyAttendanceData({
        records: res.data.attendanceRecords || [],
        dailyRecords: res.data.dailyRecords || [],
        students: studentsRes.data || []
      });
    } catch (err) {
      console.error("Daily sync failed", err);
    } finally {
      setIsAttHistoryLoading(false);
    }
  };


  useEffect(() => {
    if (semesterCourses.length > 0 && !selectedCourseAtt) {
      setSelectedCourseAtt(semesterCourses[0]);
    }
  }, [semesterCourses]);


  const attendancePercentLast7 = useMemo(() => {
    const attendanceDates = gamification?.attendanceDates || [];
    const set = new Set(attendanceDates);
    const todayKey = getTodayKey();
    const today = new Date();
    let attended = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = getTodayKey(d);
      if (set.has(k)) attended += 1;
    }
    return attended / 7;
  }, [gamification?.attendanceDates]);

  const streakDays = user?.streak || gamification?.streakDays || 0;
  const xp = gamification?.xp || 0;
  const progressToNext = ((xp % 100) / 100) * 100;

  const pendingTasksCount = useMemo(() => {
    let pending = 0;
    for (const t of ASSIGNMENTS_SEED) {
      const courseProgress = gamification?.progressByCourseId?.[t.course];
      const completed = new Set(courseProgress?.completedAssignmentIds || []);
      if (!completed.has(t.id)) pending += 1;
    }
    return pending;
  }, [gamification]);

  const activeCoursesCount = useMemo(() => {
    return semesterCourses.filter((c) => {
      const p = gamification?.progressByCourseId?.[c.id];
      if (!p) return false;
      const hasAny =
        (p.completedLectureIds?.length || 0) +
          (p.completedAssignmentIds?.length || 0) +
          (p.completedQuizIds?.length || 0) >
        0;
      return hasAny;
    }).length;
  }, [gamification]);

  const badgeDefinitions = useMemo(() => {
    return [
      { id: 'streak_master', title: 'Streak Master', subtitle: '7 days attendance', icon: Flame, colorClass: 'bg-orange-500/20 border-orange-400/40 text-orange-200' },
      { id: 'quiz_genius', title: 'Quiz Genius', subtitle: '90%+ quiz accuracy', icon: Brain, colorClass: 'bg-amber-500/20 border-amber-400/40 text-amber-200' },
      { id: 'consistent_learner', title: 'Consistent Learner', subtitle: '100% last 7 days attendance', icon: BookOpen, colorClass: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' },
      { id: 'level_5_climber', title: 'Level 5 Climber', subtitle: 'Reach level 5', icon: Trophy, colorClass: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200' },
    ];
  }, []);

  const earnedBadges = new Set(gamification?.badges || []);

  const quizzesTotalCount = useMemo(() => {
    return Object.values(QUIZZIES_BY_COURSE).reduce((sum, quizzes) => sum + (quizzes?.length || 0), 0);
  }, []);

  const leaderboardData = useMemo(() => {
    const list = globalLeaderboard && globalLeaderboard.length > 0 ? globalLeaderboard : [
      { _id: 'p1', name: 'Ishaan Anand', xp: 480, semester: Number(user?.semester) || 1, department: user?.department || 'CS' },
      { _id: 'p2', name: 'Ananya Singh', xp: 420, semester: Number(user?.semester) || 1, department: user?.department || 'CS' },
      { _id: 'p3', name: 'Kabir Verma', xp: 395, semester: Number(user?.semester) || 1, department: user?.department || 'CS' },
      { _id: 'p4', name: 'Dr. Malviya', xp: 310, semester: Number(user?.semester) || 1, department: user?.department || 'CS' },
    ];

    // Pre-calculate global rank mapping
    const globalRankMap = {};
    list.forEach((s, i) => { globalRankMap[s._id] = i + 1; });
    
    // Filter by semester if not 'All'
    let filteredList = leaderboardSem === 'All' 
       ? list 
       : list.filter(p => p.semester === Number(leaderboardSem) || p.semester === leaderboardSem);

    // Sort by Score (Descending) as requested by user for real-time leader tracking
    filteredList = [...filteredList].sort((a, b) => b.xp - a.xp);

    // Calculate user's rank in their ACTUAL current active semester (based on XP, not name)
    const activeSemList = [...list].filter(p => p.semester === Number(user?.semester) || p.semester === user?.semester);
    const currentSemRank = activeSemList.findIndex((s) => s._id === user?._id) + 1 || (activeSemList.length + 1);

    // Find current user's XP-based rank in the filtered list
    const xpSortedFiltered = [...filteredList].sort((a, b) => b.xp - a.xp);
    const rank = xpSortedFiltered.findIndex((s) => s._id === user?._id) + 1 || (xpSortedFiltered.length + 1);
    
    // Create a map for XP-based rank within the current filtered view for Trophies/Badges
    const xpRankInFiltered = {};
    xpSortedFiltered.forEach((s, i) => { xpRankInFiltered[s._id] = i + 1; });

    const aheadPercent = Math.round(((filteredList.length - rank) / Math.max(1, filteredList.length)) * 100);
    
    return { 
      list: filteredList, 
      rank, 
      aheadPercent, 
      globalRankMap, 
      xpRankInFiltered,
      currentSemRank, 
      totalStudents: list.length, 
      semTotalStudents: activeSemList.length 
    };
  }, [globalLeaderboard, user?._id, leaderboardSem, user?.semester]);

  const paginatedLeaderboard = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return leaderboardData.list.slice(startIndex, startIndex + itemsPerPage);
  }, [leaderboardData.list, currentPage]);

  const totalPages = Math.ceil(leaderboardData.list.length / itemsPerPage);

  const last7Keys = useMemo(() => {
    const keys = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      keys.push(getTodayKey(d));
    }
    return keys;
  }, []);
  const weeklyPerformance = useMemo(() => {
    const attendanceDates = new Set(gamification?.attendanceDates || []);
    const attempts = gamification?.quizAttempts || [];
    const quizPassedByKey = {};
    for (const a of attempts) {
      if (!a.passed) continue;
      const key = getTodayKey(new Date(a.submittedAt));
      quizPassedByKey[key] = (quizPassedByKey[key] || 0) + 1;
    }
    const data = last7Keys.map((k) => {
      const attendedCount = attendanceDates.has(k) ? 1 : 0;
      const quizPassed = Math.min(2, quizPassedByKey[k] || 0);
      const perf = Math.min(100, Math.round(attendedCount * 70 + quizPassed * 30));
      return {
        date: `${k.substring(4, 6)}-${k.substring(6, 8)}`,
        attended: attendedCount > 0 ? 100 : 0,
        momentum: perf || (attendedCount > 0 ? 60 : 20)
      };
    });
    return data;
  }, [gamification, last7Keys]);

  const streakProgressPercent = Math.min(100, (streakDays / 7) * 100);
  const nextStreakMilestone = streakDays >= 7 ? 'Streak Master Achieved' : `Streak Master in ${7 - streakDays} days`;

  const menuItems = useMemo(
    () => [
      { id: 'overview', icon: Home, label: 'Overview' },
      { id: 'result', icon: Target, label: 'Result' },
      { id: 'quizzes', icon: Brain, label: 'Quiz Arena' },
      { id: 'monthly-register', icon: Layers, label: 'Monthly Register' },
      { id: 'achievements', icon: Trophy, label: 'Achievements' },
      { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
      { id: 'aesthetics', icon: Palette, label: 'Aesthetics' },
    ],
    []
  );

  const earnedBadgeMeta = useMemo(() => {
    // Keep the badge rendering stable and tied to badgeDefinitions order.
    return badgeDefinitions.filter((b) => earnedBadges.has(b.id)).slice(0, 4);
  }, [badgeDefinitions, earnedBadges]);

  const timetable = useMemo(() => {
    const fullTimetable = [
      { time: '09:00 AM', subject: 'Engineering Chemistry', type: 'Class', courseId: 'BT-101', semester: 1 },
      { time: '11:00 AM', subject: 'Mathematics-I', type: 'Class', courseId: 'BT-102', semester: 1 },
      { time: '02:00 PM', subject: 'Engineering Graphics Lab', type: 'Lab', courseId: 'BT-105', semester: 1 },
      { time: '09:00 AM', subject: 'Data Structures', type: 'Class', courseId: 'CS301', semester: 3 },
      { time: '11:30 AM', subject: 'Operating Systems', type: 'Class', courseId: 'CS401', semester: 4 },
      { time: '03:00 PM', subject: 'Capstone Working Session', type: 'Class', courseId: 'CS899', semester: 8 },
    ];
    return fullTimetable.filter(item => item.semester === user?.semester);
  }, [user?.semester]);

  const handleJoin = (courseId) => {
    markAttendance({ dateKey: getTodayKey() });
    navigate(`/live-class/${courseId}`);
  };

  const courseProgressCards = useMemo(() => {
    return semesterCourses.map((course) => {
      const totals = {
        totalLectures: resourceMetaByCourseId[course.id]?.totalLectures ?? 12,
        totalVideos: resourceMetaByCourseId[course.id]?.totalVideos ?? 3,
        totalDocs: resourceMetaByCourseId[course.id]?.totalDocs ?? 9,
        totalAssignments: ASSIGNMENTS_SEED.filter((a) => a.course === course.id).length || 0,
        totalQuizzes: (QUIZZIES_BY_COURSE[course.id] || []).length || 0,
      };

      const summary = getCourseProgressSummary({
        studentState: gamification,
        courseId: course.id,
        totals: {
          totalLectures: totals.totalLectures,
          totalAssignments: totals.totalAssignments,
          totalQuizzes: totals.totalQuizzes,
        },
      });

      const courseProgress = gamification?.progressByCourseId?.[course.id];
      const lectureIds = courseProgress?.completedLectureIds || [];
      const typeById = courseProgress?.completedLectureTypesById || {};
      const videoCompleted = lectureIds.filter((id) => {
        const t = typeById[id];
        return t === 'youtube' || t === 'yt';
      }).length;
      const docsCompleted = Math.max(0, lectureIds.length - videoCompleted);

      return {
        course,
        totals,
        summary,
        videoCompleted,
        docsCompleted,
      };
    });
  }, [gamification, resourceMetaByCourseId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 dark:bg-[#0f172a] p-4 md:p-8 gap-6 animate-pulse">
        <div className="w-full lg:w-64 bg-gray-200 rounded-2xl h-48 lg:h-full"></div>
        <div className="flex-1 bg-gray-200 rounded-2xl h-56 lg:h-full"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col lg:flex-row bg-transparent overflow-hidden relative">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 shrink-0 glass border-r border-gray-200 dark:border-gray-800 p-4 space-y-4 z-[101] transform transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:block surface-elevation h-full overflow-y-auto custom-scrollbar`}>
        <div className="flex items-center justify-between lg:hidden mb-4">
           <span className="text-sm font-black uppercase tracking-widest text-primary-600">Quick Access</span>
           <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
              <CheckCircle2 size={20} className="rotate-45" />
           </button>
        </div>
        {/* Mini-Profile */}
        <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-primary-500/30 shrink-0">
                {(user?.name || 'S')[0]}
                {(user?.name || 'S')[1] || ''}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate uppercase tracking-tight">{user?.name || 'Student'}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 mt-1">Level {level}</div>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-500/20 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
              <span>XP to next</span>
              <span>{xp % 100}/100</span>
            </div>
            <div className="h-2 bg-gray-200/60 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-gradient-to-r from-primary-600 to-indigo-600"
              />
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-500/20'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon size={18} />
              <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-emerald-500" />
              <div className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Attendance</div>
            </div>
            <div className="text-xs font-black text-emerald-500">{Math.round(attendancePercentLast7 * 100)}%</div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            <span>Streak</span>
            <span className="text-orange-500">{streakDays}d</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-3 md:p-8 overflow-y-auto no-scrollbar">
        <header className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30 backdrop-blur-xl"
            style={{ background: 'linear-gradient(135deg, rgba(67,97,238,0.18), rgba(114,9,183,0.10))' }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden self-start flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary-500/20"
              >
                <LayoutDashboard size={14} />
                Open Sidebar
              </button>
              <div className="w-full md:min-w-[260px]">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white capitalize">
                  {menuItems.find((i) => i.id === activeTab)?.label}
                </h1>
                <div className="text-gray-600 dark:text-gray-300 mt-1 font-semibold flex items-center gap-2 flex-wrap">
                  Welcome back, <span className="uppercase font-extrabold text-primary-600 dark:text-primary-400">{user?.name?.split(' ')[0] || 'Student'}</span>
                  <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <select 
                      value={selectedSem} 
                      onChange={(e) => setSelectedSem(Number(e.target.value))}
                      className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest bg-transparent px-3 py-1 outline-none cursor-pointer border-r border-gray-100 dark:border-gray-700"
                    >
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="dark:bg-gray-900">Semester {s}</option>)}
                    </select>
                    <div className="px-3 py-1 flex items-center gap-2">
                       {selectedSem < user?.semester ? (
                         <>
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">Completed</span>
                         </>
                       ) : selectedSem === user?.semester ? (
                         <>
                           <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
                           <span className="text-primary-600 text-[9px] font-black uppercase tracking-widest italic">Active Duty</span>
                         </>
                       ) : (
                         <>
                           <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                           <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Future Phase</span>
                         </>
                       )}
                    </div>
                  </div>
                </div>
                {!user?.faceRegistered && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20">
                         <Target size={18} />
                      </div>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        Biometric registration pending. Secure your account and enable self-attendance.
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate('/face-registration')}
                      className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      Setup Now
                    </button>
                  </div>
                )}
              </div>
            </div>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl border border-amber-100 dark:border-amber-900/10 bg-amber-50/20 dark:bg-amber-500/5 group hover:bg-amber-500/10 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">Scholar Coins</div>
                    <CoinIcon size={16} className="group-hover:rotate-12 transition-transform" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-1 tabular-nums italic">{user?.coins || 0}</div>
                  <div className="mt-2 text-[8px] font-black text-amber-600/60 uppercase tracking-widest italic flex items-center gap-1.5">
                    <Zap size={8} /> Redeem for Prizes
                  </div>
                </div>
                <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Badges</div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{(gamification?.badges || []).length}</div>
                  {earnedBadgeMeta.length ? (
                    <div className="mt-3 flex items-center gap-2">
                      {earnedBadgeMeta.map((b) => (
                        <div
                          key={b.id}
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center ${b.colorClass}`}
                          title={b.title}
                        >
                          <b.icon size={14} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Earn to unlock
                    </div>
                  )}
                </div>
                <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Pending</div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{pendingTasksCount}</div>
                  <div className="mt-3 text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">Tasks assigned</div>
                </div>
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-2 p-5 sm:p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30 backdrop-blur-3xl relative overflow-hidden group">
                  {/* Decorative Background Flame */}
                  <div className="absolute top-[-20%] right-[-10%] opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                    <Flame size={200} className="text-orange-500 fill-current" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8 sm:gap-6">
                    <div className="w-full sm:w-auto text-center sm:text-left flex flex-col items-center sm:items-start">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-orange-500/20 rounded-xl text-orange-500 animate-pulse">
                              <Flame size={20} className="fill-current" />
                           </div>
                           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500/80">Streak Momentum</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{streakDays}</span>
                           <span className="text-lg sm:text-xl font-black text-gray-400 uppercase">Days</span>
                        </div>
                        
                        {(() => {
                           if (!user?.lastStreakedAt) return null;
                           const today = new Date().setHours(0,0,0,0);
                           const last = new Date(user.lastStreakedAt).setHours(0,0,0,0);
                           if (last === today) {
                              return (
                                <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 w-fit">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                   <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest whitespace-nowrap">Daily Reward Claimed</span>
                                </div>
                              );
                           }
                           return null;
                        })()}

                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                           {streakDays >= 7 ? 'Legendary Consistency!' : `${7 - (streakDays % 7)} days to next major badge`}
                        </p>
                    </div>

                    <div className="w-full sm:flex-1">
                        <div className="flex justify-between mb-4 gap-1 sm:gap-2">
                           {last7Keys.map((k, i) => {
                              const attended = new Set(gamification?.attendanceDates || []).has(k);
                              return (
                                 <div key={k} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                    <div className={`w-full aspect-square rounded-lg flex items-center justify-center border-2 transition-all duration-500 max-w-[36px] ${attended ? 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/40 text-white' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 opacity-40'}`}>
                                       {attended ? <CheckCircle2 size={12} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                    </div>
                                    <span className="text-[7px] font-black uppercase tracking-tighter text-gray-400 mt-1">D{i+1}</span>
                                 </div>
                              );
                           })}
                        </div>
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-white/5">
                           <motion.div
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min(100, ((streakDays % 7) || (streakDays > 0 ? 7 : 0)) / 7 * 100)}%` }}
                             className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                           />
                        </div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-2 flex justify-between">
                           <span>Weekly Matrix</span>
                           <span>{Math.round(streakProgressPercent)}% Complete</span>
                        </p>
                    </div>
                  </div>
                </div>
              </div>

            <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-3 text-sm font-bold text-gray-700 dark:text-gray-200">
                <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 flex items-center justify-center">
                   <Trophy size={18} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 mb-1">Your Current Sem Rank</span>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">#{leaderboardData.currentSemRank}</span>
                         <span className="text-[11px] bg-emerald-500/10 text-emerald-600 px-3 py-1 rounded-full font-black uppercase tracking-widest italic border border-emerald-500/20">Top Standing</span>
                      </div>
                      <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
                      <MomentumSidebarTracker user={user} isInline={true} />
                   </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/quize-arena')}
                className="px-4 py-2 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest hover:opacity-90 transition"
              >
                Jump to Quiz Arena
              </button>
            </div>
            
            {selectedSem < user?.semester && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Semester Terminus Reached</h4>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Historical verification view active. Record sector frozen post-grading.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest italic">Status: COMPLETED</span>
                </div>
              </div>
            )}
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/30 border border-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                          <Target size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white">XP & Level</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">XP drives your progression</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">{xp}</div>
                        <div className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 mt-1">Level {level}</div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                          <span>Progress to next</span>
                          <span>{Math.round(progressToNext)}%</span>
                        </div>
                        <div className="h-2 bg-gray-200/60 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressToNext}%` }}
                            transition={{ duration: 0.7 }}
                            className="h-full bg-gradient-to-r from-primary-600 to-indigo-600"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-indigo-600 to-primary-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <Trophy size={22} />
                    </div>
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 lg:col-span-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-400/30 text-emerald-500 flex items-center justify-center">
                          <Flame size={18} />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white">Streak & Attendance</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">Earn "Streak Master" at 7 days</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <div className="text-3xl font-extrabold text-gray-900 dark:text-white tabular-nums">{streakDays}</div>
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                          / 7 day streak
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="h-2 bg-gray-200/60 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (streakDays / 7) * 100)}%` }}
                            transition={{ duration: 0.7 }}
                            className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="min-w-[160px]">
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">Last 7 days</div>
                      <div className="flex gap-2">
                        {last7Keys.map((k) => {
                          const attended = new Set(gamification?.attendanceDates || []).has(k);
                          return (
                            <div
                              key={k}
                              className={`w-8 h-8 rounded-2xl border flex items-center justify-center text-xs font-black transition ${
                                attended
                                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                                  : 'bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 text-gray-400'
                              }`}
                              title={k}
                            >
                              {attended ? 'Y' : ''}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Weekly Result</div>
                    <div className="w-full relative" style={{ height: '220px', minWidth: '0' }}>
                      {isMounted && (
                        <ResponsiveContainer width="100%" height="100%" debounce={50}>
                        <AreaChart data={weeklyPerformance}>
                          <defs>
                            <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4361ee" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#7209b7" stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                          <XAxis dataKey="day" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Area type="monotone" dataKey="performance" stroke="#4361ee" fill="url(#perfGrad)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800 lg:col-span-2">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-extrabold text-gray-900 dark:text-white">Course Progress</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                        Lectures (40) + Assignments (30) + Quizzes (30)
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('progress')}
                      className="px-3 py-2 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest hover:opacity-90 border border-gray-200 dark:border-gray-800"
                    >
                      Full View
                    </button>
                  </div>

                  <div className="mt-5 space-y-4">
                    {courseProgressCards.map((card) => {
                      const isBlocked = card.course.excludedStudents?.includes(user?._id);
                      return (
                        <div key={card.course.id} className={`flex items-center justify-between gap-4 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25 ${isBlocked ? 'opacity-60' : ''}`}>
                          <div className="flex items-center gap-4 min-w-0">
                            <div
                              className={`w-12 h-12 rounded-3xl flex items-center justify-center text-white shadow-lg shrink-0 ${isBlocked ? 'bg-gray-400' : 'shadow-primary-500/20'}`}
                              style={!isBlocked ? { background: `linear-gradient(135deg, ${card.course.accent}, rgba(114,9,183,0.7))` } : {}}
                            >
                              <BookOpen size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                                {card.course.id} · {card.course.name}
                                {isBlocked && <span className="ml-2 text-[8px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-black uppercase tracking-widest align-middle">Blocked</span>}
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                                Videos {card.videoCompleted}/{card.totals.totalVideos} · Docs {card.docsCompleted}/{card.totals.totalDocs}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-3xl font-extrabold text-gray-900 dark:text-white">{card.summary.progressPercentage}%</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">Captured</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                  onClick={() => !isBlocked && navigate(`/self-attendance/${card.course.id}`)}
                                  className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-md ${isBlocked || !user?.faceRegistered ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:opacity-90 shadow-green-500/20'}`}
                                  disabled={isBlocked || !user?.faceRegistered}
                                  title={!user?.faceRegistered ? "Register face first" : ""}
                                >
                                  {isBlocked ? 'Blocked' : 'Self Attendance'}
                                </button>
                                <button
                                  onClick={() => !isBlocked && navigate(`/course-inner/${card.course.id}`)}
                                  className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-md ${isBlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:opacity-90 shadow-primary-500/20'}`}
                                >
                                  {isBlocked ? 'Locked' : 'Open Course'}
                                </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {courseProgressCards.length === 0 && (
                      <div className="py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem]">
                        <BookOpen className="mx-auto text-gray-300 dark:text-gray-700 mb-6" size={48} />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">No Academic Modules Detected</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mt-3 max-w-md mx-auto leading-relaxed">
                          Your current sector allocation <span className="text-primary-500">[{user?.department || 'UNASSIGNED'}]</span> or semester <span className="text-primary-500">[{user?.semester || 'UNASSIGNED'}]</span> has no active curriculum mapped at this lattice point.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-400/30 text-amber-500 flex items-center justify-center">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-gray-900 dark:text-white">Badges</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                        Unlock achievements with streak, accuracy, and consistency
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3">
                    {badgeDefinitions.map((b) => {
                      const earned = earnedBadges.has(b.id);
                      const Icon = b.icon;
                      return (
                        <motion.div
                          key={b.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className={`p-4 rounded-3xl border ${earned ? ` ${b.colorClass}` : 'bg-white/35 dark:bg-gray-900/25 border-gray-200 dark:border-gray-800 text-gray-500'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${earned ? 'bg-white/20 border-white/20' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-widest">{b.title}</div>
                              <div className="text-xs font-semibold mt-1">{b.subtitle}</div>
                            </div>
                          </div>
                          <div className="mt-3 h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: earned ? '100%' : '25%' }}
                              transition={{ duration: 0.6 }}
                              className={`h-full rounded-full ${earned ? 'bg-gradient-to-r from-primary-600 to-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-extrabold text-gray-900 dark:text-white">Today's Timetable</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">Attend classes to earn XP</div>
                    </div>
                    <button
                      onClick={() => setActiveTab('assignments')}
                      className="px-3 py-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30 text-gray-700 dark:text-gray-200 font-black text-xs uppercase tracking-widest hover:bg-white dark:hover:bg-gray-800"
                    >
                      Go to Assignments
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {timetable.map((item) => (
                      <motion.div
                        key={`${item.courseId}_${item.time}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-white/35 dark:bg-gray-900/25 border border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 shrink-0">
                            <Clock size={18} className="text-gray-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{item.subject}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">{item.time}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {item.type}
                          </span>
                          <button
                            onClick={() => handleJoin(item.courseId)}
                            className="px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white transition shadow-md shadow-emerald-500/20 flex items-center gap-2"
                          >
                            <Video size={14} />
                            Join Now
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-extrabold text-gray-900 dark:text-white">Quick Achievements</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">Short goals to level up</div>
                    </div>
                    <button
                      onClick={() => setActiveTab('quizzes')}
                      className="px-3 py-2 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest hover:opacity-90 border border-gray-200 dark:border-gray-800"
                    >
                      Start Quiz
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-3xl bg-primary-50 dark:bg-primary-900/30 border border-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest text-gray-500">Next Goal</div>
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white">Clear one quiz</div>
                          </div>
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest text-emerald-500">{(gamification?.passedQuizIds || []).length} passed</div>
                      </div>
                      <div className="mt-3 h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, ((gamification?.passedQuizIds || []).length / Math.max(1, quizzesTotalCount)) * 100)}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-primary-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'result' && (
            <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="grid grid-cols-1 gap-6">
                {courseProgressCards.map((card) => (
                  <div key={card.course.id} className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="w-12 h-12 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20"
                          style={{ background: `linear-gradient(135deg, ${card.course.accent}, rgba(114,9,183,0.7))` }}
                        >
                          <BookOpen size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-lg font-extrabold text-gray-900 dark:text-white truncate">{card.course.id} · {card.course.name}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                            Lectures {card.summary.completedLectures} · Assignments {card.summary.completedAssignments} · Quizzes {card.summary.completedQuizzes}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-4xl font-extrabold text-gray-900 dark:text-white">{card.summary.progressPercentage}%</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">Course Capture</div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Video Watch</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {Math.round((card.videoCompleted / Math.max(1, card.totals.totalVideos)) * 100)}%
                          </div>
                          <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            {card.videoCompleted}/{card.totals.totalVideos}
                          </div>
                        </div>
                        <div className="h-2 mt-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((card.videoCompleted / Math.max(1, card.totals.totalVideos)) * 100)}%` }}
                            transition={{ duration: 0.7 }}
                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-primary-600"
                          />
                        </div>
                      </div>
                      <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">PDF / Docs Opened</div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                            {Math.round((card.docsCompleted / Math.max(1, card.totals.totalDocs)) * 100)}%
                          </div>
                          <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                            {card.docsCompleted}/{card.totals.totalDocs}
                          </div>
                        </div>
                        <div className="h-2 mt-3 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round((card.docsCompleted / Math.max(1, card.totals.totalDocs)) * 100)}%` }}
                            transition={{ duration: 0.7 }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-600"
                          />
                        </div>
                      </div>
                      <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25">
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Next Step</div>
                        <div className="mt-2 text-sm font-extrabold text-gray-900 dark:text-white">
                          {card.summary.progressPercentage >= 70 ? 'Maintain momentum' : 'Complete one more quiz'}
                        </div>
                        <div className="mt-3 flex gap-3">
                          <button
                            onClick={() => navigate(`/course-inner/${card.course.id}`)}
                            className="flex-1 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary-600 text-white hover:opacity-90 transition shadow-md shadow-primary-500/20"
                          >
                            Open Course
                          </button>
                          <button
                            onClick={() => setActiveTab('quizzes')}
                            className="px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest bg-gray-900 dark:bg-white text-white dark:text-gray-900 border border-gray-200 dark:border-gray-800 hover:opacity-90 transition"
                          >
                            Quiz
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'aesthetics' && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                    <div className="flex flex-col">
                        <h2 className="text-3xl font-black uppercase tracking-tighter dark:text-white italic">Workspace <span className="text-primary-600">Aesthetics</span></h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Personalize your neural learning environment</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <button 
                            onClick={() => {
                                localStorage.removeItem('personal_theme');
                                window.location.reload();
                            }}
                            className="p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30 hover:border-primary-500/30 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 group-hover:scale-110 transition-transform">
                                    <RefreshCw size={20} />
                                </div>
                                <div className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white underline decoration-primary-500/30">Institutional Default</div>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase italic leading-relaxed">Reset to follow the university's master protocol signature.</p>
                        </button>

                        {[
                            { id: 'academic', name: 'Classic Academic', light: '#FDFBF7', dark: '#0f172a', desc: 'Warm paper & deep slate for scholarly focus.' },
                            { id: 'indigo', name: 'Indigo Fusion', light: '#F0F4F8', dark: '#0B0E14', desc: 'Cool slate & obsidian for tech-driven minds.' },
                            { id: 'nature', name: 'Nature\'s Breath', light: '#F0FDF4', dark: '#052E16', desc: 'Mint & forest tones for a calm study session.' },
                            { id: 'amethyst', name: 'Royal Amethyst', light: '#F5F3FF', dark: '#1E1B4B', desc: 'Lavender & midnight for premium distinction.' },
                            { id: 'sunset', name: 'Sunset Horizon', light: '#FFF1F2', dark: '#450A0A', desc: 'Rose & burgundy for high-energy productivity.' },
                            { id: 'ocean', name: 'Ocean Deep', light: '#F0F9FF', dark: '#082F49', desc: 'Sky & sea blues for serene concentration.' },
                            { id: 'cyber', name: 'Cyber Gold', light: '#FEFCE8', dark: '#1A1600', desc: 'Lemon & bronze for bold institutional grit.' }
                        ].map(t => (
                            <button 
                                key={t.id}
                                onClick={() => {
                                    localStorage.setItem('personal_theme', JSON.stringify(t));
                                    document.documentElement.style.setProperty('--bg-light', t.light);
                                    document.documentElement.style.setProperty('--bg-dark', t.dark);
                                }}
                                className="p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30 hover:border-primary-500/30 transition-all text-left group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{t.name}</div>
                                    <div className="flex gap-1.5">
                                        <div className="w-4 h-4 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: t.light }} />
                                        <div className="w-4 h-4 rounded-full border border-black/5 shadow-sm" style={{ backgroundColor: t.dark }} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase italic leading-relaxed mb-6">{t.desc}</p>
                                <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-500 w-0 group-hover:w-full transition-all duration-700" />
                                </div>
                            </button>
                        ))}
                    </div>
                </motion.div>
             )}

          {/* Attendance tab removed */}

          {activeTab === 'monthly-register' && (
            <motion.div key="monthly-reg" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <MonthlyRegister 
                    user={user} 
                    initialSemester={selectedSem} 
                    initialCourse={selectedCourseAtt} 
                    onPersistChange={(s, c) => {
                        setSelectedSem(s);
                        setSelectedCourseAtt(c);
                    }} 
                />
            </motion.div>
          )}

          {activeTab === 'quizzes' && (
            <motion.div key="quizzes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
               <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Quiz Arena Hub</h2>
                    <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest mt-1">Earn Neural Credits & Experience Nodes</p>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableQuizzes.map(q => (
                    <div key={q._id} className="group relative bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all overflow-hidden flex flex-col">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-primary-600/5 rounded-bl-[4rem] group-hover:scale-110 transition-transform" />
                       <div className="w-14 h-14 rounded-2xl bg-primary-600/10 text-primary-600 flex items-center justify-center mb-6 shadow-inner"><Brain size={28}/></div>
                       <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2 leading-none">{q.title}</h3>
                       <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 uppercase tracking-wide">{q.description || 'Test your cognitive logic across institutional parameters.'}</p>
                       
                       {q.isCompleted && q.bestAttempt ? (
                         <div className="mb-6 p-4 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                               <div className="flex items-center gap-2">
                                  <Trophy size={14} className="text-amber-500" />
                                  <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase">Best Attempt</span>
                               </div>
                               <div className="px-3 py-1 bg-primary-600 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">Rank #{q.bestAttempt.rank}</div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-white/5 pt-4">
                               <div className="text-center">
                                  <div className="text-base font-black text-gray-900 dark:text-white">{q.bestAttempt.score}</div>
                                  <div className="text-[8px] font-black text-gray-400 uppercase">Obtained</div>
                               </div>
                               <div className="text-center">
                                  <div className="text-base font-black text-emerald-500">{q.bestAttempt.correct}</div>
                                  <div className="text-[8px] font-black text-gray-400 uppercase">Correct</div>
                               </div>
                               <div className="text-center">
                                  <div className="text-base font-black text-red-500">{q.bestAttempt.wrong}</div>
                                  <div className="text-[8px] font-black text-gray-400 uppercase">Wrong</div>
                               </div>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); viewQuizLeaderboard(q._id); }}
                              className="w-full mt-4 py-2 text-[9px] font-black uppercase tracking-widest text-primary-600 border border-primary-600/20 rounded-xl hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                               <Trophy size={10} /> View Peer Rankings
                            </button>
                         </div>
                       ) : (
                         <div className="flex-grow" />
                       )}

                       <div className="flex items-center justify-between pt-6 border-t border-gray-50 dark:border-gray-800 mt-auto">
                          <div className="flex items-center gap-4">
                             <div className="flex items-center gap-2"><Target size={14} className="text-gray-400"/><span className="text-[10px] font-black text-gray-500">{q.totalPoints} PTS</span></div>
                             <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400"/><span className="text-[10px] font-black text-gray-500">{q.timeLimit} MIN</span></div>
                          </div>
                          <button 
                             onClick={() => setActiveQuizId(q._id)} 
                             className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${q.isCompleted ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-primary-600 hover:text-white'}`}
                          >
                             {q.isCompleted ? 'Re-attempt' : 'Start Quiz'}
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'achievements' && (
            <motion.div key="achievements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-gradient-to-br from-primary-600 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                     <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-2">Neural Bank</div>
                        <div className="text-6xl font-black flex items-center gap-3">
                           {gamifiedStats.stats.coins}
                           <CoinIcon size={36} />
                        </div>
                        <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10 w-fit drop-shadow-xl backdrop-blur-md">
                           <Flame size={16} className="text-orange-400" />
                           <span className="text-[10px] font-black uppercase tracking-widest">{streakDays} DAY STREAK ACTIVE</span>
                        </div>
                     </div>
                     <div className="absolute top-[-10%] right-[-10%] opacity-10 group-hover:rotate-12 transition-transform duration-1000"><Zap size={240} className="fill-current" /></div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3rem] p-8 flex flex-col justify-center">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Learning Time</div>
                        <div className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">{gamifiedStats.stats.learningTime} <span className="text-sm font-bold text-gray-500">MINS</span></div>
                        <div className="mt-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                           <div className="h-full bg-primary-600 w-[65%]" />
                        </div>
                     </div>
                     <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3rem] p-8 flex flex-col justify-center">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Progression Level</div>
                        <div className="text-4xl font-black text-gray-900 dark:text-white tabular-nums">LVL {Math.floor(gamifiedStats.stats.coins / 100) + 1}</div>
                        <div className="mt-4 flex gap-2">
                           <div className="w-2 h-2 rounded-full bg-primary-500" />
                           <div className="w-2 h-2 rounded-full bg-primary-500" />
                           <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-800" />
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] p-12 border border-gray-100 dark:border-gray-800 shadow-xl">
                  <div className="mb-12">
                     <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.3em] flex items-center gap-4 mb-2">
                        Institutional Badge Catalog <div className="h-px flex-1 bg-gray-100 dark:border-gray-800" />
                     </h3>
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Unlock achievements with streak, accuracy, and consistency</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                     {[
                        {
                           id: 'streak_master',
                           name: 'Streak Master',
                           desc: '7 days attendance',
                           icon: <Flame size={32} />,
                           color: 'orange',
                           unlocked: streakDays >= 7
                        },
                        {
                           id: 'quiz_genius',
                           name: 'Quiz Genius',
                           desc: '90%+ quiz accuracy',
                           icon: <Brain size={32} />,
                           color: 'indigo',
                           unlocked: (gamifiedStats.stats.accuracy || 0) >= 90
                        },
                        {
                           id: 'consistent_learner',
                           name: 'Consistent Learner',
                           desc: '100% last 7 days attendance',
                           icon: <Target size={32} />,
                           color: 'emerald',
                           unlocked: weeklyPerformance.every(d => d.attended > 0)
                        },
                        {
                           id: 'level_5_climber',
                           name: 'Level 5 Climber',
                           desc: 'Reach level 5',
                           icon: <ChevronRight size={32} />,
                           color: 'amber',
                           unlocked: (Math.floor(gamifiedStats.stats.coins / 100) + 1) >= 5
                        }
                     ].map(badge => (
                        <div key={badge.id} className="group relative flex flex-col items-center p-8 rounded-[2.5rem] bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 transition-all hover:-translate-y-2">
                           <div className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 ${badge.unlocked ? `bg-${badge.color}-500/10 text-${badge.color}-500 shadow-[0_15px_35px_-5px_rgba(var(--primary-rgb),0.2)] scale-110` : 'bg-gray-200 dark:bg-gray-800 text-gray-400 opacity-40 grayscale'}`}>
                              {badge.icon}
                              {badge.unlocked && (
                                 <div className="absolute top-4 right-4 animate-bounce">
                                    <Sparkles size={16} className="text-amber-400" />
                                 </div>
                              )}
                           </div>
                           
                           <div className="mt-8 text-center space-y-2">
                              <h4 className={`text-sm font-black uppercase tracking-tight ${badge.unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                 {badge.name}
                              </h4>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                                 {badge.desc}
                              </p>
                           </div>

                           {!badge.unlocked && (
                              <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-[1px] rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="px-5 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-[9px] uppercase tracking-widest">
                                    Locked
                                 </div>
                              </div>
                           )}
                        </div>
                     ))}
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 px-2 py-2 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-3xl">
                     {['Daily', 'Weekly', 'Global'].map(t => (
                       <button key={t} className={`px-6 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${t === 'Global' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>{t}</button>
                     ))}
                  </div>
                  <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ranking Sector</span>
                      <select 
                        value={leaderboardSem}
                        onChange={(e) => setLeaderboardSem(e.target.value)}
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-primary-500 transition-all"
                      >
                         <option value="All">Global Roster</option>
                         {[1,2,3,4,5,6,7,8].map(s => (
                           <option key={s} value={s}>Semester {s}</option>
                         ))}
                      </select>
                   </div>
               </div>

               <div className="bg-white dark:bg-gray-900 rounded-[3rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-950/50 border-b border-gray-100 dark:border-gray-800">
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Position</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Collaborator</th>
                          <th className="px-10 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Momentum Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLeaderboard.map((student, i) => {
                          const absoluteRank = (currentPage - 1) * itemsPerPage + i + 1;
                          return (
                            <tr key={`leader-${student._id}`} className={`group hover:bg-primary-500/5 dark:hover:bg-primary-600/5 transition-all ${student._id === user._id ? 'bg-primary-600/10 border-l-4 border-primary-600' : ''}`}>
                              <td className="px-10 py-6">
                                 <div className="flex items-center gap-4">
                                    <span className={`text-xl font-black italic tracking-tighter ${absoluteRank <= 3 ? 'text-primary-600' : 'text-gray-400'}`}>#{absoluteRank}</span>
                                    {absoluteRank <= 3 && <div className={`w-6 h-6 rounded-lg ${absoluteRank===1?'bg-yellow-400':absoluteRank===2?'bg-gray-300':'bg-orange-400'} flex items-center justify-center text-white`}><Trophy size={14}/></div>}
                                 </div>
                              </td>
                              <td className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black overflow-hidden drop-shadow-xl border-2 border-white dark:border-gray-700">
                                      {student.profilePic ? <img src={student.profilePic} alt="" className="w-full h-full object-cover" /> : <Users size={20} className="text-gray-400" />}
                                   </div>
                                   <div>
                                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1">{student.name}</p>
                                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{student.department || 'DEPT-X'}</p>
                                   </div>
                                </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                 <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-gray-50 dark:bg-gray-950/50 rounded-xl border border-gray-100 dark:border-gray-800 transition-all group-hover:border-indigo-200">
                                    <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">{student.coins || student.xp || 0}</span>
                                    <CoinIcon size={14} />
                                 </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="px-10 py-6 bg-gray-50/50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {leaderboardData.list.length > 0 
                          ? `Showing ${(currentPage-1)*itemsPerPage + 1} to ${Math.min(currentPage*itemsPerPage, leaderboardData.list.length)} of ${leaderboardData.list.length} Collaborators`
                          : "Initializing Peer Grid: 0 Collaborators Identified"}
                     </p>
                     <div className="flex items-center gap-2">
                        <button 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-primary-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
                        >
                           <ChevronLeft size={18} />
                        </button>
                        
                        <div className="flex items-center gap-1">
                           {(() => {
                              let startPage = Math.max(1, currentPage - 2);
                              let endPage = Math.min(totalPages, startPage + 4);
                              if (endPage - startPage < 4) {
                                 startPage = Math.max(1, endPage - 4);
                              }
                              
                              const pages = [];
                              for (let p = startPage; p <= endPage; p++) {
                                 pages.push(p);
                              }
                              
                              return pages.map(pageNum => (
                                <button 
                                  key={`pg-${pageNum}`}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-9 h-9 rounded-xl font-black text-[10px] transition-all ${currentPage === pageNum ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-500 hover:border-primary-500 hover:text-primary-600'}`}
                                >
                                  {pageNum}
                                </button>
                              ));
                           })()}
                        </div>

                        <button 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-400 hover:text-primary-600 disabled:opacity-30 disabled:hover:text-gray-400 transition-all"
                        >
                           <ChevronRight size={18} />
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeQuizId && (
          <QuizArena 
            quizId={activeQuizId} 
            onClose={() => {
              setActiveQuizId(null);
              // Trigger refresh of gamification stats
              const config = { headers: { Authorization: `Bearer ${user.token}` } };
              axios.get('http://localhost:5001/api/gamification/achievements', config).then(r => setGamifiedStats(r.data));
            }} 
          />
        )}
      <AnimatePresence>
        {selectedQuizLeaderboard && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={() => setSelectedQuizLeaderboard(null)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
            <motion.div 
               initial={{ scale:0.95, y:20 }} 
               animate={{ scale:1, y:0 }} 
               exit={{ scale:0.95, y:20 }} 
               className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-[3rem] p-10 border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
               <div className="flex items-center justify-between mb-8 overflow-hidden">
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner"><Trophy size={28}/></div>
                     <div className="truncate">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{selectedQuizLeaderboard.title}</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Peer Proficiency Rankings</p>
                     </div>
                  </div>
                  <button onClick={() => setSelectedQuizLeaderboard(null)} className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl text-gray-400 group h-fit">
                     <X size={20} className="group-hover:rotate-90 transition-transform" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-3">
                  {quizLeaderboardData.map((entry, idx) => (
                    <div key={entry._id} className={`p-5 rounded-[1.75rem] border flex items-center justify-between gap-4 transition-all ${entry._id === user?._id ? 'bg-primary-600 border-primary-500 text-white' : 'bg-gray-50/50 dark:bg-white/5 border-gray-100 dark:border-white/5 text-gray-900 dark:text-white hover:border-primary-500/30'}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-400 text-amber-900 shadow-lg shadow-amber-400/30' : idx === 1 ? 'bg-slate-300 text-slate-900 shadow-lg shadow-slate-300/30' : idx === 2 ? 'bg-orange-400 text-orange-900 shadow-lg shadow-orange-400/30' : 'bg-white/10'}`}>
                             {idx + 1}
                          </div>
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                             {entry.profilePic ? <img src={entry.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-black bg-primary-600/10">{entry.name[0]}</div>}
                          </div>
                          <div className="min-w-0">
                             <p className="text-sm font-black tracking-tight truncate">{entry.name}</p>
                             <p className={`text-[9px] font-black uppercase tracking-widest opacity-60 ${entry._id === user?._id ? 'text-white' : 'text-gray-500'}`}>{entry.department || 'General'}</p>
                          </div>
                       </div>
                       <div className="text-right whitespace-nowrap">
                          <p className="text-lg font-black">{entry.score}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{Math.floor(entry.timeTaken / 60)}m {entry.timeTaken % 60}s</p>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </main>
    </div>
  );
};

export default StudentDashboard;
