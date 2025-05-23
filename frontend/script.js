document.addEventListener('DOMContentLoaded', () => {
 fetch('http://localhost:3000/api/productos')
 .then(response => response.json())
 .then(productos => {
 const catalogo = document.getElementById('catalogo');
 catalogo.innerHTML = productos.map(producto => `
 <div class="col-md-4 mb-4">
 <div class="card">
 <img src="${producto.imagen}" class="card-img-top" alt="${producto.nombre}">
 <div class="card-body">
 <h5 class="card-title">${producto.nombre}</h5>
 <p class="card-text">$${producto.precio}</p>
 <button class="btn btn-success" onclick="agregarAlCarrito(${producto.id})">Agregar al Carrito</button>
 </div>
 </div>
 </div>
 `).join('');
 })
 .catch(error => console.error('Error al cargar productos:', error));
});

function agregarAlCarrito(productoId) {
 const usuarioId = localStorage.getItem('usuarioId');
 if (!usuarioId) {
 alert('Por favor, inicia sesión primero');
 window.location.href = 'login.html';
 return;
 }

 fetch('http://localhost:3000/api/carrito', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ usuarioId, productoId, cantidad: 1 })
 })
 .then(response => response.json())
 .then(data => {
 alert(data.mensaje);
 })
 .catch(error => console.error('Error al agregar al carrito:', error));
}