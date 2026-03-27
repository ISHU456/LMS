import express from 'express';
import {
  getDepartments,
  createDepartment,
  getDepartmentById,
  getDepartmentByCode
} from '../controllers/departmentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getDepartments)
  .post(protect, createDepartment);

router.get('/code/:code', getDepartmentByCode);
router.get('/:id', getDepartmentById);

export default router;
