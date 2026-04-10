import express from 'express';
import { getEducationNews } from '../controllers/newsController.js';

const router = express.Router();

router.get('/education', getEducationNews);

export default router;
