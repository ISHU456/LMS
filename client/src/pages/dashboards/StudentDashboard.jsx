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

  const [resourceMetaByCourseId, setResourceMetaByCourseId] = useState({});

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Fetch resources to compute total lectures/videos/docs for progress tracking.
      const map = {};
      await Promise.all(
        STUDENT_COURSE_CATALOG.map(async (course) => {
          try {
            const res = await axios.get(`http://localhost:5000/api/resources?courseId=${course.id}`);
            const resources = res.data || [];
            const totalLectures = resources.length;
            const totalVideos = resources.filter((r) => r.type === 'youtube' || r.type === 'yt').length;
            map[course.id] = {
              totalLectures,
              totalVideos,
              totalDocs: Math.max(0, totalLectures - totalVideos),
            };
          } catch {
            // Fallback values for demo even if backend is not fully populated.
            map[course.id] = { totalLectures: 12, totalVideos: 3, totalDocs: 9 };
          }
        })
      );
      if (!cancelled) setResourceMetaByCourseId(map);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    return STUDENT_COURSE_CATALOG.filter((c) => {
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

  const leaderboard = useMemo(() => {
    const seed = [
      { name: 'Ishaan', xp: 480 },
      { name: 'Ananya', xp: 420 },
      { name: 'Kabir', xp: 390 },
      { name: 'Meera', xp: 320 },
      { name: 'Vivaan', xp: 260 },
      { name: 'Riya', xp: 210 },
    ];
    const current = { name: user?.name || 'Student', xp };
    const list = [...seed, current].sort((a, b) => b.xp - a.xp);
    const rank = list.findIndex((s) => s.name === current.name && s.xp === current.xp) + 1;
    const total = list.length;
    const aheadPercent = Math.round(((total - rank) / Math.max(1, total - 1)) * 100);
    return { list, rank, aheadPercent };
  }, [xp, user?.name]);

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
      { id: 'assignments', icon: FileText, label: 'Assignments' },
      { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
    ],
    []
  );

  const earnedBadgeMeta = useMemo(() => {
    // Keep the badge rendering stable and tied to badgeDefinitions order.
    return badgeDefinitions.filter((b) => earnedBadges.has(b.id)).slice(0, 4);
  }, [badgeDefinitions, earnedBadges]);

  const timetable = useMemo(() => {
    return [
      { time: '09:00 AM', subject: 'Data Structures', type: 'Class', courseId: 'CS301' },
      { time: '11:30 AM', subject: 'Operating Systems', type: 'Class', courseId: 'CS401' },
      { time: '03:00 PM', subject: 'Capstone Working Session', type: 'Class', courseId: 'CS899' },
    ];
  }, []);

  const handleJoin = (courseId) => {
    markAttendance({ dateKey: getTodayKey() });
    navigate(`/live-class/${courseId}`);
  };

  const courseProgressCards = useMemo(() => {
    return STUDENT_COURSE_CATALOG.map((course) => {
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
                <p className="text-gray-600 dark:text-gray-300 mt-1 font-semibold">
                  Welcome back, <span className="uppercase font-extrabold text-primary-600 dark:text-primary-400">{user?.name?.split(' ')[0] || 'Student'}</span>
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
                <div className="px-4 py-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/40 dark:bg-gray-900/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Streak</div>
                    <Flame size={14} className="text-orange-500" />
                  </div>
                  <div className="text-2xl font-extrabold text-gray-900 dark:text-white mt-1">{streakDays}d</div>
                  <div className="mt-3 h-2 bg-gray-200/60 dark:bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (streakDays / 7) * 100)}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
                <Trophy size={18} className="text-yellow-500" />
                You are ahead of {leaderboard.aheadPercent}% students
                <span className="text-lg ml-1 font-black">GO</span>
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
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
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
                    {courseProgressCards.map((card) => (
                      <div key={card.course.id} className="flex items-center justify-between gap-4 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25">
                        <div className="flex items-center gap-4 min-w-0">
                          <div
                            className="w-12 h-12 rounded-3xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20 shrink-0"
                            style={{ background: `linear-gradient(135deg, ${card.course.accent}, rgba(114,9,183,0.7))` }}
                          >
                            <BookOpen size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{card.course.id} · {card.course.name}</div>
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
                            onClick={() => navigate(`/course-inner/${card.course.id}`)}
                            className="px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary-600 text-white hover:opacity-90 transition shadow-md shadow-primary-500/20"
                          >
                            Open Course
                          </button>
                        </div>
                      </div>
                    ))}
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

          {activeTab === 'assignments' && (
            <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ASSIGNMENTS_SEED.map((task) => {
                  const courseProgress = gamification?.progressByCourseId?.[task.course];
                  const submitted = new Set(courseProgress?.completedAssignmentIds || []).has(task.id);
                  const due = task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A';
                  const status = submitted ? 'Submitted' : 'Pending';
                  return (
                    <div key={task.id} className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white">{task.title}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                            {task.course} · {task.type} · Due {due}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${submitted ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' : 'bg-amber-500/20 border-amber-400/40 text-amber-200'}`}>
                          {submitted ? <CheckCircle2 size={14} className="inline mr-1" /> : <Clock size={14} className="inline mr-1" />}
                          {status}
                        </div>
                      </div>
                      <div className="mt-4 h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: submitted ? '100%' : '35%' }}
                          transition={{ duration: 0.7 }}
                          className={`h-full rounded-full ${submitted ? 'bg-gradient-to-r from-emerald-500 to-indigo-600' : 'bg-gradient-to-r from-amber-400 to-primary-600'}`}
                        />
                      </div>
                      <div className="mt-5 flex gap-3">
                        <button
                          onClick={() => navigate('/assignments')}
                          className="flex-1 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary-600 text-white hover:opacity-90 transition shadow-md shadow-primary-500/20"
                        >
                          Open Submission
                        </button>
                        <button
                          onClick={() => navigate(`/course-inner/${task.course}`)}
                          className="px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest bg-gray-900 dark:bg-white text-white dark:text-gray-900 border border-gray-200 dark:border-gray-800 hover:opacity-90 transition"
                        >
                          Course
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboard' && (
            <motion.div key="leaderboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
              <div className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900 dark:text-white">Leaderboard</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                      Earn XP for attendance, assignments, and passing quizzes
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white/35 dark:bg-gray-900/25">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Your Rank</div>
                    <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">#{leaderboard.rank}</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {leaderboard.list.map((p, idx) => {
                    const isMe = p.name === user?.name && p.xp === xp;
                    return (
                      <div
                        key={`${p.name}_${idx}`}
                        className={`flex items-center justify-between gap-4 p-4 rounded-3xl border ${
                          isMe ? 'bg-gradient-to-r from-primary-600/15 to-indigo-600/10 border-primary-500/30' : 'bg-white/35 dark:bg-gray-900/25 border-gray-100 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${
                              idx === 0
                                ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                                : idx === 1
                                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                                  : 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-extrabold text-gray-900 dark:text-white">{p.name}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">{isMe ? 'You' : 'Student'}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">{p.xp}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">XP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default StudentDashboard;
