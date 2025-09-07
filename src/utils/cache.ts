import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { CacheItem } from '../types';

export class ImageCache {
	private cacheDir: string;
	private maxSize: number;
	private currentSize: number = 0;
	private cacheMap: Map<string, CacheItem> = new Map();

	constructor(cacheDir: string = path.join(__dirname, '../../cache'), maxSize: number = 100 * 1024 * 1024) {
		this.cacheDir = cacheDir;
		this.maxSize = maxSize;
		this.init();
	}

	async init(): Promise<void> {
		await fs.ensureDir(this.cacheDir);
		await this.cleanup();
	}

	generateKey(options: any, imagePath: string): string {
		const str = JSON.stringify({ options, imagePath });
		return crypto.createHash('md5').update(str).digest('hex');
	}

	async get(cacheKey: string): Promise<CacheItem | null> {
		// Primero verificar en memoria
		if (this.cacheMap.has(cacheKey)) {
			const item = this.cacheMap.get(cacheKey);
			if (!item) return null;

			// Actualizar timestamp para LRU
			this.cacheMap.delete(cacheKey);
			this.cacheMap.set(cacheKey, { ...item, timestamp: Date.now() });
			return item;
		}

		// Si no está en memoria, verificar en disco
		const cachePath = path.join(this.cacheDir, `${cacheKey}`);
		if (await fs.pathExists(cachePath)) {
			try {
				const data = await fs.readJson(cachePath);
				const buffer = Buffer.from(data.buffer.data);

				const item: CacheItem = {
					buffer,
					mimeType: data.mimeType,
					timestamp: data.timestamp
				};

				// Almacenar en memoria para futuras solicitudes
				this.addToMemory(cacheKey, item);

				return item;
			} catch (error) {
				console.error('Error reading cache file:', error);
				return null;
			}
		}

		return null;
	}

	async set(cacheKey: string, item: CacheItem): Promise<void> {
		// Almacenar en memoria
		this.addToMemory(cacheKey, item);

		// Almacenar en disco de forma asíncrona
		try {
			const cachePath = path.join(this.cacheDir, `${cacheKey}`);
			const data = {
				buffer: item.buffer,
				mimeType: item.mimeType,
				timestamp: item.timestamp
			};

			await fs.writeJson(cachePath, data);
		} catch (error) {
			console.error('Error writing cache file:', error);
		}
	}

	private addToMemory(cacheKey: string, item: CacheItem): void {
		const itemSize = item.buffer.length;

		// Si excede el tamaño máximo, limpiar elementos más antiguos
		while (this.currentSize + itemSize > this.maxSize && this.cacheMap.size > 0) {
			// Encontrar la clave más antigua de manera segura
			let oldestKey: string | null = null;
			let oldestTimestamp = Infinity;

			for (const [key, value] of this.cacheMap.entries()) {
				if (value.timestamp < oldestTimestamp) {
					oldestTimestamp = value.timestamp;
					oldestKey = key;
				}
			}

			// Eliminar el elemento más antiguo si se encontró
			if (oldestKey) {
				const oldestItem = this.cacheMap.get(oldestKey);
				if (oldestItem) {
					this.currentSize -= oldestItem.buffer.length;
					this.cacheMap.delete(oldestKey);
				}
			} else {
				// Si no se encuentra la clave más antigua, salir del bucle
				break;
			}
		}

		this.cacheMap.set(cacheKey, item);
		this.currentSize += itemSize;
	}

	async cleanup(): Promise<void> {
		try {
			const files = await fs.readdir(this.cacheDir);
			const now = Date.now();
			const weekAgo = now - (7 * 24 * 60 * 60 * 1000);

			for (const file of files) {
				const filePath = path.join(this.cacheDir, file);
				const stats = await fs.stat(filePath);

				if (stats.mtimeMs < weekAgo) {
					await fs.remove(filePath);
				}
			}
		} catch (error) {
			console.error('Error cleaning up cache:', error);
		}
	}
}