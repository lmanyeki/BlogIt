import express from 'express';
import { getAllBlogs, getBlogById, createBlog, authMiddleware, upload } from './blogController.js';

const router = express.Router();


router.get('/', getAllBlogs);
router.get('/:id', getBlogById);
router.post('/', authMiddleware, upload.single('featuredImage'), createBlog);
router.put('/:id', authMiddleware, updateBlog);
router.delete('/:id', authMiddleware, deleteBlog);

export default router;