import express from 'express';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import validateEmailAndUsername from "./middleware/validateEmailAndUsername.js";
import checkPasswordStrength from './middleware/checkPasswordStrength.js';
// import {pr} from '@prisma/client';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;


const app = express();
const client = new PrismaClient();
app.use(cookieParser());


app.use(express.json());
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
}))

app.post("/auth/signup", [validateEmailAndUsername, checkPasswordStrength], async (req, res) => {
    const { firstName, lastName, emailAddress, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    try {
        const newUser = await client.user.create({
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

app.post("/auth/login", async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const user = await client.user.findFirst({
            where: {
                OR: [{ emailAddress: identifier }, { username: identifier }]
            }
        });
        if (!user) {
            return res.status(401).json({ message: "Wrong login credentials."});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("password match", isMatch)
        if (!isMatch) {
            return res.status(401).json({ message: "Wrong login credentials."});
        }
        const jwtPayload = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
        }
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET_KEY);
        res.status(200).cookie("blogitAuthToken", token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        }).json({
            firstName: user.firstName,
            lastName: user.lastName,
            emailAddress: user.emailAddress,
            username: user.username
        })
    } catch (e) {
        res.status(500).json({ message: "Something went wrong."})
    }
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port} `)
})
