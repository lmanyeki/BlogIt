import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { PrismaClient } from "@prisma/client";

const client = new PrismaClient();

export const signup = async (req,res) => {
const { firstName, lastName, emailAddress, username, password } = req.body;
  
    if (!firstName || !lastName || !emailAddress || !username || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
  
    try {
      const existingUser = await client.user.findFirst({
        where: {
          OR: [
            { emailAddress: emailAddress },
            { username: username }
          ]
        }
      });
  
      if (existingUser) {
        return res.status(400).json({ message: "Email or username already exists." });
      }
  
      const hashedPassword = await bcrypt.hash(password, 12);
  
      await client.user.create({
        data: {
          firstName,
          lastName,
          emailAddress,
          username,
          password: hashedPassword,
        },
      });
  
      res.status(201).json({ message: "User successfully created." });
  
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  };

export const login= async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const user = await client.user.findFirst({
            where: {
                OR: [{ emailAddress: identifier }, { username: identifier }]
            }
        });

        if (!user) {
            return res.status(401).json({ message: "user not found"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
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
          });
        } catch (err) {
          console.error("Login error:", err);
          res.status(500).json({ message: "Something went wrong. Please try again." });
        }
};
