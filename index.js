import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const app = express();
const client = new PrismaClient();

app.use(express.json())

app.post("/auth/register", async (req, res) => {
    const { firstName, lastName, emailAddress, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    try {
        const newUser = await client.User.create({
            data: {
                firstName,
                lastName,
                emailAddress,
                username,
                password: hashedPassword
            }
        })
        res.status(201).json(newUser);
    } catch (e) {
        res.status(500).json({ message: "Something went wrong. Please try again." })
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port} `)
})
