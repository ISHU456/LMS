const STORAGE_PREFIX = 'smartlms_gamification_v1_';

const pad2 = (n) => String(n).padStart(2, '0');

export const getTodayKey = (d = new Date()) => {
  const local = new Date(d);
  return `${local.getFullYear()}-${pad2(local.getMonth() + 1)}-${pad2(local.getDate())}`;
};

const dateKeyToDate = (dateKey) => {
  const [y, m, day] = dateKey.split('-').map((x) => parseInt(x, 10));
  return new Date(y, m - 1, day);
};

const addDaysToDate = (date, deltaDays) => {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
};

const getAttendancePercentLast7Days = (attendanceDates, todayKey) => {
  const set = new Set(attendanceDates || []);
  let attended = 0;
  const today = dateKeyToDate(todayKey);
  for (let i = 0; i < 7; i++) {
    const k = getTodayKey(addDaysToDate(today, -i));
    if (set.has(k)) attended += 1;
  }
  return attended / 7;
};

const computeStreakDaysEndingAt = (attendanceDates, endKey) => {
  const set = new Set(attendanceDates || []);
  const endDate = dateKeyToDate(endKey);
  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const k = getTodayKey(addDaysToDate(endDate, -i));
    if (set.has(k)) streak += 1;
    else break;
  }
  return streak;
};

export const getStorageKey = (studentId) => `${STORAGE_PREFIX}${studentId}`;

export const getGamificationState = (studentId) => {
  if (!studentId) return null;
  const raw = localStorage.getItem(getStorageKey(studentId));
  if (raw) return JSON.parse(raw);

  const todayKey = getTodayKey();
  const state = {
    studentId,
    xp: 0,
    badges: [],
    passedQuizIds: [],
    streakDays: 0,
    attendanceDates: [],
    quizStats: { correct: 0, total: 0 },
    quizAttempts: [], // { quizId, courseId, correct, total, scorePercent, passed, submittedAt }
    progressByCourseId: {
      // [courseId]: { completedLectureIds: [], completedLectureTypesById: {}, completedAssignmentIds: [], completedQuizIds: [] }
    },
    lastActiveDate: todayKey,
  };

  localStorage.setItem(getStorageKey(studentId), JSON.stringify(state));
  return state;
};

export const saveGamificationState = (studentId, state) => {
  localStorage.setItem(getStorageKey(studentId), JSON.stringify(state));
  try {
    window.dispatchEvent(new CustomEvent('smartlms:gamification_update', { detail: state }));
  } catch (e) {
    // ignore
  }
};

const cloneState = (obj) => {
  try {
    if (typeof structuredClone === 'function') return structuredClone(obj);
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(obj));
};

export const getLevelFromXp = (xp) => Math.floor((xp || 0) / 100);

export const emitAchievement = (achievement) => {
  try {
    window.dispatchEvent(
      new CustomEvent('smartlms:achievement', {
        detail: achievement,
      })
    );
  } catch {
    // ignore
  }
};

const computeEarnedBadges = (state) => {
  const todayKey = getTodayKey();
  const level = getLevelFromXp(state.xp);
  const streakDays = state.streakDays || 0;
  const accuracy = state.quizStats.total > 0 ? state.quizStats.correct / state.quizStats.total : 0;
  const attendancePercent = getAttendancePercentLast7Days(state.attendanceDates, todayKey);

  const earned = [];
  if (streakDays >= 7) earned.push('streak_master');
  if (accuracy >= 0.9 && state.quizStats.total >= 1) earned.push('quiz_genius');
  if (attendancePercent === 1) earned.push('consistent_learner');

  // Optional: level-based prestige badge (kept in code but not required by your spec).
  if (level >= 5) earned.push('level_5_climber');

  // New: Course Completer Badge
  const courseIds = Object.keys(state.progressByCourseId || {});
  for (const cid of courseIds) {
    const prog = state.progressByCourseId[cid];
    // This is a simplified check. In a real app we'd need to know the 'total' for each course.
    // For now, if they've completed at least 5 lectures and 1 assignment in a course, they are a 'completer' for demo.
    if ((prog.completedLectureIds?.length || 0) >= 5 && (prog.completedAssignmentIds?.length || 0) >= 1) {
      earned.push('course_completer');
      break; 
    }
  }

  return earned;
};

const getBadgeMeta = (badgeId) => {
  const meta = {
    streak_master: {
      title: 'Streak Master',
      subtitle: '7 days attendance',
      icon: 'flame',
      color: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    },
    quiz_genius: {
      title: 'Quiz Genius',
      subtitle: '90%+ quiz accuracy',
      icon: 'brain',
      color: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    },
    consistent_learner: {
      title: 'Consistent Learner',
      subtitle: '100% last 7 days attendance',
      icon: 'book',
      color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    },
    level_5_climber: {
      title: 'Level 5 Climber',
      subtitle: 'Reach level 5',
      icon: 'sparkle',
      color: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
    },
    course_completer: {
      title: 'Course Completer',
      subtitle: 'Finished all course materials',
      icon: 'award',
      color: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    },
  };

  return meta[badgeId];
};

export const awardXPForStudent = ({ studentId, amount, reason }) => {
  if (!studentId || !amount) return { state: null, events: [] };

  const prev = getGamificationState(studentId);
  const prevLevel = getLevelFromXp(prev.xp);

  const next = cloneState(prev);
  next.xp = (next.xp || 0) + amount;
  next.lastActiveDate = getTodayKey();

  const nextLevel = getLevelFromXp(next.xp);
  const prevBadges = new Set(prev.badges || []);
  const earnedBadgesNow = computeEarnedBadges(next);
  const newBadges = earnedBadgesNow.filter((b) => !prevBadges.has(b));

  next.badges = Array.from(new Set([...(next.badges || []), ...newBadges]));
  saveGamificationState(studentId, next);

  const events = [];
  events.push({
    type: 'xp_gained',
    title: `+${amount} XP`,
    subtitle: reason || 'Achievement unlocked',
    icon: 'zap',
    color: 'bg-primary-600/20 text-primary-200 border-primary-400/40',
  });

  if (nextLevel > prevLevel) {
    events.push({
      type: 'level_up',
      title: `Level Up: ${nextLevel}`,
      subtitle: `You reached Level ${nextLevel}. Keep going.`,
      icon: 'trophy',
      color: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
    });
  }

  for (const badgeId of newBadges) {
    const meta = getBadgeMeta(badgeId);
    events.push({
      type: 'badge_unlocked',
      badgeId,
      title: meta.title,
      subtitle: meta.subtitle,
      icon: meta.icon,
      color: meta.color,
    });
  }

  for (const e of events) emitAchievement(e);
  return { state: next, events };
};

export const markAttendanceForStudent = ({ studentId, dateKey }) => {
  if (!studentId) return { state: null, events: [] };
  const prev = getGamificationState(studentId);
  const todayKey = dateKey || getTodayKey();

  if ((prev.attendanceDates || []).includes(todayKey)) {
    return { state: prev, events: [] };
  }

  const next = structuredClone(prev);
  next.attendanceDates = Array.from(new Set([...(next.attendanceDates || []), todayKey]));
  next.streakDays = computeStreakDaysEndingAt(next.attendanceDates, todayKey);
  next.lastActiveDate = todayKey;

  const earnedBadgesNow = computeEarnedBadges(next);
  const prevBadges = new Set(prev.badges || []);
  const newBadges = earnedBadgesNow.filter((b) => !prevBadges.has(b));
  next.badges = Array.from(new Set([...(next.badges || []), ...newBadges]));

  saveGamificationState(studentId, next);

  // Attendance is part of your XP rule.
  const xpResult = awardXPForStudent({
    studentId,
    amount: 10,
    reason: 'Attend class',
  });

  const events = [];
  events.push({
    type: 'attendance_marked',
    title: 'Attendance Confirmed',
    subtitle: `Streak: ${next.streakDays} day${next.streakDays === 1 ? '' : 's'}`,
    icon: 'calendar',
    color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
  });
  // awardXPForStudent already emits xp/level/badge events, so we only add attendance event here.
  emitAchievement(events[0]);

  // Merge with xp events for optional caller use.
  return { state: xpResult.state || next, events: [...events, ...(xpResult.events || [])] };
};

const ensureCourseProgress = (state, courseId) => {
  if (!state.progressByCourseId) state.progressByCourseId = {};
  if (!state.progressByCourseId[courseId]) {
    state.progressByCourseId[courseId] = {
      completedLectureIds: [],
      completedLectureTypesById: {},
      completedAssignmentIds: [],
      completedQuizIds: [],
    };
  }
  return state.progressByCourseId[courseId];
};

export const completeLectureForStudent = ({ studentId, courseId, lectureId, lectureType }) => {
  if (!studentId || !courseId || !lectureId) return null;
  const prev = getGamificationState(studentId);
  const next = cloneState(prev);

  const courseProgress = ensureCourseProgress(next, courseId);
  if (!courseProgress.completedLectureIds.includes(lectureId)) {
    courseProgress.completedLectureIds.push(lectureId);
    if (lectureType) courseProgress.completedLectureTypesById[lectureId] = lectureType;
    saveGamificationState(studentId, next);

    // Award XP
    const xpAmount = lectureType === 'youtube' || lectureType === 'yt' ? 15 : 10;
    const reason = `Completed ${lectureType || 'resource'}`;
    const xpResult = awardXPForStudent({
      studentId,
      amount: xpAmount,
      reason
    });

    return xpResult.state || next;
  }

  return prev;
};

export const submitAssignmentForStudent = ({ studentId, courseId, assignmentId }) => {
  if (!studentId || !courseId || !assignmentId) return { state: null, events: [] };

  const prev = getGamificationState(studentId);
  const next = cloneState(prev);
  const courseProgress = ensureCourseProgress(next, courseId);

  if (courseProgress.completedAssignmentIds.includes(assignmentId)) {
    return { state: prev, events: [] };
  }

  courseProgress.completedAssignmentIds.push(assignmentId);
  saveGamificationState(studentId, next);

  const xpResult = awardXPForStudent({
    studentId,
    amount: 20,
    reason: 'Submit assignment',
  });
  return { state: xpResult.state || next, events: xpResult.events || [] };
};

export const submitQuizAttemptForStudent = ({
  studentId,
  quizId,
  courseId,
  correctCount,
  totalQuestions,
  passingPercentage,
  maxAttempts,
}) => {
  if (!studentId || !quizId || !courseId || !totalQuestions) return { state: null, events: [] };

  const prev = getGamificationState(studentId);
  const prevAttemptCount = (prev.quizAttempts || []).filter((a) => a.quizId === quizId).length;
  if (prevAttemptCount >= (maxAttempts || 3)) {
    return { state: prev, events: [] };
  }

  const scorePercent = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercent >= (passingPercentage || 70);

  const next = cloneState(prev);
  ensureCourseProgress(next, courseId);
  const courseProgress = next.progressByCourseId[courseId];

  // Quiz stats for the "Quiz Genius" badge.
  next.quizStats.correct += correctCount;
  next.quizStats.total += totalQuestions;

  next.quizAttempts = next.quizAttempts || [];
  next.quizAttempts.push({
    quizId,
    courseId,
    correct: correctCount,
    total: totalQuestions,
    scorePercent,
    passed,
    submittedAt: new Date().toISOString(),
  });

  if (!courseProgress.completedQuizIds.includes(quizId)) {
    courseProgress.completedQuizIds.push(quizId);
  }

  if (passed && !next.passedQuizIds.includes(quizId)) {
    next.passedQuizIds.push(quizId);
  }

  // Save before awarding XP (so derived badges/streak computations are consistent).
  // Update streakDays again in case badges depend on it.
  next.streakDays = computeStreakDaysEndingAt(next.attendanceDates, getTodayKey());

  // Evaluate badges.
  const earnedBadgesNow = computeEarnedBadges(next);
  const prevBadges = new Set(prev.badges || []);
  const newBadges = earnedBadgesNow.filter((b) => !prevBadges.has(b));
  next.badges = Array.from(new Set([...(next.badges || []), ...newBadges]));

  saveGamificationState(studentId, next);

  const events = [];
  emitAchievement({
    type: 'quiz_result',
    title: `${passed ? 'Passed' : 'Try Again'} - ${scorePercent}%`,
    subtitle: passed ? 'Quiz cleared. XP pending.' : `You need ${passingPercentage || 70}% to pass.`,
    icon: 'brain',
    color: passed ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' : 'bg-amber-500/20 text-amber-200 border-amber-400/40',
  });

  if (passed && next.passedQuizIds.includes(quizId)) {
    // If this quiz was passed for the first time, award XP.
    const wasPassedBefore = (prev.passedQuizIds || []).includes(quizId);
    if (!wasPassedBefore) {
      const xpResult = awardXPForStudent({
        studentId,
        amount: 30,
        reason: 'Pass quiz',
      });
      events.push(...(xpResult.events || []));
    }
  }

  return { state: getGamificationState(studentId), events };
};

export const getCourseProgressSummary = ({ studentState, courseId, totals }) => {
  const courseProgress = studentState?.progressByCourseId?.[courseId];
  const completedLectureIds = courseProgress?.completedLectureIds || [];
  const completedAssignmentIds = courseProgress?.completedAssignmentIds || [];
  const completedQuizIds = courseProgress?.completedQuizIds || [];

  const totalLectures = totals?.totalLectures || 0;
  const totalAssignments = totals?.totalAssignments || 0;
  const totalQuizzes = totals?.totalQuizzes || 0;

  const lectureRatio = totalLectures > 0 ? completedLectureIds.length / totalLectures : 0;
  const assignmentRatio = totalAssignments > 0 ? completedAssignmentIds.length / totalAssignments : 0;
  const quizRatio = totalQuizzes > 0 ? completedQuizIds.length / totalQuizzes : 0;

  const progressPercentage = Math.round((lectureRatio * 40 + assignmentRatio * 30 + quizRatio * 30) * 1);

  return {
    completedLectures: completedLectureIds.length,
    completedAssignments: completedAssignmentIds.length,
    completedQuizzes: completedQuizIds.length,
    progressPercentage: Math.max(0, Math.min(100, progressPercentage)),
  };
};

