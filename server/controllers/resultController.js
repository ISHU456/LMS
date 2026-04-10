import Result from '../models/Result.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Department from '../models/Department.js';
import FinalResult from '../models/FinalResult.js';
import Submission from '../models/Submission.js';
import mongoose from 'mongoose';

// HELPER: Calculate Grade from Marks
const calculateGrade = (marks) => {
  if (marks >= 90) return 'O';
  if (marks >= 80) return 'A+';
  if (marks >= 70) return 'A';
  if (marks >= 60) return 'B+';
  if (marks >= 50) return 'B';
  if (marks >= 40) return 'C';
  if (marks >= 35) return 'P';
  return 'F';
};

// @desc    Get summary of results for a semester/dept
// @route   GET /api/results/semester-summary
// @access  Admin/HOD
export const getSemesterSummary = async (req, res) => {
  try {
    const { semester, academicYear, department, section } = req.query;
    const semNum = parseInt(semester);
    
    // 1. Get courses for this semester/dept
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
      }
    }
    
    const courses = await Course.find(courseQuery).select('name code credits type department');
    const courseIds = courses.map(c => c._id.toString());

    // 2. Get students for this semester/dept/section (Alphabetical)
    const studentFilter = { role: 'student', semester: semNum };
    
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
        studentFilter.$or = [
          { department: dept.name },
          { department: dept.code },
          { department: { $regex: new RegExp(`^${dept.code}$|^${dept.name}$`, 'i') } }
        ];
      } else {
        studentFilter.department = department;
      }
    }

    if (section && section !== 'all') {
        studentFilter.section = section;
    }

    const students = await User.find(studentFilter)
      .select('name rollNumber enrollmentNumber department semester section')
      .sort({ name: 1 });

    // 3. Get all results for these courses and semester
    const results = await Result.find({
      semester: semNum,
      academicYear: academicYear || '2025-26',
      course: { $in: courses.map(c => c._id) }
    });

    // 4. Construct matrix
    const matrix = {};
    const studentIds = students.map(s => s._id.toString());
    
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

    // 5. Get compiled finals
    const studentFinals = await FinalResult.find({
      student: { $in: studentIds },
      semester: semNum,
      academicYear: academicYear || '2025-26'
    });

    const finalsMap = {};
    studentFinals.forEach(f => {
      finalsMap[f.student.toString()] = f;
    });

    res.json({ students, courses, matrix, studentFinals: finalsMap });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate final results (Average SGPA/CGPA)
// @route    POST /api/results/generate-final
// @access   Admin/HOD
export const generateFinalResult = async (req, res) => {
  try {
    const { semester, academicYear, department, section } = req.body;
    const semNum = parseInt(semester);

    // 1. Fetch Students
    const studentFilter = { role: 'student', semester: semNum };
    const dept = await Department.findOne({ 
      $or: [
        { name: department },
        { code: department },
        { name: { $regex: new RegExp(`^${department}$`, 'i') } },
        { code: { $regex: new RegExp(`^${department}$`, 'i') } }
      ]
    });

    if (dept) {
      studentFilter.$or = [
        { department: dept.name },
        { department: dept.code },
        { department: { $regex: new RegExp(`^${dept.code}$|^${dept.name}$`, 'i') } }
      ];
    } else if (department && department !== 'All') {
      studentFilter.department = department;
    }
    
    if (section && section !== 'all') {
        studentFilter.section = section;
    }
    const students = await User.find(studentFilter);

    // 2. Fetch Courses
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
      if (dept) courseQuery.department = dept._id;
    }
    const courses = await Course.find(courseQuery);
    const courseIds = courses.map(c => c._id);

    const ops = [];
    for (const student of students) {
       // Get all results for this student/semester/courses
       const results = await Result.find({
          student: student._id,
          course: { $in: courseIds },
          status: { $in: ['published', 'approved', 'submitted'] }
       });

       if (results.length === 0) continue;

       const totalMarks = results.reduce((sum, r) => sum + r.totalMarks, 0);
       const maxMarks = results.length * 100;
       const percentage = (totalMarks / maxMarks) * 100;
       
       // Rough SGPA calculation (Total Marks / 10 is standard for 100 max)
       // This is a placeholder for institutional logic
       const sgpa = percentage / 10;

       ops.push({
         updateOne: {
           filter: { student: student._id, semester: semNum, academicYear: academicYear || '2025-26' },
           update: { 
             $set: { 
                totalMarksMax: maxMarks,
                totalMarksObtained: totalMarks,
                percentage: percentage.toFixed(2),
                sgpa: sgpa.toFixed(2),
                isPublished: false 
             } 
           },
           upsert: true
         }
       });
    }

    if (ops.length > 0) {
        await FinalResult.bulkWrite(ops);
    }

    res.json({ message: `Successfully compiled final standing for ${ops.length} students.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Publish Final Results to Students
// @route   POST /api/results/publish-final
export const publishFinalResults = async (req, res) => {
    try {
        const { semester, academicYear, department, section } = req.body;
        
        const studentFilter = { role: 'student', semester: parseInt(semester) };
        const dept = await Department.findOne({ 
          $or: [
            { name: department },
            { code: department },
            { name: { $regex: new RegExp(`^${department}$`, 'i') } },
            { code: { $regex: new RegExp(`^${department}$`, 'i') } }
          ]
        });

        if (dept) {
          studentFilter.$or = [
            { department: dept.name },
            { department: dept.code },
            { department: { $regex: new RegExp(`^${dept.code}$|^${dept.name}$`, 'i') } }
          ];
        } else if (department && department !== 'All') {
          studentFilter.department = department;
        }

        if (section && section !== 'all') {
            studentFilter.section = section;
        }
        const studentIds = await User.find(studentFilter).distinct('_id');

        const result = await FinalResult.updateMany(
            { student: { $in: studentIds }, semester: parseInt(semester), academicYear },
            { $set: { isPublished: true } }
        );

        res.json({ message: `Successfully published results for ${result.modifiedCount} identities.` });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// @desc    Secure Transcript Archival to Cloud
// @route    POST /api/results/upload-transcript
export const uploadTranscript = async (req, res) => {
    try {
        const { studentId, semester, academicYear } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Transcript binary not found in request buffer.' });

        const finalResult = await FinalResult.findOneAndUpdate(
            { student: studentId, semester: parseInt(semester), academicYear },
            { $set: { pdfUrl: req.file.path } },
            { upsert: true, new: true }
        );

        res.json({ message: 'Transcript successfully archived to digital vault.', finalResult });
    } catch (e) {
        res.status(500).json({ message: 'Archival failure.', error: e.message });
    }
};

// @desc    Get student's own results (Detailed)
// @route   GET /api/results/my-results
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
export const getAnalytics = async (req, res) => {
  try {
    const { courseId, semester } = req.query;
    const filter = { status: 'published' };
    if (courseId) filter.course = courseId;
    if (semester) filter.semester = semester;

    const results = await Result.find(filter);

    const gradeDistribution = {
      'O': 0, 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'P': 0, 'F': 0
    };

    results.forEach(r => {
      if (gradeDistribution[r.grade] !== undefined) {
        gradeDistribution[r.grade]++;
      }
    });

    res.json({
      totalStudents: results.length,
      gradeDistribution: Object.keys(gradeDistribution).map(k => ({ name: k, value: gradeDistribution[k] })),
      averageMarks: results.length > 0 ? (results.reduce((sum, r) => sum + r.totalMarks, 0) / results.length).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Get students for mark entry (Section-Aware & Alphabetical)
export const getStudentsForEntry = async (req, res) => {
  try {
    const { courseId, semester, academicYear, section } = req.query;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course Terminal not found.' });

    // Authorization Protocol (Admin bypass or Faculty Assignment check)
    const isAuthorized = req.user.role === 'admin' || 
                         course.facultyAssigned?.some(f => f.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
       return res.status(403).json({ 
         message: 'Access Terminal Locked. Ask permission from internal admin to view academic records.',
         unauthorized: true 
       });
    }

    const semNum = parseInt(semester);
    
    // 1. Fetch Students (Enforced Alpha-Bravo Ranking)
    const studentFilter = { role: 'student', semester: semNum };
    if (course.department) {
       const dept = await Department.findById(course.department);
       if (dept) {
         studentFilter.$or = [
           { department: dept.name },
           { department: dept.code },
           { department: { $regex: new RegExp(`^${dept.code}$|^${dept.name}$`, 'i') } }
         ];
       }
    }
    if (section && section !== 'all') {
      studentFilter.section = section;
    }

    const students = await User.find(studentFilter).select('name rollNumber section').sort({ name: 1 });

    // 2. Fetch Existing Results for this course/sem/year
    const results = await Result.find({
      course: courseId,
      semester: semNum,
      academicYear: academicYear || '2025-26'
    }).populate('createdBy', 'name');

    const resultTable = results.reduce((acc, r) => {
      acc[r.student.toString()] = r;
      return acc;
    }, {});

    const studentData = students.map(s => {
      const res = resultTable[s._id.toString()];
      return {
        _id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        section: s.section,
        existingResult: res || null,
        marks: res?.marks || {},
        totalMarks: res?.totalMarks || 0,
        grade: res?.grade || '',
        status: res?.status || 'draft',
        isLocked: res?.isLocked || false,
        uploaderName: res?.createdBy?.name || 'N/A'
      };
    });

    res.json({ students: studentData, course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save marks (Draft Mode)
export const saveMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear, results } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course Node not found.' });

    // Authorization Protocol (Admin bypass or Faculty Assignment check)
    const isAuthorized = req.user.role === 'admin' || 
                         course.facultyAssigned?.some(f => f.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
       return res.status(403).json({ message: 'Access Terminal Locked. Authorization failure during persistence.' });
    }

    const ops = results.map(r => {
      const m = r.marks || {};
      let total = 0;
      let grade = 'F';

      const type = (course.type || 'THEORY').toUpperCase().trim();
      
      if (type === 'THEORY') {
        const msts = [Number(m.mst1) || 0, Number(m.mst2) || 0, Number(m.mst3) || 0];
        const bestTwoSum = msts.sort((a, b) => b - a).slice(0, 2).reduce((sum, val) => sum + val, 0);
        total = bestTwoSum + (Number(m.endSem) || 0);
      } else if (type === 'PRACTICAL') {
        total = (Number(m.internalPractical) || 0) + (Number(m.externalPractical) || 0);
      } else if (type === 'VIVA') {
        total = (Number(m.vivaScore) || 0) * 10;
      }

      if (total >= 90) grade = 'O';
      else if (total >= 80) grade = 'A+';
      else if (total >= 70) grade = 'A';
      else if (total >= 60) grade = 'B+';
      else if (total >= 50) grade = 'B';
      else if (total >= 40) grade = 'C';

      return {
        updateOne: {
          filter: { 
            student: r.studentId, 
            course: courseId, 
            semester: parseInt(semester), 
            academicYear: academicYear || '2025-26' 
          },
          update: { 
            $set: { 
              courseType: course.type,
              marks: m,
              totalMarks: total,
              grade,
              status: 'draft',
              createdBy: req.user._id
            } 
          },
          upsert: true
        }
      };
    });

    if (ops.length > 0) await Result.bulkWrite(ops);
    
    // FETCH THE UPDATED RESULTS TO RETURN TO CLIENT
    const updatedResults = await Result.find({
        course: courseId,
        semester: parseInt(semester),
        academicYear: academicYear || '2025-26',
        student: { $in: results.map(r => r.studentId) }
    });

    res.json({ message: 'Synchronized marks to draft sector.', results: updatedResults });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit marks for approval
export const submitMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course terminal not found.' });

    // Authorization Protocol (Admin bypass or Faculty Assignment check)
    const isAuthorized = req.user.role === 'admin' || 
                         course.facultyAssigned?.some(f => f.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
       return res.status(403).json({ message: 'Access Terminal Locked. Authorization failure during submission.' });
    }
    await Result.updateMany(
      { course: courseId, semester: parseInt(semester), academicYear, status: 'draft' },
      { status: 'submitted' }
    );
    res.json({ message: 'Results transferred to Administrative Hub for certification.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin: Publish Certified Results
export const publishMarks = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Academic Lattice Node missing.' });

    // Authorization Protocol (Admin bypass or Faculty Assignment check)
    const isAuthorized = req.user.role === 'admin' || 
                         course.facultyAssigned?.some(f => f.toString() === req.user._id.toString());
    
    if (!isAuthorized) {
       return res.status(403).json({ message: 'Access Terminal Locked. Authorization failure during publication.' });
    }
    await Result.updateMany(
      { course: courseId, semester: parseInt(semester), academicYear, status: 'approved' },
      { status: 'published' }
    );
    res.json({ message: 'Academic records published to student portfolios.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Lock result entries
export const lockResults = async (req, res) => {
  try {
    const { courseId, semester, academicYear } = req.body;
    await Result.updateMany(
      { course: courseId, semester: parseInt(semester), academicYear },
      { isLocked: true }
    );
    res.json({ message: 'Mark-list locked for official archival.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle individual lock
export const toggleResultLock = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Result.findById(id);
    if (!result) return res.status(404).json({ message: 'Record not found.' });
    
    const updated = await Result.findByIdAndUpdate(
      id, 
      { $set: { isLocked: !result.isLocked } }, 
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get finalized transcript for a student
export const getTranscript = async (req, res) => {
  try {
    const { studentId } = req.params;
    const transcript = await FinalResult.findOne({ student: studentId }).sort({ createdAt: -1 });
    res.json(transcript);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all published final results
export const getFinalResults = async (req, res) => {
  try {
    const finals = await FinalResult.find({ student: req.user._id, isPublished: true });
    res.json(finals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
