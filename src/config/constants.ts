export const PORT: number = parseInt(process.env.PORT || '3000');
export const IMAGE_QUALITY: number = parseInt(process.env.IMAGE_QUALITY || '85');
export const CACHE_MAX_AGE: number = parseInt(process.env.CACHE_MAX_AGE || '604800'); // 7 días en segundos
export const CACHE_MAX_SIZE: number = parseInt(process.env.CACHE_MAX_SIZE || '100'); // 100MB
export const ALLOWED_FORMATS: string[] = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff'];
export const DEFAULT_WIDTH: number = 1920;
export const DEFAULT_FIT: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' = 'cover';
export const DEFAULT_FORMAT: 'avif' | 'webp' | 'jpeg' | 'jpg' | 'png' = 'avif';