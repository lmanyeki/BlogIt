import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/authRoutes.js";
import blogRoutes from "./routes/blogs.js";
import pkg from '@prisma/client';
const { PrismaClient } = pkg;


const app = express();
const client = new PrismaClient();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}));

app.use("/auth", authRoutes);
app.use("/blogs", blogRoutes);


app.put('/user/:id/profile', async (req, res) => {
    const { id } = req.params;
    const {
      phoneNumber,
      occupation,
      bio,
      status,
      secondaryEmail,
      profilePhoto
    } = req.body;
  
    try {
      const updatedUser = await client.user.update({
        where: { id },
        data: {
          phoneNumber,
          occupation,
          bio,
          status,
          secondaryEmail,
          profilePhoto,
        },
      });
  
      res.json({ message: "Profile updated successfully", updatedUser });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port} `)
})
