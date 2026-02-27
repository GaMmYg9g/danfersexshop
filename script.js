// ============================================
// LUXURIA SHOP - LÓGICA PRINCIPAL (CORREGIDA)
// ============================================

// Configuración - AHORA USA EL NÚMERO DE WHATSAPP DESDE CONFIG
const WHATSAPP_NUMBER = localStorage.getItem('luxuriaWhatsApp') || "5356502201";
const TIENDA_NOMBRE = "LUXURIA SHOP";

// Estado de la aplicación
let carrito = JSON.parse(localStorage.getItem('luxuriaCarrito')) || [];
let usuario = JSON.parse(localStorage.getItem('luxuriaUsuario')) || null;

// Elementos DOM
const productosContainer = document.getElementById('productosContainer');
const contadorCarrito = document.getElementById('contadorCarrito');
const verCarritoBtn = document.getElementById('verCarrito');
const carritoModal = document.getElementById('carritoModal');
const cerrarCarritoBtn = document.getElementById('cerrarModal');
const carritoItems = document.getElementById('carritoItems');
const totalCarrito = document.getElementById('totalCarrito');
const subtotalCarrito = document.getElementById('subtotalCarrito');
const realizarPedidoBtn = document.getElementById('realizarPedido');
const registroModal = document.getElementById('registroModal');
const cerrarRegistroBtn = document.getElementById('cerrarRegistroModal');
const formularioRegistro = document.getElementById('formularioRegistro');
const confirmacionModal = document.getElementById('confirmacionModal');
const numeroPedido = document.getElementById('numeroPedido');
const totalConfirmacion = document.getElementById('totalConfirmacion');
const seguirComprando = document.getElementById('seguirComprando');
const buscador = document.getElementById('buscador');
const categoriasBtns = document.querySelectorAll('.categoria');

// Estado de filtros
let filtroCategoria = 'todos';
let filtroBusqueda = '';

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    actualizarContadorCarrito();
    
    // Event listeners
    verCarritoBtn.addEventListener('click', abrirCarrito);
    cerrarCarritoBtn.addEventListener('click', cerrarCarritoModal);
    realizarPedidoBtn.addEventListener('click', procesarPedido);
    cerrarRegistroBtn.addEventListener('click', () => cerrarModal(registroModal));
    formularioRegistro.addEventListener('submit', guardarRegistro);
    seguirComprando.addEventListener('click', () => cerrarModal(confirmacionModal));
    buscador.addEventListener('input', filtrarProductos);
    
    categoriasBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoriasBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroCategoria = btn.dataset.categoria;
            filtrarProductos();
        });
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === carritoModal) cerrarCarritoModal();
        if (e.target === registroModal) cerrarModal(registroModal);
        if (e.target === confirmacionModal) cerrarModal(confirmacionModal);
    });
});

// ===== FUNCIONES DE PRODUCTOS =====
function cargarProductos() {
    const productosFiltrados = filtrarProductosArray();
    renderizarProductos(productosFiltrados);
}

function filtrarProductosArray() {
    let productosFiltrados = obtenerProductos();
    
    // Filtrar por búsqueda
    if (filtroBusqueda) {
        productosFiltrados = productosFiltrados.filter(p => 
            p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
            p.descripcion.toLowerCase().includes(filtroBusqueda.toLowerCase())
        );
    }
    
    // Filtrar por categoría
    if (filtroCategoria !== 'todos') {
        productosFiltrados = productosFiltrados.filter(p => 
            p.categoria === filtroCategoria
        );
    }
    
    return productosFiltrados;
}

function filtrarProductos() {
    filtroBusqueda = buscador.value;
    const productosFiltrados = filtrarProductosArray();
    renderizarProductos(productosFiltrados);
}

function renderizarProductos(productosArray) {
    if (!productosContainer) return;
    
    if (productosArray.length === 0) {
        productosContainer.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: #888;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p>No se encontraron productos</p>
            </div>
        `;
        return;
    }
    
    productosContainer.innerHTML = productosArray.map(producto => {
        const agotado = productoAgotado(producto);
        const stockText = agotado ? 'SIN STOCK' : `${producto.stock} disponibles`;
        const stockClass = agotado ? 'stock-agotado' : 'stock-disponible';
        
        return `
            <div class="producto-card">
                <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-imagen" onerror="this.src='${IMAGEN_DEFAULT}'">
                <div class="producto-info">
                    <h3 class="producto-nombre">${producto.nombre}</h3>
                    <p class="producto-descripcion">${producto.descripcion}</p>
                    <div class="producto-precio">$${producto.precio.toFixed(2)}</div>
                    <div class="producto-stock ${stockClass}">${stockText}</div>
                    ${agotado ? 
                        '<button class="btn-agotado" disabled>⛔ AGOTADO</button>' : 
                        `<button class="btn-agregar" onclick="agregarAlCarrito(${producto.id})">AGREGAR</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// ===== FUNCIONES DEL CARRITO =====
function agregarAlCarrito(productoId) {
    const producto = productos.find(p => p.id === productoId);
    if (!producto || productoAgotado(producto)) return;
    
    const itemExistente = carrito.find(item => item.id === productoId);
    
    if (itemExistente) {
        if (itemExistente.cantidad < producto.stock) {
            itemExistente.cantidad++;
        } else {
            alert('No hay más stock disponible');
            return;
        }
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            imagen: producto.imagen,
            stock: producto.stock
        });
    }
    
    guardarCarrito();
    actualizarContadorCarrito();
    
    // Feedback visual sutil
    const btn = event.target;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function eliminarDelCarrito(productoId) {
    carrito = carrito.filter(item => item.id !== productoId);
    guardarCarrito();
    actualizarContadorCarrito();
    abrirCarrito(); // Refrescar vista
}

function actualizarCantidad(productoId, nuevaCantidad) {
    const item = carrito.find(item => item.id === productoId);
    const producto = productos.find(p => p.id === productoId);
    
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(productoId);
        return;
    }
    
    if (nuevaCantidad > producto.stock) {
        alert('No hay suficiente stock');
        return;
    }
    
    item.cantidad = nuevaCantidad;
    guardarCarrito();
    abrirCarrito(); // Refrescar vista
}

function guardarCarrito() {
    localStorage.setItem('luxuriaCarrito', JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contadorCarrito.textContent = totalItems;
}

function calcularTotales() {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    return {
        subtotal,
        total: subtotal // Envío gratis
    };
}

// ===== MODALES =====
function abrirCarrito() {
    if (carrito.length === 0) {
        carritoItems.innerHTML = '<p style="text-align: center; color: #888; padding: 2rem;">Tu carrito está vacío</p>';
        subtotalCarrito.textContent = '$0';
        totalCarrito.textContent = '$0';
    } else {
        renderizarCarrito();
    }
    carritoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarCarritoModal() {
    carritoModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function cerrarModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function renderizarCarrito() {
    const { subtotal, total } = calcularTotales();
    
    carritoItems.innerHTML = carrito.map(item => `
        <div class="carrito-item">
            <div class="carrito-item-info">
                <h4>${item.nombre}</h4>
                <p>$${item.precio.toFixed(2)} c/u</p>
            </div>
            <div class="carrito-item-cantidad">
                <button class="btn-cantidad" onclick="actualizarCantidad(${item.id}, ${item.cantidad - 1})">−</button>
                <span>${item.cantidad}</span>
                <button class="btn-cantidad" onclick="actualizarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    subtotalCarrito.textContent = `$${subtotal.toFixed(2)}`;
    totalCarrito.textContent = `$${total.toFixed(2)}`;
}

// ===== PROCESAR PEDIDO =====
function procesarPedido() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    cerrarCarritoModal();
    
    if (!usuario) {
        abrirModalRegistro();
    } else {
        enviarPedidoWhatsApp();
    }
}

function abrirModalRegistro() {
    registroModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function guardarRegistro(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('regNombre').value;
    const telefono = document.getElementById('regTelefono').value;
    
    usuario = {
        nombre,
        telefono,
        fechaRegistro: new Date().toISOString()
    };
    
    localStorage.setItem('luxuriaUsuario', JSON.stringify(usuario));
    cerrarModal(registroModal);
    enviarPedidoWhatsApp();
}

function enviarPedidoWhatsApp() {
    const { total } = calcularTotales();
    const numeroPedidoGenerado = generarNumeroPedido();
    
    // Crear mensaje
    let mensaje = `*${TIENDA_NOMBRE} - NUEVO PEDIDO*%0A%0A`;
    mensaje += `*Cliente:* ${usuario.nombre}%0A`;
    mensaje += `*Teléfono:* ${usuario.telefono}%0A`;
    mensaje += `*Pedido:* ${numeroPedidoGenerado}%0A%0A`;
    mensaje += `*PRODUCTOS*%0A`;
    
    carrito.forEach(item => {
        mensaje += `• ${item.nombre} x${item.cantidad} = $${(item.precio * item.cantidad).toFixed(2)}%0A`;
    });
    
    mensaje += `%0A*TOTAL: $${total.toFixed(2)}*%0A%0A`;
    mensaje += `_Pedido generado automáticamente_`;
    
    // Abrir WhatsApp con el número configurado
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');
    
    // Guardar pedido en historial
    guardarPedido(numeroPedidoGenerado, total);
    
    // Mostrar confirmación
    numeroPedido.textContent = `#${numeroPedidoGenerado}`;
    totalConfirmacion.textContent = `Total: $${total.toFixed(2)}`;
    confirmacionModal.classList.add('active');
    
    // Vaciar carrito
    carrito = [];
    guardarCarrito();
    actualizarContadorCarrito();
}

function generarNumeroPedido() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `LUX-${año}${mes}${dia}-${random}`;
}

function guardarPedido(numero, total) {
    const pedido = {
        numero,
        fecha: new Date().toISOString(),
        cliente: usuario,
        productos: carrito,
        total
    };
    
    const historial = JSON.parse(localStorage.getItem('luxuriaHistorial')) || [];
    historial.push(pedido);
    localStorage.setItem('luxuriaHistorial', JSON.stringify(historial));
}

// Hacer funciones globales para los onclick
window.agregarAlCarrito = agregarAlCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.actualizarCantidad = actualizarCantidad;
