import express from 'express';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

import imageRoutes from './routes/images';
import { PORT } from './config/constants';

dotenv.config();

const app = express();

// Middleware de seguridad
app.use(helmet({
	contentSecurityPolicy: false,
	crossOriginEmbedderPolicy: false
}));

// Rutas de imágenes
app.use('/cdn-cgi/image', imageRoutes);

// Servir archivos estáticos
app.use('/static', express.static(path.join(__dirname, '../static')));

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	console.error(err.stack);
	res.status(500).send('Algo salió mal!');
});

// Ruta de salud
app.get('/health', (req, res) => {
	res.status(200).json({ status: 'OK', message: 'Servidor de imágenes funcionando' });
});

app.listen(PORT, () => {
	console.log(`Servidor de imágenes TypeScript ejecutándose en el puerto ${PORT}`);
	console.log(`Ejemplo: http://localhost:${PORT}/cdn-cgi/image/fit=cover,format=avif,quality=85,width=1920/keyart/imagen.jpg`);
});