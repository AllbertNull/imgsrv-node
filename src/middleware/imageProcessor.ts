import sharp, { ResizeOptions } from 'sharp';
import path from 'path';
import fs from 'fs-extra';
import mime from 'mime-types';
import { Request, Response, NextFunction } from 'express';
import { ImageOptions, ProcessedImageResponse, ImageRequest } from '../types';
import { IMAGE_QUALITY, DEFAULT_FIT, DEFAULT_WIDTH } from '../config/constants';
import { parseOptions, isValidImageFormat } from '../utils/validators';

// Función principal de procesamiento de imágenes
export async function processImage(req: Request, res: Response, next: NextFunction): Promise<void> {
	try {
		const imageRequest = req as ImageRequest;
		const params = req.params[0];

		if (!params) {
			res.status(400).send('URL de imagen no válida');
			return;
		}

		// Extraer parámetros de la URL
		const urlParts = params.split('/');
		const optionsString = urlParts[0];
		const imagePath = urlParts.slice(1).join('/');

		if (!imagePath) {
			res.status(400).send('Ruta de imagen no especificada');
			return;
		}

		// Parsear opciones
		const options = parseOptions(optionsString);
		imageRequest.parsedOptions = options;
		imageRequest.imagePath = imagePath;

		const fullImagePath = path.join(__dirname, '../../static/images', imagePath);

		// Verificar si la imagen existe
		if (!await fs.pathExists(fullImagePath)) {
			res.status(404).send('Imagen no encontrada');
			return;
		}

		// Verificar formato de imagen
		const fileExtension = imagePath.split('.').pop()?.toLowerCase() || '';
		if (!isValidImageFormat(fileExtension)) {
			res.status(400).send('Formato de imagen no soportado');
			return;
		}

		// Procesar la imagen
		const result = await transformImage(fullImagePath, options);

		if (!result.success || !result.buffer) {
			res.status(500).send(result.message || 'Error procesando la imagen');
			return;
		}

		// Configurar headers de respuesta
		res.setHeader('Content-Type', result.mimeType || 'image/avif');
		res.setHeader('Cache-Control', `public, max-age=${86400 * 30}`); // 30 días
		res.setHeader('X-Image-Processor', 'NodeJS-Sharp-TypeScript');
		res.setHeader('X-Image-Options', JSON.stringify(options));

		// Enviar imagen procesada
		res.send(result.buffer);

	} catch (error) {
		console.error('Error procesando imagen:', error);
		next(error);
	}
}

// Función para transformar la imagen
async function transformImage(imagePath: string, options: ImageOptions): Promise<ProcessedImageResponse> {
	try {
		const { format, quality, width, height, fit } = options;

		// Configurar opciones de sharp
		let transform = sharp(imagePath);

		// Aplicar redimensionamiento si es necesario
		if (width || height) {
			const resizeOptions: ResizeOptions = {
				width: width || undefined,
				height: height || undefined,
				fit: fit || DEFAULT_FIT,
				withoutEnlargement: true
			};

			transform = transform.resize(resizeOptions);
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