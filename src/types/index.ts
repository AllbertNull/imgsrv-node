export interface ImageOptions {
	format?: 'avif' | 'webp' | 'jpeg' | 'jpg' | 'png' | 'heif';
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
	originalWidth?: number;
	originalHeight?: number;
}

export interface ResizeOptions {
	width?: number;
	height?: number;
	fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	withoutEnlargement?: boolean;
}

export interface ImageMapping {
	id: string;
	path: string;
	description?: string;
}

export interface User {
	username: string;
	password: string;
}

export interface AuthRequest extends Express.Request {
	headers: any;
	user?: { username: string };
}

export interface ImageMetadata {
	width: number;
	height: number;
	format: string;
	space: string;
	channels: number;
	density: number;
	hasProfile: boolean;
	hasAlpha: boolean;
}