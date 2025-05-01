import { db } from "../config/firebaseConfig";
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import admin from 'firebase-admin';
import * as ExcelJS from 'exceljs';


interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  status: 'active' | 'inactive';
  role: string;
  createdAt: admin.firestore.Timestamp;
}


export const getAllUsers = async (req: Request, res: Response) => {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(users);
};


export const activateUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
  
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      const usersRef = db.collection('users');
      const userDoc = await usersRef.doc(userId).get();
  
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const user = userDoc.data() as User;
  
      if (user.status === 'active') {
        return res.status(400).json({ error: 'User is already active' });
      }
  
      await userDoc.ref.update({ status: 'active' });
  
      res.status(200).json({ message: 'User activated successfully' });
    } catch (error) {
      console.error('Activation error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};


export const getUser = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
  
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      const usersRef = db.collection('users');
      const userDoc = await usersRef.doc(userId).get();
  
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      const user = userDoc.data() as User;
  
      res.status(200).json({ user });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};


export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, email, role, status, password } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const usersRef = db.collection('users');
    const userDoc = await usersRef.doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    const updateData: Partial<User> = {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
      ...(status && { status }),
    };

    
    if (password) {
      const salt = await bcrypt.genSalt(10); 
      const hashedPassword = await bcrypt.hash(password, salt); 
      updateData.password = hashedPassword; 
    }

    
    await userDoc.ref.update(updateData);

    res.status(200).json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const deleteUser = async (req: Request, res: Response) => {  
    try {
      const { userId } = req.params;
  
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
  
      const usersRef = db.collection('users');
      const userDoc = await usersRef.doc(userId).get();
  
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      await userDoc.ref.delete();
  
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};






export const getScans = async (req: Request, res: Response) => {
  try {
    const { userName, zone, date, page = '1', limit = '10' } = req.query;

    const pageNumber = parseInt(page.toString(), 10);
    const limitNumber = parseInt(limit.toString(), 10);
    const offset = (pageNumber - 1) * limitNumber;

    let userIds: string[] = [];
    if (userName) {
      const usersSnap = await db.collection('users')
        .where('name', '>=', userName.toString().toLowerCase())
        .where('name', '<=', userName.toString().toLowerCase() + '\uf8ff')
        .get();
      userIds = usersSnap.docs.map(doc => doc.id);
    }

    const scansSnap = await db.collection('scans').get();

    let scansWithUser = await Promise.all(
      scansSnap.docs.map(async doc => {
        const data = doc.data();
        const userDoc = await db.collection('users').doc(data.userId).get();
        const user = userDoc.exists ? userDoc.data() : null;

        return {
          id: doc.id,
          scanData: data.scanData,
          scanType: data.scanType,
          timestamp: data.timestamp,
          zone: data.zone,
          userId: data.userId,
          userName: user?.name || '—'
        };
      })
    );

    if (userName && userIds.length > 0) {
      scansWithUser = scansWithUser.filter(scan =>
        userIds.includes(scan.userId)
      );
    } else if (userName) {
      scansWithUser = [];
    }

    if (zone) {
      scansWithUser = scansWithUser.filter(scan =>
        scan.zone.toLowerCase().includes(zone.toString().toLowerCase())
      );
    }

    if (date) {
      const filterDate = new Date(date.toString());
      const filterDateStr = filterDate.toISOString().split('T')[0];

      scansWithUser = scansWithUser.filter(scan => {
        const scanDate = new Date(scan.timestamp);
        const scanDateStr = scanDate.toISOString().split('T')[0];
        return scanDateStr === filterDateStr;
      });
    }

    const total = scansWithUser.length;
    const paginated = scansWithUser.slice(offset, offset + limitNumber);

    res.json({ scans: paginated, total });
  } catch (error) {
    console.error('Error al obtener escaneos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};



export const exportScans = async (req: Request, res: Response) => {
  try {
    const scansSnapshot = await db.collection('scans').get();
    
    const scans = await Promise.all(
      scansSnapshot.docs.map(async (doc) => {
        const scanData = doc.data();
        const userDoc = await db.collection('users').doc(scanData.userId).get();
        const user = userDoc.exists ? userDoc.data() : null;
        
        
        const timestampArg = new Date(new Date(scanData.timestamp).getTime() - (3 * 60 * 60 * 1000));
        
        return {
          userName: user?.name || 'Desconocido',  
          zone: scanData.zone,
          fecha: timestampArg,  
          hora: timestampArg,   
          scanType: scanData.scanType, 
        };
      })
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Escaneos');

    
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getFullYear()}`;

    
    worksheet.columns = [
      { header: 'Usuario', key: 'userName', width: 25 },  
      { header: 'Zona', key: 'zone', width: 20 },
      { 
        header: 'Fecha', 
        key: 'fecha', 
        width: 15,
        style: { numFmt: 'dd/mm/yyyy' } 
      },
      { 
        header: 'Hora', 
        key: 'hora', 
        width: 12,
        style: { numFmt: 'hh:mm' } 
      }
    ];

    
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF007BFF' } 
      };
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' } 
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    
    scans.forEach(scan => {
      const row = worksheet.addRow({
        userName: scan.userName,
        zone: scan.zone,
        fecha: scan.fecha,
        hora: scan.hora
      });
      
      
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: rowNumber % 2 === 0 ? 'FFF8F9FA' : 'FFFFFFFF' }
          };
        });
      }
    });

    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=asistencia-${formattedDate}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar el archivo Excel:', error);
    res.status(500).json({ error: 'Error al generar el archivo Excel' });
  }
};