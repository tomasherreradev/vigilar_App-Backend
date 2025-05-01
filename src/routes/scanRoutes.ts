import { Router } from 'express';
import { sendScan } from '../controllers/scanController';

const router = Router();

router.post('/scan', sendScan);

export default router;

