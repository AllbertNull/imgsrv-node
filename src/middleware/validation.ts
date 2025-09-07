import { Request, Response, NextFunction } from 'express';
import { isValidOutputFormat, isValidFit, validateScale, calculateTargetDimensions } from '../utils/validators';
import { getImageMetadata } from './imageProcessor';
import { ImageMapper } from '../utils/imageMapper';
import path from 'path';
import fs from 'fs-extra';

// Middleware para validar parámetros de imagen
export function validateImageParams(req: Request, res: Response, next: NextFunction): void {
	const { format, fit, width, height } = req.query;

	if (format && !isValidOutputFormat(format as string)) {
		res.status(400).json({
			error: 'Formato no válido',
			message: `Los formatos válidos son: avif, webp, jpeg, jpg, png, heif`
		});
		return;
	}

	if (fit && !isValidFit(fit as string)) {
		res.status(400).json({
			error: 'Modo de ajuste no válido',
			message: `Los modos de ajuste válidos son: cover, contain, fill, inside, outside`
		});
		return;
	}

	if (width && (isNaN(Number(width)) || Number(width) <= 0)) {
		res.status(400).json({
			error: 'Ancho no válido',
			message: 'El ancho debe ser un número positivo'
		});
		return;
	}

	if (height && (isNaN(Number(height)) || Number(height) <= 0)) {
		res.status(400).json({
			error: 'Alto no válido',
			message: 'El alto debe ser un número positivo'
		});
		return;
	}

	next();
}

// Middleware para validar escala máxima
export async function validateMaxScale(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const params = req.params[0];

		if (!params) {
			res.status(400).json({ error: 'URL de imagen no válida' });
			return;
		}

		// Dividir la URL en parámetros y ID de imagen
		const lastSlashIndex = params.lastIndexOf('/');
		if (lastSlashIndex === -1) {
			res.status(400).json({ error: 'Formato de URL incorrecto' });
			return;
		}

		const optionsString = params.substring(0, lastSlashIndex);
		const imageId = params.substring(lastSlashIndex + 1);

		if (!imageId) {
			res.status(400).json({ error: 'ID de imagen no especificado' });
			return;
		}

		// Obtener la ruta real de la imagen
		const imagePath = ImageMapper.getImagePathById(imageId);

		if (!imagePath) {
			res.status(404).json({ error: 'Imagen no encontrada para el ID proporcionado' });
			return;
		}

		const fullImagePath = path.join(__dirname, '../../static/images', imagePath);

		// Verificar si la imagen existe
		if (!await fs.pathExists(fullImagePath)) {
			res.status(404).json({ error: 'Imagen no encontrada en el sistema de archivos' });
			return;
		}

		// Obtener metadatos de la imagen original
		const metadata = await getImageMetadata(fullImagePath);
		const { width, height } = req.query;

		// Calcular dimensiones objetivo
		const { targetWidth, targetHeight } = calculateTargetDimensions(
			metadata.width,
			metadata.height,
			width ? Number(width) : undefined,
			height ? Number(height) : undefined
		);

		// Validar escala máxima
		const scaleError = validateScale(metadata.width, metadata.height, targetWidth, targetHeight);

		if (scaleError) {
			res.status(400).json({
				error: 'Escala excedida',
				message: scaleError
			});
			return;
		}

		next();
	} catch (error) {
		console.error('Error validando escala:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
}