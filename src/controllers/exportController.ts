import express, { Request, Response } from 'express';
import { db } from '../config/firebaseConfig';
import * as XLSX from 'xlsx';



export const exportScans = async (req: Request, res: Response) => {
    try {
      const snapshot = await db.collection('scans').get();
  
      const scans = snapshot.docs.map(doc => doc.data());
  
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(scans);
      XLSX.utils.book_append_sheet(wb, ws, 'Escaneos');
  
      const file = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  
      res.setHeader('Content-Disposition', 'attachment; filename=escaneos.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(file);
    } catch (error) {
      console.error('Error al exportar los escaneos:', error);
      res.status(500).json({ message: 'Error al exportar los escaneos' });
    }
};