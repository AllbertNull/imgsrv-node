import { ImageOptions } from '../types';
import {
	IMAGE_QUALITY,
	DEFAULT_FIT,
	DEFAULT_FORMAT,
	MAX_SCALE_FACTOR,
	ALLOWED_OUTPUT_FORMATS,
	ALLOWED_INPUT_FORMATS
} from '../config/constants';

export function validateOptions(options: Partial<ImageOptions>): ImageOptions {
	const validated: ImageOptions = {
		format: DEFAULT_FORMAT,
		quality: IMAGE_QUALITY,
		fit: DEFAULT_FIT,
		...options
	};

	if (validated.quality && (validated.quality < 1 || validated.quality > 100)) {
		validated.quality = IMAGE_QUALITY;
	}

	if (validated.width && validated.width < 1) {
		validated.width = undefined;
	}

	if (validated.height && validated.height < 1) {
		validated.height = undefined;
	}

	return validated;
}

export function isValidInputFormat(format: string): boolean {
	return ALLOWED_INPUT_FORMATS.includes(format.toLowerCase());
}

export function isValidOutputFormat(format: string): boolean {
	return ALLOWED_OUTPUT_FORMATS.includes(format.toLowerCase());
}

export function isValidFit(fit: string): boolean {
	return ['cover', 'contain', 'fill', 'inside', 'outside'].includes(fit);
}

export function validateScale(originalWidth: number, originalHeight: number, width?: number, height?: number): string | null {
	if (width && width > originalWidth * MAX_SCALE_FACTOR) {
		return `El ancho solicitado (${width}px) excede el factor de escala máximo (${MAX_SCALE_FACTOR}x). Máximo permitido: ${originalWidth * MAX_SCALE_FACTOR}px`;
	}

	if (height && height > originalHeight * MAX_SCALE_FACTOR) {
		return `El alto solicitado (${height}px) excede el factor de escala máximo (${MAX_SCALE_FACTOR}x). Máximo permitido: ${originalHeight * MAX_SCALE_FACTOR}px`;
	}

	return null;
}

export function calculateTargetDimensions(originalWidth: number, originalHeight: number, width?: number, height?: number): { targetWidth: number, targetHeight: number } {
	let targetWidth = width;
	let targetHeight = height;

	// Si solo se especifica un dimension, mantener aspect ratio
	if (width && !height) {
		targetHeight = Math.round(originalHeight * (width / originalWidth));
	} else if (height && !width) {
		targetWidth = Math.round(originalWidth * (height / originalHeight));
	} else if (!width && !height) {
		// Si no se especifican dimensiones, usar las originales
		targetWidth = originalWidth;
		targetHeight = originalHeight;
	}

	return {
		targetWidth: targetWidth || originalWidth,
		targetHeight: targetHeight || originalHeight
	};
}

export function parseOptions(optionsString: string): ImageOptions {
	const options: Partial<ImageOptions> = {};
	const params = optionsString.split(',');

	params.forEach(param => {
		const [key, value] = param.split('=');
		if (key && value) {
			switch (key) {
				case 'format':
					if (isValidOutputFormat(value)) {
						options.format = value as ImageOptions['format'];
					}
					break;
				case 'quality':
					const quality = parseInt(value, 10);
					if (!isNaN(quality) && quality >= 1 && quality <= 100) {
						options.quality = quality;
					}
					break;
				case 'width':
					const width = parseInt(value, 10);
					if (!isNaN(width) && width > 0) {
						options.width = width;
					}
					break;
				case 'height':
					const height = parseInt(value, 10);
					if (!isNaN(height) && height > 0) {
						options.height = height;
					}
					break;
				case 'fit':
					if (isValidFit(value)) {
						options.fit = value as ImageOptions['fit'];
					}
					break;
			}
		}
	});

	return validateOptions(options);
}