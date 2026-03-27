import Course from '../models/Course.js';
import Department from '../models/Department.js';
import User from '../models/User.js';
import Progress from '../models/Progress.js';
import Resource from '../models/Resource.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
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
        const userDept = req.user.department?.trim();
        courses = courses.map(c => {
           const isAssigned = c.facultyAssigned?.some(f => 
             (f._id?.equals(req.user._id) || f.equals(req.user._id))
           );
           
           const isDeptMatch = c.department?.name === userDept || c.department?.code === userDept;
           const isSemMatch = (req.user.assignedSemesters && req.user.assignedSemesters.length > 0) 
             ? req.user.assignedSemesters.includes(c.semester) 
             : false;
           
           const authorized = isAssigned || (isDeptMatch && isSemMatch);
           return { ...c.toObject(), isAuthorized: authorized }; 
        });
        
        // Show all courses in teacher's department, but tag authorization
        courses = courses.filter(c => 
          c.department?.name === userDept || c.department?.code === userDept || c.isAuthorized
        );
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
    const course = await Course.findOne({ code }).populate('department').populate('facultyAssigned');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Authorization Check for Teachers
    if (req.user.role === 'teacher') {
       const userDept = req.user.department?.trim();
       const isAssigned = course.facultyAssigned?.some(f => 
         (f._id?.equals(req.user._id) || f.equals(req.user._id))
       );
       const isDeptMatch = course.department?.name === userDept || course.department?.code === userDept;
       const isSemMatch = (req.user.assignedSemesters && req.user.assignedSemesters.length > 0) 
         ? req.user.assignedSemesters.includes(course.semester) 
         : false;
       
       if (!isAssigned && !(isDeptMatch && isSemMatch)) {
         return res.status(403).json({ message: 'Unauthorized access to course students' });
       }
    }

    // 1. Get all items to calc content progress and reward XP
    const courseResources = await Resource.find({ extraCourseId: code });
    const courseAssignments = await Assignment.find({ 
      $or: [{ extraCourseId: code }, { course: course._id }] 
    });
    
    const totalItems = courseResources.length + courseAssignments.length;

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
      // Progress & Resource XP
      const progress = await Progress.findOne({ user: student._id, course: course._id });
      const completedResourceIds = progress ? progress.completedItems.map(i => i.itemId.toString()) : [];
      
      // Calculate resource XP from base points
      const resourceXP = courseResources.reduce((acc, res) => {
        if (completedResourceIds.includes(res._id.toString())) {
          return acc + (res.points || 15);
        }
        return acc;
      }, 0);

      // 4. Calculate Assignment XP from Submissions
      const assignmentIds = courseAssignments.map(a => a._id);

      const studentSubmissions = await Submission.find({
        student: student._id,
        assignment: { $in: assignmentIds },
        status: { $in: ['submitted', 'graded', 'late'] }
      });

      const submissionXP = studentSubmissions.reduce((acc, sub) => {
        // Use marksObtained if graded, else automatedScore for quizes
        return acc + (sub.marksObtained || sub.automatedScore || 0);
      }, 0);

      const totalXP = resourceXP + submissionXP;

      // ACTUAL PROGRESS CALCULATION: Resources from Progress model + Assignments from Submission model
      const actualCompletedCount = completedResourceIds.length + studentSubmissions.length;
      const percentage = totalItems > 0 ? Math.round((actualCompletedCount / totalItems) * 100) : 0;

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
        xp: totalXP,
        badge,
        rank: 0 
      };
    }));

    // Sort students by XP (DESC) for Leaderboard
    const sortedByXP = studentData.sort((a, b) => b.xp - a.xp);
    // Sort by name if XP is tied? (Optional but good)
    const ranked = sortedByXP.map((s, idx) => ({ ...s, rank: idx + 1 }));

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

export const toggleAutoRestrict = async (req, res) => {
    try {
        const { code } = req.params;
        const course = await Course.findOne({ code });
        if (!course) return res.status(404).json({ message: 'Course node not identified.' });

        course.autoRestrictEnabled = !course.autoRestrictEnabled;
        await course.save();

        res.json({ message: `Auto-Restriction ${course.autoRestrictEnabled ? 'Activated' : 'Suspended'}.`, enabled: course.autoRestrictEnabled });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateCourseDeadline = async (req, res) => {
  try {
    const { code } = req.params;
    const { marksDeadline } = req.body;

    const course = await Course.findOne({ code: code.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    course.marksDeadline = marksDeadline;
    await course.save();

    res.json({ message: 'Result locking deadline synchronized.', marksDeadline: course.marksDeadline });
  } catch (e) {
    console.error('CRITICAL: Course Deadline Update Failed =>', e);
    res.status(500).json({ message: e.message });
  }
};
