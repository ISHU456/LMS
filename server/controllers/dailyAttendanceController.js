import DailyAttendance from '../models/DailyAttendance.js';
import GPSConfig from '../models/GPSConfig.js';
import UserFace from '../models/UserFace.js';
import { decryptDescriptors } from '../utils/crypto.js';
import { getDistance } from '../utils/haversine.js';

// @desc    Mark daily entry attendance
// @route   POST /api/attendance/daily/entry
// @access  Student
export const markDailyEntry = async (req, res) => {
  try {
    const { descriptor, location } = req.body;
    const userId = req.user._id;

    if (!descriptor || !location) {
      return res.status(400).json({ message: 'Missing face descriptor or location data' });
    }

    // 1. Check Window (10 AM to 5 PM)
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check if it's within 10:00 to 17:00 (5 PM)
    if (currentHour < 10 || currentHour >= 17) {
      return res.status(403).json({ 
        message: 'Attendance system is only active between 10:00 AM and 05:00 PM' 
      });
    }

    // 2. Fetch Face Data & Verify
    const userFace = await UserFace.findOne({ user: userId });
    if (!userFace) return res.status(404).json({ message: 'Face not registered' });

    const storedDescriptors = decryptDescriptors(userFace.encryptedDescriptors);
    const isMatch = storedDescriptors.some(stored => {
       const v1 = Array.from(stored);
       const v2 = Array.from(descriptor);
       if (v1.length !== v2.length) return false;
       const dist = Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
       return dist < 0.5;
    });

    if (!isMatch) return res.status(401).json({ message: 'Face verification failed' });

    // 3. GPS Verification
    const gpsConfig = await GPSConfig.findOne({ isActive: true });
    if (gpsConfig) {
      const distance = getDistance(location.latitude, location.longitude, gpsConfig.center.lat, gpsConfig.center.lng);
      if (distance > gpsConfig.radius) {
         return res.status(401).json({ 
           message: `You are outside the campus perimeter (${Math.round(distance)}m away). Allowed radius: ${gpsConfig.radius}m` 
         });
      }
    }

    // 4. Record Entry
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await DailyAttendance.findOne({ student: userId, date: today });

    if (attendance && attendance.entry && attendance.entry.time) {
      return res.status(400).json({ message: 'Entry already marked for today' });
    }

    if (!attendance) {
      attendance = new DailyAttendance({
        student: userId,
        date: today,
        entry: {
          time: new Date(),
          location: { lat: location.latitude, lng: location.longitude },
          faceVerified: true
        },
        status: 'incomplete'
      });
    } else {
      attendance.entry = {
          time: new Date(),
          location: { lat: location.latitude, lng: location.longitude },
          faceVerified: true
      };
    }

    await attendance.save();

    res.status(201).json({ message: 'Daily Entry marked successfully', attendance });

  } catch (error) {
    console.error('Error marking daily entry:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark daily exit attendance
// @route   POST /api/attendance/daily/exit
// @access  Student
export const markDailyExit = async (req, res) => {
  try {
    const { descriptor, location } = req.body;
    const userId = req.user._id;

    if (!descriptor || !location) {
      return res.status(400).json({ message: 'Missing face descriptor or location data' });
    }

    // 1. Check Window
    const now = new Date();
    const currentHour = now.getHours();
    
    if (currentHour < 10 || currentHour >= 17) {
      return res.status(403).json({ 
        message: 'Attendance system is only active between 10:00 AM and 05:00 PM' 
      });
    }

    // 2. Face & GPS (Same as entry)
    const userFace = await UserFace.findOne({ user: userId });
    if (!userFace) return res.status(404).json({ message: 'Face not registered' });

    const storedDescriptors = decryptDescriptors(userFace.encryptedDescriptors);
    const isMatch = storedDescriptors.some(stored => {
       const v1 = Array.from(stored);
       const v2 = Array.from(descriptor);
       const dist = Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
       return dist < 0.5;
    });

    if (!isMatch) return res.status(401).json({ message: 'Face verification failed' });

    const gpsConfig = await GPSConfig.findOne({ isActive: true });
    if (gpsConfig) {
      const distance = getDistance(location.latitude, location.longitude, gpsConfig.center.lat, gpsConfig.center.lng);
      if (distance > gpsConfig.radius) {
         return res.status(401).json({ message: `Outside campus perimeter (${Math.round(distance)}m away)` });
      }
    }

    // 3. Record Exit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await DailyAttendance.findOne({ student: userId, date: today });

    if (!attendance || !attendance.entry || !attendance.entry.time) {
      return res.status(400).json({ message: 'You must mark Entry before marking Exit' });
    }

    if (attendance.exit && attendance.exit.time) {
      return res.status(400).json({ message: 'Exit already marked for today' });
    }

    attendance.exit = {
      time: new Date(),
      location: { lat: location.latitude, lng: location.longitude },
      faceVerified: true
    };
    attendance.status = 'present'; // Both entry and exit done

    await attendance.save();

    res.status(200).json({ message: 'Daily Exit marked successfully', attendance });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current student's daily status
// @route   GET /api/attendance/daily/status
export const getDailyStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await DailyAttendance.findOne({ 
      student: req.user._id, 
      date: today 
    });

    const gpsConfig = await GPSConfig.findOne({ isActive: true });

    res.json({ attendance, gpsConfig });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Update GPS Configuration
// @route   POST /api/attendance/daily/gps-config
export const updateGPSConfig = async (req, res) => {
  try {
    const { lat, lng, radius, label } = req.body;

    let config = await GPSConfig.findOne({ isActive: true });
    if (config) {
      config.center = { lat, lng };
      config.radius = radius;
      config.label = label || config.label;
      config.updatedBy = req.user._id;
    } else {
      config = new GPSConfig({
        center: { lat, lng },
        radius,
        label,
        updatedBy: req.user._id
      });
    }

    await config.save();
    res.json({ message: 'GPS Configuration updated', config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get students monthly daily attendance (for Teachers)
export const getMonthlyDailyAttendance = async (req, res) => {
  try {
    const { studentId, month, year } = req.query;
    
    const targetMonth = Number(month) || new Date().getMonth() + 1;
    const targetYear = Number(year) || new Date().getFullYear();

    const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const end = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const records = await DailyAttendance.find({
      student: studentId,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bulk monthly daily attendance for a list of students
export const getBulkMonthlyDailyAttendance = async (req, res) => {
  try {
    const { studentIds, month, year } = req.query;
    if (!studentIds) return res.status(400).json({ message: 'studentIds required' });
    
    const ids = studentIds.split(',');
    const targetMonth = Number(month) || new Date().getMonth() + 1;
    const targetYear = Number(year) || new Date().getFullYear();

    const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const end = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const records = await DailyAttendance.find({
      student: { $in: ids },
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
