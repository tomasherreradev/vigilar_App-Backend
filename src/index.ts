import dotenv from 'dotenv';
import express from 'express';
import scanRoutes from './routes/scanRoutes';
import exportRoutes from './routes/exportRoutes';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';


dotenv.config();

import cors from 'cors';

const app = express();
const PORT = process.env.PORT;


app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api', scanRoutes);
app.use('/export', exportRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});