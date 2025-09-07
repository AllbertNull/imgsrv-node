import express from 'express';
import { authenticateToken, generateAccessToken, verifyAdminCredentials } from '../middleware/auth';
import { ImageMapper, loadMappings } from '../utils/imageMapper';

const router = express.Router();

// Ruta de login para obtener token
router.post('/login', async (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
	}

	const isValid = await verifyAdminCredentials(username, password);
	if (!isValid) {
		return res.status(401).json({ error: 'Credenciales inválidas' });
	}

	const token = generateAccessToken(username);
	res.json({ token });
});

// Todas las rutas siguientes requieren autenticación
router.use(authenticateToken);

// Listar todos los mapeos
router.get('/mappings', (req, res) => {
	res.json(ImageMapper.getAllMappings());
});

// Obtener un mapeo específico
router.get('/mappings/:id', (req, res) => {
	const { id } = req.params;
	const path = ImageMapper.getImagePathById(id);

	if (!path) {
		return res.status(404).json({ error: 'Mapeo no encontrado' });
	}

	res.json({ id, path });
});

// Agregar un nuevo mapeo
router.post('/mappings', async (req, res) => {
	const { id, path, description } = req.body;

	if (!id || !path) {
		return res.status(400).json({ error: 'ID y path son requeridos' });
	}

	const success = await ImageMapper.addMapping({ id, path, description });
	if (!success) {
		return res.status(409).json({ error: 'El ID ya existe' });
	}

	res.status(201).json({ message: 'Mapeo agregado correctamente', id, path });
});

// Actualizar un mapeo existente
router.put('/mappings/:id', async (req, res) => {
	const { id } = req.params;
	const { path, description } = req.body;

	if (!path) {
		return res.status(400).json({ error: 'Path es requerido' });
	}

	const success = await ImageMapper.updateMapping(id, { path, description });
	if (!success) {
		return res.status(404).json({ error: 'Mapeo no encontrado' });
	}

	res.json({ message: 'Mapeo actualizado correctamente', id, path });
});

// Eliminar un mapeo
router.delete('/mappings/:id', async (req, res) => {
	const { id } = req.params;

	const success = await ImageMapper.deleteMapping(id);
	if (!success) {
		return res.status(404).json({ error: 'Mapeo no encontrado' });
	}

	res.json({ message: 'Mapeo eliminado correctamente' });
});

// Recargar mapeos desde el archivo
router.post('/reload-mappings', async (req, res) => {
	await loadMappings();
	res.json({ message: 'Mapeos recargados correctamente' });
});

export default router;