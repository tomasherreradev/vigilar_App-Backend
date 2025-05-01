import { Router } from 'express';
import { exportScans } from '../controllers/exportController';

const router = Router();

router.post('/export', exportScans);

export default router;

