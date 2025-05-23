const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const Stripe = require('stripe');
const app = express();
const port = 3000;

const stripe = Stripe('sk_test_51RRij8RspDn1dTHMA7VmDkEFDCEaNmEcspbV76iODeIqnyGqXiN3yqrXRDTpNxaG2ST5iVzM54jtUKVWZSY8x8MH00W7e1l5Q3'); // Reemplaza con sk_test_...

app.use(cors({
  origin: 'https://proyecto-ropa.netlify.app'
}));
app.use(express.json());

const productosFile = 'productos.json';
const usuariosFile = 'usuarios.json';
const carritosFile = 'carritos.json';

async function inicializarArchivos() {
 try {
 await fs.access(productosFile);
 } catch {
 await fs.writeFile(productosFile, JSON.stringify([]));
 }
 try {
 await fs.access(usuariosFile);
 } catch {
 await fs.writeFile(usuariosFile, JSON.stringify([]));
 }
 try {
 await fs.access(carritosFile);
 } catch {
 await fs.writeFile(carritosFile, JSON.stringify({}));
 }
}
inicializarArchivos();

app.get('/api/productos', async (req, res) => {
 const productos = JSON.parse(await fs.readFile(productosFile));
 res.json(productos);
});

app.get('/api/productos/:id', async (req, res) => {
 const productos = JSON.parse(await fs.readFile(productosFile));
 const producto = productos.find(p => p.id === parseInt(req.params.id));
 if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
 res.json(producto);
});

app.post('/api/login', async (req, res) => {
 const { email, password } = req.body;
 const usuarios = JSON.parse(await fs.readFile(usuariosFile));
 const usuario = usuarios.find(u => u.email === email && u.password === password);
 if (usuario) {
 res.json({ mensaje: 'Login exitoso', usuario: { id: usuario.id, email: usuario.email } });
 } else {
 res.status(401).json({ error: 'Email o contraseña incorrectos' });
 }
});

app.post('/api/registro', async (req, res) => {
 const { email, password } = req.body;
 const usuarios = JSON.parse(await fs.readFile(usuariosFile));
 if (usuarios.find(u => u.email === email)) {
 return res.status(400).json({ error: 'El email ya está registrado' });
 }
 const nuevoUsuario = { id: usuarios.length + 1, email, password };
 usuarios.push(nuevoUsuario);
 await fs.writeFile(usuariosFile, JSON.stringify(usuarios));
 res.json({ mensaje: 'Registro exitoso', usuario: { id: nuevoUsuario.id, email } });
});

app.post('/api/carrito', async (req, res) => {
 const { usuarioId, productoId, cantidad, clear } = req.body;
 const carritos = JSON.parse(await fs.readFile(carritosFile));
 if (clear) {
 carritos[usuarioId] = [];
 await fs.writeFile(carritosFile, JSON.stringify(carritos));
 return res.json({ mensaje: 'Carrito limpiado' });
 }
 if (!carritos[usuarioId]) carritos[usuarioId] = [];
 const producto = JSON.parse(await fs.readFile(productosFile)).find(p => p.id === productoId);
 if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
 carritos[usuarioId].push({ productoId, cantidad, nombre: producto.nombre, precio: producto.precio });
 await fs.writeFile(carritosFile, JSON.stringify(carritos));
 res.json({ mensaje: 'Producto agregado al carrito' });
});

app.get('/api/carrito/:usuarioId', async (req, res) => {
 const carritos = JSON.parse(await fs.readFile(carritosFile));
 res.json(carritos[req.params.usuarioId] || []);
});

app.post('/api/pago', async (req, res) => {
 const { usuarioId, monto } = req.body;
 try {
 const paymentIntent = await stripe.paymentIntents.create({
 amount: monto,
 currency: 'mxn',
 payment_method_types: ['card'],
 });
 res.json({ clientSecret: paymentIntent.client_secret });
 } catch (error) {
 res.status(500).json({ error: 'Error al procesar el pago' });
 }
});

app.listen(port, () => {
 console.log(`Servidor corriendo en http://localhost:${port}`);
});