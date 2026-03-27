import Course from '../models/Course.js';

export const isCourseTeacher = async (req, res, next) => {
  try {
    const { courseId, code } = req.params;
    const { courseId: bodyCourseId, extraCourseId } = req.body;

    // Determine the identifier (ID or Code)
    const identifier = courseId || bodyCourseId || code || extraCourseId || req.query.courseId;

    if (!identifier) {
      return res.status(400).json({ message: 'Course identifier required for authorization' });
    }

    // Admins and HODs are globally authorized
    if (req.user.role === 'admin' || req.user.role === 'hod') {
      return next();
    }

    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only authorized faculty can perform this action' });
    }

    const query = identifier.length === 24 
      ? { _id: identifier } 
      : { code: identifier.toUpperCase() };

    const course = await Course.findOne(query);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isAssigned = course.facultyAssigned.some(f => 
      f.toString() === req.user._id.toString()
    );

    if (!isAssigned) {
      return res.status(403).json({ message: 'You are not authorized to manage this course' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};
