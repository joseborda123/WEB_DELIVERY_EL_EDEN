const tabLogin = document.getElementById('tab-login');
const tabRegistro = document.getElementById('tab-registro');
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');


tabLogin.addEventListener('click', function() {
    tabLogin.classList.add('activa');
    tabRegistro.classList.remove('activa');
    
    formLogin.classList.remove('oculto');
    formRegistro.classList.add('oculto');
});


tabRegistro.addEventListener('click', function() {
    tabRegistro.classList.add('activa');
    tabLogin.classList.remove('activa');
    
    formRegistro.classList.remove('oculto');
    formLogin.classList.add('oculto');
});



function configurarBotonOjo(inputId, btnId) {
    const inputPassword = document.getElementById(inputId);
    const btnVerPass = document.getElementById(btnId);

    btnVerPass.addEventListener('click', function() {
        const icono = btnVerPass.querySelector('i');

        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';

            icono.classList.remove('fa-eye');
            icono.classList.add('fa-eye-slash');
        } else {
            inputPassword.type = 'password';

            icono.classList.remove('fa-eye-slash');
            icono.classList.add('fa-eye');
        }
    });
}

configurarBotonOjo('input-password-login', 'btn-ver-pass-login');
configurarBotonOjo('input-password-registro', 'btn-ver-pass-registro');