import { Router } from 'express';
import { adminCheck } from '../middleware/adminCheck';
import { getAllUsers, getUser, updateUser, deleteUser, exportScans, getScans } from '../controllers/adminController';

const router = Router();

router.get('/user/all', adminCheck, getAllUsers);
router.get('/user/:userId', adminCheck, getUser);
router.put('/user/:userId', adminCheck, updateUser);
router.delete('/user/:userId', adminCheck, deleteUser);
router.get('/scans', adminCheck, getScans);
router.post('/export-scans', adminCheck, exportScans);


export default router;
