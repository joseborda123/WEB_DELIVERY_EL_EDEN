const listaCarrito = document.getElementById('carrito-lista');
const inputCupon = document.getElementById('carrito-cupon');
const btnAplicar = document.querySelector('.carrito-aplicar');
const lineas = document.querySelectorAll('.carrito-linea');
const textoTotal = document.querySelector('.carrito-monto');

const cupones = {
    'EDEN10': 0.10,
    'PACARAN2026': 0.05,
    'SISTEMAS': 0.20
};
let descuento = 0;

const lineaDescuento = document.createElement('div');
lineaDescuento.className = 'carrito-linea';
lineaDescuento.innerHTML = '<span>Descuento</span><span>- S/ 0.00</span>';
if (lineas[0]) {
    lineas[0].after(lineaDescuento);
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Renderizar la lista de productos
function renderizarCarrito() {
    const cart = getCart();
    listaCarrito.innerHTML = '';

    if (cart.length === 0) {
        listaCarrito.innerHTML = '<p style="padding: 20px; font-size: 1.1rem; text-align: center;">Tu carrito está vacío. <a href="Menu.html" style="color:#d32f2f; font-weight:bold;">Ver Menú</a></p>';
        calcularTotales(cart);
        return;
    }

    cart.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrito-item';
        itemDiv.innerHTML = `
          <img src="${item.img}" alt="${item.title}">
          <div class="carrito-detalle">
            <strong>${item.title}</strong>
            <small class="carrito-nota">${item.desc}</small>
            <small class="carrito-unitario">S/ ${item.price.toFixed(2)} c/u</small>
          </div>
          <div class="carrito-controles">
            <button class="carrito-cantidad" onclick="cambiarCantidad(${index}, -1)" aria-label="Disminuir">-</button>
            <span class="carrito-numero">${item.cantidad}</span>
            <button class="carrito-cantidad" onclick="cambiarCantidad(${index}, 1)" aria-label="Aumentar">+</button>
          </div>
          <div class="carrito-subtotal">S/ ${(item.price * item.cantidad).toFixed(2)}</div>
          <button class="carrito-eliminar" onclick="eliminarProducto(${index})" aria-label="Quitar del carrito">
            <i class="bi bi-trash-fill"></i>
          </button>
        `;
        listaCarrito.appendChild(itemDiv);
    });

    calcularTotales(cart);
}

window.cambiarCantidad = function(index, cambio) {
    let cart = getCart();
    if (cart[index]) {
        cart[index].cantidad += cambio;
        if (cart[index].cantidad <= 0) {
            cart.splice(index, 1);
        }
        saveCart(cart);
        renderizarCarrito();
    }
};

window.eliminarProducto = function(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderizarCarrito();
};

function calcularTotales(cart = getCart()) {
    let subtotal = 0;

    cart.forEach(item => {
        subtotal += item.price * item.cantidad;
    });

    const montoDescuento = subtotal * descuento;
    const envio = subtotal > 0 ? 5 : 0;
    const igv = (subtotal - montoDescuento) * 0.18;
    const total = subtotal - montoDescuento + envio + igv;

    lineas[0].lastElementChild.textContent = 'S/ ' + subtotal.toFixed(2);
    lineaDescuento.lastElementChild.textContent = '- S/ ' + montoDescuento.toFixed(2);
    lineas[1].lastElementChild.textContent = 'S/ ' + envio.toFixed(2);
    lineas[2].lastElementChild.textContent = 'S/ ' + igv.toFixed(2);
    textoTotal.textContent = 'S/ ' + total.toFixed(2);
}

// Evento cupón
if (btnAplicar) {
    btnAplicar.addEventListener('click', function() {
        const codigo = inputCupon.value.trim().toUpperCase();

        if (cupones[codigo]) {
            descuento = cupones[codigo];
            alert('Cupón aplicado: ' + (descuento * 100) + '% de descuento');
        } else {
            descuento = 0;
            alert('El cupón no es válido');
        }

        calcularTotales();
    });
}

// Cargar carrito al iniciar
renderizarCarrito();