import admin from 'firebase-admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  status: 'active' | 'inactive';
  role: string;
  createdAt: admin.firestore.Timestamp;
}