// ============================================================
// admin.js – Módulo de Gestión de Usuarios (Administrador)
// Conecta con la API REST en http://localhost:3000/api/users
// ============================================================

const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------
    // 1. VERIFICAR TOKEN (autenticación obligatoria)
    // -------------------------------------------------------
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    // -------------------------------------------------------
    // 2. REFERENCIAS A ELEMENTOS DEL DOM
    // -------------------------------------------------------
    const cuerpoTabla = document.getElementById('cuerpo-tabla-usuarios');
    const inputBuscar = document.getElementById('input-buscar');
    const btnMostrarForm = document.getElementById('btn-mostrar-form-nuevo');
    const seccionForm = document.getElementById('seccion-nuevo-usuario');
    const formNuevo = document.getElementById('form-nuevo-usuario');
    const btnCerrarForm = document.getElementById('btn-cerrar-form');
    const btnCancelar = document.getElementById('btn-cancelar-form');
    const formTitulo = document.getElementById('form-titulo');
    const mensajeForm = document.getElementById('mensaje-form');
    const editUserId = document.getElementById('edit-user-id');

    // Campos del formulario
    const campoNombre = document.getElementById('campo-nombre');
    const campoEmail = document.getElementById('campo-email');
    const campoRol = document.getElementById('campo-rol');
    const campoPassword = document.getElementById('campo-password');
    const campoConfirmar = document.getElementById('campo-confirmar');

    // Errores del formulario
    const errorNombre = document.getElementById('error-nombre');
    const errorEmail = document.getElementById('error-email');
    const errorRol = document.getElementById('error-rol');
    const errorPassword = document.getElementById('error-password');
    const errorConfirmar = document.getElementById('error-confirmar');

    // Modal de eliminación
    const modalEliminar = document.getElementById('modal-eliminar');
    const modalMensaje = document.getElementById('modal-mensaje');
    const btnCancelarEliminar = document.getElementById('btn-cancelar-eliminar');
    const btnConfirmarEliminar = document.getElementById('btn-confirmar-eliminar');

    // Cerrar sesión
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

    let todosLosUsuarios = []; // cache de usuarios
    let idParaEliminar = null; // id temporal para eliminación

    // -------------------------------------------------------
    // 3. CARGAR USUARIOS DESDE LA API
    // -------------------------------------------------------
    async function cargarUsuarios() {
        try {
            const res = await fetch(`${API_BASE}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('token');
                    window.location.href = '../login.html';
                    return;
                }
                throw new Error('Error al obtener usuarios');
            }

            const json = await res.json();
            todosLosUsuarios = json.data || json || [];
            renderizarTabla(todosLosUsuarios);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:30px; color:#e53935;">
                        &#9888; Error al cargar usuarios. Verifica la conexión con el servidor.
                    </td>
                </tr>`;
        }
    }

    // -------------------------------------------------------
    // 4. RENDERIZAR TABLA
    // -------------------------------------------------------
    function renderizarTabla(usuarios) {
        if (!usuarios || usuarios.length === 0) {
            cuerpoTabla.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:30px; opacity:0.6;">
                        No se encontraron usuarios.
                    </td>
                </tr>`;
            return;
        }

        cuerpoTabla.innerHTML = usuarios.map(u => {
            const badgeClass = obtenerBadgeClass(u.role);
            const badgeLabel = obtenerBadgeLabel(u.role);
            const fechaFormateada = formatearFecha(u.createdAt);

            return `
                <tr>
                    <td>${u.id}</td>
                    <td>${escaparHTML(u.full_name)}</td>
                    <td>${escaparHTML(u.email)}</td>
                    <td><span class="badge ${badgeClass}">${badgeLabel}</span></td>
                    <td>${fechaFormateada}</td>
                    <td class="td-acciones">
                        <button class="btn-accion btn-editar" title="Editar usuario" onclick="editarUsuario(${u.id})">
                            &#9999;&#65039; Editar
                        </button>
                        <button class="btn-accion btn-eliminar" title="Eliminar usuario" onclick="eliminarUsuario(${u.id}, '${escaparHTML(u.full_name)}')">
                            &#128465;&#65039; Eliminar
                        </button>
                    </td>
                </tr>`;
        }).join('');
    }

    // -------------------------------------------------------
    // 5. BADGES DE ROL (colores según requisito)
    // -------------------------------------------------------
    function obtenerBadgeClass(role) {
        switch (role) {
            case 'admin': return 'badge-admin';   // rojo / morado
            case 'coach': return 'badge-coach';   // azul
            case 'user': return 'badge-user';    // verde
            default: return 'badge-user';
        }
    }

    function obtenerBadgeLabel(role) {
        switch (role) {
            case 'admin': return 'admin';
            case 'coach': return 'coach';
            case 'user': return 'user';
            default: return role;
        }
    }

    // -------------------------------------------------------
    // 6. FORMATO DE FECHA: dd/mm/yyyy
    // -------------------------------------------------------
    function formatearFecha(fechaISO) {
        if (!fechaISO) return '—';
        const d = new Date(fechaISO);
        if (isNaN(d.getTime())) return '—';
        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const anio = d.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }

    // -------------------------------------------------------
    // 7. ESCAPAR HTML (seguridad XSS)
    // -------------------------------------------------------
    function escaparHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // -------------------------------------------------------
    // 8. BUSCAR / FILTRAR USUARIOS
    // -------------------------------------------------------
    inputBuscar.addEventListener('input', () => {
        const termino = inputBuscar.value.trim().toLowerCase();
        if (!termino) {
            renderizarTabla(todosLosUsuarios);
            return;
        }
        const filtrados = todosLosUsuarios.filter(u =>
            u.full_name.toLowerCase().includes(termino) ||
            u.email.toLowerCase().includes(termino) ||
            u.role.toLowerCase().includes(termino)
        );
        renderizarTabla(filtrados);
    });

    // -------------------------------------------------------
    // 9. MOSTRAR / OCULTAR FORMULARIO
    // -------------------------------------------------------
    btnMostrarForm.addEventListener('click', () => {
        limpiarFormulario();
        formTitulo.innerHTML = '&#128221; Crear Nuevo Usuario';
        document.getElementById('grupo-password').style.display = '';
        document.getElementById('grupo-confirm-password').style.display = '';
        seccionForm.style.display = 'block';
        seccionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    function cerrarFormulario() {
        seccionForm.style.display = 'none';
        limpiarFormulario();
    }

    btnCerrarForm.addEventListener('click', cerrarFormulario);
    btnCancelar.addEventListener('click', cerrarFormulario);

    // -------------------------------------------------------
    // 10. VALIDACIONES DEL FORMULARIO
    // -------------------------------------------------------
    function validarFormulario(esEdicion) {
        let valido = true;
        limpiarErroresForm();

        // Nombre
        const nombre = campoNombre.value.trim();
        if (!nombre) {
            mostrarError(campoNombre, errorNombre, 'El nombre es obligatorio');
            valido = false;
        } else if (nombre.length < 3) {
            mostrarError(campoNombre, errorNombre, 'El nombre debe tener al menos 3 caracteres');
            valido = false;
        }

        // Email
        const email = campoEmail.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            mostrarError(campoEmail, errorEmail, 'El email es obligatorio');
            valido = false;
        } else if (!emailRegex.test(email)) {
            mostrarError(campoEmail, errorEmail, 'Formato de email inválido');
            valido = false;
        }

        // Rol
        if (!campoRol.value) {
            mostrarError(campoRol, errorRol, 'Debe seleccionar un rol');
            valido = false;
        }

        // Contraseña (solo en creación, o si se llena en edición)
        if (!esEdicion) {
            const password = campoPassword.value;
            if (!password) {
                mostrarError(campoPassword, errorPassword, 'La contraseña es obligatoria');
                valido = false;
            } else if (password.length < 8) {
                mostrarError(campoPassword, errorPassword, 'Contraseña mínima 8 caracteres');
                valido = false;
            }

            const confirmar = campoConfirmar.value;
            if (!confirmar) {
                mostrarError(campoConfirmar, errorConfirmar, 'Debe confirmar la contraseña');
                valido = false;
            } else if (password !== confirmar) {
                mostrarError(campoConfirmar, errorConfirmar, 'Las contraseñas no coinciden');
                valido = false;
            }
        } else {
            // En edición, si se escribe contraseña, validar
            const password = campoPassword.value;
            if (password && password.length < 8) {
                mostrarError(campoPassword, errorPassword, 'Contraseña mínima 8 caracteres');
                valido = false;
            }
            if (password && password !== campoConfirmar.value) {
                mostrarError(campoConfirmar, errorConfirmar, 'Las contraseñas no coinciden');
                valido = false;
            }
        }

        return valido;
    }

    function mostrarError(input, errorEl, mensaje) {
        input.classList.add('borde-error');
        errorEl.textContent = mensaje;
    }

    function limpiarErroresForm() {
        [campoNombre, campoEmail, campoRol, campoPassword, campoConfirmar].forEach(el => {
            el.classList.remove('borde-error');
        });
        [errorNombre, errorEmail, errorRol, errorPassword, errorConfirmar].forEach(el => {
            el.textContent = '';
        });
        mensajeForm.textContent = '';
        mensajeForm.className = 'mensaje-form';
    }

    function limpiarFormulario() {
        formNuevo.reset();
        editUserId.value = '';
        limpiarErroresForm();
    }

    // -------------------------------------------------------
    // 11. ENVIAR FORMULARIO (crear o editar)
    // -------------------------------------------------------
    formNuevo.addEventListener('submit', async (e) => {
        e.preventDefault();

        const esEdicion = !!editUserId.value;
        if (!validarFormulario(esEdicion)) return;

        const datos = {
            full_name: campoNombre.value.trim(),
            email: campoEmail.value.trim().toLowerCase(),
            role: campoRol.value
        };

        // Agregar contraseña si corresponde
        if (!esEdicion || campoPassword.value) {
            datos.password = campoPassword.value;
        }

        try {
            let url, method;

            if (esEdicion) {
                url = `${API_BASE}/users/${editUserId.value}`;
                method = 'PUT';
            } else {
                url = `${API_BASE}/users`;
                method = 'POST';
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(datos)
            });

            const resultado = await res.json();

            if (res.ok) {
                mensajeForm.textContent = esEdicion
                    ? '✅ Usuario actualizado correctamente.'
                    : '✅ Usuario creado correctamente.';
                mensajeForm.className = 'mensaje-form mensaje-exito';
                await cargarUsuarios();
                setTimeout(() => cerrarFormulario(), 1500);
            } else {
                const msgError = resultado.message || resultado.errors
                    ? Object.values(resultado.errors || {}).join(', ') || resultado.message
                    : 'Error al guardar el usuario.';
                mensajeForm.textContent = '❌ ' + msgError;
                mensajeForm.className = 'mensaje-form mensaje-error';
            }
        } catch (error) {
            console.error('Error al guardar usuario:', error);
            mensajeForm.textContent = '❌ Error de conexión con el servidor.';
            mensajeForm.className = 'mensaje-form mensaje-error';
        }
    });

    // -------------------------------------------------------
    // 12. EDITAR USUARIO (función global)
    // -------------------------------------------------------
    window.editarUsuario = async function (id) {
        try {
            const res = await fetch(`${API_BASE}/users/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('No se pudo obtener el usuario');

            const json = await res.json();
            const usuario = json.data || json;

            // Rellenar formulario
            editUserId.value = usuario.id;
            campoNombre.value = usuario.full_name || '';
            campoEmail.value = usuario.email || '';
            campoRol.value = usuario.role || 'user';
            campoPassword.value = '';
            campoConfirmar.value = '';

            // Cambiar título y ocultar campos de contraseña opcionalmente
            formTitulo.innerHTML = '&#9999;&#65039; Editar Usuario';
            document.getElementById('grupo-password').style.display = '';
            document.getElementById('grupo-confirm-password').style.display = '';

            limpiarErroresForm();
            seccionForm.style.display = 'block';
            seccionForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            console.error('Error al cargar usuario para editar:', error);
            alert('No se pudo cargar los datos del usuario.');
        }
    };

    // -------------------------------------------------------
    // 13. ELIMINAR USUARIO (modal de confirmación)
    // -------------------------------------------------------
    window.eliminarUsuario = function (id, nombre) {
        idParaEliminar = id;
        modalMensaje.textContent = `¿Estás seguro de que deseas eliminar a "${nombre}"? Esta acción no se puede deshacer.`;
        modalEliminar.style.display = 'flex';
    };

    btnCancelarEliminar.addEventListener('click', () => {
        modalEliminar.style.display = 'none';
        idParaEliminar = null;
    });

    // Cerrar modal al hacer clic fuera
    modalEliminar.addEventListener('click', (e) => {
        if (e.target === modalEliminar) {
            modalEliminar.style.display = 'none';
            idParaEliminar = null;
        }
    });

    btnConfirmarEliminar.addEventListener('click', async () => {
        if (!idParaEliminar) return;

        try {
            const res = await fetch(`${API_BASE}/users/${idParaEliminar}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const resultado = await res.json();

            if (res.ok) {
                modalEliminar.style.display = 'none';
                idParaEliminar = null;
                await cargarUsuarios();
            } else {
                alert(resultado.message || 'No se pudo eliminar el usuario.');
                modalEliminar.style.display = 'none';
                idParaEliminar = null;
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error de conexión al eliminar el usuario.');
            modalEliminar.style.display = 'none';
            idParaEliminar = null;
        }
    });

    // -------------------------------------------------------
    // 14. CERRAR SESIÓN
    // -------------------------------------------------------
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '../login.html';
        });
    }

    // -------------------------------------------------------
    // 15. INICIO – Cargar usuarios
    // -------------------------------------------------------
    cargarUsuarios();
});
