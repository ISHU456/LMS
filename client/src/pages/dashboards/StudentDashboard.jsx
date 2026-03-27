import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSelector } from 'react-redux';
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
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

import QuizCenter from '../../components/student/QuizCenter';
import { useGamification } from '../../hooks/useGamification';
import {
  ASSIGNMENTS_SEED,
  QUIZZIES_BY_COURSE,
  STUDENT_COURSE_CATALOG,
  getQuizById,
} from '../../data/learningCatalog';
import { getCourseProgressSummary, getTodayKey } from '../../utils/gamificationStore';

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const studentId = user?._id;
  const { gamification, level, markAttendance, submitQuizAttempt } = useGamification(studentId);

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [leaderboardSem, setLeaderboardSem] = useState(user?.semester || 'All');
  const [isMounted, setIsMounted] = useState(false);
  const itemsPerPage = 25;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [semesterCourses, setSemesterCourses] = useState([]);

  const [resourceMetaByCourseId, setResourceMetaByCourseId] = useState({});
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [classroomAttendance, setClassroomAttendance] = useState({ students: [], records: [] });

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`http://localhost:5001/api/courses`, config);
        
        // Filter by student's semester and department
        const studentCourses = res.data.filter(c => 
          c.semester === user?.semester && 
          (c.department?.name === user?.department || c.department?.code === user?.department)
        ).map(c => ({
          id: c.code,
          name: c.name,
          accent: '#4361ee', // Default, can be refined
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
    fetchClassroomAttendance();

    const interval = setInterval(() => {
      fetchLeaderboard();
      load(); 
    }, 60000); 

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user?._id, user?.token, user?.semester, user?.department]);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/auth/leaderboard');
      setGlobalLeaderboard(res.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard");
    }
  };

  const fetchClassroomAttendance = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/attendance/classroom', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = res.data;
      if (data.students) {
        data.students.sort((a, b) => a.name.localeCompare(b.name));
      }
      setClassroomAttendance(data);
    } catch (err) {
      console.error("Failed to fetch classroom attendance");
    }
  };

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

  const streakDays = gamification?.streakDays || 0;
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
    const list = globalLeaderboard.length > 0 ? globalLeaderboard : [
      { name: 'Ishaan', xp: 480, semester: 1, department: 'CS' },
      { name: 'Ananya', xp: 420, semester: 1, department: 'CS' },
      { name: 'Kabir', xp: 390, semester: 1, department: 'CS' }
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
      const attended = attendanceDates.has(k) ? 1 : 0;
      const quizPassed = Math.min(2, quizPassedByKey[k] || 0);
      // Blend attendance + quiz pass into a 0..100 score.
      const perf = Math.min(100, Math.round(attended * 70 + quizPassed * 30));
      return {
        day: k.slice(5),
        attendance: attended,
        quizPassed,
        performance: perf,
      };
    });

    return data;
  }, [gamification, last7Keys]);

  const menuItems = useMemo(
    () => [
      { id: 'overview', icon: Home, label: 'Overview' },
      { id: 'progress', icon: Target, label: 'Progress' },
      { id: 'quizzes', icon: Brain, label: 'Quizzes' },
      { id: 'attendance', icon: CalendarDays, label: 'Attendance Register' },
      { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
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
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 dark:bg-[#0f172a]">
      <aside className="w-full lg:w-72 shrink-0 glass border-b lg:border-r border-gray-200 dark:border-gray-800 p-4 space-y-4 overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30">
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

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium ${
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

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30 backdrop-blur-xl"
            style={{ background: 'linear-gradient(135deg, rgba(67,97,238,0.18), rgba(114,9,183,0.10))' }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-[260px]">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white capitalize">
                  {menuItems.find((i) => i.id === activeTab)?.label}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-1 font-semibold flex items-center gap-2">
                  Welcome back, <span className="uppercase font-extrabold text-primary-600 dark:text-primary-400">{user?.name?.split(' ')[0] || 'Student'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700">ACTIVE SEMESTER: {user?.semester || 'N/A'}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30">
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
                <div className="px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Pending</div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{pendingTasksCount}</div>
                </div>
                <div className="flex-1 min-w-[300px] px-8 py-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30 backdrop-blur-3xl relative overflow-hidden group">
                  {/* Decorative Background Flame */}
                  <div className="absolute top-[-20%] right-[-10%] opacity-5 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-1000">
                    <Flame size={200} className="text-orange-500 fill-current" />
                  </div>
                  
                  <div className="relative z-10 flex items-center justify-between gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-2 bg-orange-500/20 rounded-xl text-orange-500 animate-pulse">
                              <Flame size={20} className="fill-current" />
                           </div>
                           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-500/80">Streak Momentum</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                           <span className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter">{streakDays}</span>
                           <span className="text-xl font-black text-gray-400 uppercase">Days</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-2">
                           {streakDays >= 7 ? 'Legendary Consistency!' : `${7 - (streakDays % 7)} days to next major badge`}
                        </p>
                    </div>

                    <div className="flex-1 max-w-[350px]">
                        <div className="flex justify-between mb-4">
                           {last7Keys.map((k, i) => {
                              const attended = new Set(gamification?.attendanceDates || []).has(k);
                              return (
                                 <div key={k} className="flex flex-col items-center gap-2">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${attended ? 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/40 text-white' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 opacity-40'}`}>
                                       {attended ? <CheckCircle2 size={14} /> : <div className="w-1 h-1 rounded-full bg-current" />}
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-tighter text-gray-500">Day {i+1}</span>
                                 </div>
                              );
                           })}
                        </div>
                        <div className="h-2.5 bg-gray-200/50 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-100 dark:border-gray-700/50">
                           <motion.div
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min(100, ((streakDays % 7) || (streakDays > 0 ? 7 : 0)) / 7 * 100)}%` }}
                             className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                           />
                        </div>
                    </div>
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
                   <span className="text-[10px] font-black uppercase text-gray-500">Your Current Sem Rank</span>
                   <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-gray-900 dark:text-white">#{leaderboardData.currentSemRank}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter italic">Top Standing</span>
                   </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('quizzes')}
                className="px-4 py-2 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest hover:opacity-90 transition"
              >
                Jump to Quiz Arena
              </button>
            </div>
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
                    <div className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-3">Weekly performance</div>
                    <div className="h-[220px] w-full relative">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                            <button
                              onClick={() => !isBlocked && navigate(`/course-inner/${card.course.id}`)}
                              className={`px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-md ${isBlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:opacity-90 shadow-primary-500/20'}`}
                            >
                              {isBlocked ? 'Access Denied' : 'Open Course'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
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

          {activeTab === 'progress' && (
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

          {activeTab === 'quizzes' && (
            <motion.div key="quizzes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <QuizCenter
                studentId={studentId}
                gamification={gamification}
                submitQuizAttempt={submitQuizAttempt}
                studentName={user?.name}
              />
            </motion.div>
          )}

          {activeTab === 'attendance' && (
            <motion.div key="attendance" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-6 pb-20">
              <div className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
                   <div className="text-center md:text-left">
                      <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                        <div className="w-12 h-12 rounded-3xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                          <CalendarDays size={24} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Master Classroom Register</h2>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 italic">Institutional Presence Ledger · {classroomAttendance.month}/{classroomAttendance.year}</p>
                   </div>

                   <div className="flex flex-wrap justify-center gap-3">
                      {[
                        { label: 'P: Present', color: 'emerald' },
                        { label: 'A: Absent', color: 'red' },
                        { label: 'H: Holiday', color: 'amber' },
                        { label: 'L: Leave', color: 'blue' },
                      ].map(tag => (
                        <div key={tag.label} className={`px-4 py-2 rounded-2xl bg-${tag.color}-500/10 text-${tag.color}-500 border border-${tag.color}-500/20 text-[10px] font-black uppercase tracking-widest`}>
                          {tag.label}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="relative overflow-x-auto rounded-[2rem] border border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/40 backdrop-blur-xl">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead>
                       <tr className="border-b border-gray-100 dark:border-gray-800">
                          <th className="sticky left-0 z-20 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md p-6 border-r border-gray-100 dark:border-gray-800 min-w-[240px]">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Student Identity Matrix</span>
                          </th>
                          {Array.from({ length: 31 }, (_, i) => {
                            const day = i + 1;
                            const isSunday = new Date(classroomAttendance.year, classroomAttendance.month - 1, day).getDay() === 0;
                            const isHoliday = [8, 25, 29].includes(day);
                            return (
                              <th key={day} className={`p-4 text-center border-r border-gray-100 dark:border-gray-800 min-w-[50px] ${isSunday || isHoliday ? 'bg-amber-500/5' : ''}`}>
                                <div className="text-[10px] font-black text-gray-400 mb-1">{day}</div>
                                <div className={`text-[8px] font-bold ${(isSunday || isHoliday) ? 'text-amber-500' : 'text-gray-300'}`}>
                                  {isSunday ? 'SUN' : isHoliday ? 'HOL' : 'WK'}
                                </div>
                              </th>
                            );
                          })}
                       </tr>
                    </thead>
                    <tbody>
                      {classroomAttendance.students.map((student, sIdx) => {
                        const isPrimary = student._id === user?._id;
                        return (
                          <tr key={student._id} className={`border-b border-gray-100 dark:border-gray-800 group hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors ${isPrimary ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                            <td className="sticky left-0 z-10 bg-inherit p-4 border-r border-gray-100 dark:border-gray-800">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-[10px] border border-gray-200 dark:border-gray-700">
                                    {sIdx + 1}
                                 </div>
                                 <div className="min-w-0">
                                    <p className={`text-xs font-black truncate ${isPrimary ? 'text-primary-600' : 'text-gray-900 dark:text-white'}`}>{student.name}</p>
                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-tighter truncate">{student.enrollmentNumber}</p>
                                 </div>
                                 {isPrimary && <span className="ml-auto text-[8px] bg-primary-600 text-white px-2 py-0.5 rounded-full font-black">YOU</span>}
                               </div>
                            </td>
                            {Array.from({ length: 31 }, (_, i) => {
                               const day = i + 1;
                               const dateKey = `${classroomAttendance.year}-${classroomAttendance.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                               const isSunday = new Date(classroomAttendance.year, classroomAttendance.month - 1, day).getDay() === 0;
                               const isHoliday = [8, 25, 29].includes(day);
                               
                               const record = classroomAttendance.records.find(r => 
                                 r.student.toString() === student._id.toString() && 
                                 new Date(r.date).getUTCDate() === day
                               );

                               let status = '-';
                               let style = 'text-gray-200 opacity-20';
                               
                               if (isSunday || isHoliday) {
                                  status = 'H';
                                  style = 'text-amber-500 font-black';
                               } else if (record) {
                                  if (record.status === 'present') { status = 'P'; style = 'text-emerald-500 font-black'; }
                                  else if (record.status === 'absent') { status = 'A'; style = 'text-red-500 font-black'; }
                                  else if (record.status === 'late') { status = 'L'; style = 'text-blue-500 font-black'; }
                               } else if (day < new Date().getDate()) {
                                  status = 'A';
                                  style = 'text-red-500/40 font-bold';
                               }

                               return (
                                 <td key={day} className={`p-4 text-center border-r border-gray-100 dark:border-gray-800 group-hover:bg-gray-50/80 dark:group-hover:bg-gray-900/80 ${isSunday || isHoliday ? 'bg-amber-500/5' : ''}`}>
                                    <span className={`text-xs ${style}`}>{status}</span>
                                 </td>
                               );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 p-10 rounded-[2.5rem] bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                  <div className="flex items-center gap-6">
                     <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Peer Presence Rank</p>
                        <p className="text-4xl font-black mt-2">Active</p>
                     </div>
                     <div className="w-px h-12 bg-white/10 dark:bg-gray-900/10" />
                     <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Global Sync Percentage</p>
                        <p className="text-4xl font-black mt-2">84.2%</p>
                     </div>
                  </div>
                  <button className="px-8 py-5 rounded-[2rem] bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-500/30 hover:scale-105 transition-all">
                     Download Monthly Analytics
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                       <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">Leaderboard Arena</h2>
                       <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-[9px] font-black uppercase text-gray-400 border border-gray-200 dark:border-gray-700">
                         {leaderboardSem === 'All' ? `${leaderboardData.totalStudents} Global Students` : `${leaderboardData.list.length} Sector Students`}
                       </span>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Filter rankings by academic sector to track your status
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                       {['All', 1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                         <button
                           key={sem}
                           onClick={() => { setLeaderboardSem(sem); setCurrentPage(1); }}
                           className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${
                             leaderboardSem === sem 
                               ? 'bg-primary-600 text-white shadow-md' 
                               : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700'
                           }`}
                         >
                           {sem === 'All' ? 'Global' : `SEM ${sem}`}
                         </button>
                       ))}
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      {leaderboardSem === 'All' ? 'Global Status' : `Semester ${leaderboardSem} Standing`}
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">#{leaderboardData.rank}</div>
                  </div>
                </div>

                 <div className="mt-6 space-y-3">
                  {paginatedLeaderboard.map((p, idx) => {
                    const isMe = p._id === user?._id;
                    const xpRank = leaderboardData.xpRankInFiltered[p._id];
                    const isTop3 = xpRank <= 3;
                    const badgeStyles = [
                      'bg-yellow-500/20 text-yellow-600 border border-yellow-400/30', // Gold
                      'bg-slate-400/20 text-slate-500 border border-slate-400/30', // Silver
                      'bg-orange-800/20 text-orange-800 border border-orange-800/20' // Brown (Bronze)
                    ][xpRank - 1] || 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700';

                    return (
                      <div
                        key={`${p._id}_${idx}`}
                        className={`flex items-center justify-between gap-4 p-4 rounded-3xl border transition-all ${
                          isMe ? 'bg-gradient-to-r from-primary-600/15 to-indigo-600/10 border-primary-500/30 shadow-lg' : 'bg-white/35 dark:bg-gray-900/25 border-gray-100 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${badgeStyles}`}>
                            {isTop3 ? <Trophy size={18} /> : xpRank}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                              {p.name} {isMe && <span className="text-[8px] bg-primary-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">YOU</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">
                                 {leaderboardSem === 'All' ? 'Global Status' : `Sector Standing`} Rank #{xpRank}
                               </div>
                               {leaderboardSem !== 'All' && (
                                 <>
                                   <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                                   <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global #{leaderboardData.globalRankMap[p._id]}</div>
                                 </>
                               )}
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mt-1 opacity-60">
                              {p.department} Sector
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums tracking-tighter">{p.xp}</div>
                          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mt-1">TOTAL XP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between p-4 rounded-[2rem] bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Showing {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, leaderboardData.list.length)} of {leaderboardData.list.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1; // Simplistic pagination
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white shadow-lg'
                                  : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default StudentDashboard;
