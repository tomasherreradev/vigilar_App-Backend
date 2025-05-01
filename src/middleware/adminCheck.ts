import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';

declare module 'express' {
  interface Request {
    user?: User;
  }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

export const adminCheck = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de autenticación no proporcionado' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
      }

      const decodedUser = decoded as User;

      if (decodedUser.role !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos de administrador' });
      }

      req.user = decodedUser;
      next();
    });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};