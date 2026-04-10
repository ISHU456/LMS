import User from '../models/User.js';
import SystemSettings from '../models/SystemSettings.js';
import Announcement from '../models/Announcement.js';
import TeacherAttendance from '../models/TeacherAttendance.js';
import Course from '../models/Course.js';
import Department from '../models/Department.js';
import mongoose from 'mongoose';
import Submission from '../models/Submission.js';
import Assignment from '../models/Assignment.js';
import Enrollment from '../models/Enrollment.js';
import Attendance from '../models/Attendance.js';
import Result from '../models/Result.js';
import ResultAudit from '../models/ResultAudit.js';
import Progress from '../models/Progress.js';
import Notification from '../models/Notification.js';

export const getAdminDashboardStats = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'student' });
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const hodCount = await User.countDocuments({ role: 'hod' });
        const adminCount = await User.countDocuments({ role: 'admin' });
        const courseCount = await Course.countDocuments();
        const depts = await Department.find();
        
        // 1. User Demographics (Real Data)
        const demographics = [
            { name: 'Students', value: studentCount },
            { name: 'Faculty (T/H)', value: teacherCount + hodCount },
            { name: 'Admins', value: adminCount }
        ];

        // 2. Department Population
        const deptPopulation = await Promise.all(depts.map(async (d) => {
            const count = await User.countDocuments({ department: { $in: [d.name, d.code] }, role: 'student' });
            return { name: d.code || d.name, students: count };
        }));

        // 3. Attendance Logic (Today's Presence)
        const todayAtZero = new Date();
        todayAtZero.setHours(0, 0, 0, 0);
        const attendanceCount = await TeacherAttendance.countDocuments({ date: todayAtZero, status: 'Present' });
        const totalEligible = teacherCount + hodCount;
        const attendancePercentage = totalEligible > 0 ? Math.round((attendanceCount / totalEligible) * 100) : 100;

        const pendingApprovals = await User.countDocuments({ aiCreditsRequested: true });

        // 4. Growth Data (Weekly/Monthly/Daily)
        const now = new Date();
        const startOfToday = new Date(now.setHours(0,0,0,0));
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const dailyGrowth = await User.countDocuments({ createdAt: { $gte: startOfToday } });
        const weeklyGrowth = await User.countDocuments({ createdAt: { $gte: oneWeekAgo } });
        const monthlyGrowth = await User.countDocuments({ createdAt: { $gte: oneMonthAgo } });

        // Time Series Data (Last 7 Days)
        const timeline = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0,0,0,0);
            const count = await User.countDocuments({ createdAt: { $gte: d, $lt: new Date(d.getTime() + 24*60*60*1000) } });
            timeline.push({ 
                date: d.toLocaleDateString('en-US', { weekday: 'short' }), 
                count 
            });
        }

        // 5. Student Leaderboard (Top 10 - Real Performance)
        const topStudents = await User.find({ role: 'student' })
            .select('name profilePic department semester _id')
            .limit(100) // Fetch top 100 to find real top 10 after calculation
            .lean();

        const topStudentIds = topStudents.map(s => s._id);
        const [topProgress, topSubmissions] = await Promise.all([
            Progress.find({ user: { $in: topStudentIds } }).lean(),
            Submission.find({ student: { $in: topStudentIds }, status: 'graded' }).lean()
        ]);

        const leaderboard = topStudents.map(student => {
            const studentProgressXP = topProgress.filter(p => p.user.toString() === student._id.toString())
                .reduce((sum, p) => sum + (p.completedItems?.length || 0), 0) * 10;
            const studentSubmissionXP = topSubmissions.filter(s => s.student.toString() === student._id.toString())
                .reduce((sum, s) => sum + (s.marksObtained || 0), 0);
            
            return {
                ...student,
                xp: studentProgressXP + studentSubmissionXP
            };
        }).sort((a, b) => b.xp - a.xp).slice(0, 10);

        // 6. Recent Active Users
        const recentUsers = await User.find()
            .select('name role createdAt profilePic')
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            users: studentCount + teacherCount + hodCount + adminCount,
            departments: depts.length,
            courses: courseCount,
            demographics,
            deptPopulation,
            attendance: attendancePercentage,
            pendingApprovals,
            growth: { daily: dailyGrowth, weekly: weeklyGrowth, monthly: monthlyGrowth },
            timeline,
            leaderboard,
            recentUsers
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// @desc    Get all users with filtering
export const getUsers = async (req, res) => {
  try {
    const { role, dept, semester, section, isActive } = req.query;
    const filter = {};
    
    if (role && role !== 'all') filter.role = role;
    if (section && section !== 'all') filter.section = section;
    if (isActive !== undefined && isActive !== 'all') filter.isActive = isActive === 'true';
    
    if (dept && dept !== 'all' && dept !== 'undefined' && dept !== '') {
        filter.$or = [
            { department: { $regex: new RegExp(`^${dept}$`, 'i') } },
            { department: { $regex: new RegExp(dept, 'i') } }
        ];
    }
    
    if (semester && semester !== 'all' && semester !== 'undefined' && semester !== '') {
        const semNum = parseInt(semester);
        if (!isNaN(semNum)) {
            filter.semester = semNum;
        }
    }
    
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user
// @route   PUT /api/admin/users/:id
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.department = req.body.department || user.department;
    user.role = req.body.role || user.role;
    user.semester = req.body.semester || user.semester;
    user.employeeId = req.body.employeeId || user.employeeId;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await User.deleteOne({ _id: user._id });
    // Also remove from courses if teacher
    if (user.role === 'teacher') {
        await Course.updateMany({}, { $pull: { facultyAssigned: user._id } });
    }
    
    res.json({ message: 'User eliminated from the system master link.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- TEACHER ATTENDANCE (ADMIN) ---

export const getTeachersWithAttendance = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        const teachers = await User.find({ role: 'teacher' }).select('name email department employeeId');
        
        const attendance = await TeacherAttendance.find({
            date: {
                $gte: new Date(date + 'T00:00:00.000Z'),
                $lte: new Date(date + 'T23:59:59.999Z')
            }
        });

        const data = teachers.map(t => {
            const entry = attendance.find(a => a.teacher.toString() === t._id.toString());
            return {
                ...t.toObject(),
                status: entry ? entry.status : 'not_marked',
                checkIn: entry ? entry.checkInTime : '--:--',
                checkOut: entry ? entry.checkOutTime : '--:--',
                attendanceId: entry ? entry._id : null
            };
        });

        res.json(data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const markTeacherAttendance = async (req, res) => {
    try {
        const { teacherId, date, status, checkIn, checkOut, remarks } = req.body;
        
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const entry = await TeacherAttendance.findOneAndUpdate(
            { teacher: teacherId, date: startOfDay },
            { 
                status, 
                checkInTime: checkIn, 
                checkOutTime: checkOut, 
                remarks, 
                markedBy: req.user._id 
            },
            { upsert: true, new: true }
        );

        res.json(entry);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().select('name code');
        res.json(departments);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// --- TEACHER PROFILE & SUBJECT MANAGEMENT ---

export const getTeacherDetails = async (req, res) => {
    try {
        const teacher = await User.findById(req.params.id).select('-password');
        if (!teacher) return res.status(404).json({ message: 'Teacher identity not found.' });

        // Find all courses where this teacher is assigned
        const assignedCourses = await Course.find({ 
            facultyAssigned: teacher._id 
        }).select('name code department semester');

        res.json({ teacher, assignedCourses });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateTeacherAssignments = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { assignedCourseIds, department, assignedSemesters, qualification, experienceYears, designation, expertise, careerDetails, aboutMe } = req.body;

        // 1. Update Teacher's Career & Sector Access
        const updateData = {};
        if (department) updateData.department = department;
        if (assignedSemesters) updateData.assignedSemesters = assignedSemesters;
        if (qualification !== undefined) updateData.qualification = qualification;
        if (experienceYears !== undefined) updateData.experienceYears = experienceYears;
        if (designation !== undefined) updateData.designation = designation;
        if (expertise !== undefined) updateData.expertise = expertise;
        if (careerDetails !== undefined) updateData.careerDetails = careerDetails;
        if (aboutMe !== undefined) updateData.aboutMe = aboutMe;
        
        if (Object.keys(updateData).length > 0) {
            await User.findByIdAndUpdate(teacherId, updateData);
        }

        // 2. Update Course Assignments (Many-to-Many)
        // First, remove teacher from ALL courses
        await Course.updateMany({}, { $pull: { facultyAssigned: teacherId } });

        // Then, add teacher to specific courses
        if (assignedCourseIds && Array.isArray(assignedCourseIds)) {
            await Course.updateMany(
                { _id: { $in: assignedCourseIds } },
                { $addToSet: { facultyAssigned: teacherId } }
            );
        }

        res.json({ message: 'Teacher credentials and sector assignments synchronized successfully.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// --- STUDENT PROFILE & ENROLLMENT MANAGEMENT ---

export const getStudentDetails = async (req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');
        if (!student) return res.status(404).json({ message: 'Student identity not found.' });

        // Potential courses for this student's current sem/dept
        const dept = await Department.findOne({ 
            $or: [{ name: student.department }, { code: student.department }] 
        });

        const allCourses = await Course.find().select('name code semester department excludedStudents');

        // Fetch Student Results (Graded Submissions)
        const results = await Submission.find({ 
            student: student._id, 
            status: 'graded' 
        }).populate({
            path: 'assignment',
            select: 'title type maxMarks',
            populate: { path: 'course', select: 'name code' }
        });

        res.json({ student, allCourses, results });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateStudentEnrollment = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { department, semester, section, rollNumber, excludedCourseIds, cgpa, percentage, aboutMe } = req.body;

        // 1. Update Student Profile
        const updateData = {};
        if (department) updateData.department = department;
        if (semester) updateData.semester = semester;
        if (section) updateData.section = section;
        if (rollNumber) updateData.rollNumber = rollNumber;
        if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
        if (cgpa !== undefined) updateData.cgpa = cgpa;
        if (percentage !== undefined) updateData.percentage = percentage;
        if (aboutMe !== undefined) updateData.aboutMe = aboutMe;
        
        await User.findByIdAndUpdate(studentId, updateData);

        // 2. Manage Course Access (via excludedStudents field in Course model)
        // We only manage exclusion list for courses provided
        if (excludedCourseIds && Array.isArray(excludedCourseIds)) {
            // Remove from all exclusions first (reset) for this student
            await Course.updateMany({}, { $pull: { excludedStudents: studentId } });
            
            // Add to specific exclusions
            await Course.updateMany(
                { _id: { $in: excludedCourseIds } },
                { $addToSet: { excludedStudents: studentId } }
            );
        }

        res.json({ message: 'Student enrollment and access state synchronized successfully.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find()
            .populate('department', 'name code')
            .populate('facultyAssigned', 'name email profilePic')
            .select('name code department semester credits type facultyAssigned');
        res.json(courses);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const createCourse = async (req, res) => {
    try {
        const { name, code, credits, department, semester, type, description } = req.body;
        
        // Check if course already exists
        const existing = await Course.findOne({ code: code.toUpperCase() });
        if (existing) return res.status(400).json({ message: 'Course code already exists.' });

        const course = new Course({
            name,
            code: code.toUpperCase(),
            credits,
            department,
            semester,
            type: type.toUpperCase(),
            description
        });

        const createdCourse = await course.save();
        res.status(201).json(createdCourse);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Handle code uppercase if it's being updated
        if (updates.code) updates.code = updates.code.toUpperCase();
        if (updates.type) updates.type = updates.type.toUpperCase();

        const updatedCourse = await Course.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedCourse) return res.status(404).json({ message: 'Course not found.' });

        res.json(updatedCourse);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getAttendanceHistory = async (req, res) => {
    try {
        const { userId, type } = req.query; // type: 'teacher' or 'student'
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        if (type === 'teacher') {
            const history = await TeacherAttendance.find({
                teacher: userId,
                date: { $gte: startOfMonth }
            }).sort({ date: 1 });
            return res.json(history);
        } else {
            // Students: aggregated attendance from all courses
            const history = await Attendance.find({
                student: userId,
                date: { $gte: startOfMonth }
            }).populate('course', 'name code').sort({ date: 1 });
            return res.json(history);
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getAnnualAttendanceReport = async (req, res) => {
    try {
        const { userId, type } = req.query;
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);

        let aggregateData;
        if (type === 'teacher') {
            aggregateData = await TeacherAttendance.aggregate([
                { $match: { 
                    teacher: new mongoose.Types.ObjectId(userId),
                    date: { $gte: startOfYear },
                    status: 'present'
                }},
                { $group: {
                    _id: { $month: "$date" },
                    count: { $sum: 1 }
                }}
            ]);
        } else {
            aggregateData = await Attendance.aggregate([
                { $match: { 
                    student: new mongoose.Types.ObjectId(userId),
                    date: { $gte: startOfYear },
                    status: 'present'
                }},
                { $group: {
                    _id: { $month: "$date" },
                    count: { $sum: 1 }
                }}
            ]);
        }

        // Fill monthly gaps
        const report = Array.from({ length: 12 }, (_, i) => {
            const monthData = aggregateData.find(d => d._id === i + 1);
            return {
                month: new Date(0, i).toLocaleString('default', { month: 'short' }),
                presentDays: monthData ? monthData.count : 0
            };
        });

        res.json(report);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ message: 'Course not found in the academic repository.' });

        // Cascaded Protocol: Purge all associated sector records
        await Promise.all([
            Result.deleteMany({ course: id }),
            Enrollment.deleteMany({ course: id }),
            Attendance.deleteMany({ course: id }),
            Submission.deleteMany({ $or: [
                { assignment: { $in: await Assignment.find({ course: id }).distinct('_id') } },
                { course: id }
            ]}),
            Assignment.deleteMany({ course: id }),
            Progress.deleteMany({ courseId: id }),
            Announcement.deleteMany({ courseId: id }),
            Course.findByIdAndDelete(id)
        ]);

        res.json({ message: 'Course and all associated academic records successfully purged from the system core.' });
    } catch (e) {
        res.status(500).json({ message: 'Cascade failure during course decommissioning.', error: e.message });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        const validRoles = ['student', 'teacher', 'admin', 'hod', 'librarian'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role assignment.' });
        }

        // Restriction: Admin cannot make anyone else an Admin
        if (role === 'admin') {
            return res.status(403).json({ message: 'Authorization Revoked: Admin promotion is locked by central protocol.' });
        }

        // Prevent self-demotion
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Self-modification of administrative privilege is prohibited.' });
        }

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
        if (!user) return res.status(404).json({ message: 'Identity not found.' });

        res.json({ message: `Identity re-classified to ${role.toUpperCase()} successfully.`, user });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// SYSTEM SETTINGS
export const getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        res.json(settings);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const updateSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) settings = new SystemSettings();
        
        Object.assign(settings, req.body);
        settings.updatedBy = req.user._id;
        await settings.save();
        res.json(settings);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GLOBAL BROADCASTS
export const sendBroadcast = async (req, res) => {
    try {
        const { title, content, priority, category } = req.body;
        const broadcast = await Announcement.create({
            title,
            content,
            priority,
            category: category || 'Global',
            author: req.user._id,
            role: req.user.role,
            type: 'text',
            important: priority === 'high'
        });
        res.json(broadcast);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getBroadcasts = async (req, res) => {
    try {
        const broadcasts = await Announcement.find({ 
            $or: [
                { courseId: null },
                { category: 'Global' }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('author', 'name profilePic');
        res.json(broadcasts);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
// --- BATCH FINALIZATION (ENROLLMENT MGMT) ---

export const getEligibleStudentsForCourse = async (req, res) => {
    try {
        const { courseId, academicYear } = req.query;
        const course = await Course.findById(courseId).populate('department');
        if (!course) return res.status(404).json({ message: 'Course not found.' });

        const year = academicYear || '2023-24';

        // 1. Find already enrolled students
        const currentEnrollments = await Enrollment.find({ 
            course: courseId, 
            academicYear: year 
        }).select('student');
        const enrolledIds = currentEnrollments.map(e => e.student.toString());

        // 2. Find eligible students (same dept/sem)
        const eligibleStudents = await User.find({
            role: 'student',
            semester: course.semester,
            $or: [
                { department: course.department.name },
                { department: course.department.code },
                { department: { $regex: new RegExp(`^${course.department.code}$|^${course.department.name}$`, 'i') } }
            ]
        }).select('name rollNumber enrollmentNumber department semester section').sort({ name: 1 });

        const data = eligibleStudents.map(s => ({
            ...s.toObject(),
            isEnrolled: enrolledIds.includes(s._id.toString())
        }));

        res.json({ course, students: data });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const finalizeCourseBatch = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { studentIds, academicYear, semester } = req.body;
        
        if (!studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({ message: 'Identity list (studentIds) is required for protocol finalization.' });
        }

        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found.' });

        const year = academicYear || '2023-24';
        const sem = semester || course.semester;

        // Perform bulk enrollment
        const operations = studentIds.map(studentId => ({
            updateOne: {
                filter: { student: studentId, course: courseId, academicYear: year, semester: sem },
                update: { $set: { status: 'enrolled' } },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await Enrollment.bulkWrite(operations);
        }

        res.json({ message: `Successfully finalized ${studentIds.length} students into the academic grid for ${course.code}.` });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const unlockCourseResults = async (req, res) => {
    try {
        const { courseId, semester, academicYear } = req.body;
        if (!courseId || !semester || !academicYear) {
            return res.status(400).json({ message: 'Parameters [courseId, semester, academicYear] are mandatory.' });
        }

        const result = await Result.updateMany(
            { course: courseId, semester: parseInt(semester), academicYear },
            { 
                isLocked: false, 
                lockedBy: null, 
                lockedAt: null, 
                status: 'draft' 
            }
        );

        // Audit the override
        await ResultAudit.create({
            action: 'ADMIN_UNLOCK',
            performedBy: req.user._id,
            course: courseId,
            semester: parseInt(semester),
            academicYear,
            details: { modifiedCount: result.modifiedCount }
        });

        res.json({ 
            message: `Override successful. ${result.modifiedCount} identity records unlocked for faculty editing.`,
            modifiedCount: result.modifiedCount 
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const approveCourseResults = async (req, res) => {
    try {
        const { courseId, semester, academicYear } = req.body;
        const result = await Result.updateMany(
            { course: courseId, semester: parseInt(semester), academicYear, status: 'submitted' },
            { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() }
        );

        await ResultAudit.create({
            action: 'ADMIN_APPROVE',
            performedBy: req.user._id,
            course: courseId, semester: parseInt(semester), academicYear,
            details: { modifiedCount: result.modifiedCount }
        });

        res.json({ message: `Successfully certified ${result.modifiedCount} records for the academic repository.` });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const rejectCourseResults = async (req, res) => {
    try {
        const { courseId, semester, academicYear, reason } = req.body;
        const result = await Result.updateMany(
            { course: courseId, semester: parseInt(semester), academicYear, status: 'submitted' },
            { status: 'rejected', rejectionReason: reason || 'Protocol violation detected during verification.' }
        );

        await ResultAudit.create({
            action: 'ADMIN_REJECT',
            performedBy: req.user._id,
            course: courseId, semester: parseInt(semester), academicYear,
            details: { modifiedCount: result.modifiedCount, reason }
        });

        res.json({ message: `Mark-list decommissioned. ${result.modifiedCount} students updated for revision.` });
        
        // Find teacher assigned to this course to notify
        const cObj = await Course.findById(courseId);
        if (cObj && cObj.facultyAssigned && cObj.facultyAssigned.length > 0) {
            await Notification.create({
                recipient: cObj.facultyAssigned[0],
                sender: req.user._id,
                title: 'CRITICAL: Mark-List Rejected',
                message: `The results for ${cObj.name} (Sem ${semester}) have been REJECTED by Admin. Reason: ${reason || 'Protocol Violation'}. Please revise and re-submit.`,
                type: 'error',
                popupActive: true,
                link: `/results/entry?courseId=${courseId}&semester=${semester}`
            });
        }
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
export const notifyFaculty = async (req, res) => {
    try {
        const { teacherId, courseId, semester, message } = req.body;
        const course = await Course.findById(courseId);
        
        await Notification.create({
            recipient: teacherId,
            sender: req.user._id,
            title: `Admin Alert: Mark-List Discrepancy`,
            message: `URGENT MESSAGE FROM ADMIN REGARDING ${course?.name} (Sem ${semester}): ${message}`,
            type: 'warning',
            popupActive: true,
            link: `/results/entry?courseId=${courseId}&semester=${semester}`
        });

        res.json({ message: 'Instructor notified successfully.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getPendingTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: 'teacher', isAuthorized: false }).select('-password');
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const authorizeTeacher = async (req, res) => {
    try {
        const { id } = req.params;
        const teacher = await User.findById(id);
        
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(404).json({ message: 'Teacher request not found' });
        }
        
        teacher.isAuthorized = true;
        teacher.isActive = true;
        await teacher.save();
        
        res.json({ message: 'Faculty access securely authorized and granted.', teacher });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
