import Result from '../models/Result.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import FinalResult from '../models/FinalResult.js';
import Enrollment from '../models/Enrollment.js';

// @desc    Get students for mark entry (Teacher)
// @route   GET /api/results/students
// @access  Teacher/Admin/HOD
export const getStudentsForEntry = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.query;
    if (!courseId) return res.status(400).json({ message: 'Course ID is required' });
    const teacher = await User.findById(req.user._id);
    const semStr = (semester && semester !== 'undefined') ? semester : null;

    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }

    const course = await Course.findById(courseId).populate('department').populate('facultyAssigned');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const semNum = parseInt(semStr || course.semester);
    if (isNaN(semNum)) return res.status(400).json({ message: 'Invalid Semester value' });
    
    // 2. Security Check: Ensure teacher is assigned to this course OR semester
    const isAssignedToCourse = course.facultyAssigned?.some(f => f._id.toString() === req.user._id.toString());
    const isAssignedToSemester = teacher.assignedSemesters?.includes(semNum);
    const isDeptMatch = course.department?.name === teacher.department || course.department?.code === teacher.department;

    if (req.user.role === 'teacher') {
      if (!isAssignedToCourse && !(isDeptMatch && isAssignedToSemester)) {
        return res.status(403).json({ message: 'Access Denied: You are not assigned to this course or semester.' });
      }
    }

    const targetYear = academicYear || '2023-24';

    // Try finding via explicit Enrollment first
    const enrollments = await Enrollment.find({
      course: courseId,
      semester: semNum,
      academicYear: targetYear
    }).populate('student', 'name rollNumber enrollmentNumber');

    let students = [];

    if (enrollments && enrollments.length > 0) {
      students = enrollments.map(e => e.student);
    } else {
      // Fallback: Automated matching via semester & department
      students = await User.find({
        role: 'student',
        semester: semNum,
        $or: [
          { department: course.department.name },
          { department: course.department.code },
          { department: { $regex: new RegExp(`^${course.department.code}$|^${course.department.name}$`, 'i') } }
        ]
      }).select('name rollNumber enrollmentNumber')
      .sort({ rollNumber: 1 });
    }

    // Fetch existing results for these students in this course/semester/year
    const existingResults = await Result.find({
      course: courseId,
      semester: semNum,
      academicYear: academicYear || '2023-24'
    });

    // Map students with existing results
    const studentsWithMarks = students.map(student => {
      const result = existingResults.find(r => r.student.toString() === student._id.toString());
      return {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        enrollmentNumber: student.enrollmentNumber,
        marks: result ? result.marks : { mst1: 0, mst2: 0, mst3: 0, endSem: 0, internalPractical: 0, externalPractical: 0 },
        totalMarks: result ? result.totalMarks : 0,
        grade: result ? result.grade : null,
        status: result ? result.status : 'not_started',
        isLocked: result ? result.isLocked : false,
        resultId: result ? result._id : null
      };
    });

    res.json(studentsWithMarks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get complete semester summary for Admin/HOD
// @route   GET /api/results/semester-summary
// @access  Admin/HOD
export const getSemesterSummary = async (req, res) => {
  try {
    const { semester, academicYear, department } = req.query;
    const semNum = parseInt(semester);
    
    if (!semNum) return res.status(400).json({ message: 'Semester is required' });

    // 1. Get all courses for this semester/dept
    const courseQuery = { semester: semNum };
    if (department && department !== 'All') courseQuery['department.name'] = department;
    
    const courses = await Course.find(courseQuery).select('name code credits type');
    const courseIds = courses.map(c => c._id);

    // 2. Get all students for this semester/dept
    const studentQuery = { role: 'student', semester: semNum };
    if (department && department !== 'All') studentQuery.department = department;
    const students = await User.find(studentQuery).select('name rollNumber enrollmentNumber department');

    // 3. Get all results for these courses and semester
    const results = await Result.find({
      semester: semNum,
      academicYear: academicYear || '2023-24',
      course: { $in: courseIds }
    });

    // 4. Construct matrix
    const matrix = {};
    students.forEach(student => {
      matrix[student._id] = {};
      courseIds.forEach(cId => {
        matrix[student._id][cId] = null;
      });
    });

    results.forEach(r => {
      if (matrix[r.student]) {
        matrix[r.student][r.course] = {
          totalMarks: r.totalMarks,
          grade: r.grade,
          status: r.status,
          isLocked: r.isLocked
        };
      }
    });

    res.json({ students, courses, matrix });
  } catch (error) {
    res.status(500).json({ message: 'Error generating summary', error: error.message });
  }
};

// @desc    Save/Update marks as draft (Teacher)
// @route   POST /api/results/save
// @access  Teacher
export const saveMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear, results } = req.body;
    // results is an array of { studentId, marks }

    const semNum = parseInt(semester);
    const savedResults = await Promise.all(results.map(async (item) => {
      let result = await Result.findOne({
        student: item.studentId, 
        course: courseId, 
        semester: semNum, 
        academicYear
      });

      if (!result) {
        const course = await Course.findById(courseId);
        result = new Result({
          student: item.studentId,
          course: courseId,
          semester: semNum,
          academicYear,
          courseType: course.type,
          createdBy: req.user._id
        });
      }

      if (result.isLocked) return result;

      // Deep merge marks to avoid wiping out fields not sent in request
      // (Though frontend sends full currently, this is more robust)
      if (item.marks) {
        Object.keys(item.marks).forEach(field => {
          if (item.marks[field] !== undefined && item.marks[field] !== null) {
            result.marks[field] = item.marks[field];
          }
        });
        // Handle absentFields specifically if provided
        if (item.marks.absentFields) {
          result.marks.absentFields = item.marks.absentFields;
        }
      }

      if (item.grade) result.grade = item.grade;
      result.status = 'draft';
      
      return await result.save();
    }));

    res.json({ message: 'Marks saved as draft', results: savedResults });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Submit marks for approval (Teacher)
// @route   POST /api/results/submit
// @access  Teacher
export const submitMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.body;
    const semNum = parseInt(semester);

    const updated = await Result.updateMany(
      { course: courseId, semester: semNum, academicYear, createdBy: req.user._id, status: { $ne: 'approved' } },
      { status: 'submitted', submittedAt: new Date() }
    );

    // Notify Admin/HOD
    const course = await Course.findById(courseId);
    const hods = await User.find({ role: 'hod', department: course.department });
    
    await Promise.all(hods.map(async (hod) => {
      await Notification.create({
        recipient: hod._id,
        sender: req.user._id,
        title: 'New Result Submission',
        message: `${req.user.name} has submitted marks for ${course.name} (Sem ${semester})`,
        link: `/results/verify?courseId=${courseId}&semester=${semester}`
      });
    }));

    res.json({ message: 'Marks submitted for approval', count: updated.nModified });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Approve marks (Admin/HOD)
// @route   POST /api/results/approve
// @access  Admin/HOD
export const approveMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.body;

    await Result.updateMany(
      { course: courseId, semester, academicYear, status: 'submitted' },
      { 
        status: 'approved', 
        approvedBy: req.user._id,
        approvedAt: new Date() 
      }
    );

    res.json({ message: 'Marks approved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Reject marks (Admin/HOD)
// @route   POST /api/results/reject
// @access  Admin/HOD
export const rejectMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear, reason } = req.body;

    await Result.updateMany(
      { course: courseId, semester, academicYear, status: 'submitted' },
      { 
        status: 'rejected', 
        rejectionReason: reason || 'Incomplete or inaccurate data',
        approvedBy: req.user._id,
      }
    );

    res.json({ message: 'Marks rejected. Teacher has been notified.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Publish marks to students
// @route   POST /api/results/publish
// @access  Admin/HOD
export const publishMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.body;

    await Result.updateMany(
      { course: courseId, semester, academicYear, status: 'approved' },
      { status: 'published' }
    );

    res.json({ message: 'Marks published to students' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get results for a student
// @route   GET /api/results/my-results
// @access  Student
export const getMyResults = async (req, res) => {
  try {
    // Check if FinalResult exists for student
    const finalResult = await FinalResult.findOne({ 
      student: req.user._id, 
      isPublished: true 
    });

    if (!finalResult) {
       return res.json({ results: [], sgpa: 0, totalCredits: 0, message: "Results not yet generated." });
    }

    const results = await Result.find({ 
      student: req.user._id, 
      status: 'published' 
    }).populate('course', 'name code credits type');

    res.json({ 
      results, 
      sgpa: finalResult.sgpa, 
      totalCredits: finalResult.totalMarksMax / 100 * 4, // Mock calc
      isFinal: true 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get result analytics for HOD/Admin
// @route   GET /api/results/analytics
// @access  HOD/Admin
export const getAnalytics = async (req, res) => {
  try {
    const { courseId, semester } = req.query;
    const filter = { status: 'published' };
    if (courseId) filter.course = courseId;
    if (semester) filter.semester = semester;

    const results = await Result.find(filter);

    const gradeDistribution = {
      'O': 0, 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'F': 0
    };

    let totalMarksSum = 0;
    results.forEach(r => {
      gradeDistribution[r.grade]++;
      totalMarksSum += r.totalMarks;
    });

    const averageMarks = results.length > 0 ? (totalMarksSum / results.length).toFixed(2) : 0;
    const passPercentage = results.length > 0 ? (((results.length - gradeDistribution['F']) / results.length) * 100).toFixed(2) : 0;

    res.json({
      totalStudents: results.length,
      gradeDistribution,
      averageMarks,
      passPercentage
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
// @desc    Generate final consolidated result (Admin/HOD)
// @route   POST /api/results/generate-final
// @access  Admin/HOD
export const generateFinalResult = async (req, res) => {
  try {
    const { semester, academicYear, department } = req.body;
    const semNum = parseInt(semester);

    // 1. Get all students of this semester/dept
    const studentQuery = { role: 'student', semester: semNum };
    if (department && department !== 'All') studentQuery.department = department;
    const students = await User.find(studentQuery);
    
    // 2. For each student, check if all their courses are approved
    const generatedResults = [];

    for (const student of students) {
        // Find all results for this student in this semester
        const individualResults = await Result.find({ 
          student: student._id, 
          semester: parseInt(semester), 
          academicYear 
        });
        
        // Find all courses for this semester/dept
        const courseQuery = { semester: parseInt(semester) };
        if (student.department) {
           courseQuery.$or = [
             { department: student.department },
             { 'department.name': student.department },
             { 'department.code': student.department }
           ];
        }
        const courses = await Course.find(courseQuery);

        const allApproved = individualResults.every(r => r.status === 'approved' || r.status === 'published');
        const countMatched = individualResults.length >= courses.length; // Basic check

        if (allApproved && countMatched) {
            let totalObtained = 0;
            let totalMax = 0;
            let weightPoints = 0;
            let totalCredits = 0;

            individualResults.forEach(r => {
                totalObtained += r.totalMarks;
                // Assuming standard max marks for percentage
                // This would be more complex in production
                totalMax += 100; 
                // Dummy SGPA calc logic
                totalCredits += 4; // Mock credits
                weightPoints += (r.gradePoints * 4);
            });

            const percentage = (totalObtained / totalMax) * 100;
            const sgpa = weightPoints / totalCredits;

            const final = await FinalResult.findOneAndUpdate(
                { student: student._id, semester: semNum, academicYear },
                {
                    courseResults: individualResults.map(r => r._id),
                    totalMarksObtained: totalObtained,
                    totalMarksMax: totalMax,
                    percentage: percentage.toFixed(2),
                    sgpa: sgpa.toFixed(2),
                    isPublished: true,
                    generatedBy: req.user._id,
                    department: student.department
                },
                { upsert: true, new: true }
            );

            // Synchronize student profile stats
            await User.findByIdAndUpdate(student._id, {
                cgpa: sgpa.toFixed(2), // Simplification: using current SGPA as latest CGPA
                percentage: percentage.toFixed(2)
            });

            generatedResults.push(final);
        }
    }

    res.json({ message: `Results generated for ${generatedResults.length} students`, count: generatedResults.length });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get final results (Student)
// @route   GET /api/results/final
// @access  Student
export const getFinalResults = async (req, res) => {
    try {
        const final = await FinalResult.findOne({ student: req.user._id, isPublished: true })
            .populate({
                path: 'courseResults',
                populate: { path: 'course', select: 'name code type' }
            });

        if (!final) {
            return res.status(404).json({ message: 'Result not generated yet.' });
        }

        res.json(final);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
// @desc    Lock results permanently
// @route   POST /api/results/lock
// @access  Admin/HOD/Teacher
export const lockResults = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.body;
    const semNum = parseInt(semester);

    await Result.updateMany(
      { course: courseId, semester: semNum, academicYear },
      { isLocked: true }
    );

    res.json({ message: 'Marks have been locked permanently.' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
export const toggleResultLock = async (req, res) => {
  try {
    const { id } = req.params; // Result ID
    const result = await Result.findById(id);
    if (!result) return res.status(404).json({ message: 'Result not found' });

    result.isLocked = !result.isLocked;
    await result.save();

    res.json({ message: `Row ${result.isLocked ? 'Locked' : 'Unlocked'}`, isLocked: result.isLocked });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling lock', error: error.message });
  }
};
