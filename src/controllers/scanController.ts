import { Request, Response } from 'express';
import { db } from '../config/firebaseConfig';
import { notifyAdmin } from '../utils/notifications';


export const sendScan = async (req: Request, res: Response) => {
    const { userId, scanData, scanType, timestamp, zone } = req.body;
  
    if (!userId || !scanData || !scanType || !timestamp || !zone) {
      return res.status(400).json({ message: 'Faltan datos' });
    }
  
    const scan = { userId, scanData, scanType, timestamp, zone };
  
    try {
      const scanRef = await db.collection('scans').add(scan);
  
      console.log('Nuevo escaneo registrado:', scan);
  
      notifyAdmin(scan);
  
      res.status(201).json({ message: 'Escaneo registrado', scan });
    } catch (error) {
      console.error('Error al guardar el escaneo en Firestore:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
};



