// ============================================
// LUXURIA SHOP - LÓGICA PRINCIPAL
// ============================================

// Configuración - CAMBIA AQUÍ TU NÚMERO
const WHATSAPP_NUMBER = "5356502201"; // ← TU NÚMERO AQUÍ
const TIENDA_NOMBRE = "LUXURIA SHOP";

// Estado
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
const vaciarCarritoBtn = document.getElementById('vaciarCarrito');
const registroModal = document.getElementById('registroModal');
const cerrarRegistroBtn = document.getElementById('cerrarRegistroModal');
const formularioRegistro = document.getElementById('formularioRegistro');
const confirmacionModal = document.getElementById('confirmacionModal');
const numeroPedido = document.getElementById('numeroPedido');
const totalConfirmacion = document.getElementById('totalConfirmacion');
const seguirComprando = document.getElementById('seguirComprando');
const buscador = document.getElementById('buscador');
const categoriasBtns = document.querySelectorAll('.categoria');

// Filtros
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
    if (vaciarCarritoBtn) vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
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
    const filtrados = filtrarProductosArray();
    renderizarProductos(filtrados);
}

function filtrarProductosArray() {
    let filtrados = productos;
    
    if (filtroBusqueda) {
        filtrados = filtrados.filter(p => 
            p.nombre.toLowerCase().includes(filtroBusqueda.toLowerCase()) ||
            p.descripcion.toLowerCase().includes(filtroBusqueda.toLowerCase())
        );
    }
    
    if (filtroCategoria !== 'todos') {
        filtrados = filtrados.filter(p => p.categoria === filtroCategoria);
    }
    
    return filtrados;
}

function filtrarProductos() {
    filtroBusqueda = buscador.value;
    renderizarProductos(filtrarProductosArray());
}

function renderizarProductos(array) {
    if (!productosContainer) return;
    
    if (array.length === 0) {
        productosContainer.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:4rem; color:#888;">No se encontraron productos</div>';
        return;
    }
    
    productosContainer.innerHTML = array.map(p => {
        const disponible = p.disponible;
        const estadoClass = disponible ? 'estado-disponible' : 'estado-agotado';
        const estadoTexto = disponible ? 'DISPONIBLE' : 'AGOTADO';
        
        // Generar especificaciones estilo Telegram
        const especsHTML = p.especificaciones.map(esp => `
            <div class="especificacion-item">
                <span class="especificacion-label">${esp.label}</span>
                <span class="especificacion-valor">${esp.valor}</span>
            </div>
        `).join('');
        
        return `
            <div class="producto-card">
                <img src="${p.imagen}" alt="${p.nombre}" class="producto-imagen" onerror="this.src='${IMAGEN_DEFAULT}'">
                <div class="producto-info">
                    <h3 class="producto-nombre">${p.nombre}</h3>
                    <p class="producto-descripcion">${p.descripcion}</p>
                    
                    <div class="producto-especificaciones">
                        ${especsHTML}
                    </div>
                    
                    <div class="producto-precio">
                        <small>USD</small> $${p.precio}
                    </div>
                    
                    <div class="producto-estado ${estadoClass}">${estadoTexto}</div>
                    
                    ${disponible ? 
                        `<button class="btn-agregar" onclick="agregarAlCarrito(${p.id})">AGREGAR</button>` : 
                        `<button class="btn-agotado" disabled>⛔ AGOTADO</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// ===== FUNCIONES DEL CARRITO =====
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto || !producto.disponible) return;
    
    const existente = carrito.find(item => item.id === id);
    
    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            imagen: producto.imagen
        });
    }
    
    guardarCarrito();
    actualizarContadorCarrito();
    
    // Feedback visual
    const btn = event.target;
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    actualizarContadorCarrito();
    abrirCarrito();
}

function actualizarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad < 1) {
        eliminarDelCarrito(id);
        return;
    }
    
    const item = carrito.find(item => item.id === id);
    if (item) {
        item.cantidad = nuevaCantidad;
        guardarCarrito();
        abrirCarrito();
    }
}

function vaciarCarrito() {
    if (carrito.length === 0) return;
    if (confirm('¿Vaciar todo el carrito?')) {
        carrito = [];
        guardarCarrito();
        actualizarContadorCarrito();
        abrirCarrito();
    }
}

function guardarCarrito() {
    localStorage.setItem('luxuriaCarrito', JSON.stringify(carrito));
}

function actualizarContadorCarrito() {
    const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contadorCarrito.textContent = total;
}

function calcularTotales() {
    const subtotal = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    return { subtotal, total: subtotal };
}

// ===== MODALES =====
function abrirCarrito() {
    if (carrito.length === 0) {
        carritoItems.innerHTML = '<p style="text-align:center; padding:2rem; color:#888;">Tu carrito está vacío</p>';
        subtotalCarrito.textContent = '$0';
        totalCarrito.textContent = '$0';
    } else {
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
                    <button class="btn-eliminar" onclick="eliminarDelCarrito(${item.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
        
        subtotalCarrito.textContent = `$${subtotal.toFixed(2)}`;
        totalCarrito.textContent = `$${total.toFixed(2)}`;
    }
    
    carritoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarCarritoModal() {
    carritoModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function cerrarModal(modal) {
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// ===== PROCESAR PEDIDO =====
function procesarPedido() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío');
        return;
    }
    
    cerrarCarritoModal();
    
    if (!usuario) {
        registroModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        enviarPedidoWhatsApp();
    }
}

function guardarRegistro(e) {
    e.preventDefault();
    
    usuario = {
        nombre: document.getElementById('regNombre').value,
        telefono: document.getElementById('regTelefono').value,
        fecha: new Date().toISOString()
    };
    
    localStorage.setItem('luxuriaUsuario', JSON.stringify(usuario));
    cerrarModal(registroModal);
    enviarPedidoWhatsApp();
}

// ===== ENVÍO A WHATSAPP (SIMPLE) =====
function enviarPedidoWhatsApp() {
    const { total } = calcularTotales();
    const numPedido = generarNumeroPedido();
    
    // Crear mensaje
    let mensaje = `*${TIENDA_NOMBRE} - NUEVO PEDIDO*%0A%0A`;
    mensaje += `*Cliente:* ${usuario.nombre}%0A`;
    mensaje += `*Teléfono:* ${usuario.telefono}%0A`;
    mensaje += `*Pedido:* ${numPedido}%0A%0A`;
    mensaje += `*PRODUCTOS*%0A`;
    
    carrito.forEach(item => {
        mensaje += `• ${item.nombre} x${item.cantidad} = $${(item.precio * item.cantidad).toFixed(2)}%0A`;
    });
    
    mensaje += `%0A*TOTAL: $${total.toFixed(2)}*`;
    
    // Abrir WhatsApp con el número configurado
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`, '_blank');
    
    // Mostrar confirmación al usuario
    numeroPedido.textContent = `#${numPedido}`;
    totalConfirmacion.textContent = `Total: $${total.toFixed(2)}`;
    confirmacionModal.classList.add('active');
    
    // Vaciar carrito
    carrito = [];
    guardarCarrito();
    actualizarContadorCarrito();
}

function generarNumeroPedido() {
    const f = new Date();
    return `LUX-${f.getFullYear()}${String(f.getMonth()+1).padStart(2,'0')}${String(f.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
}

// Hacer funciones globales
window.agregarAlCarrito = agregarAlCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.actualizarCantidad = actualizarCantidad;
window.vaciarCarrito = vaciarCarrito;
