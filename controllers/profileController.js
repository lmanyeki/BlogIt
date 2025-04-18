import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-photos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, JPG, PNG, GIF) are allowed'));
    }
  }
}).single('profilePhoto');

const deleteOldProfilePhoto = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { profilePhoto: true }
  });
  
  if (user.profilePhoto) {
    const photoPath = path.join('uploads/profile-photos/', path.basename(user.profilePhoto));
    if (fs.existsSync(photoPath)) {
      fs.unlinkSync(photoPath);
    }
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        emailAddress: true,
        username: true,
        phoneNumber: true,
        occupation: true,
        bio: true,
        status: true,
        secondaryEmail: true,
        profilePhoto: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    try {
      const { phoneNumber, occupation, bio, status, secondaryEmail } = req.body;
      const updateData = {
        phoneNumber: phoneNumber || null,
        occupation: occupation || null,
        bio: bio || null,
        status: status || null,
        secondaryEmail: secondaryEmail || null
      };

      if (req.file) {
        updateData.profilePhoto = `/profile-photos/${req.file.filename}`;
        await deleteOldProfilePhoto(req.user.id);
      }

      if (secondaryEmail) {
        const existingUser = await prisma.user.findFirst({
          where: {
            secondaryEmail,
            NOT: { id: req.user.id }
          }
        });
        
        if (existingUser) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Secondary email already in use' });
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: {
          phoneNumber: true,
          occupation: true,
          bio: true,
          status: true,
          secondaryEmail: true,
          profilePhoto: true
        }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

export const updatePersonalInfo = async (req, res) => {
  try {
    const { firstName, lastName, emailAddress, username } = req.body;

    if (!firstName || !lastName || !emailAddress || !username) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const emailExists = await prisma.user.findFirst({
      where: {
        emailAddress,
        NOT: { id: req.user.id }
      }
    });
    
    if (emailExists) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const usernameExists = await prisma.user.findFirst({
      where: {
        username,
        NOT: { id: req.user.id }
      }
    });
    
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already in use' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        emailAddress,
        username
      },
      select: {
        firstName: true,
        lastName: true,
        emailAddress: true,
        username: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating personal info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { password: true }
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};