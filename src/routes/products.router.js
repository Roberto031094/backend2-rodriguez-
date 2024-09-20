import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';

const router = express.Router();
const productsFilePath = path.join(process.cwd(), 'src', 'data', 'productos.json');
let io; 

const readProductsFile = () => {
  try {
    if (!fs.existsSync(productsFilePath)) return [];
    const data = fs.readFileSync(productsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error al leer el archivo productos.json:', error);
    return [];
  }
};

const writeProductsFile = (products) => {
  try {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
    console.log('Archivo productos.json actualizado correctamente.');
  } catch (error) {
    console.error('Error al escribir el archivo productos.json:', error);
  }
};

// Config de io
export const configureIO = (socketServer) => {
  io = socketServer;

  io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');

    socket.on('addProduct', (newProduct) => {
      // Usé esto para dar un ID único
      newProduct.id = uuidv4();

      const products = readProductsFile();
      products.push(newProduct);
      writeProductsFile(products);

      io.emit('productAdded', newProduct);
    });
  });
};


// GET de todos los productos
router.get('/', (req, res) => {
  const products = readProductsFile();
  const limit = req.query.limit;
  res.json(limit ? products.slice(0, limit) : products);
});

// GET de producto según id
router.get('/:pid', (req, res) => {
  const { pid } = req.params;
  const products = readProductsFile();
  const product = products.find(p => p.id === pid);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

// POST del producto
router.post('/', (req, res) => {
  const { title, description, code, price, stock, category, thumbnails = [] } = req.body;

  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios, excepto thumbnails.' });
  }

  const products = readProductsFile();

  const newProduct = {
    id: uuidv4(),
    title,
    description,
    code,
    price,
    status: true,
    stock,
    category,
    thumbnails
  };

  products.push(newProduct);
  console.log('Nuevo producto agregado:', newProduct); 
  writeProductsFile(products);

  res.status(201).json(newProduct);

  if (io) {
    io.emit('productAdded', newProduct);
    io.emit('productListUpdate', products);
  }
});

// PUT del producto
router.put('/:pid', (req, res) => {
  const { pid } = req.params;
  const { id, ...updates } = req.body;

  const products = readProductsFile();
  const productIndex = products.findIndex(p => p.id === pid);

  if (productIndex !== -1) {
    products[productIndex] = { ...products[productIndex], ...updates };
    writeProductsFile(products);
    res.json(products[productIndex]);
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

// DELETE del producto
router.delete('/:pid', (req, res) => {
  const { pid } = req.params;
  const products = readProductsFile();
  const productIndex = products.findIndex(p => p.id === pid);

  if (productIndex !== -1) {
    const deletedProduct = products.splice(productIndex, 1);
    writeProductsFile(products); 
    res.json(deletedProduct);

    if (io) {
      io.emit('productDeleted', pid);
    }
  } else {
    res.status(404).json({ message: 'Producto no encontrado' });
  }
});

// Ruta para la vista home
router.get('/home', (req, res) => {
  const products = readProductsFile();
  res.render('home', { products });
});

// Ruta para la vista realTimeProducts
router.get('/realtimeproducts', (req, res) => {
  const products = readProductsFile();
  res.render('realTimeProducts', { products });
});

export { readProductsFile };
export default router;
