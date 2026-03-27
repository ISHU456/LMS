import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import mongoose from 'mongoose';

// --- UTILITY: PARSE RAW QUIZ INPUT ---
// Format: 
// Question: What is 2+2?
// Options: 2, 3, 4, 5
// Answer: 4
const parseQuizInput = (rawText) => {
    try {
        const questions = [];
        const blocks = rawText.split(/\d+\./); // Split by "1. ", "2. " etc or just use blocks
        // Alternatively, if it's a single block per question:
        const normalizedBlocks = rawText.includes('Question:') ? rawText.split('Question:').filter(b => b.trim()) : [rawText];
        
        for (let block of normalizedBlocks) {
            const qMatch = block.match(/Question:(.*)/i) || { 1: block.split('Options:')[0] };
            const oMatch = block.match(/Options:(.*)/i);
            const aMatch = block.match(/Answer:(.*)/i);

            if (qMatch && oMatch && aMatch) {
                const questionText = qMatch[1].trim();
                const options = oMatch[1].split(',').map(o => o.trim());
                const correctAnswerText = aMatch[1].trim();
                const correctIndex = options.findIndex(o => o === correctAnswerText);

                if (correctIndex !== -1) {
                    questions.push({
                        question: questionText,
                        options: options,
                        correctAnswer: correctIndex
                    });
                }
            }
        }
        return questions;
    } catch (e) {
        console.error("Quiz parsing error:", e);
        return [];
    }
};

// --- CONTROLLERS ---

export const createAssignment = async (req, res) => {
  try {
    const { title, description, type, courseId, facultyId, dueDate, totalMarks, quizQuestions: rawQuizQuestions } = req.body;
    
    let quizQuestions = [];
    if (type === 'quiz' && rawQuizQuestions) {
        try {
            quizQuestions = typeof rawQuizQuestions === 'string' ? JSON.parse(rawQuizQuestions) : rawQuizQuestions;
        } catch (e) {
            return res.status(400).json({ message: "Invalid quiz mapping format." });
        }
    }

    console.log("[AssignmentController] Creating Protocol Node...", req.body);
    const assignment = new Assignment({
       title,
       description,
       type,
       course: mongoose.Types.ObjectId.isValid(courseId) ? courseId : undefined,
       extraCourseId: !mongoose.Types.ObjectId.isValid(courseId) ? courseId : undefined,
       faculty: req.user?._id || facultyId,
       dueDate,
       totalMarks: totalMarks || 10,
       quizQuestions,
       pdfUrl: req.file ? req.file.path : undefined
    });

    await assignment.save();
    console.log("[AssignmentController] Protocol Node Deployed Successfully.");
    res.status(201).json(assignment);
  } catch (error) {
    console.error("[AssignmentController] Protocol Node Deployment FAILURE:", error);
    res.status(500).json({ message: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { assignmentId, studentId, studentNotes, quizAnswers } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    // Deadline Check
    if (new Date() > new Date(assignment.dueDate)) {
        return res.status(403).json({ message: "Deadline has passed. Submission rejected." });
    }

    let automatedScore = 0;
    let status = 'submitted';

    let parsedAnswers = quizAnswers;
    if (typeof quizAnswers === 'string') {
        try {
            parsedAnswers = JSON.parse(quizAnswers);
        } catch (e) {
            console.error("Failed to parse quiz answers");
        }
    }

    if (assignment.type === 'quiz' && parsedAnswers) {
        let correct = 0;
        assignment.quizQuestions.forEach((q, idx) => {
            if (Number(parsedAnswers[idx]) === q.correctAnswer) correct++;
        });
        automatedScore = (correct / assignment.quizQuestions.length) * assignment.totalMarks;
        status = 'graded'; // Quizzes are auto-graded
    }

    let submission = await Submission.findOne({ assignment: assignmentId, student: studentId });

    if (submission) {
        submission.studentNotes = studentNotes;
        submission.quizAnswers = parsedAnswers;
        submission.marksObtained = assignment.type === 'quiz' ? Math.round(automatedScore) : submission.marksObtained;
        submission.status = status;
        submission.submittedAt = new Date();
        submission.attemptCount = (submission.attemptCount || 1) + 1;
        if (req.files && req.files.length > 0) {
            submission.files = req.files.map(f => ({ fileName: f.originalname, fileUrl: f.path }));
        }
    } else {
        submission = new Submission({
           assignment: assignmentId,
           student: studentId,
           studentNotes,
           quizAnswers: parsedAnswers,
           marksObtained: assignment.type === 'quiz' ? Math.round(automatedScore) : undefined,
           status,
           submittedAt: new Date(),
           attemptCount: 1,
           files: req.files ? req.files.map(f => ({ fileName: f.originalname, fileUrl: f.path })) : []
        });
    }

    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSubmissions = async (req, res) => {
    try {
        const submissions = await Submission.find({ assignment: req.params.assignmentId })
            .populate('student', 'name email profilePic');
        res.json(submissions);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const gradeSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { marks, feedback, teacherId } = req.body;

        const submission = await Submission.findByIdAndUpdate(submissionId, {
            marksObtained: marks,
            facultyFeedback: feedback,
            status: 'graded',
            gradedBy: teacherId,
            gradedAt: new Date()
        }, { new: true });

        res.json(submission);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const deleteSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        await Submission.findByIdAndDelete(submissionId);
        res.json({ message: 'Response eradicated completely from the master link.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getCourseAssignments = async (req, res) => {
    try {
        const { courseId } = req.params;
        const query = [];
        if (mongoose.Types.ObjectId.isValid(courseId)) {
            query.push({ course: courseId });
        } else {
            // If it's not a valid ObjectId, we skip the 'course' field query 
            // to avoid Mongoose casting errors and only look at 'extraCourseId'
            query.push({ extraCourseId: courseId });
        }
        
        // If it was a valid ID, it could still be an extraCourseId in some edge cases
        if (mongoose.Types.ObjectId.isValid(courseId)) {
            query.push({ extraCourseId: courseId });
        }

        const assignments = await Assignment.find({ $or: query }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getUserSubmissions = async (req, res) => {
    try {
        const { courseId } = req.params;
        const userId = req.user._id;

        const query = [];
        if (mongoose.Types.ObjectId.isValid(courseId)) {
            query.push({ course: courseId });
        } else {
            query.push({ extraCourseId: courseId });
        }
        if (mongoose.Types.ObjectId.isValid(courseId)) {
            query.push({ extraCourseId: courseId });
        }

        const assignments = await Assignment.find({ $or: query });
        const assignmentIds = assignments.map(a => a._id);

        const submissions = await Submission.find({
            student: userId,
            assignment: { $in: assignmentIds }
        }).populate('assignment', 'title type');

        res.json(submissions);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const deleteAssignment = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        await Assignment.findByIdAndDelete(assignmentId);
        await Submission.deleteMany({ assignment: assignmentId });
        res.json({ message: 'Assignment and all linked submissions eradicated.' });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

export const getAllAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ faculty: req.user._id }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};
