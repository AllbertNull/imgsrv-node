import express from 'express';
import { processImage } from '../middleware/imageProcessor';

const router = express.Router();

// Ruta para procesar imágenes con parámetros en la URL
router.get('/*', processImage);

export default router;