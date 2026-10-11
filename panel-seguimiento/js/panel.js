/* =========================================================
   Pantalla 5 - Seguimiento del pedido en tiempo real
   Este archivo funciona SOLO (no necesita otros .js).

   ¿De dónde saca el pedido?
   1) Si existe en localStorage la clave "eden_pedido" (la que guarda
      el checkout al confirmar la compra), usa ese pedido.
   2) Si no existe, muestra un pedido de ejemplo (PEDIDO_DEMO).

   Formato que espera el pedido (ver PEDIDO_DEMO más abajo):
     ticket, cliente, items[{nombre, cantidad, precio}],
     totales{subtotal, descuento, delivery, total},
     entrega{direccion}, pago{metodo: yape|tarjeta|efectivo},
     repartidor{nombre, vehiculo, telefono}, etaMin, estado (0 a 3), fecha
   ========================================================= */

const $ = (id) => document.getElementById(id);

const PEDIDO_DEMO = {
  ticket: "#EDEN-2026-1042",
  cliente: "Alejandro",
  items: [
    { nombre: "Ceviche de Camarones del Río", cantidad: 1, precio: 42 },
    { nombre: "Arroz con Pato Pacaranino",    cantidad: 1, precio: 42 },
    { nombre: "Chicha Morada Casera",         cantidad: 1, precio: 15 }
  ],
  totales: { subtotal: 99, descuento: 0, delivery: 5, total: 104 },
  entrega: { direccion: "Av. Lima 123, Pacarán" },
  pago: { metodo: "yape" },
  repartidor: { nombre: "Carlos Ramírez Quispe", vehiculo: "Moto Honda XR 150 · Placa 1234-AB", telefono: "998765432" },
  etaMin: 25,
  estado: 2,                       // 0 Recibido, 1 En cocina, 2 En camino, 3 Entregado
  fecha: new Date().toISOString()
};

const CLAVE_PEDIDO = "eden_pedido";

// Pequeñas utilidades propias de esta pantalla
const util = {
  soles: (n) => "S/ " + Number(n).toFixed(2),
  primerNombre: (n) => String(n || "").trim().split(" ")[0],
  // Solo guarda el avance si el pedido vino de localStorage
  guardarPedido: (p) => {
    try { if (localStorage.getItem(CLAVE_PEDIDO)) localStorage.setItem(CLAVE_PEDIDO, JSON.stringify(p)); } catch (e) {}
  }
};

function obtenerPedido() {
  try {
    const guardado = localStorage.getItem(CLAVE_PEDIDO);
    if (guardado) return JSON.parse(guardado);
  } catch (e) {}
  return PEDIDO_DEMO;
}

iniciarSeguimiento(obtenerPedido());

function iniciarSeguimiento(pedido) {
  const ESTADOS = [
    { etiqueta: "Recibido",  icono: "✓",  msg: "Recibimos tu pedido." },
    { etiqueta: "En cocina", icono: "✓",  msg: "Estamos preparando tu pedido." },
    { etiqueta: "En camino", icono: "🛵", msg: "Tu repartidor va hacia tu dirección." },
    { etiqueta: "Entregado", icono: "🏠", msg: "¡Pedido entregado! Buen provecho." }
  ];
  const METODOS = { yape: "Yape / Plin", tarjeta: "Tarjeta", efectivo: "Efectivo contra entrega" };

  let estadoActual = pedido.estado || 0;
  let progreso = estadoActual === 3 ? 1 : 0;
  let temporizador = null;

  const ruta = $("ruta");
  const rutaHecha = $("ruta-hecha");
  const largoRuta = ruta.getTotalLength();
  rutaHecha.style.strokeDasharray = largoRuta;

  /* ---------- Datos del pedido ---------- */
  function renderDatosFijos() {
    const t = pedido.totales;
    $("ticket").textContent = pedido.ticket;
    $("saludo").textContent = `Gracias por tu compra, ${util.primerNombre(pedido.cliente)}. Tu pedido de El Edén ya está en marcha.`;
    $("rep-nombre").textContent = pedido.repartidor.nombre;
    $("rep-vehiculo").textContent = pedido.repartidor.vehiculo;
    $("btn-llamar").href = "tel:+51" + pedido.repartidor.telefono;

    let lineas = pedido.items
      .map((i) => `<li><span>${i.cantidad} × ${i.nombre}</span><span>${util.soles(i.precio * i.cantidad)}</span></li>`)
      .join("");
    if (t.descuento > 0) lineas += `<li class="descuento"><span>Descuento</span><span>− ${util.soles(t.descuento)}</span></li>`;
    lineas += `<li><span>Delivery</span><span>${util.soles(t.delivery)}</span></li>`;
    $("lista-items").innerHTML = lineas;
    $("total").textContent = util.soles(t.total);

    $("entrega").textContent = `Entrega en: ${pedido.entrega.direccion} · Pago: ${METODOS[pedido.pago.metodo] || ""}`;
  }

  /* ---------- Stepper ---------- */
  function renderStepper() {
    $("stepper").innerHTML = ESTADOS.map((e, i) => {
      const clase = i < estadoActual ? "completado" : i === estadoActual ? "activo" : "pendiente";
      const marca = i < estadoActual ? "✓" : (i === estadoActual ? e.icono : "");
      const aria = i === estadoActual ? ' aria-current="step"' : "";
      return `<li class="paso ${clase}"${aria}><div class="paso__icono">${marca}</div>${e.etiqueta}</li>`;
    }).join("");
    $("mensaje-estado").textContent = ESTADOS[estadoActual].msg;
    $("estado-sr").textContent = `Estado del pedido: ${ESTADOS[estadoActual].etiqueta}`;
  }

  /* ---------- Mapa y ETA ---------- */
  function renderMapa() {
    const p = ruta.getPointAtLength(progreso * largoRuta);
    $("moto").setAttribute("transform", `translate(${p.x} ${p.y})`);
    rutaHecha.style.strokeDashoffset = largoRuta * (1 - progreso);

    const base = pedido.etaMin || 25;
    if (estadoActual === 3) $("eta").textContent = "Entregado";
    else if (estadoActual < 2) $("eta").textContent = `Tiempo estimado: ${base + 10}–${base + 20} minutos`;
    else $("eta").textContent = `Llega en aprox. ${Math.max(Math.ceil(base * (1 - progreso)), 1)} min`;
  }

  function render() { renderStepper(); renderMapa(); }

  /* ---------- Recorrido simulado ---------- */
  function iniciarRecorrido() {
    detenerRecorrido();
    temporizador = setInterval(() => {
      progreso = Math.min(progreso + 0.01, 1);
      if (progreso >= 1) { cambiarEstado(3); return; }
      renderMapa();
    }, 400);
  }
  function detenerRecorrido() { clearInterval(temporizador); temporizador = null; }

  function cambiarEstado(nuevo) {
    estadoActual = nuevo;
    if (nuevo < 2) { progreso = 0; detenerRecorrido(); }
    else if (nuevo === 2) { if (progreso >= 1) progreso = 0; iniciarRecorrido(); }
    else { progreso = 1; detenerRecorrido(); }
    pedido.estado = nuevo;          // se guarda para que no se pierda al recargar
    util.guardarPedido(pedido);
    render();
  }

  $("btn-avanzar").addEventListener("click", () => {
    if (estadoActual < ESTADOS.length - 1) cambiarEstado(estadoActual + 1);
  });
  $("btn-reiniciar").addEventListener("click", () => cambiarEstado(0));
  $("btn-comprobante").addEventListener("click", abrirBoleta);
  $("b-cerrar").addEventListener("click", () => $("boleta").close());
  $("b-imprimir").addEventListener("click", () => window.print());
  $("boleta").addEventListener("click", (e) => { if (e.target === $("boleta")) $("boleta").close(); });

  /* ---------- Comprobante (boleta) ---------- */
  function esc(t) {
    return String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function abrirBoleta() {
    const t = pedido.totales;
    const fecha = new Date(pedido.fecha).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" });
    const numero = "B001-" + (pedido.ticket.match(/(\d+)$/)[1]).padStart(6, "0");

    const filas = pedido.items.map((i) =>
      `<tr><td>${i.cantidad} × ${esc(i.nombre)}</td><td>${util.soles(i.precio * i.cantidad)}</td></tr>`).join("");
    const descuento = t.descuento > 0
      ? `<div class="linea"><span>Descuento</span><span>− ${util.soles(t.descuento)}</span></div>` : "";

    $("boleta-contenido").innerHTML = `
      <h2 id="b-titulo">EL EDÉN</h2>
      <p class="centro">Restaurante Tradicional · Pacarán, Cañete<br>RUC 20000000001 (ejemplo)</p>
      <p class="tipo">BOLETA DE VENTA ELECTRÓNICA<br>${numero}</p>
      <dl>
        <dt>Pedido</dt><dd>${esc(pedido.ticket)}</dd>
        <dt>Fecha</dt><dd>${fecha}</dd>
        <dt>Cliente</dt><dd>${esc(pedido.cliente)}</dd>
        <dt>Entrega</dt><dd>${esc(pedido.entrega.direccion)}</dd>
        <dt>Pago</dt><dd>${METODOS[pedido.pago.metodo] || ""}</dd>
      </dl>
      <table>
        <thead><tr><th>Detalle</th><th>Importe</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="linea"><span>Subtotal</span><span>${util.soles(t.subtotal)}</span></div>
      ${descuento}
      <div class="linea"><span>Delivery</span><span>${util.soles(t.delivery)}</span></div>
      <div class="linea total"><span>TOTAL</span><span>${util.soles(t.total)}</span></div>
      <p class="gracias">¡Gracias por tu compra!</p>`;
    $("boleta").showModal();
  }

  /* ---------- Inicio ---------- */
  renderDatosFijos();
  render();
  if (estadoActual === 2) iniciarRecorrido();
}
