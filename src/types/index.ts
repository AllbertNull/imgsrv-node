export interface ImageOptions {
	format?: 'avif' | 'webp' | 'jpeg' | 'jpg' | 'png';
	quality?: number;
	width?: number;
	height?: number;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ProcessedImageResponse {
	success: boolean;
	message?: string;
	buffer?: Buffer;
	mimeType?: string;
}

export interface CacheItem {
	buffer: Buffer;
	mimeType: string;
	timestamp: number;
}

export interface ImageRequest extends Express.Request {
	parsedOptions?: ImageOptions;
	imagePath?: string;
}

// Tipo para los parámetros de resize de Sharp
export interface ResizeOptions {
	width?: number;
	height?: number;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	withoutEnlargement?: boolean;
}