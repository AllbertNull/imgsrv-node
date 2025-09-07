import sharp from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import mime from 'mime-types';
import { Request, Response, NextFunction } from 'express';
import { ImageOptions, ProcessedImageResponse, ImageRequest, ImageMetadata } from '../types';
import { IMAGE_QUALITY, DEFAULT_FIT, MAX_SCALE_FACTOR } from '../config/constants';
import { parseOptions, validateScale, calculateTargetDimensions } from '../utils/validators';
import { ImageMapper } from '../utils/imageMapper';
import { ImageCache } from '../utils/cache';

// Inicializar caché
const imageCache = new ImageCache();

// Función para obtener metadatos de la imagen
export async function getImageMetadata(imagePath: string): Promise<ImageMetadata> {
	const metadata = await sharp(imagePath).metadata();
	return {
		width: metadata.width || 0,
		height: metadata.height || 0,
		format: metadata.format || '',
		space: metadata.space || '',
		channels: metadata.channels || 0,
		density: metadata.density || 0,
		hasProfile: metadata.hasProfile || false,
		hasAlpha: metadata.hasAlpha || false
	};
}

// Función principal de procesamiento de imágenes
export async function processImage(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const imageRequest = req as ImageRequest;
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

		// Obtener la ruta real de la imagen desde la base de datos
		const imagePath = ImageMapper.getImagePathById(imageId);

		if (!imagePath) {
			res.status(404).json({ error: 'Imagen no encontrada para el ID proporcionado' });
			return;
		}

		// Parsear opciones
		const options = parseOptions(optionsString);
		imageRequest.parsedOptions = options;
		imageRequest.imagePath = imagePath;

		// Verificar si ya está en caché
		const cacheKey = imageCache.generateKey(options, imagePath);
		const cachedImage = await imageCache.get(cacheKey);

		if (cachedImage) {
			res.setHeader('Content-Type', cachedImage.mimeType);
			res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 días
			res.setHeader('X-Image-Cache', 'HIT');
			res.send(cachedImage.buffer);
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
		imageRequest.originalWidth = metadata.width;
		imageRequest.originalHeight = metadata.height;

		// Procesar la imagen
		const result = await transformImage(fullImagePath, options, metadata);

		if (!result.success || !result.buffer) {
			res.status(500).json({ error: 'Error procesando la imagen', message: result.message });
			return;
		}

		// Almacenar en caché
		await imageCache.set(cacheKey, {
			buffer: result.buffer,
			mimeType: result.mimeType || 'image/avif',
			timestamp: Date.now()
		});

		// Configurar headers de respuesta
		res.setHeader('Content-Type', result.mimeType || 'image/avif');
		res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 días
		res.setHeader('X-Image-Processor', 'NodeJS-Sharp-TypeScript');
		res.setHeader('X-Image-Cache', 'MISS');
		res.setHeader('X-Original-Width', metadata.width.toString());
		res.setHeader('X-Original-Height', metadata.height.toString());

		// Enviar imagen procesada
		res.send(result.buffer);

	} catch (error) {
		console.error('Error procesando imagen:', error);
		next(error);
	}
}

// Función para transformar la imagen con soporte para escalado real
async function transformImage(imagePath: string, options: ImageOptions, metadata: ImageMetadata): Promise<ProcessedImageResponse> {
	try {
		const { format, quality, width, height, fit } = options;
		const { width: originalWidth, height: originalHeight } = metadata;

		// Calcular dimensiones objetivo
		const { targetWidth, targetHeight } = calculateTargetDimensions(
			originalWidth,
			originalHeight,
			width,
			height
		);

		// Validar escala máxima
		const scaleError = validateScale(originalWidth, originalHeight, targetWidth, targetHeight);
		if (scaleError) {
			return {
				success: false,
				message: scaleError
			};
		}

		// Configurar opciones de sharp
		let transform = sharp(imagePath);

		// Aplicar redimensionamiento si es necesario
		if (targetWidth !== originalWidth || targetHeight !== originalHeight) {
			transform = transform.resize({
				width: targetWidth,
				height: targetHeight,
				fit: fit || DEFAULT_FIT,
				withoutEnlargement: false, // Permitir agrandamiento
				kernel: 'lanczos3' // Kernel de alta calidad para escalado
			});
		}

		// Aplicar formato y calidad
		switch (format) {
			case 'avif':
				transform = transform.avif({
					quality: quality || IMAGE_QUALITY,
					effort: 4
				});
				break;
			case 'webp':
				transform = transform.webp({
					quality: quality || IMAGE_QUALITY
				});
				break;
			case 'jpeg':
			case 'jpg':
				transform = transform.jpeg({
					quality: quality || IMAGE_QUALITY,
					mozjpeg: true
				});
				break;
			case 'png':
				transform = transform.png({
					quality: quality || IMAGE_QUALITY,
					compressionLevel: 9
				});
				break;
			case 'heif':
				transform = transform.heif({
					quality: quality || IMAGE_QUALITY,
					compression: 'av1' // Usar compresión AV1 para HEIF
				});
				break;
			default:
				transform = transform.avif({
					quality: quality || IMAGE_QUALITY,
					effort: 4
				});
				break;
		}

		// Convertir a buffer
		const buffer = await transform.toBuffer();
		const mimeType = mime.lookup(format || 'avif') || 'image/avif';

		return {
			success: true,
			buffer,
			mimeType: mimeType as string
		};

	} catch (error) {
		console.error('Error transformando imagen:', error);
		return {
			success: false,
			message: error instanceof Error ? error.message : 'Error desconocido transformando imagen'
		};
	}
}