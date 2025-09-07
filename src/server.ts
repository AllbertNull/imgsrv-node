import express from 'express';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

import imageRoutes from './routes/images';
import adminRoutes from './routes/admin';
import { PORT, API_RATE_LIMIT } from './config/constants';
import { loadMappings } from './utils/imageMapper';

dotenv.config();

// Cargar mapeos de imágenes
loadMappings().catch(console.error);

const app = express();

// Configurar rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: API_RATE_LIMIT, // límite de solicitudes por ventana
	message: { error: 'Demasiadas solicitudes, intenta más tarde' }
});

// Middleware
app.use(helmet({
	contentSecurityPolicy: false,
	crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));

// Rutas
app.use('/cdn-cgi/image', imageRoutes);
app.use('/admin', adminRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
	res.status(200).json({
		status: 'OK',
		message: 'Servidor CDN funcionando',
		timestamp: new Date().toISOString()
	});
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error(err.stack);
	res.status(500).json({ error: 'Error interno del servidor' });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
	res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
	console.log(`Servidor CDN ejecutándose en el puerto ${PORT}`);
	console.log(`Health check: http://localhost:${PORT}/health`);
	console.log(`Endpoint de imágenes: http://localhost:${PORT}/cdn-cgi/image/fit=cover,format=avif,quality=85,width=1920/[id]`);
	console.log(`Admin API: http://localhost:${PORT}/admin/login`);
});