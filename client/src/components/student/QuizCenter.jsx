import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Brain,
  RotateCcw,
  Timer,
  ShieldCheck,
} from 'lucide-react';
import { QUIZZIES_BY_COURSE, getQuizById, getAllQuizzes } from '../../data/learningCatalog';
import { getTodayKey } from '../../utils/gamificationStore';

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const shuffleQuestionOptions = (q) => {
  const options = q.options || [];
  const indices = options.map((_, idx) => idx);
  const shuffledIndices = shuffleArray(indices);
  const shuffledOptions = shuffledIndices.map((idx) => options[idx]);
  const newCorrectIndex = shuffledIndices.indexOf(q.correctIndex);
  return { ...q, options: shuffledOptions, correctIndex: newCorrectIndex };
};

const QuizCenter = ({ studentId, gamification, submitQuizAttempt, studentName }) => {
  const quizzes = useMemo(() => getAllQuizzes(), []);

  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const selectedQuiz = useMemo(() => (selectedQuizId ? getQuizById(selectedQuizId) : null), [selectedQuizId]);

  const [attemptedQuizIdToRender, setAttemptedQuizIdToRender] = useState(null);
  const [phase, setPhase] = useState('list'); // list | attempt | result

  const [attemptQuestions, setAttemptQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const quizAttemptsById = useMemo(() => {
    const map = {};
    for (const a of gamification?.quizAttempts || []) {
      if (!map[a.quizId]) map[a.quizId] = [];
      map[a.quizId].push(a);
    }
    return map;
  }, [gamification]);

  const completedQuizIdsByCourse = useMemo(() => {
    const map = {};
    const pb = gamification?.progressByCourseId || {};
    for (const courseId of Object.keys(pb)) {
      map[courseId] = pb[courseId]?.completedQuizIds || [];
    }
    return map;
  }, [gamification]);

  useEffect(() => {
    if (phase !== 'attempt') return;
    if (!selectedQuiz) return;

    const timeLimit = selectedQuiz.timeLimitSec || 120;
    setSecondsLeft(timeLimit);
    setSubmitted(false);

    return () => {};
  }, [phase, selectedQuiz]);

  useEffect(() => {
    if (phase !== 'attempt') return;
    if (submitted) return;
    if (!selectedQuiz) return;

    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          // Auto-submit at time up
          // Using functional state update to avoid stale values.
          setTimeout(() => {
            handleSubmitAttempt(true);
          }, 0);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, submitted, selectedQuiz, attemptQuestions, answers]);

  const startAttempt = (quiz) => {
    const courseId = quiz.courseId;
    const attemptsSoFar = (quizAttemptsById[quiz.quizId] || []).length;
    if (attemptsSoFar >= (quiz.maxAttempts || 3)) return;

    const bank = quiz.questions || [];
    const shuffledQuestions = shuffleArray(bank)
      .slice(0, quiz.questionsPerAttempt || 5)
      .map((q) => shuffleQuestionOptions(q));

    setAttemptedQuizIdToRender(quiz.quizId);
    setSelectedQuizId(quiz.quizId);
    setAttemptQuestions(shuffledQuestions);
    setAnswers({});
    setPhase('attempt');
    setSubmitted(false);
  };

  const handleSubmitAttempt = (isAuto = false) => {
    if (!selectedQuiz) return;
    if (submitted) return;
    setSubmitted(true);

    const totalQuestions = attemptQuestions.length;
    const correctCount = attemptQuestions.reduce((acc, q) => {
      const selectedIndex = answers[q.id];
      if (selectedIndex === q.correctIndex) return acc + 1;
      return acc;
    }, 0);

    const payload = {
      quizId: selectedQuiz.quizId,
      courseId: selectedQuiz.courseId,
      correctCount,
      totalQuestions,
      passingPercentage: selectedQuiz.passingPercentage,
      maxAttempts: selectedQuiz.maxAttempts,
    };

    submitQuizAttempt(payload);
    setPhase('result');
    setSecondsLeft((s) => s);
  };

  const result = useMemo(() => {
    if (!submitted || phase !== 'result') return null;
    const totalQuestions = attemptQuestions.length;
    const correctCount = attemptQuestions.reduce((acc, q) => {
      const selectedIndex = answers[q.id];
      if (selectedIndex === q.correctIndex) return acc + 1;
      return acc;
    }, 0);
    const scorePercent = Math.round((correctCount / Math.max(1, totalQuestions)) * 100);
    const passed = scorePercent >= (selectedQuiz?.passingPercentage || 70);
    return { totalQuestions, correctCount, scorePercent, passed };
  }, [submitted, phase, attemptQuestions, answers, selectedQuiz]);

  const quizLeaderboard = useMemo(() => {
    if (!selectedQuiz) return [];
    const attempts = (gamification?.quizAttempts || []).filter((a) => a.quizId === selectedQuiz.quizId);
    const bestScore = attempts.reduce((m, a) => Math.max(m, a.scorePercent || 0), 0);
    const youName = studentName || 'You';
    const demo = [
      { name: 'Aarav', xp: 88 },
      { name: 'Ananya', xp: 83 },
      { name: 'Kabir', xp: 79 },
      { name: 'Meera', xp: 74 },
      { name: 'Vivaan', xp: 69 },
    ];
    const combined = [...demo, { name: youName, xp: bestScore }];
    combined.sort((a, b) => b.xp - a.xp);
    return combined.slice(0, 5);
  }, [gamification, selectedQuiz, studentName]);

  const attemptedCount = (selectedQuizId && quizAttemptsById[selectedQuizId]?.length) || 0;
  const maxAttempts = selectedQuiz?.maxAttempts || 3;
  const attemptsRemaining = Math.max(0, maxAttempts - attemptedCount);

  const courseNameForQuiz = (quiz) => {
    const course = Object.keys(QUIZZIES_BY_COURSE).find((k) => k === quiz.courseId) || quiz.courseId;
    return course;
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-500/20">
            <Brain size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Quiz Arena</h2>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Timer-based quizzes with instant scoring.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/40">
          <ShieldCheck size={16} className="text-emerald-500" />
          <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Auto Evaluation</span>
        </div>
      </header>

      {phase === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const attempts = (quizAttemptsById[quiz.quizId] || []).length;
            const completed = (gamification?.passedQuizIds || []).includes(quiz.quizId);
            const remaining = Math.max(0, (quiz.maxAttempts || 3) - attempts);
            const courseId = quiz.courseId;
            const courseProgressIds = completedQuizIdsByCourse[courseId] || [];
            const quizzesCompletedCount = courseProgressIds.length;
            return (
              <motion.div
                key={quiz.quizId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                        <Brain size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white truncate">{quiz.title}</h3>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                          {courseNameForQuiz(quiz)} - Quiz ID {quiz.quizId}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="px-3 py-1 rounded-full bg-primary-50 border border-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} /> {quiz.timeLimitSec}s
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-400/30 text-amber-600 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest">
                        Pass: {quiz.passingPercentage}%
                      </span>
                      <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
                        Attempts left: {remaining}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end">
                    {completed ? (
                      <div className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-400/30">
                        <CheckCircle2 size={14} /> Passed
                      </div>
                    ) : null}
                    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mt-2">
                      {quizzesCompletedCount ? `${quizzesCompletedCount} quiz cleared` : 'Not started yet'}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startAttempt({ ...quiz, courseId })}
                    disabled={remaining <= 0}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 ${
                      remaining <= 0
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:opacity-95'
                    }`}
                  >
                    <PlayCircle size={14} />
                    {remaining <= 0 ? 'Limit Reached' : 'Start Quiz'}
                  </motion.button>
                  {attempts > 0 ? (
                    <div className="w-10 h-10 rounded-xl bg-white/40 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                      <Timer size={18} className="text-primary-500" />
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {phase === 'attempt' && selectedQuiz && (
          <motion.div
            key="attempt"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center border border-primary-500/20">
                    <Brain size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{selectedQuiz.title}</h3>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                      Timer-based - Auto submit - {selectedQuiz.questionsPerAttempt || 5} questions
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-400/30 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest">
                    Passing: {selectedQuiz.passingPercentage}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-300">
                    Attempt: {attemptsRemaining < maxAttempts ? attemptedCount + 1 : attemptedCount + 1} / {maxAttempts}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <div className="px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-300 flex items-center gap-2">
                  <Clock size={16} />
                  <div className="text-sm font-black tabular-nums">
                    {Math.floor(secondsLeft / 60)
                      .toString()
                      .padStart(2, '0')}
                    :
                    {(secondsLeft % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {attemptQuestions.map((q, idx) => {
                const selectedIndex = answers[q.id];
                return (
                  <div key={q.id} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                        Q{idx + 1}
                      </span>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">{q.question}</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedIndex === optIdx;
                        return (
                          <motion.button
                            type="button"
                            key={optIdx}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setAnswers((a) => ({ ...a, [q.id]: optIdx }))}
                            className={`text-left px-4 py-3 rounded-2xl border transition-all font-bold text-sm ${
                              isSelected
                                ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-500/30'
                                : 'bg-white/40 dark:bg-gray-900/40 border-gray-200 dark:border-gray-800 hover:border-primary-500/30'
                            }`}
                          >
                            {opt}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3 items-center justify-between">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Tip: you can submit before time ends. Unanswered questions count as incorrect.
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmitAttempt(false)}
                  className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 border border-gray-200 dark:border-gray-800 shadow-md"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhase('list');
                    setSelectedQuizId(null);
                  }}
                  className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-white/50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800"
                >
                  Exit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'result' && selectedQuiz && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="glass p-6 rounded-3xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">{selectedQuiz.title} Results</h3>
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  Instant evaluation and gamified XP (if passed).
                </p>
              </div>
              <div
                className={`px-4 py-3 rounded-2xl border text-sm font-black ${
                  result?.passed
                    ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40'
                    : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
                }`}
              >
                {result?.passed ? <CheckCircle2 size={18} className="inline mr-2" /> : <XCircle size={18} className="inline mr-2" />}
                {result?.scorePercent}% {result?.passed ? 'Passed' : 'Not Passed'}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Correct</div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{result?.correctCount}</div>
              </div>
              <div className="bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Total</div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{result?.totalQuestions}</div>
              </div>
              <div className="bg-white/40 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-xs font-black uppercase tracking-widest text-gray-500">Passing Mark</div>
                <div className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">{selectedQuiz.passingPercentage}%</div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 bg-white/30 dark:bg-gray-900/25">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-extrabold text-gray-900 dark:text-white">Quiz Leaderboard</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                    Best scores (demo + your attempts)
                  </div>
                </div>
                <div className="px-3 py-1 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-[10px] uppercase tracking-widest border border-gray-200 dark:border-gray-800">
                  Top 5
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {quizLeaderboard.map((p, idx) => {
                  const isMe = p.name === (studentName || 'You');
                  return (
                    <div
                      key={`${p.name}_${idx}`}
                      className={`flex items-center justify-between gap-4 p-3 rounded-2xl border ${
                        isMe
                          ? 'bg-primary-600/10 border-primary-500/40'
                          : 'bg-white/35 dark:bg-gray-900/30 border-gray-100 dark:border-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-xs font-black ${
                          idx === 0
                            ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                            : idx === 1
                              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                              : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                        }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-gray-900 dark:text-white truncate">{p.name}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">
                            {isMe ? 'You' : 'Student'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">{p.xp}%</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mt-1">Score</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 items-center justify-between">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
                {result?.passed
                  ? 'Nice! If it is your first time passing, you gained +30 XP automatically.'
                  : 'No worries. Retry until you reach the passing percentage.'}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPhase('list');
                    setAttemptQuestions([]);
                    setAnswers({});
                    setSubmitted(false);
                    setSelectedQuizId(null);
                  }}
                  className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 border border-gray-200 dark:border-gray-800 shadow-md"
                >
                  Back to Quizzes
                </button>
                <button
                  type="button"
                  onClick={() => startAttempt(selectedQuiz)}
                  disabled={attemptsRemaining <= 0}
                  className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest border ${
                    attemptsRemaining <= 0
                      ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed border-gray-200 dark:border-gray-700'
                      : 'bg-white/50 dark:bg-gray-900/40 text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <RotateCcw size={14} className="inline mr-2" />
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizCenter;

