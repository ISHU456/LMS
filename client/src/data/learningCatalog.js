export const STUDENT_COURSE_CATALOG = [
  // Semester 1
  { id: 'BT-101', name: 'Engineering Chemistry', accent: '#10b981', semester: 1 },
  { id: 'BT-102', name: 'Mathematics-I', accent: '#3b82f6', semester: 1 },
  { id: 'BT-103', name: 'English for Communication', accent: '#8b5cf6', semester: 1 },
  { id: 'BT-104', name: 'Basic Electrical & Electronics Engineering', accent: '#f59e0b', semester: 1 },
  { id: 'BT-105', name: 'Engineering Graphics', accent: '#ec4899', semester: 1 },
  { id: 'BT-106', name: 'Manufacturing Practices (Lab)', accent: '#475569', semester: 1 },
  { id: 'BT-CLAB', name: 'English Language / Communication Lab', accent: '#0f172a', semester: 1 },

  // Semester 2
  { id: 'BT-201', name: 'Engineering Physics', accent: '#14b8a6', semester: 2 },
  { id: 'BT-202', name: 'Mathematics-II', accent: '#f59e0b', semester: 2 },
  { id: 'BT-203', name: 'Basic Mechanical Engineering', accent: '#ef4444', semester: 2 },
  { id: 'BT-204', name: 'Basic Civil Engineering', accent: '#826011', semester: 2 },
  { id: 'BT-205', name: 'Basic Computer Engineering', accent: '#2563eb', semester: 2 },

  // Semester 3
  { id: 'BT-301', name: 'Mathematics-III', accent: '#6366f1', semester: 3 },
  { id: 'BT-302', name: 'Data Structures', accent: '#4361ee', semester: 3 },
  { id: 'BT-303', name: 'Digital Systems', accent: '#06b6d4', semester: 3 },
  { id: 'BT-304', name: 'Computer Organization', accent: '#f97316', semester: 3 },
  { id: 'BT-305', name: 'Discrete Mathematics', accent: '#d946ef', semester: 3 },

  // Semester 4
  { id: 'BT-401', name: 'Analysis & Design of Algorithms', accent: '#ef4444', semester: 4 },
  { id: 'BT-402', name: 'Operating Systems', accent: '#7209b7', semester: 4 },
  { id: 'BT-403', name: 'Software Engineering', accent: '#10b981', semester: 4 },
  { id: 'BT-404', name: 'Theory of Computation', accent: '#8b5cf6', semester: 4 },
  { id: 'BT-405', name: 'Database Management Systems', accent: '#f59e0b', semester: 4 },

  // Semester 5
  { id: 'BT-501', name: 'Computer Networks', accent: '#3b82f6', semester: 5 },
  { id: 'BT-502', name: 'Compiler Design', accent: '#f43f5e', semester: 5 },
  { id: 'BT-503', name: 'Machine Learning / AI', accent: '#10b981', semester: 5 },
  { id: 'BT-OE1', name: 'Open Elective-I', accent: '#64748b', semester: 5 },
  { id: 'BT-DE1', name: 'Department Elective-I', accent: '#475569', semester: 5 },

  // Semester 6
  { id: 'BT-601', name: 'Cloud Computing', accent: '#0ea5e9', semester: 6 },
  { id: 'BT-602', name: 'Information Security', accent: '#dc2626', semester: 6 },
  { id: 'BT-603', name: 'Data Mining / Big Data', accent: '#fbbf24', semester: 6 },
  { id: 'BT-OE2', name: 'Open Elective-II', accent: '#94a3b8', semester: 6 },
  { id: 'BT-DE2', name: 'Department Elective-II', accent: '#334155', semester: 6 },

  // Semester 7
  { id: 'BT-701', name: 'Artificial Intelligence', accent: '#7c3aed', semester: 7 },
  { id: 'BT-DE3', name: 'Blockchain / IoT', accent: '#2563eb', semester: 7 },
  { id: 'BT-PROJ1', name: 'Major Project - Phase 1', accent: '#f72585', semester: 7 },
  { id: 'BT-TRAIN', name: 'Industrial Training', accent: '#10b981', semester: 7 },

  // Semester 8
  { id: 'BT-PROJ2', name: 'Major Project - Phase 2', accent: '#f72585', semester: 8 },
  { id: 'BT-SEM', name: 'Seminar', accent: '#64748b', semester: 8 },
  { id: 'BT-INTERN', name: 'Internship / Industry Work', accent: '#10b981', semester: 8 },
];

export const QUIZZIES_BY_COURSE = {
  'BT-302': [
    {
      quizId: 'BT302-q1',
      title: 'DSA Quickfire',
      timeLimitSec: 120,
      passingPercentage: 70,
      maxAttempts: 3,
      questionsPerAttempt: 5,
      questions: [
        { id: 'BT302-q1-1', type: 'mcq', question: 'Which data structure is LIFO?', options: ['Queue', 'Stack', 'Heap', 'Graph'], correctIndex: 1, marks: 10 },
        { id: 'BT302-q1-2', type: 'mcq', question: 'Binary Search complexity?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctIndex: 1, marks: 10 }
      ],
    },
  ],
  'BT-402': [
    {
      quizId: 'BT402-q1',
      title: 'OS Fundamentals',
      timeLimitSec: 150,
      passingPercentage: 70,
      maxAttempts: 3,
      questionsPerAttempt: 5,
      questions: [
        { id: 'BT402-q1-1', type: 'mcq', question: 'LIFO scheduling?', options: ['SJF', 'FCFS', 'RR', 'None'], correctIndex: 1, marks: 10 }
      ],
    },
  ],
};

export const ASSIGNMENTS_SEED = [
  { id: 1, title: 'Build Full-Stack LMS', type: 'project', course: 'BT-PROJ2', maxMarks: 100, deadline: '2026-04-15T23:59:00' },
  { id: 2, title: 'Algorithm Analysis', type: 'assignment', course: 'BT-401', maxMarks: 20, deadline: '2026-03-22T23:59:00' },
  { id: 3, title: 'PCB Design', type: 'assignment', course: 'BT-104', maxMarks: 50, deadline: '2026-03-10T23:59:00' },
];

export const getAllQuizzes = () => {
  return Object.entries(QUIZZIES_BY_COURSE).flatMap(([courseId, quizzes]) =>
    (quizzes || []).map((q) => ({ ...q, courseId }))
  );
};

export const getQuizById = (quizId) => {
  const quizzes = getAllQuizzes();
  return quizzes.find((q) => q.quizId === quizId);
};

export const getCoursesWithQuizzes = () => {
  return Object.keys(QUIZZIES_BY_COURSE);
};
