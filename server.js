const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const fs = require('fs').promises;

const app = express();

// Configurar Stripe (usa la variable de entorno de Render)
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors({
  origin: 'https://juchishopingonlinee.netlify.app' // Permitir solicitudes desde tu frontend
}));
app.use(express.json());

// Ruta para obtener los productos
app.get('/api/productos', async (req, res) => {
  try {
    const data = await fs.readFile('productos.json', 'utf8');
    const productos = JSON.parse(data);
    res.json(productos);
  } catch (error) {
    console.error('Error al leer productos.json:', error);
    res.status(500).json({ error: 'Error al cargar los productos' });
  }
});

// Ruta para el login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await fs.readFile('usuarios.json', 'utf8');
    const usuarios = JSON.parse(data);
    const usuario = usuarios.find(u => u.email === email && u.password === password);
    if (usuario) {
      res.json({ mensaje: 'Login exitoso', usuario });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error en el login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para el registro
app.post('/api/registro', async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await fs.readFile('usuarios.json', 'utf8');
    let usuarios = JSON.parse(data);
    if (usuarios.find(u => u.email === email)) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }
    usuarios.push({ email, password });
    await fs.writeFile('usuarios.json', JSON.stringify(usuarios, null, 2));
    res.json({ mensaje: 'Registro exitoso' });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para añadir al carrito
app.post('/api/carrito', async (req, res) => {
  try {
    const { usuarioId, productoId, cantidad } = req.body;
    const data = await fs.readFile('carritos.json', 'utf8');
    let carritos = JSON.parse(data);
    let carrito = carritos.find(c => c.usuarioId === usuarioId);
    if (!carrito) {
      carrito = { usuarioId, productos: [] };
      carritos.push(carrito);
    }
    carrito.productos.push({ productoId, cantidad });
    await fs.writeFile('carritos.json', JSON.stringify(carritos, null, 2));
    res.json({ mensaje: 'Producto añadido al carrito' });
  } catch (error) {
    console.error('Error al añadir al carrito:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para obtener el carrito
app.get('/api/carrito/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const data = await fs.readFile('carritos.json', 'utf8');
    const carritos = JSON.parse(data);
    const carrito = carritos.find(c => c.usuarioId === usuarioId) || { usuarioId, productos: [] };
    res.json(carrito);
  } catch (error) {
    console.error('Error al obtener el carrito:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para procesar el pago con Stripe
app.post('/api/pago', async (req, res) => {
  try {
    const { amount, token } = req.body;
    const charge = await stripe.charges.create({
      amount: amount * 100, // Convertir a centavos
      currency: 'mxn',
      source: token,
      description: 'Compra en proyecto-ropa'
    });
    res.json({ mensaje: 'Pago exitoso', charge });
  } catch (error) {
    console.error('Error al procesar el pago:', error);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});