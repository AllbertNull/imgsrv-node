import { ImageOptions } from '../types';
import { ALLOWED_FORMATS, IMAGE_QUALITY, DEFAULT_FIT, DEFAULT_FORMAT } from '../config/constants';

export function validateOptions(options: Partial<ImageOptions>): ImageOptions {
	const validated: ImageOptions = {
		format: DEFAULT_FORMAT,
		quality: IMAGE_QUALITY,
		fit: DEFAULT_FIT,
		...options
	};

	// Validar y ajustar calidad
	if (validated.quality && (validated.quality < 1 || validated.quality > 100)) {
		validated.quality = IMAGE_QUALITY;
	}

	// Validar dimensiones
	if (validated.width && validated.width < 1) {
		validated.width = undefined;
	}

	if (validated.height && validated.height < 1) {
		validated.height = undefined;
	}

	return validated as ImageOptions;
}

export function isValidImageFormat(format: string): boolean {
	return ALLOWED_FORMATS.includes(format.toLowerCase());
}

export function parseOptions(optionsString: string): ImageOptions {
	const options: Partial<ImageOptions> = {};
	const params = optionsString.split(',');

	params.forEach(param => {
		const [key, value] = param.split('=');
		if (key && value) {
			switch (key) {
				case 'format':
					if (['avif', 'webp', 'jpeg', 'jpg', 'png'].includes(value)) {
						options.format = value as ImageOptions['format'];
					}
					break;
				case 'quality':
					const quality = parseInt(value);
					if (!isNaN(quality) && quality >= 1 && quality <= 100) {
						options.quality = quality;
					}
					break;
				case 'width':
					const width = parseInt(value);
					if (!isNaN(width) && width > 0) {
						options.width = width;
					}
					break;
				case 'height':
					const height = parseInt(value);
					if (!isNaN(height) && height > 0) {
						options.height = height;
					}
					break;
				case 'fit':
					if (['cover', 'contain', 'fill', 'inside', 'outside'].includes(value)) {
						options.fit = value as ImageOptions['fit'];
					}
					break;
			}
		}
	});

	return validateOptions(options);
}