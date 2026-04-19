import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quiz from './models/Quiz.js'; // Assuming gamification/quizzes point to a Quiz model

dotenv.config();

const seedRealQuizzes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Get Admin user for createdBy field
    const User = (await import('./models/User.js')).default;
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log("No admin found. Cannot attach createdBy");
      process.exit(1);
    }

    const quizzes = [
      {
        title: "Computer Networks: Transport Layer",
        description: "Assess your knowledge of TCP, UDP, multiplexing, and standard port configurations.",
        category: "Computer Networks",
        difficulty: "easy",
        createdBy: admin._id,
        timeLimit: 15,
        idealTime: 10,
        totalPoints: 100,
        coinsReward: {
          base: 30,
          fullMarksBonus: 20,
          speedBonusMultiplier: 1.5
        },
        questions: [
          {
            text: "Which protocol provides a connectionless, unreliable datagram service?",
            options: ["TCP", "UDP", "FTP", "HTTP"],
            correctAnswer: "UDP",
            explanation: "User Datagram Protocol (UDP) does not guarantee delivery, ordering, or duplicate protection.",
            type: "mcq"
          },
          {
            text: "During the TCP 3-way handshake, what is the second packet sent?",
            options: ["SYN", "ACK", "SYN-ACK", "FIN"],
            correctAnswer: "SYN-ACK",
            explanation: "The server acknowledges the client's SYN request and sends its own SYN in a single SYN-ACK packet.",
            type: "mcq"
          },
          {
            text: "Which well-known port is used by standard HTTP?",
            options: ["21", "22", "80", "443"],
            correctAnswer: "80",
            explanation: "Port 80 is the default port for standard unencrypted HTTP traffic.",
            type: "mcq"
          },
          {
            text: "What is the primary function of the Transport Layer?",
            options: ["Routing packets", "Process-to-process delivery", "Error detection on the wire", "MAC address mapping"],
            correctAnswer: "Process-to-process delivery",
            explanation: "The Transport Layer uses ports to deliver data directly between specific processes/applications on hosts.",
            type: "mcq"
          }
        ]
      },
      {
        title: "Operating Systems: Process Synchronization",
        description: "Test your understanding of deadlocks, semaphores, mutexes, and scheduling algorithms.",
        category: "Operating Systems",
        difficulty: "medium",
        createdBy: admin._id,
        timeLimit: 20,
        idealTime: 12,
        totalPoints: 100,
        coinsReward: {
          base: 50,
          fullMarksBonus: 30,
          speedBonusMultiplier: 2.0
        },
        questions: [
          {
            text: "Which of the following is NOT a necessary condition for deadlock?",
            options: ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Circular Release"],
            correctAnswer: "Circular Release",
            explanation: "The fourth condition is 'Circular Wait', not 'Circular Release'.",
            type: "mcq"
          },
          {
            text: "A semaphore is fundamentally...",
            options: ["A hardware register", "An integer variable", "A disk partition", "A PCB structure"],
            correctAnswer: "An integer variable",
            explanation: "A semaphore is an integer variable accessed through atomic wait() and signal() operations.",
            type: "mcq"
          },
          {
            text: "Which scheduling algorithm is non-preemptive?",
            options: ["Round Robin", "Shortest Remaining Time First", "First Come First Serve (FCFS)", "Multilevel Queue"],
            correctAnswer: "First Come First Serve (FCFS)",
            explanation: "Once a process gets the CPU in FCFS, it keeps it until it explicitly terminates or requests I/O.",
            type: "mcq"
          },
          {
            text: "What problem occurs when a low priority process holds a lock needed by a high priority process?",
            options: ["Deadlock", "Priority Inversion", "Thrashing", "Belady's Anomaly"],
            correctAnswer: "Priority Inversion",
            explanation: "Priority Inversion happens when a high-priority process is blocked waiting on a lower-priority process.",
            type: "mcq"
          }
        ]
      },
      {
        title: "Advanced CPU & Kernel Engineering",
        description: "Deep dive into page faults, virtual memory architectures, and kernel traps.",
        category: "Operating Systems",
        difficulty: "hard",
        createdBy: admin._id,
        timeLimit: 25,
        idealTime: 15,
        totalPoints: 200,
        coinsReward: {
          base: 100,
          fullMarksBonus: 50,
          speedBonusMultiplier: 2.5
        },
        questions: [
          {
            text: "What causes a Page Fault?",
            options: ["Execution of an illegal instruction", "Accessing a page not currently in memory", "Division by zero", "A hardware interrupt"],
            correctAnswer: "Accessing a page not currently in memory",
            explanation: "A page fault occurs when a program accesses a mapped virtual memory page that is not loaded in physical RAM.",
            type: "mcq"
          },
          {
            text: "Which memory management scheme suffers from External Fragmentation?",
            options: ["Paging", "Pure Segmentation", "Demand Paging", "TLB Mappings"],
            correctAnswer: "Pure Segmentation",
            explanation: "Segmentation allocates continuous blocks of varying sizes, leading to free spaces between segments (External Fragmentation).",
            type: "mcq"
          },
          {
            text: "What does the Translation Lookaside Buffer (TLB) cache?",
            options: ["Disk blocks", "CPU instructions", "Page table entries", "Network packets"],
            correctAnswer: "Page table entries",
            explanation: "The TLB is a specialized associative cache that stores recent virtual-to-physical address translations.",
            type: "mcq"
          },
          {
            text: "What is the transition from User Mode to Kernel Mode called?",
            options: ["Mode Switch / Trap", "Context Switch", "Spooling", "Thrashing"],
            correctAnswer: "Mode Switch / Trap",
            explanation: "A trap (software interrupt) invokes a mode switch to provide the kernel privileges required for system calls.",
            type: "mcq"
          }
        ]
      }
    ];

    await Quiz.insertMany(quizzes);
    console.log("3 Real Subject-Wise Quizzes Seeded!");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedRealQuizzes();
