import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  completeLectureForStudent,
  getGamificationState,
  getLevelFromXp,
  markAttendanceForStudent,
  submitAssignmentForStudent,
  submitQuizAttemptForStudent,
} from '../utils/gamificationStore';

export const useGamification = (studentId) => {
  const [state, setState] = useState(() => (studentId ? getGamificationState(studentId) : null));

  useEffect(() => {
    setState(studentId ? getGamificationState(studentId) : null);
  }, [studentId]);

  const level = useMemo(() => {
    if (!state) return 0;
    return getLevelFromXp(state.xp || 0);
  }, [state]);

  const refresh = useCallback(() => {
    if (!studentId) return;
    setState(getGamificationState(studentId));
  }, [studentId]);

  const markAttendance = useCallback(
    ({ dateKey }) => {
      if (!studentId) return { events: [] };
      const res = markAttendanceForStudent({ studentId, dateKey });
      setState(res.state);
      return { events: res.events || [] };
    },
    [studentId]
  );

  const completeLecture = useCallback(
    ({ courseId, lectureId, lectureType }) => {
      if (!studentId) return null;
      const next = completeLectureForStudent({ studentId, courseId, lectureId, lectureType });
      if (next) setState(next);
      return next;
    },
    [studentId]
  );

  const submitAssignment = useCallback(
    ({ courseId, assignmentId }) => {
      if (!studentId) return { events: [] };
      const res = submitAssignmentForStudent({ studentId, courseId, assignmentId });
      setState(res.state);
      return { events: res.events || [] };
    },
    [studentId]
  );

  const submitQuizAttempt = useCallback(
    (payload) => {
      if (!studentId) return { events: [], state: null };
      const res = submitQuizAttemptForStudent({ ...payload, studentId });
      setState(res.state);
      return { events: res.events || [], state: res.state };
    },
    [studentId]
  );

  return {
    gamification: state,
    level,
    refresh,
    markAttendance,
    completeLecture,
    submitAssignment,
    submitQuizAttempt,
  };
};

