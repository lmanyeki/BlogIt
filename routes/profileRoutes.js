import express from 'express';
import {
  getProfile,
  updateProfile,
  updatePersonalInfo,
  updatePassword
} from '../controllers/profileController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, getProfile);
router.patch('/profile', authenticateUser, updateProfile);
router.patch('/personal-info', authenticateUser, updatePersonalInfo);
router.patch('/password', authenticateUser, updatePassword);

export default router;