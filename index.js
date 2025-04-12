import express from 'express';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import validateEmailAndUsername from "./validateEmailAndUsername.js";
import checkPasswordStrength from './middleware/checkPasswordStrength.js';
// import {pr} from '@prisma/client';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;


const app = express();
const client = new PrismaClient();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}))

app.post("/auth/signup", [validateEmailAndUsername, checkPasswordStrength], async (req, res) => {
    const { firstName, lastName, emailAddress, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    try {
        const newUser = await client.User.create({
            data: {
                firstName,
                lastName,
                emailAddress,
                username,
                password: hashedPassword,
            }
        })
        res.status(201).json({ message: "User successfully created."});
    } catch (e) {
        res.status(500).json({ message: "Something went wrong. Please try again." })
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port} `)
})
