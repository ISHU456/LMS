import CourseAccess from '../models/CourseAccess.js';
import Course from '../models/Course.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

// @desc    Update student course access state (Manual Override)
// @route   PUT /api/course-access/update
// @access  Teacher/Admin
export const updateAccessState = async (req, res) => {
  try {
    const { courseId, studentId, state, reason } = req.body;
    const adminId = req.user._id;

    if (!courseId || !studentId || !state) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const access = await CourseAccess.findOneAndUpdate(
      { course: courseId, student: studentId },
      { 
        $set: { 
          accessState: state, 
          reason: reason || 'Manual update',
          updatedBy: adminId,
          autoRestricted: false // Manual override clears auto flag
        },
        $push: {
          restrictionHistory: {
            state,
            reason: reason || 'Manual update',
            updatedBy: adminId,
            date: new Date()
          }
        }
      },
      { upsert: true, new: true }
    );

    // Sync with Course.excludedStudents for backward compatibility if BLOCKED
    if (state === 'BLOCKED') {
      await Course.findByIdAndUpdate(courseId, { $addToSet: { excludedStudents: studentId } });
    } else {
      await Course.findByIdAndUpdate(courseId, { $pull: { excludedStudents: studentId } });
    }

    // Broadcast notification (Simple event for now)
    if (req.io) {
      req.io.emit('access-update', { 
        studentId, 
        courseId, 
        state, 
        message: `Your access to the course has been updated to ${state}.` 
      });
    }

    res.status(200).json({ message: 'Access state updated successfully', access });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all students access data for a course
// @route   GET /api/course-access/course/:courseId
// @access  Teacher
export const getCourseAccessData = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Get all students for this course (same logic as courseController.getCourseStudents)
    const students = await User.find({
      role: 'student',
      semester: course.semester
    }).select('name email rollNumber profilePic enrollmentNumber');

    const accessData = await Promise.all(students.map(async (student) => {
      let access = await CourseAccess.findOne({ course: courseId, student: student._id })
        .populate('updatedBy', 'name');
      
      if (!access) {
        // Create default if not exists
        access = new CourseAccess({
          course: courseId,
          student: student._id,
          accessState: 'ACTIVE',
          attendancePercent: 100
        });
        // We don't necessarily save it yet to keep DB clean, but return it
      }

      return {
        student: {
          _id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          enrollmentNumber: student.enrollmentNumber,
          profilePic: student.profilePic,
          email: student.email
        },
        accessState: access.accessState,
        attendancePercent: access.attendancePercent,
        reason: access.reason,
        lastUpdated: access.updatedAt,
        updatedBy: access.updatedBy?.name || 'System',
        autoRestricted: access.autoRestricted
      };
    }));

    res.status(200).json(accessData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get access history for a student
// @route   GET /api/course-access/history/:courseId/:studentId
// @access  Teacher/Admin/Student
export const getAccessHistory = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const access = await CourseAccess.findOne({ course: courseId, student: studentId })
      .populate('restrictionHistory.updatedBy', 'name');
    
    if (!access) {
      return res.status(200).json([]);
    }

    res.status(200).json(access.restrictionHistory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Internal function to check and auto-restrict (can be called from attendance controller)
export const checkAndAutoRestrict = async (courseId, studentId, percentage) => {
  try {
    if (percentage < 75) {
      const course = await Course.findById(courseId).select('autoRestrictEnabled');
      if (course && !course.autoRestrictEnabled) return; // Skip if restricted system is disabled for this course

      const access = await CourseAccess.findOne({ course: courseId, student: studentId });
      
      // Only auto-restrict if currently ACTIVE and not manually overridden recently?
      // For now, simple: if < 75 and ACTIVE, make it RESTRICTED.
      if (!access || access.accessState === 'ACTIVE') {
        await CourseAccess.findOneAndUpdate(
          { course: courseId, student: studentId },
          { 
            $set: { 
              accessState: 'RESTRICTED', 
              reason: 'Automatic restriction: Attendance below 75%',
              autoRestricted: true,
              attendancePercent: percentage
            },
            $push: {
              restrictionHistory: {
                state: 'RESTRICTED',
                reason: 'Automatic restriction: Attendance below 75%',
                updatedBy: null, // System
                date: new Date()
              }
            }
          },
          { upsert: true }
        );
      }
    }
  } catch (error) {
    console.error('Auto-restriction error:', error);
  }
};
