export const STUDENT_COURSE_CATALOG = [
  {
    id: 'CS301',
    name: 'Data Structures & Algorithms',
    accent: '#4361ee',
  },
  {
    id: 'CS401',
    name: 'Operating Systems',
    accent: '#7209b7',
  },
  {
    id: 'CS899',
    name: 'Capstone Implementation',
    accent: '#f72585',
  },
];

export const QUIZZIES_BY_COURSE = {
  CS301: [
    {
      quizId: 'CS301-q1',
      title: 'DSA Quickfire',
      timeLimitSec: 120,
      passingPercentage: 70,
      maxAttempts: 3,
      questionsPerAttempt: 5,
      questions: [
        {
          id: 'CS301-q1-1',
          type: 'mcq',
          question: 'Which data structure is best for implementing a LIFO (Last In, First Out) behavior?',
          options: ['Queue', 'Stack', 'Heap', 'Graph'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS301-q1-2',
          type: 'mcq',
          question: 'The worst-case time complexity of Binary Search is:',
          options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS301-q1-3',
          type: 'mcq',
          question: 'Which traversal visits nodes in the order: Root, Left, Right?',
          options: ['In-order', 'Pre-order', 'Post-order', 'Level-order'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS301-q1-4',
          type: 'mcq',
          question: 'What does a min-heap guarantee?',
          options: ['The root is the maximum element', 'The root is the minimum element', 'All leaves are sorted', 'Every node has two children'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS301-q1-5',
          type: 'mcq',
          question: 'In BFS, the shortest path (in an unweighted graph) is found because:',
          options: ['It uses a stack', 'It explores neighbors in increasing distance order', 'It sorts all edges first', 'It only works for trees'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS301-q1-6',
          type: 'mcq',
          question: 'Dynamic Programming is typically useful when an algorithm has:',
          options: ['No overlapping subproblems', 'Overlapping subproblems and optimal substructure', 'Only optimal substructure', 'Only overlapping subproblems'],
          correctIndex: 1,
          marks: 10,
        },
      ],
    },
  ],
  CS401: [
    {
      quizId: 'CS401-q1',
      title: 'OS Fundamentals Test',
      timeLimitSec: 150,
      passingPercentage: 70,
      maxAttempts: 3,
      questionsPerAttempt: 5,
      questions: [
        {
          id: 'CS401-q1-1',
          type: 'mcq',
          question: 'Which scheduling algorithm is based on the principle of "First Come, First Served"?',
          options: ['SJF', 'FCFS', 'Round Robin', 'Priority Scheduling'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS401-q1-2',
          type: 'mcq',
          question: 'A process in waiting state is typically waiting for:',
          options: ['CPU execution', 'I/O completion', 'Memory allocation', 'Thread creation'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS401-q1-3',
          type: 'mcq',
          question: 'Which of the following is a non-preemptive scheduling algorithm?',
          options: ['SRTF', 'RR', 'SJF (non-preemptive)', 'Priority (preemptive)'],
          correctIndex: 2,
          marks: 10,
        },
        {
          id: 'CS401-q1-4',
          type: 'mcq',
          question: 'What is the primary purpose of an operating system?',
          options: ['To compile programs', 'To manage hardware resources and provide services', 'To replace the CPU', 'To store databases only'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS401-q1-5',
          type: 'mcq',
          question: 'Deadlock can be prevented by ensuring that:',
          options: ['At least one of the Coffman conditions is not satisfied', 'The OS uses a bigger clock', 'All processes are identical', 'Memory is unlimited'],
          correctIndex: 0,
          marks: 10,
        },
        {
          id: 'CS401-q1-6',
          type: 'mcq',
          question: 'In virtual memory, the system uses disk space to act as:',
          options: ['Cache', 'RAM extension', 'Printer storage', 'Network memory'],
          correctIndex: 1,
          marks: 10,
        },
      ],
    },
  ],
  CS899: [
    {
      quizId: 'CS899-q1',
      title: 'Capstone Readiness Quiz',
      timeLimitSec: 180,
      passingPercentage: 70,
      maxAttempts: 3,
      questionsPerAttempt: 5,
      questions: [
        {
          id: 'CS899-q1-1',
          type: 'mcq',
          question: 'Which best describes a "deliverable" in a project-based course?',
          options: ['A required output with success criteria', 'A random task with no evaluation', 'Only the final presentation', 'An optional document'],
          correctIndex: 0,
          marks: 10,
        },
        {
          id: 'CS899-q1-2',
          type: 'mcq',
          question: 'A good project scope should be:',
          options: ['Vague and unbounded', 'Clear, measurable, and realistic', 'Only one line long', 'Changed every hour'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS899-q1-3',
          type: 'mcq',
          question: 'What is the purpose of version control?',
          options: ['To delete old code', 'To track changes and collaborate safely', 'To store only screenshots', 'To avoid testing'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS899-q1-4',
          type: 'mcq',
          question: 'In an iterative development process, you should:',
          options: ['Wait until everything is perfect', 'Deliver small increments and refine', 'Avoid feedback', 'Skip documentation entirely'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS899-q1-5',
          type: 'mcq',
          question: 'Which practice improves maintainability the most?',
          options: ['Hard-coded constants everywhere', 'Consistent code structure and documentation', 'Removing tests', 'Using deeply nested logic'],
          correctIndex: 1,
          marks: 10,
        },
        {
          id: 'CS899-q1-6',
          type: 'mcq',
          question: 'A retrospective meeting helps because it:',
          options: ['Blames individuals', 'Identifies improvements for the next iteration', 'Repeats issues', 'Stops the project'],
          correctIndex: 1,
          marks: 10,
        },
      ],
    },
  ],
};

export const ASSIGNMENTS_SEED = [
  {
    id: 1,
    title: 'Build Full-Stack LMS',
    type: 'project',
    course: 'CS899',
    maxMarks: 100,
    deadline: '2026-04-15T23:59:00',
  },
  {
    id: 2,
    title: 'Algorithm Complexity Analysis',
    type: 'assignment',
    course: 'CS301',
    maxMarks: 20,
    deadline: '2026-03-22T23:59:00',
  },
  {
    id: 3,
    title: 'Operating Systems PCB Design',
    type: 'assignment',
    course: 'CS401',
    maxMarks: 50,
    deadline: '2026-03-10T23:59:00',
  },
];

export const getAllQuizzes = () => {
  return Object.entries(QUIZZIES_BY_COURSE).flatMap(([courseId, quizzes]) =>
    (quizzes || []).map((q) => ({
      ...q,
      courseId,
    }))
  );
};

export const getQuizById = (quizId) => {
  const quizzes = getAllQuizzes();
  return quizzes.find((q) => q.quizId === quizId);
};

export const getCoursesWithQuizzes = () => {
  return Object.keys(QUIZZIES_BY_COURSE);
};

