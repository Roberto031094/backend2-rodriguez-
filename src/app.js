import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { create } from 'express-handlebars';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Config Handlebars
const hbs = create({
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  defaultLayout: 'main',
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views','layouts'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

// Las rutas
import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import viewsRouter from './routes/views.router.js';

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);
app.use('/', viewsRouter);

// Config server
const httpServer = app.listen(8080, () => {
  console.log('Servidor escuchando en http://localhost:8080');
});

// Config WebSockets
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
  },
});

// Importar el controlador de WebSockets para productos
import { configureIO } from './routes/products.router.js';
configureIO(io);

// Evento de conexión
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Ruta para eliminar productos
app.delete('/productos/:id', (req, res) => {
  const productId = req.params.id;
  
  console.log(`Producto con ID ${productId} eliminado`);

  io.emit('productDeleted', productId);

  res.sendStatus(200);
});


io.on('connection', (socket) => {
    console.log('Un cliente se ha conectado.');

    // Escucha el evento 'addProduct'
    socket.on('addProduct', (newProduct) => {
        // Lógica para agregar el producto a la base de datos o arreglo
        io.emit('productAdded', newProduct); // Emite el evento para actualizar la lista
    });

    // Escucha el evento 'deleteProduct'
    socket.on('deleteProduct', (productId) => {
        // Lógica para eliminar el producto de la base de datos o del arreglo
        // Aquí deberías eliminar el producto por su ID
        console.log(`Producto con ID: ${productId} eliminado.`);

        // Luego, emite el evento para notificar a todos los clientes
        io.emit('productDeleted', productId);
    });

    socket.on('disconnect', () => {
        console.log('Un cliente se ha desconectado.');
    });
});