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
    if (departmentId) query.department = departmentId;
    if (semester && semester !== 'All') {
      const semNumber = parseInt(semester.replace('Sem-', ''));
      if (!isNaN(semNumber)) query.semester = semNumber;
    }

    let courses = await Course.find(query).populate('department', 'name code').populate('facultyAssigned', 'name profilePic');
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
    const course = await Course.findOne({ code }).populate('department', 'name code').populate('facultyAssigned', 'name profilePic');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
};

export const updateCourseSchedule = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const { schedule, timetableImageUrl } = req.body;
    const course = await Course.findOneAndUpdate({ code }, { ...(schedule && { schedule }), ...(timetableImageUrl && { timetableImageUrl }) }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Error updating schedule', error: error.message });
  }
};

export const uploadTimetableImage = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const course = await Course.findOneAndUpdate({ code }, { timetableImageUrl: req.file.path }, { new: true });
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

    // 1. Get all items to calc content progress and reward XP
    const courseResources = await Resource.find({ extraCourseId: code });
    const courseAssignments = await Assignment.find({ $or: [{ extraCourseId: code }, { course: course._id }] });
    const totalItems = courseResources.length + courseAssignments.length;

    // 2. Find students (Enforced Alpha-Bravo Ranking)
    const { semester, section } = req.query;
    const studentFilter = {
      role: 'student',
      semester: parseInt(semester) || course.semester,
      $or: [
        { department: course.department.name }, 
        { department: course.department.code },
        { department: { $regex: new RegExp(`^${course.department.code}$|^${course.department.name}$`, 'i') } }
      ]
    };

    if (section && section !== 'all') {
      studentFilter.section = section;
    }

    const students = await User.find(studentFilter).select('name email profilePic enrollmentNumber rollNumber section');

    const activeStudents = students.filter(s => !course.excludedStudents?.some(excludedId => excludedId.equals(s._id)));

    // 3. Attach progress
    const studentData = await Promise.all(activeStudents.map(async (student) => {
      const progress = await Progress.findOne({ user: student._id, course: course._id });
      const completedResourceIds = progress ? progress.completedItems.map(i => i.itemId.toString()) : [];
      const resourceXP = courseResources.reduce((acc, res) => completedResourceIds.includes(res._id.toString()) ? acc + (res.points || 15) : acc, 0);
      const studentSubmissions = await Submission.find({ student: student._id, assignment: { $in: courseAssignments.map(a => a._id) }, status: { $in: ['submitted', 'graded', 'late'] } });
      const totalXP = resourceXP + studentSubmissions.reduce((acc, sub) => acc + (sub.marksObtained || sub.automatedScore || 0), 0);
      const percentage = totalItems > 0 ? Math.round(((completedResourceIds.length + studentSubmissions.length) / totalItems) * 100) : 0;
      return { 
        _id: student._id, 
        name: student.name, 
        profilePic: student.profilePic, 
        rollNumber: student.rollNumber, 
        section: student.section,
        progress: percentage, 
        xp: totalXP, 
        rank: 0 
      };
    }));

    res.json(studentData.sort((a, b) => b.xp - a.xp).map((s, idx) => ({ ...s, rank: idx + 1 })));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

export const removeStudentFromCourse = async (req, res) => {
  try {
    const { code, studentId } = req.params;
    const course = await Course.findOneAndUpdate({ code: code.toUpperCase() }, { $addToSet: { excludedStudents: studentId } }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Student removed', excludedStudents: course.excludedStudents });
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
    } catch (e) { res.status(500).json({ message: e.message }); }
};

export const updateCourseDeadline = async (req, res) => {
  try {
    const { code } = req.params;
    const { marksDeadline } = req.body;
    const course = await Course.findOne({ code: code.toUpperCase() });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.marksDeadline = marksDeadline;
    await course.save();
    res.json({ message: 'Locking deadline synchronized.', marksDeadline: course.marksDeadline });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const incrementCourseViews = async (req, res) => {
  try {
    const { code } = req.params;
    const course = await Course.findOneAndUpdate({ code: code.toUpperCase() }, { $inc: { views: 1 } }, { new: true });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ views: course.views });
  } catch (error) { res.status(500).json({ message: 'Error incrementing views', error: error.message }); }
};
