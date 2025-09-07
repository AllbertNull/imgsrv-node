import fs from 'fs-extra';
import path from 'path';
import { ImageMapping } from '../types';

const MAPPINGS_FILE = path.join(__dirname, '../../data/image-mappings.json');

// Cargar mapeos desde archivo
export let imageMappings: ImageMapping[] = [];

export async function loadMappings(): Promise<void> {
	try {
		await fs.ensureDir(path.dirname(MAPPINGS_FILE));
		if (await fs.pathExists(MAPPINGS_FILE)) {
			const data = await fs.readJson(MAPPINGS_FILE);
			imageMappings = data;
		} else {
			// Datos iniciales
			// imageMappings = [
			// 	{ id: "G8AN02", path: "keyart/thumb_01.png" },
			// 	{ id: "GXJHM3G58", path: "keyart/backdrop_wide.jpg" }
			// ];
			await saveMappings();
		}
	} catch (error) {
		console.error('Error loading image mappings:', error);
		imageMappings = [];
	}
}

export async function saveMappings(): Promise<void> {
	try {
		await fs.writeJson(MAPPINGS_FILE, imageMappings, { spaces: 2 });
	} catch (error) {
		console.error('Error saving image mappings:', error);
	}
}

export class ImageMapper {
	static getImagePathById(id: string): string | null {
		const mapping = imageMappings.find(item => item.id === id);
		return mapping ? mapping.path : null;
	}

	static getAllMappings(): ImageMapping[] {
		return imageMappings;
	}

	static async addMapping(mapping: ImageMapping): Promise<boolean> {
		// Evitar duplicados
		if (imageMappings.some(item => item.id === mapping.id)) {
			return false;
		}

		imageMappings.push(mapping);
		await saveMappings();
		return true;
	}

	static async updateMapping(id: string, updates: Partial<ImageMapping>): Promise<boolean> {
		const index = imageMappings.findIndex(item => item.id === id);
		if (index === -1) return false;

		imageMappings[index] = { ...imageMappings[index], ...updates };
		await saveMappings();
		return true;
	}

	static async deleteMapping(id: string): Promise<boolean> {
		const index = imageMappings.findIndex(item => item.id === id);
		if (index === -1) return false;

		imageMappings.splice(index, 1);
		await saveMappings();
		return true;
	}
}