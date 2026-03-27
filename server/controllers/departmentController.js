import Department from '../models/Department.js';

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDepartmentByCode = async (req, res) => {
  try {
    const department = await Department.findOne({ code: req.params.code.toUpperCase() })
      .populate('hod', 'name profilePic designation')
      .populate('facultyList', 'name profilePic designation qualification expertise');
    
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const department = await Department.create(req.body);
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) return res.status(404).json({ message: 'Not found' });
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
