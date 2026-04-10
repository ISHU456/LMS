import AccessRequest from '../models/AccessRequest.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// @desc    Create a new access request (Teacher context)
// @route   POST /api/access-requests
export const createAccessRequest = async (req, res) => {
  try {
    const { courseId, message } = req.body;
    
    // Check if the teacher already has access
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course Hub not found.' });

    const alreadyAssigned = course.facultyAssigned?.some(f => f.toString() === req.user._id.toString());
    if (alreadyAssigned) return res.status(400).json({ message: 'Teacher already has valid curriculum access.' });

    // Check for existing pending request
    const existing = await AccessRequest.findOne({ teacher: req.user._id, course: courseId, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'A pending request is already in transmission.' });

    const request = await AccessRequest.create({
      teacher: req.user._id,
      course: courseId,
      message: message || 'Curriculum access required for academic mark entry.'
    });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending requests (Admin context)
// @route   GET /api/access-requests/pending
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await AccessRequest.find({ status: 'pending' })
      .populate('teacher', 'name email department rollNumber')
      .populate('course', 'name code semester')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve access request (Admin context)
// @route   POST /api/access-requests/resolve/:id
export const resolveAccessRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const request = await AccessRequest.findById(req.params.id);
    
    if (!request) return res.status(404).json({ message: 'Access Request not found.' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'Request already resolved.' });

    request.status = status;
    request.resolvedBy = req.user._id;
    request.resolvedAt = new Date();
    await request.save();

    if (status === 'approved') {
      // Add teacher to course's facultyAssigned array
      const course = await Course.findById(request.course);
      if (course) {
        if (!course.facultyAssigned.includes(request.teacher)) {
          course.facultyAssigned.push(request.teacher);
          await course.save();
        }
      }
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
