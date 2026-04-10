import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import chatbotRoutes from './routes/chatbotRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import courseAccessRoutes from './routes/courseAccessRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import mfaRoutes from './routes/mfaRoutes.js';
import accessRequestRoutes from './routes/accessRequestRoutes.js';
import gamificationRoutes from './routes/gamificationRoutes.js';
import newsRoutes from './routes/newsRoutes.js';

import Department from './models/Department.js';
import Course from './models/Course.js';
import SystemSettings from './models/SystemSettings.js';

// Connect to Database
connectDB().then(async () => {
  try {
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      console.log('Database empty, seeding departments...');
      const departments = [
        { name: 'Computer Science and Engineering', code: 'CSE', tagline: 'Innovating the Future of Computing' },
        { name: 'Electronics and Communication', code: 'ECE' },
        { name: 'Mechanical Engineering', code: 'ME' },
        { name: 'Civil Engineering', code: 'CE' },
        { name: 'Electrical Engineering', code: 'EE' }
      ];
      const createdDepts = await Department.insertMany(departments);
      
      const cse = createdDepts.find(d => d.code === 'CSE');
      if (cse) {
        console.log('Seeding initial CSE courses...');
        const initialCourses = [
          { code: 'CS301', name: 'Data Structures', credits: 4, semester: 3, type: 'THEORY', department: cse._id, description: 'Core concepts of data organization.' },
          { code: 'CS401', name: 'Operating Systems', credits: 3, semester: 4, type: 'THEORY', department: cse._id, description: 'Process management and memory.' },
          { code: 'CS503', name: 'Computer Networks', credits: 4, semester: 5, type: 'THEORY', department: cse._id, description: 'OSI model and TCP/IP.' }
        ];
        await Course.insertMany(initialCourses);
      }
      console.log('Auto-seeding completed successfully.');
    }
  } catch (err) {
    console.error('Auto-seeding failed:', err);
  }
});

const app = express();
const httpServer = createServer(app);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    methods: ["GET", "POST"],
    credentials: true
  },
});

app.use(cors({
  origin: frontendUrl,
  credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/course-access', courseAccessRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/news', newsRoutes);


// PUBLIC SETTINGS
app.get('/api/public/settings', async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        res.json(settings);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// Socket.io for Real-time features
io.on('connection', (socket) => {
  // console.log('New client connected', socket.id);
  
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  socket.on('disconnect', () => {
    // console.log('Client disconnected');
  });
});

// Use the port from environment or fallback to 5000 (standard for backend)
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
