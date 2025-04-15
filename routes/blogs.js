import express from "express";
import verifyUser from "../middleware/verifyUser.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/", verifyUser, async (req, res) => {
  const { title, excerpt, body, featuredImage } = req.body;

  try {
    const blog = await prisma.blog.create({
      data: {
        title,
        excerpt,
        body,
        featuredImage,
        userId: req.user.id, 
      },
    });

    res.status(201).json({ message: "Blog created successfully", blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create blog" });
  }
});

export default router;
