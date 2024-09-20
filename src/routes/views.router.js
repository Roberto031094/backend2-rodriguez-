import express from 'express';
import { readProductsFile } from './products.router.js';

const router = express.Router();

// Ruta de la página de inicio
router.get('/', (req, res) => {
    res.render('home', { title: 'Página de Inicio', message: 'Bienvenido a la tienda de productos' });
});

// Ruta para la vista de productos en tiempo real
router.get('/realtimeproducts', (req, res) => {
    const products = readProductsFile();
    res.render('realtimeproducts', { products });
});

export default router;

