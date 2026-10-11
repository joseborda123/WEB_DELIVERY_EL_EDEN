document.addEventListener('DOMContentLoaded', () => {
    // Referencias a las pestañas y formularios
    const tabLogin = document.getElementById('tab-login');
    const tabRegistro = document.getElementById('tab-registro');
    const formLogin = document.getElementById('form-login');
    const formRegistro = document.getElementById('form-registro');

    // Cambios entre pestañas
    if (tabLogin && tabRegistro && formLogin && formRegistro) {
        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('activa');
            tabRegistro.classList.remove('activa');
            formLogin.classList.remove('oculto');
            formRegistro.classList.add('oculto');
        });

        tabRegistro.addEventListener('click', () => {
            tabRegistro.classList.add('activa');
            tabLogin.classList.remove('activa');
            formRegistro.classList.remove('oculto');
            formLogin.classList.add('oculto');
        });
    }

    // Ojo para ver/ocultar contraseña
    function configurarBotonOjo(inputId, btnId) {
        const inputPassword = document.getElementById(inputId);
        const btnVerPass = document.getElementById(btnId);

        if (!inputPassword || !btnVerPass) return;

        btnVerPass.addEventListener('click', () => {
            const icono = btnVerPass.querySelector('i');
            const esPassword = inputPassword.type === 'password';

            inputPassword.type = esPassword ? 'text' : 'password';

            if (icono) {
                icono.classList.toggle('fa-eye', !esPassword);
                icono.classList.toggle('fa-eye-slash', esPassword);
            }
        });
    }

    configurarBotonOjo('input-password-login', 'btn-ver-pass-login');
    configurarBotonOjo('input-password-registro', 'btn-ver-pass-registro');

    // --- USUARIOS POR DEFECTO PARA PRUEBA ---
    const usuariosPrueba = [
        { nombre: 'Admin Edén', email: 'admin@eden.com', password: '123' }
    ];

    function obtenerUsuarios() {
        const guardados = localStorage.getItem('usuariosEdén');
        return guardados ? JSON.parse(guardados) : usuariosPrueba;
    }

    // --- 1. VALIDACIÓN DE INICIO DE SESIÓN ---
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita redirigir automáticamente

            const emailIngresado = formLogin.querySelector('input[type="email"]').value.trim();
            const passwordIngresada = document.getElementById('input-password-login').value;

            const usuarios = obtenerUsuarios();

            // Buscar si existe un usuario con el correo y contraseña ingresados
            const usuarioValido = usuarios.find(u => u.email === emailIngresado && u.password === passwordIngresada);

            if (usuarioValido) {
                // Credenciales correctas
                localStorage.setItem('usuarioSesion', JSON.stringify(usuarioValido));
                window.location.href = 'Menu.html';
            } else {
                // Credenciales incorrectas
                alert('Correo o contraseña incorrectos. Por favor intenta de nuevo.');
            }
        });
    }

    // --- 2. VALIDACIÓN Y REGISTRO DE NUEVO USUARIO ---
    if (formRegistro) {
        formRegistro.addEventListener('submit', (e) => {
            e.preventDefault();

            const nombre = formRegistro.querySelector('input[type="text"]').value.trim();
            const email = formRegistro.querySelector('input[type="email"]').value.trim();
            const password = document.getElementById('input-password-registro').value;

            let usuarios = obtenerUsuarios();

            // Verificar si el correo ya está registrado
            const existeCorreo = usuarios.some(u => u.email === email);

            if (existeCorreo) {
                alert('Este correo ya se encuentra registrado. Intenta iniciar sesión.');
                return;
            }

            // Registrar y guardar nuevo usuario
            const nuevoUsuario = { nombre, email, password };
            usuarios.push(nuevoUsuario);
            localStorage.setItem('usuariosEdén', JSON.stringify(usuarios));
            localStorage.setItem('usuarioSesion', JSON.stringify(nuevoUsuario));

            alert('¡Cuenta creada con éxito! Bienvenido a El Edén.');
            window.location.href = 'Menu.html';
        });
    }
});