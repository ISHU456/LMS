import Course from '../models/Course.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Resource from '../models/Resource.js';
import Assignment from '../models/Assignment.js';
import CourseAccess from '../models/CourseAccess.js';
import mongoose from 'mongoose';

export const getCourses = async (req, res) => {
  try {
    const { departmentId, semester } = req.query;
    let query = {};

    if (departmentId) {
      query.department = departmentId;
    }

    if (semester && semester !== 'All') {
      const semNumber = parseInt(semester.replace('Sem-', ''));
      if (!isNaN(semNumber)) {
        query.semester = semNumber;
      }
    }

    let courses = await Course.find(query)
      .populate('department', 'name code')
      .populate('facultyAssigned', 'name profilePic');

    // Filter by excludedStudents if student is logged in
    // OR filter by assignedSemesters if teacher is logged in
    if (req.user) {
      if (req.user.role === 'student') {
        const studentSem = req.user.semester;
        courses = courses.filter(c => c.semester === studentSem && !c.excludedStudents?.includes(req.user._id));
      } else if (req.user.role === 'teacher') {
        courses = courses.filter(c => {
           const isAssigned = c.facultyAssigned?.some(f => f._id.equals(req.user._id) || f.equals(req.user._id));
           const isDeptMatch = c.department?.name === req.user.department || c.department?.code === req.user.department;
           const isSemAssigned = req.user.assignedSemesters?.length > 0 ? req.user.assignedSemesters.includes(c.semester) : true;
           return isAssigned || (isDeptMatch && isSemAssigned);
        });
      }
    }
      
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const course = new Course(req.body);
    const savedCourse = await course.save();
    res.status(201).json(savedCourse);
  } catch (error) {
    res.status(400).json({ message: 'Error creating course', error: error.message });
  }
};

export const getCourseByCode = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
  
    const course = await Course.findOne({ code })
      .populate('department', 'name code')
      .populate('facultyAssigned', 'name profilePic');
    if (!course) {
      console.log(`[CourseController] Course NOT FOUND: ${code}`);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
};

export const updateCourseSchedule = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    console.log(`[CourseController] Updating schedule for code: ${code}`);
    const { schedule, timetableImageUrl } = req.body;
    const course = await Course.findOneAndUpdate(
      { code },
      { 
        ...(schedule && { schedule }),
        ...(timetableImageUrl && { timetableImageUrl })
      },
      { new: true }
    );
    if (!course) {
      console.log(`[CourseController] Course NOT FOUND for update: ${code}`);
      return res.status(404).json({ message: 'Course not found' });
    }
    console.log(`[CourseController] Schedule updated successfully for: ${code}`);
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error updating schedule', error: error.message });
  }
};

export const uploadTimetableImage = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    const course = await Course.findOneAndUpdate(
      { code },
      { timetableImageUrl: req.file.path },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ timetableImageUrl: course.timetableImageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading timetable image', error: error.message });
  }
};
export const getCourseStudents = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const course = await Course.findOne({ code }).populate('department');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // 1. Get total items to calc progress
    const totalResources = await Resource.countDocuments({ extraCourseId: code });
    const totalAssignments = await Assignment.countDocuments({ extraCourseId: code });
    const totalItems = totalResources + totalAssignments;

    // 2. Find students who belong to this course (Matching department)
    const students = await User.find({
      role: 'student',
      semester: parseInt(req.query.semester) || course.semester,
      $or: [
        { department: course.department.name },
        { department: course.department.code }
      ]
    }).select('name email profilePic enrollmentNumber rollNumber');

    // Filter out manually excluded students (backward compatibility)
    const activeStudents = students.filter(s => 
      !course.excludedStudents?.some(excludedId => excludedId.equals(s._id))
    );

    // 3. Attach progress data for each student
    const studentData = await Promise.all(activeStudents.map(async (student) => {
      const progress = await Progress.findOne({ user: student._id, course: course._id });
      const completedCount = progress ? progress.completedItems.length : 0;
      const percentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
      
      // Calculate XP (Dummy logic but more realistic than static)
      // Base XP 10 per item + 50 bonus if completed
      const xp = completedCount * 10 + (percentage === 100 ? 500 : 0);

      // Determine Badge
      let badge = "Novice";
      if (percentage >= 100) badge = "Quantum Scholar";
      else if (percentage >= 80) badge = "Neural Navigator";
      else if (percentage >= 50) badge = "Core Guardian";

      return {
        _id: student._id,
        name: student.name,
        profilePic: student.profilePic,
        rollNumber: student.rollNumber,
        progress: percentage,
        xp,
        badge,
        rank: 0 // Will rank after fetch
      };
    }));

    // Rank by XP then Progress
    const sorted = studentData.sort((a, b) => (b.xp + b.progress) - (a.xp + a.progress));
    const ranked = sorted.map((s, idx) => ({ ...s, rank: idx + 1 }));

    res.json(ranked);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

export const removeStudentFromCourse = async (req, res) => {
  try {
    const { code, studentId } = req.params;
    const course = await Course.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $addToSet: { excludedStudents: studentId } },
      { new: true }
    );
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Student removed from course', excludedStudents: course.excludedStudents });
  } catch (error) {
    res.status(500).json({ message: 'Error removing student', error: error.message });
  }
};
