import Result from '../models/Result.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Notification from '../models/Notification.js';
import FinalResult from '../models/FinalResult.js';
import Enrollment from '../models/Enrollment.js';
import ResultAudit from '../models/ResultAudit.js';
import Department from '../models/Department.js';

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

    const targetYear = academicYear || '2025-26';

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
      academicYear: academicYear || '2025-26'
    }).populate('createdBy', 'name');

    // Map students with existing results
    const studentsWithMarks = students.map(student => {
      const result = existingResults.find(r => r.student.toString() === student._id.toString());
      return {
        _id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        enrollmentNumber: student.enrollmentNumber,
        marks: result ? result.marks : { mst1: '', mst2: '', mst3: '', endSem: '', internalPractical: '', externalPractical: '', vivaScore: '' },
        totalMarks: result ? result.totalMarks : 0,
        grade: result ? result.grade : null,
        status: result ? result.status : 'not_started',
        isLocked: result ? result.isLocked : false,
        resultId: result ? result._id : null,
        uploaderName: result?.createdBy?.name || 'N/A'
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
    
    if (department && department !== 'All') {
      const dept = await Department.findOne({ 
        $or: [
          { name: department },
          { code: department },
          { name: { $regex: new RegExp(`^${department}$`, 'i') } },
          { code: { $regex: new RegExp(`^${department}$`, 'i') } }
        ]
      });
      if (dept) {
        courseQuery.department = dept._id;
      } else {
        // If department name not found in Department collection, try filtering by name/code (legacy)
        console.warn(`Department ${department} not found in collection, skipping course filter.`);
      }
    }
    
    const courses = await Course.find(courseQuery).select('name code credits type department');
    const courseIds = courses.map(c => c._id.toString());

    // 2. Get all students for this semester/dept
    const studentQuery = { role: 'student', semester: semNum };
    
    if (department && department !== 'All') {
      const dept = await Department.findOne({ 
        $or: [
          { name: department },
          { code: department },
          { name: { $regex: new RegExp(`^${department}$`, 'i') } },
          { code: { $regex: new RegExp(`^${department}$`, 'i') } }
        ]
      });

      if (dept) {
        studentQuery.$or = [
          { department: dept.name },
          { department: dept.code },
          { department: { $regex: new RegExp(`^${dept.name}$`, 'i') } },
          { department: { $regex: new RegExp(`^${dept.code}$`, 'i') } }
        ];
      } else {
        // Fallback for direct string match if department not in collection
        studentQuery.$or = [
          { department: department },
          { department: { $regex: new RegExp(`^${department}$`, 'i') } }
        ];
      }
    }
    const students = await User.find(studentQuery).select('name rollNumber enrollmentNumber department');

    // 3. Get all results for these courses and semester
    const results = await Result.find({
      semester: semNum,
      academicYear: academicYear || '2025-26',
      course: { $in: courses.map(c => c._id) }
    });

    // 4. Construct matrix
    const matrix = {};
    students.forEach(student => {
      const sId = student._id.toString();
      matrix[sId] = {};
      courseIds.forEach(cId => {
        matrix[sId][cId] = null;
      });
    });

    results.forEach(r => {
      const sId = r.student.toString();
      const cId = r.course.toString();
      if (matrix[sId]) {
        matrix[sId][cId] = {
          totalMarks: r.totalMarks,
          grade: r.grade,
          status: r.status,
          isLocked: r.isLocked,
          _id: r._id
        };
      }
    });

    // 5. Get final results (SGPA/CGPA)
    const finalResults = await FinalResult.find({
      semester: semNum,
      academicYear: academicYear || '2025-26'
    });

    const studentFinals = {};
    finalResults.forEach(fr => {
      studentFinals[fr.student.toString()] = {
        sgpa: fr.sgpa,
        percentage: fr.percentage,
        isPublished: fr.isPublished,
        pdfUrl: fr.pdfUrl
      };
    });

    res.json({ students, courses, matrix, studentFinals });
  } catch (error) {
    console.error('SUMMARY ERROR:', error);
    res.status(500).json({ message: 'Error generating summary', error: error.message });
  }
};

// @desc    Save/Update marks as draft (Teacher)
// @route   POST /api/results/save
// @access  Teacher
export const saveMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear, results } = req.body;
    if (!courseId || !semester || !results) {
      return res.status(400).json({ message: 'Missing required parameters (courseId, semester, results)' });
    }

    const semNum = parseInt(semester);
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const savedResults = await Promise.all(results.map(async (item) => {
      let result = await Result.findOne({
        student: item.studentId, 
        course: courseId, 
        semester: semNum, 
        academicYear
      });

      if (!result) {
        result = new Result({
          student: item.studentId,
          course: courseId,
          semester: semNum,
          academicYear,
          courseType: course.type.toUpperCase(),
          createdBy: req.user._id,
          marks: { mst1: '', mst2: '', mst3: '', endSem: '', internalPractical: '', externalPractical: '', vivaScore: '' }
        });
      }

      if (result.isLocked) return result;

      // Deep merge marks
      if (item.marks) {
        Object.keys(item.marks).forEach(field => {
          if (item.marks[field] !== undefined && item.marks[field] !== null) {
            result.marks[field] = item.marks[field];
          }
        });
        if (item.marks.absentFields) {
          result.marks.absentFields = item.marks.absentFields;
        }
      }

      if (item.grade) result.grade = item.grade;
      if (item.totalMarks !== undefined) result.totalMarks = item.totalMarks;
      
      // Update createdBy if not already set, or if an admin is taking over
      if (!result.createdBy || req.user.role === 'admin' || req.user.role === 'hod') {
          result.createdBy = req.user._id;
      }
      
      result.status = 'draft';
      return await result.save();
    }));

    await ResultAudit.create({
      action: 'SAVE_DRAFT',
      performedBy: req.user._id,
      course: courseId,
      semester: semNum,
      academicYear,
      details: { count: results.length }
    });

    res.json({ message: 'Marks saved as draft', results: savedResults });
  } catch (error) {
    console.error('SAVE MARKS ERROR:', error);
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
    const targetYear = academicYear || '2025-26';

    // Verify course exists and user has access
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // Identify results for this course/sem/year regardless of who created them, 
    // as long as they are currently in draft or rejected status
    // Identify results for this course/sem/year regardless of who created them, 
    // as long as they are currently in draft or rejected status
    const filter = { 
      course: courseId, 
      semester: semNum, 
      academicYear: targetYear, 
      status: { $in: ['draft', 'rejected', 'not_started'] } 
    };

    const updated = await Result.updateMany(
      filter,
      { 
        status: 'submitted', 
        submittedAt: new Date(),
        isLocked: true,
        lockedBy: req.user._id,
        lockedAt: new Date()
      }
    );

    // Find HODs for this department - be flexible with String vs ID stored in User
    const hods = await User.find({ 
      role: 'hod', 
      $or: [
        { department: course.department },
        { department: course.department?.name },
        { department: course.department?.code }
      ].filter(Boolean)
    });
    
    await Promise.all(hods.map(async (hod) => {
      await Notification.create({
        recipient: hod._id,
        sender: req.user._id,
        title: 'New Result Submission',
        message: `${req.user.name} has submitted marks for ${course.name} (Sem ${semester})`,
        link: `/results/verify?courseId=${courseId}&semester=${semester}`
      });
    }));

    await ResultAudit.create({
      action: 'SUBMIT',
      performedBy: req.user._id,
      course: courseId,
      semester: semNum,
      academicYear: targetYear,
      details: { count: updated.modifiedCount || updated.nModified }
    });

    res.json({ message: 'Marks submitted for approval', count: updated.modifiedCount || updated.nModified });
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
      { course: courseId, semester: parseInt(semester), academicYear, status: 'submitted' },
      { 
        status: 'approved', 
        approvedBy: req.user._id,
        approvedAt: new Date() 
      }
    );

    await ResultAudit.create({
      action: 'APPROVE',
      performedBy: req.user._id,
      course: courseId,
      semester,
      academicYear,
    });

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
      { course: courseId, semester: parseInt(semester), academicYear, status: 'submitted' },
      { 
        status: 'rejected', 
        rejectionReason: reason || 'Incomplete or inaccurate data',
        approvedBy: req.user._id,
        isLocked: false,
        lockedBy: null,
        lockedAt: null
      }
    );

    await ResultAudit.create({
      action: 'REJECT',
      performedBy: req.user._id,
      course: courseId,
      semester,
      academicYear,
      details: { reason }
    });

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
      { course: courseId, semester: parseInt(semester), academicYear, status: 'approved' },
      { status: 'published' }
    );

    await ResultAudit.create({
      action: 'PUBLISH',
      performedBy: req.user._id,
      course: courseId,
      semester,
      academicYear,
    });

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
      student: req.user._id
    });

    if (!finalResult) {
       return res.json({ results: [], sgpa: 0, totalCredits: 0, message: "Academic records are currently being compiled." });
    }

    // Official Detailed Results (Table) - Now unique per course to prevent duplication
    const allResults = await Result.find({ 
      student: req.user._id,
      semester: finalResult.semester
    }).populate('course', 'name code credits type');

    // De-duplicate by course ID (preferring 'published' status if available)
    const uniqueMap = new Map();
    allResults.forEach(r => {
        const cid = r.course?._id?.toString();
        if (!uniqueMap.has(cid) || r.status === 'published') {
            uniqueMap.set(cid, r);
        }
    });
    const results = Array.from(uniqueMap.values());

    res.json({ 
      results, 
      sgpa: finalResult.sgpa, 
      totalCredits: finalResult.totalMarksMax / 100 * 4, 
      isPublished: finalResult.isPublished,
      pdfUrl: finalResult.pdfUrl,
      message: finalResult.isPublished ? "Official Results Published" : "Final Transcript Generated (Pre-Release Preview)"
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

    // 1. Resolve department if specified
    const studentQuery = { role: 'student', semester: semNum };
    
    if (department && department !== 'All') {
      const dept = await Department.findOne({ 
        $or: [
          { name: department },
          { code: department },
          { name: { $regex: new RegExp(`^${department}$`, 'i') } },
          { code: { $regex: new RegExp(`^${department}$`, 'i') } }
        ]
      });
      
      if (dept) {
        studentQuery.$or = [
          { department: dept.name },
          { department: dept.code },
          { department: { $regex: new RegExp(`^${dept.name}$`, 'i') } },
          { department: { $regex: new RegExp(`^${dept.code}$`, 'i') } }
        ];
      } else {
        studentQuery.department = { $regex: new RegExp(`^${department}$`, 'i') };
      }
    }
    
    const students = await User.find(studentQuery);
    
    // 2. For each student, check if all their courses are approved
    const generatedResults = [];

    for (const student of students) {
        // Find all results for this student in this semester with populated course details
        const individualResults = await Result.find({ 
          student: student._id, 
          semester: semNum, 
          academicYear: academicYear || '2025-26'
        }).populate('course');
        
        // Find all courses for this student's department and semester
        const courseQuery = { semester: semNum };
        if (student.department) {
           const stdDept = await Department.findOne({
             $or: [
               { name: student.department },
               { code: student.department }
             ]
           });
           
           courseQuery.$or = [
             { department: stdDept ? stdDept._id : null },
             { departmentName: student.department },
             { departmentCode: student.department }
           ].filter(c => c.department !== null);
           
           // If no formal department found, try a broad match
           if (!stdDept) {
              delete courseQuery.$or;
           }
        }
        
        const courses = await Course.find(courseQuery);

        // Allow 'submitted', 'approved', or 'published' results to be compiled by Admin
        const validResults = individualResults.filter(r => 
          ['submitted', 'approved', 'published'].includes(r.status)
        );
        
        if (validResults.length > 0) {
            let totalObtained = 0;
            let totalMax = 0;
            let weightPoints = 0;
            let totalCredits = 0;

            validResults.forEach(r => {
                const credits = r.course?.credits || 4; // Fallback to 4 credits
                totalObtained += r.totalMarks;
                totalMax += 100; // Assuming 100 is max marks per subject
                totalCredits += credits;
                weightPoints += (r.gradePoints * credits);
            });

            const percentage = (totalObtained / totalMax) * 100;
            const sgpa = totalCredits > 0 ? (weightPoints / totalCredits) : 0;

            const final = await FinalResult.findOneAndUpdate(
                { student: student._id, semester: semNum, academicYear: academicYear },
                {
                    courseResults: validResults.map(r => r._id),
                    totalMarksObtained: totalObtained,
                    totalMarksMax: totalMax,
                    percentage: percentage.toFixed(2),
                    sgpa: sgpa.toFixed(2),
                    isPublished: false, // Default to false, let admin publish later
                    generatedBy: req.user._id,
                    department: student.department
                },
                { upsert: true, new: true }
            );

            // Synchronize student profile stats
            await User.findByIdAndUpdate(student._id, {
                cgpa: sgpa.toFixed(2), // Latest SGPA
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
// @desc    Publish all compiled results for a sector
// @route   POST /api/results/publish-final
// @access  Admin/HOD
export const publishFinalResults = async (req, res) => {
    try {
        const { semester, academicYear, department } = req.body;
        const semNum = parseInt(semester);

        const filter = { semester: semNum, academicYear };
        if (department && department !== 'All') filter.department = department;

        const result = await FinalResult.updateMany(filter, { isPublished: true });
        
        res.json({ message: `Successfully published results for ${result.modifiedCount} students.`, count: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: 'Publishing Protocol Failure', error: error.message });
    }
};

// @desc    Upload generated transcript PDF
// @route   POST /api/results/upload-transcript
// @access  Admin/HOD
import { v2 as cloudinary } from 'cloudinary';
export const uploadTranscript = async (req, res) => {
    try {
        const { studentId, semester, academicYear } = req.body;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const final = await FinalResult.findOneAndUpdate(
            { student: studentId, semester: parseInt(semester), academicYear },
            { pdfUrl: req.file.path }, 
            { new: true, upsert: true }
        );

        res.json({ message: 'Transcript Archive Synchronized', pdfUrl: req.file.path });
    } catch (error) {
        res.status(500).json({ message: 'Archival Failure', error: error.message });
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
      { 
        isLocked: true,
        lockedBy: req.user._id,
        lockedAt: new Date()
      }
    );

    await ResultAudit.create({
      action: 'LOCK',
      performedBy: req.user._id,
      course: courseId,
      semester: semNum,
      academicYear,
    });

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
    if (result.isLocked) {
      result.lockedBy = req.user._id;
      result.lockedAt = new Date();
    } else {
      result.lockedBy = null;
      result.lockedAt = null;
    }
    await result.save();

    res.json({ message: `Row ${result.isLocked ? 'Locked' : 'Unlocked'}`, isLocked: result.isLocked });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling lock', error: error.message });
  }
};

// @desc    Unlock results for a course
// @route   POST /api/results/unlock
// @access  Teacher/Admin/HOD
export const unlockResults = async (req, res) => {
    try {
      const { courseId, semester, academicYear } = req.body;
      const semNum = parseInt(semester);
  
      await Result.updateMany(
        { course: courseId, semester: semNum, academicYear },
        { isLocked: false }
      );
  
      await ResultAudit.create({
      action: 'UNLOCK',
      performedBy: req.user._id,
      course: courseId,
      semester: semNum,
      academicYear,
    });

    res.json({ message: 'Marks have been unlocked for editing.' });
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };

export const getTranscript = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId } = req.query;

    const student = await User.findById(studentId).select('name rollNumber enrollmentNumber department semester');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const result = await Result.findOne({ student: studentId, course: courseId })
      .populate('course', 'name code credits type');

    if (!result) return res.status(404).json({ message: 'No result found for this course.' });

    res.json({ student, result });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
