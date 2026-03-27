import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Progress from '../models/Progress.js';
import Resource from '../models/Resource.js';
import Assignment from '../models/Assignment.js';

export const updateProgress = async (req, res) => {
  try {
    const { courseId, itemId, itemType } = req.body;
    if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
    const userId = req.user._id;

    // Resolve course internal ID if courseId is a string code
    let courseInternalId = courseId;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const course = await Course.findOne({ code: courseId.toUpperCase() });
      if (!course) return res.status(404).json({ message: 'Course not found' });
      courseInternalId = course._id;
    }

    let progress = await Progress.findOne({ user: userId, course: courseInternalId });

    if (!progress) {
      progress = new Progress({
        user: userId,
        course: courseInternalId,
        completedItems: []
      });
    }

    // Check if already completed
    const isAlreadyCompleted = progress.completedItems.some(
      item => item.itemId.toString() === itemId.toString()
    );

    if (!isAlreadyCompleted) {
      progress.completedItems.push({
        itemId,
        itemType,
        completedAt: new Date()
      });
      progress.lastAccessed = new Date();
      await progress.save();
    }

    res.json(progress);
  } catch (error) {
    console.error('SERVER ERROR [updateProgress]:', error);
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
};

export const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
    const userId = req.user._id;

    // Resolve course internal ID if courseId is a string code
    let courseInternalId = courseId;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      const course = await Course.findOne({ code: courseId.toUpperCase() });
      if (!course) return res.status(404).json({ message: 'Course not found' });
      courseInternalId = course._id;
    }

    const progress = await Progress.findOne({ user: userId, course: courseInternalId });
    
    // Get total items for this course to calculate percentage
    const totalResources = await Resource.countDocuments({ extraCourseId: courseId });
    const totalAssignments = await Assignment.countDocuments({ extraCourseId: courseId });
    const totalItems = totalResources + totalAssignments;

    const completedCount = progress ? progress.completedItems.length : 0;
    const percentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

    res.json({
      progress,
      totalItems,
      completedCount,
      percentage
    });
  } catch (error) {
    console.error('SERVER ERROR [getProgress]:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};
