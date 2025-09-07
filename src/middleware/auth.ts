import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../types';
import { JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD } from '../config/constants';

// Middleware para verificar el token JWT
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
	const authHeader = req.headers['authorization'];
	const token = authHeader && authHeader.split(' ')[1];

	if (!token) {
		res.status(401).json({ error: 'Token de acceso requerido' });
		return;
	}

	jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
		if (err) {
			res.status(403).json({ error: 'Token inválido o expirado' });
			return;
		}

		req.user = user;
		next();
	});
}

// Middleware para generar token de acceso
export function generateAccessToken(username: string): string {
	return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
}

// Función para verificar credenciales de administrador
export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
	if (username !== ADMIN_USERNAME) {
		return false;
	}

	// En un entorno real, deberías usar hash de contraseñas
	// Aquí usamos una comparación simple para demostración
	return password === ADMIN_PASSWORD;
}