import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS as string);
const databaseURL = process.env.DATABASE_URL;


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: databaseURL as string
});

const db = admin.firestore();

export { db };
