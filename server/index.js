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
import codingRoutes from './routes/codingRoutes.js';


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
app.use('/api/coding', codingRoutes);



// PUBLIC SETTINGS
app.get('/api/public/settings', async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        res.json(settings);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// LIVE STATUS API
app.get('/api/live/status/:roomId', (req, res) => {
  const { roomId } = req.params;
  const isLive = !!broadcasters[roomId];
  res.json({ isLive });
});

const broadcasters = {}; // roomId -> { id, name }
const roomParticipants = {}; // roomId -> [{ id, name, email }]

// Socket.io for Real-time features
io.on('connection', (socket) => {
  // Join a private room for specific notifications
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });
  
  // WebRTC Broadcaster Logic (Teacher)
  socket.on('broadcaster-join', async (roomId, name) => {
    broadcasters[roomId] = { id: socket.id, name };
    socket.join(roomId);
    
    // Fetch academic context for targeted broadcasting
    try {
      const course = await Course.findOne({ code: roomId }).populate('department');
      if (course) {
        io.emit('global-class-started', { 
          roomId, 
          name, 
          department: course.department?.name,
          deptCode: course.department?.code,
          semester: course.semester
        });
      } else {
        io.emit('global-class-started', { roomId, name });
      }
    } catch (e) {
      io.emit('global-class-started', { roomId, name });
    }
    
    socket.to(roomId).emit('broadcaster-connected', name);
    
    // Broadcast existing participants to broadcaster (though they'll join later)
    if (!roomParticipants[roomId]) roomParticipants[roomId] = [];
    socket.emit('update-participants', roomParticipants[roomId]);
  });

  // WebRTC Watcher Logic (Student)
  socket.on('watcher-join', (roomId, user) => {
    socket.join(roomId);
    
    if (!roomParticipants[roomId]) roomParticipants[roomId] = [];
    // Add if not already there
    if (!roomParticipants[roomId].find(p => p.id === socket.id)) {
      roomParticipants[roomId].push({ id: socket.id, ...user });
    }
    
    // Notify room of updated list
    io.to(roomId).emit('update-participants', roomParticipants[roomId]);
    
    if (broadcasters[roomId]) {
      // Send offer with broadcaster name
      socket.to(broadcasters[roomId].id).emit('watcher-connected', socket.id, user);
      socket.emit('broadcaster-name', broadcasters[roomId].name);
    }
  });

  // Signaling
  socket.on('offer', (id, message) => {
    // Find room to attach broadcaster name
    let broadcasterName = 'Professor';
    for (const rid in broadcasters) {
      if (broadcasters[rid].id === socket.id) broadcasterName = broadcasters[rid].name;
    }
    socket.to(id).emit('offer', socket.id, message, broadcasterName);
  });
  socket.on('answer', (id, message) => {
    socket.to(id).emit('answer', socket.id, message);
  });
  socket.on('candidate', (id, message) => {
    socket.to(id).emit('candidate', socket.id, message);
  });

  // Chat & Interactions
  socket.on('chat-message', (roomId, message) => {
    io.to(roomId).emit('chat-message', message);
  });
  socket.on('raise-hand', (roomId, user) => {
    if (broadcasters[roomId]) {
      socket.to(broadcasters[roomId].id).emit('raise-hand', user);
    }
  });

  socket.on('disconnect', () => {
    // Check if broadcaster left
    for (const roomId in broadcasters) {
      if (broadcasters[roomId].id === socket.id) {
        delete broadcasters[roomId];
        socket.to(roomId).emit('broadcaster-disconnected');
      }
    }
    // Check if participant left
    for (const roomId in roomParticipants) {
      const initialLen = roomParticipants[roomId].length;
      roomParticipants[roomId] = roomParticipants[roomId].filter(p => p.id !== socket.id);
      if (roomParticipants[roomId].length !== initialLen) {
        io.to(roomId).emit('update-participants', roomParticipants[roomId]);
      }
    }
    socket.broadcast.emit('disconnectPeer', socket.id);
  });
});

// Use the port from environment or fallback to 5000 (standard for backend)
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
