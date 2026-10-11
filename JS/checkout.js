"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const formulario = document.getElementById("form-checkout");
    const listaProductos = document.getElementById("lista-productos");
    const subtotalElemento = document.getElementById("subtotal");
    const envioElemento = document.getElementById("envio");
    const totalElemento = document.getElementById("total");
    const botonConfirmar = document.getElementById("btn-confirmar");
    const mensaje = document.getElementById("mensaje");

    // Ajusta estos valores según las reglas reales del restaurante.
    const COSTO_ENVIO = 5.00;

    let productos = [];
    let subtotal = 0;

    const formatoSoles = cantidad =>
        new Intl.NumberFormat("es-PE", {
            style: "currency",
            currency: "PEN"
        }).format(cantidad);

    function obtenerCarrito() {
        // Posibles claves usadas por distintas implementaciones.
        const claves = ["carrito", "cart", "productosCarrito"];

        for (const clave of claves) {
            try {
                const guardado = localStorage.getItem(clave);

                if (!guardado) continue;

                const datos = JSON.parse(guardado);

                const lista = Array.isArray(datos)
                    ? datos
                    : datos.productos || datos.items || datos.carrito;

                if (Array.isArray(lista)) {
                    return lista;
                }
            } catch (error) {
                console.warn("No se pudo leer la clave:", clave);
            }
        }

        return [];
    }

    function normalizarProducto(producto) {
        const nombre = producto.nombre
            ?? producto.nombreProducto
            ?? producto.name
            ?? producto.titulo
            ?? "Producto";

        const precio = Number(
            producto.precio
            ?? producto.price
            ?? producto.precioUnitario
            ?? 0
        );

        const cantidad = Number(
            producto.cantidad
            ?? producto.quantity
            ?? producto.qty
            ?? 1
        );

        const imagen = producto.imagen
            ?? producto.image
            ?? producto.foto
            ?? "";

        return {
            nombre: String(nombre),
            precio: Number.isFinite(precio) && precio >= 0 ? precio : 0,
            cantidad: Number.isInteger(cantidad) && cantidad > 0
                ? cantidad
                : 1,
            imagen: typeof imagen === "string" ? imagen : ""
        };
    }

    function mostrarMensaje(texto, tipo = "error") {
        mensaje.textContent = texto;
        mensaje.className = `mensaje ${tipo}`;
    }

    function calcularTotales() {
        subtotal = productos.reduce(
            (suma, producto) =>
                suma + producto.precio * producto.cantidad,
            0
        );

        const envio = productos.length > 0 ? COSTO_ENVIO : 0;
        const total = subtotal + envio;

        subtotalElemento.textContent = formatoSoles(subtotal);
        envioElemento.textContent = formatoSoles(envio);
        totalElemento.textContent = formatoSoles(total);

        return { subtotal, envio, total };
    }

    function mostrarProductos() {
        listaProductos.replaceChildren();

        if (productos.length === 0) {
            const aviso = document.createElement("div");
            aviso.className = "carrito-vacio";

            const texto = document.createElement("p");
            texto.textContent =
                "Tu carrito está vacío o todavía no se han podido recuperar sus productos.";

            const enlace = document.createElement("a");
            enlace.href = "carrito.html";
            enlace.textContent = "Volver al carrito";

            aviso.append(texto, enlace);
            listaProductos.appendChild(aviso);

            botonConfirmar.disabled = true;
            calcularTotales();
            return;
        }

        botonConfirmar.disabled = false;

        productos.forEach(producto => {
            const fila = document.createElement("article");
            fila.className = "producto";

            const imagen = document.createElement("div");
            imagen.className = "producto-imagen";

            if (producto.imagen) {
                const img = document.createElement("img");
                img.src = producto.imagen;
                img.alt = producto.nombre;
                img.loading = "lazy";

                img.addEventListener("error", () => {
                    imagen.replaceChildren();
                    imagen.classList.add("sin-imagen");
                    imagen.textContent = "✦";
                }, { once: true });

                imagen.appendChild(img);
            } else {
                imagen.innerHTML = '<i class="bi bi-egg-fried"></i>';
            }

            const informacion = document.createElement("div");
            informacion.className = "producto-info";

            const nombre = document.createElement("strong");
            nombre.textContent = producto.nombre;

            const cantidad = document.createElement("small");
            cantidad.textContent = `Cantidad: ${producto.cantidad}`;

            informacion.append(nombre, cantidad);

            const precio = document.createElement("span");
            precio.className = "producto-precio";
            precio.textContent = formatoSoles(
                producto.precio * producto.cantidad
            );

            fila.append(imagen, informacion, precio);
            listaProductos.appendChild(fila);
        });

        calcularTotales();
    }

    function actualizarMetodoPago() {
        document.querySelectorAll(".metodo").forEach(metodo => {
            const radio = metodo.querySelector('input[name="pago"]');
            metodo.classList.toggle("seleccionado", radio.checked);
        });
    }

    document.querySelectorAll('input[name="pago"]').forEach(radio => {
        radio.addEventListener("change", actualizarMetodoPago);
    });

    function obtenerDatosFormulario() {
        const datos = new FormData(formulario);

        return {
            nombre: String(datos.get("nombre") || "").trim(),
            celular: String(datos.get("celular") || "").trim(),
            departamento: String(datos.get("departamento") || ""),
            provincia: String(datos.get("provincia") || "").trim(),
            distrito: String(datos.get("distrito") || "").trim(),
            direccion: String(datos.get("direccion") || "").trim(),
            referencia: String(datos.get("referencia") || "").trim(),
            indicaciones: String(datos.get("indicaciones") || "").trim(),
            pago: String(datos.get("pago") || "")
        };
    }

    formulario.addEventListener("submit", event => {
        event.preventDefault();

        mensaje.textContent = "";
        mensaje.className = "mensaje";

        if (!formulario.reportValidity()) {
            return;
        }

        if (productos.length === 0) {
            mostrarMensaje(
                "Agrega productos al carrito antes de finalizar el pedido."
            );
            return;
        }

        const datos = obtenerDatosFormulario();

        if (!/^\d{9}$/.test(datos.celular)) {
            mostrarMensaje(
                "Ingresa un número de celular peruano de 9 dígitos."
            );
            return;
        }

        if (!["Efectivo", "Tarjeta", "Billetera digital"].includes(datos.pago)) {
            mostrarMensaje("Selecciona un método de pago válido.");
            return;
        }

        const totales = calcularTotales();

        const metodoPago = datos.pago === "Efectivo"
            ? "efectivo"
            : datos.pago === "Tarjeta"
                ? "tarjeta"
                : "yape";

        const direccionEntrega = [
            datos.direccion,
            datos.distrito,
            datos.provincia,
            datos.departamento
        ].filter(Boolean).join(", ");

        const pedido = {
            ticket: `#EDEN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 900 + 100))}`,
            cliente: datos.nombre,
            items: productos.map(producto => ({
                nombre: producto.nombre,
                cantidad: producto.cantidad,
                precio: producto.precio
            })),
            totales: {
                subtotal: Number(totales.subtotal.toFixed(2)),
                descuento: 0,
                delivery: Number(totales.envio.toFixed(2)),
                total: Number(totales.total.toFixed(2))
            },
            entrega: { direccion: direccionEntrega },
            pago: { metodo: metodoPago },
            repartidor: {
                nombre: "Carlos Ramírez Quispe",
                vehiculo: "Moto Honda XR 150 · Placa 1234-AB",
                telefono: "998765432"
            },
            etaMin: 25,
            estado: 0,
            fecha: new Date().toISOString()
        };

        try {
            localStorage.setItem("eden_pedido", JSON.stringify(pedido));
            localStorage.setItem("cart", JSON.stringify([]));
        } catch (error) {
            console.warn("No se pudo guardar el pedido:", error);
        }

        botonConfirmar.disabled = true;
        botonConfirmar.innerHTML =
            '<i class="bi bi-check-circle-fill"></i> PEDIDO VALIDADO';

        const confirmacion = document.createElement("div");
        confirmacion.className = "mensaje exito";

        const titulo = document.createElement("strong");
        titulo.textContent = "¡Pedido confirmado!";

        const detalle = document.createElement("p");
        detalle.textContent =
            `Cliente: ${datos.nombre}. Método de pago: ${datos.pago}. Total: ${formatoSoles(totales.total)}.`;

        const aclaracion = document.createElement("p");
        aclaracion.textContent = "Te estamos llevando al seguimiento de tu pedido.";

        confirmacion.append(titulo, detalle, aclaracion);
        mensaje.replaceChildren(confirmacion);
        mensaje.className = "mensaje";
        mensaje.scrollIntoView({ behavior: "smooth", block: "nearest" });

        window.location.href = "panel-seguimiento/panel.html";
    });

    productos = obtenerCarrito().map(normalizarProducto);
    mostrarProductos();
    actualizarMetodoPago();
});