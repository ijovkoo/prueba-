document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formRegistro');
    if (!form) return;

    const nombre = form.querySelector('.nombrenombre');
    const correo = form.querySelector('.nombrecorre');
    const contra = form.querySelector('.nombrecontra');
    const confirmar = form.querySelector('.confirmarcontra');
    const apiMsg = document.getElementById('mensaje-error-api');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        limpiarErrores();

        let hayErrores = false;

        // 1. Validación: Campos obligatorios
        if (!nombre.value.trim()) {
            marcarError(nombre, 'El nombre es obligatorio');
            hayErrores = true;
        }

        // 2. Validación: Formato de Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo.value.trim())) {
            marcarError(correo, 'Formato de email inválido');
            hayErrores = true;
        }

        // 3. Validación: Contraseña segura (mínimo 8 caracteres)
        if (contra.value.length < 8) {
            marcarError(contra, 'La contraseña debe tener al menos 8 caracteres');
            hayErrores = true;
        }

        // 4. Validación: Confirmación de contraseña
        if (contra.value !== confirmar.value) {
            marcarError(confirmar, 'Las contraseñas no coinciden');
            hayErrores = true;
        }

        if (hayErrores) return;

        // Estandarización de datos
        const datosParaEnviar = {
            full_name: nombre.value.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '),
            email: correo.value.trim().toLowerCase(),
            password: contra.value,
            role: 'user'
        };

        try {
            const respuesta = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosParaEnviar)
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                apiMsg.style.color = 'green';
                apiMsg.textContent = '¡Registro exitoso! Redirigiendo...';
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                marcarError(correo, data.message || 'El correo ya está registrado');
            }

        } catch (error) {
            console.error('Error de red:', error);
            apiMsg.style.color = 'red';
            apiMsg.textContent = 'No hay conexión con el servidor.';
        }
    });

    function marcarError(inputElement, mensaje) {
        inputElement.classList.add('borde-error');
        const errorSmall = inputElement.nextElementSibling;
        if (errorSmall && errorSmall.classList.contains('error-texto')) {
            errorSmall.textContent = mensaje;
        }
    }

    function limpiarErrores() {
        form.querySelectorAll('input').forEach(i => i.classList.remove('borde-error'));
        form.querySelectorAll('.error-texto').forEach(m => m.textContent = '');
        apiMsg.textContent = '';
    }
});
