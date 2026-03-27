import Resource from '../models/Resource.js';
import fs from 'fs';

// Get all resources for a particular course (Mocked by courseId string for now)
export const getResources = async (req, res) => {
  try {
    const { courseId } = req.query; // e.g. CS101 string
    const query = courseId ? { extraCourseId: courseId } : {}; // For simple demo using a string field
    const resources = await Resource.find(query).sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources', error: error.message });
  }
};

// Handle File Upload and Metadata Storage
export const uploadResource = async (req, res) => {
  try {
    const { title, type, extraCourseId, uploadedBy, points } = req.body;
    
    const resourceData = {
      title,
      type,
      extraCourseId,
      uploadedBy,
      points: Number(points) || 10,
    };

    if (req.file) {
      // Storage in Cloudinary via CloudinaryStorage middleware
      resourceData.fileUrl = req.file.path; // Cloudinary URL
      resourceData.fileType = req.file.originalname.split('.').pop();
      resourceData.size = `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`;
    } else if (req.body.fileUrl) {
      resourceData.fileUrl = req.body.fileUrl;
    }

    const newResource = new Resource(resourceData);
    await newResource.save();
    
    res.status(201).json(newResource);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading resource', error: error.message });
  }
};

// Download / View File from DB Buffer
export const getFileFromDB = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource || !resource.fileData || !resource.fileData.data) {
      return res.status(404).json({ message: 'File not found in database' });
    }

    res.contentType(resource.fileData.contentType);
    res.send(resource.fileData.data);
  } catch (error) {
    res.status(500).json({ message: 'Error streaming file', error: error.message });
  }
};

// Delete Resource
export const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resource', error: error.message });
  }
};

// Update Resource Metadata
export const updateResource = async (req, res) => {
  try {
    const { title, type } = req.body;
    const resource = await Resource.findByIdAndUpdate(req.params.id, { title, type }, { new: true });
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Error updating resource', error: error.message });
  }
};
