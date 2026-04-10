import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import CourseAccess from '../models/CourseAccess.js';
import Department from '../models/Department.js';
import { checkAndAutoRestrict } from './courseAccessController.js';
import mongoose from 'mongoose';

// @desc    Mark attendance for multiple students
// @route   POST /api/attendance/bulk-mark
// @access  Teacher
export const markBulkAttendance = async (req, res) => {
  try {
    const { courseId, date, semester, attendanceData } = req.body;
    const teacherId = req.user._id;

    if (!courseId || !date || !semester || !attendanceData) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const attendanceDate = new Date(date);
    const entryWindowExpiresAt = new Date(attendanceDate);
    entryWindowExpiresAt.setUTCDate(entryWindowExpiresAt.getUTCDate() + 7);

    // Prepare operations for bulkWrite
    const operations = attendanceData.map(item => ({
      updateOne: {
        filter: { course: courseId, student: item.studentId, date: attendanceDate },
        update: {
          $set: {
            status: item.status,
            semester: semester,
            markedBy: teacherId,
            remarks: item.remarks || '',
            entryWindowExpiresAt: entryWindowExpiresAt
          }
        },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(operations);

    // After marking attendance, update course access percentages
    await updateAttendancePercentages(courseId);

    res.status(200).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    console.error('Error marking bulk attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Helper: Update attendance percentages for all students in a course
const updateAttendancePercentages = async (courseId) => {
  try {
    const students = await Attendance.distinct('student', { course: courseId });
    
    for (const studentId of students) {
      const records = await Attendance.find({ course: courseId, student: studentId });
      const total = records.length;
      const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const percentage = total > 0 ? (presentCount / total) * 100 : 100;

      await CourseAccess.findOneAndUpdate(
        { course: courseId, student: studentId },
        { $set: { attendancePercent: percentage } },
        { upsert: true, new: true }
      );

      // Auto-restriction logic
      await checkAndAutoRestrict(courseId, studentId, percentage);
    }
  } catch (error) {
    console.error('Error updating percentages:', error);
  }
};

// @desc    Get attendance for a course (Teacher Dashboard)
// @route   GET /api/attendance/course/:courseId
// @access  Teacher
export const getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { startDate, endDate, semester, section } = req.query;

    const query = { course: courseId };
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const start = new Date(Date.UTC(s.getFullYear(), s.getMonth(), s.getDate()));
      const end = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate()));
      end.setUTCHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    if (semester) {
      query.semester = semester;
    }

    const attendanceRecords = await Attendance.find(query)
      .populate({
        path: 'student',
        match: section && section !== 'all' ? { section: section } : {},
        select: 'name rollNumber profilePic enrollmentNumber section'
      })
      .sort({ date: -1 });

    // Filter out records where student doesn't match the section filter
    const filteredRecords = attendanceRecords.filter(r => r.student !== null);

    // NEW: If we are looking at a specific date, also fetch DailyAttendance for these students
    let dailyRecords = [];
    if (startDate === endDate && startDate) {
      const DailyAttendance = (await import('../models/DailyAttendance.js')).default;
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const dayStart = s;
      const dayEnd = new Date(s);
      dayEnd.setHours(23, 59, 59, 999);
      
      const studentFilter = { role: 'student' };
      if (section && section !== 'all') studentFilter.section = section;
      const studentIds = await User.find(studentFilter).distinct('_id');

      dailyRecords = await DailyAttendance.find({
        student: { $in: studentIds },
        date: { $gte: dayStart, $lte: dayEnd }
      });
    }

    res.status(200).json({ attendanceRecords: filteredRecords, dailyRecords });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student's subject-wise attendance
// @route   GET /api/attendance/student/:studentId
// @access  Student/Teacher/Admin
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    const query = { student: studentId };
    if (courseId) query.course = courseId;

    const records = await Attendance.find(query)
      .populate('course', 'name code')
      .sort({ date: -1 });

    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update single attendance record (within 7-day window)
// @route   PUT /api/attendance/:id
// @access  Teacher
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check entry window
    if (new Date() > attendance.entryWindowExpiresAt) {
      return res.status(403).json({ message: 'Attendance editing window has expired (7 days)' });
    }

    attendance.status = status || attendance.status;
    attendance.remarks = remarks || attendance.remarks;
    attendance.markedBy = req.user._id;

    await attendance.save();
    
    // Recalculate percentage for this student in this course
    await updateAttendancePercentages(attendance.course);

    res.status(200).json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get Teacher dashboard stats
// @route   GET /api/attendance/stats/teacher
// @access  Teacher
export const getTeacherStats = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { assignedSemesters, department: teacherDept } = req.user;
    
    const query = { 
      $or: [
        { facultyAssigned: teacherId }
      ]
    };

    if (assignedSemesters && assignedSemesters.length > 0) {
        // Find the department ID for the teacher's department name/code
        const dept = await Department.findOne({ 
            $or: [{ name: teacherDept }, { code: teacherDept }] 
        });
        
        if (dept) {
            query.$or.push({ 
                semester: { $in: assignedSemesters }, 
                department: dept._id 
            });
        }
    }

    const courses = await Course.find(query);
    const courseIds = courses.map(c => c._id);

    const stats = await Promise.all(courses.map(async (course) => {
      const accessData = await CourseAccess.find({ course: course._id });
      const studentCount = accessData.length;
      
      const lowAttendanceCount = accessData.filter(a => a.attendancePercent < 75).length;
      const restrictedOnlyCount = accessData.filter(a => a.accessState === 'RESTRICTED').length;
      const blockedCount = accessData.filter(a => a.accessState === 'BLOCKED').length;
      const restrictedTotalCount = restrictedOnlyCount + blockedCount;
      
      const avgAttendance = accessData.length > 0 
        ? accessData.reduce((acc, curr) => acc + curr.attendancePercent, 0) / accessData.length 
        : 100;

      return {
        courseId: course._id,
        courseName: course.name,
        courseCode: course.code,
        semester: course.semester,
        studentCount,
        avgAttendance: Math.round(avgAttendance),
        studentsBelow75: lowAttendanceCount,
        activeStudents: studentCount - restrictedTotalCount,
        restrictedStudents: restrictedOnlyCount,
        blockedStudents: blockedCount
      };
    }));

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get full classroom attendance for a semester/department (Student View)
// @route   GET /api/attendance/classroom
// @access  Student/Teacher/Admin
export const getClassroomAttendance = async (req, res) => {
  try {
    // We use the logged-in student's own class context for security, 
    // but allow overrides for Admin/Teachers if needed.
    let { semester, department } = req.user;
    
    if (req.query.semester && req.user.role !== 'student') semester = req.query.semester;
    if (req.query.department && req.user.role !== 'student') department = req.query.department;

    const { month, year } = req.query;
    
    // 1. Find all students in this same class (Enforced Alpha-Bravo Ranking)
    const studentFilter = { 
      role: 'student', 
      semester: Number(semester)
    };

    if (department) {
      studentFilter.$or = [
        { department: department },
        { department: { $regex: new RegExp(`^${department}$`, 'i') } }
      ];
    }

    if (req.query.section && req.query.section !== 'all') {
      studentFilter.section = req.query.section;
    }

    const students = await User.find(studentFilter)
      .select('name enrollmentNumber profilePic section _id')
      .sort({ name: 1 });

    const studentIds = students.map(s => s._id);

    // 2. Define Month range
    const targetMonth = Number(month) || new Date().getMonth() + 1;
    const targetYear = Number(year) || new Date().getFullYear();

    const start = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const end = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    // 3. Fetch all attendance records for these students in this month
    const records = await Attendance.find({
      student: { $in: studentIds },
      date: { $gte: start, $lte: end }
    }).select('student status date').lean();

    res.status(200).json({ students, records, year: targetYear, month: targetMonth });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get face descriptions for all students in a course (for Teacher's Live Scan)
// @route   GET /api/attendance/course/:courseId/face-data
// @access  Teacher
export const getClassFaceData = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { semester } = req.query;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Find all students (Enforced Alpha-Bravo Ranking)
    const studentFilter = { 
      role: 'student', 
      semester: Number(semester || course.semester)
    };

    if (course.department) {
      studentFilter.$or = [
        { department: course.department.name }, 
        { department: course.department.code },
        { department: { $regex: new RegExp(`^${course.department.code}$|^${course.department.name}$`, 'i') } }
      ];
    }

    if (req.query.section && req.query.section !== 'all') {
      studentFilter.section = req.query.section;
    }

    const students = await User.find(studentFilter).select('_id name rollNumber section').sort({ name: 1 });

    const studentIds = students.map(s => s._id);

    // Dynamic import to avoid circular dependencies if any
    const UserFace = (await import('../models/UserFace.js')).default;
    const { decryptDescriptors } = await import('../utils/crypto.js');

    const faceDatas = await UserFace.find({ user: { $in: studentIds } });
    
    const results = students.map(student => {
      const faceMatch = faceDatas.find(f => f.user.toString() === student._id.toString());
      if (!faceMatch) return null;
      
      try {
        const descriptors = decryptDescriptors(faceMatch.encryptedDescriptors);
        return {
          studentId: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          descriptors
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
