import { db } from '../config/firebaseConfig';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/User.model';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;
const SALT_ROUNDS = 10;




export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required',
        code: 'CREDENTIALS_REQUIRED'
      });
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.trim().toLowerCase()).get();

    if (snapshot.empty) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }); 
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as User;

    let isPasswordValid = false;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      return res.status(500).json({
        success: false,
        error: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    if(user.status !== 'active') {
      return res.status(403).json({ 
        success: false,
        error: 'Account not active',
        code: 'ACCOUNT_INACTIVE',
        details: 'Please contact support to activate your account'
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '1h' }  
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword,
      token,
      expiresIn: 3600 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

export const authenticate = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ 
        error: err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid or expired token' 
      });
    }

    (req as any).user = user; 
    next();
  });
};


export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (!snapshot.empty) {
      return res.status(400).json({ error: 'User already exists' });
    }

    
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser: User = {
      id: uuidv4(),
      email,
      password: hashedPassword, 
      name,
      status: 'inactive',
      role: 'user', 
      createdAt: admin.firestore.Timestamp.now()
    };

    await usersRef.doc(newUser.id).set(newUser);
    
    
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response) => {
  res.json({ message: 'Logout successful' });
};
