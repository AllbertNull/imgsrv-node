import express from 'express';
import { processImage } from '../middleware/imageProcessor';
import { validateImageParams, validateMaxScale } from '../middleware/validation';

const router = express.Router();

// Ruta para procesar imágenes con el nuevo formato: /cdn-cgi/image/params/ID
router.get('/*', validateImageParams, validateMaxScale, processImage);

export default router;