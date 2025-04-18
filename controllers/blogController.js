import { PrismaClient } from "@prisma/client";
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const client = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {

  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await client.blog.findMany({
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        author: {
          select: {
            username: true,
            profilePhoto: true
          }
        }
      },
      where: {
        author: {
          isDeleted: false,
          isDeactivated: false
        }
      }
    });

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Failed to fetch blog posts" });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await client.blog.findUnique({
      where: {
        id: id
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            bio: true
          }
        }
      }
    });

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ message: "Failed to fetch blog post" });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { title, excerpt, body } = req.body;
    const userId = req.user.id;
    
    if (!title || !excerpt || !body) {
      return res.status(400).json({ message: "Title, excerpt, and body are required" });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: "Featured image is required" });
    }
    
    const featuredImagePath = `/uploads/${req.file.filename}`;
    
    const newBlog = await client.blog.create({
      data: {
        title,
        excerpt,
        body,
        featuredImage: featuredImagePath,
        userId
      }
    });
    
    res.status(201).json(newBlog);
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ message: "Failed to create blog post" });
  }
};

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.blogitAuthToken;
    
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid authentication" });
  }
};