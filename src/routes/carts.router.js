import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const cartsFilePath = path.join(process.cwd(), 'src', 'data', 'carrito.json');

const readCartsFile = () => {
    if (!fs.existsSync(cartsFilePath)) return [];
    const data = fs.readFileSync(cartsFilePath, 'utf-8');
    return JSON.parse(data);
};

const writeCartsFile = (carts) => {
    fs.writeFileSync(cartsFilePath, JSON.stringify(carts, null, 2));
};

// GET general (Lo hice para probar la ruta)
router.get('/', (req, res) => {
    const carts = readCartsFile();
    res.status(200).json({
        message: 'Lista de carritos',
        carts
    });
});

// POST para crear un carrito
router.post('/', (req, res) => {
    const { product, quantity } = req.body;

    if (!product || !quantity) {
        return res.status(400).json({ message: 'Los campos product y quantity son obligatorios.' });
    }

    const carts = readCartsFile();

    const newCart = {
        id: uuidv4(),
        products: [{ product, quantity }] 
    };

    carts.push(newCart);
    writeCartsFile(carts);

    res.status(201).json({
        message: 'Nuevo carrito creado',
        cart: newCart
    });
});

// GET para obtener los productos de un carrito por ID
router.get('/:cid', (req, res) => {
    const { cid } = req.params;
    const carts = readCartsFile();
    const cart = carts.find(c => c.id === cid);

    if (!cart) {
        return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    res.status(200).json({
        message: 'Productos en el carrito',
        products: cart.products
    });
});

// POST para agregar un producto a un carrito existente
router.post('/:cid/product/:pid', (req, res) => {
    const { cid, pid } = req.params;
    const carts = readCartsFile();
    const cart = carts.find(c => c.id === cid);

    if (!cart) {
        return res.status(404).json({ message: 'Carrito no encontrado' });
    }

    const existingProduct = cart.products.find(p => p.product === pid);

    if (existingProduct) {
        existingProduct.quantity += 1;
    } else {
        const newProduct = {
            product: pid,
            quantity: 1
        };
        cart.products.push(newProduct);
    }

    writeCartsFile(carts);

    res.status(200).json({
        message: 'Producto agregado al carrito',
        cart: cart
    });
});

export default router;
