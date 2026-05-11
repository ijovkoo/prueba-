// ============================================================
// coach.js – Panel del Entrenador (Coach)
// Carga datos reales del coach logueado desde la API
// ============================================================

const API_BASE = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', async () => {
    // -------------------------------------------------------
    // 1. VERIFICAR TOKEN
    // -------------------------------------------------------
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    // -------------------------------------------------------
    // 2. CARGAR DATOS DEL COACH LOGUEADO
    // -------------------------------------------------------
    let coachData = null;

    try {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            localStorage.removeItem('token');
            window.location.href = '../login.html';
            return;
        }

        const json = await res.json();
        coachData = json.data || json;

        // --- Rellenar perfil visual ---
        const nombre = coachData.full_name || 'Coach';
        const email = coachData.email || '';
        const fechaRegistro = formatearFecha(coachData.createdAt);

        // Nombre en header
        const headerNombre = document.getElementById('coach-nombre-header');
        if (headerNombre) headerNombre.textContent = nombre;

        // Bienvenida
        const bienvenida = document.getElementById('coach-bienvenida');
        if (bienvenida) bienvenida.textContent = `Bienvenido, ${nombre}. Gestiona tu equipo y revisa tu agenda.`;

        // Tarjeta de perfil
        document.getElementById('coach-nombre').textContent = nombre;
        document.getElementById('coach-email').textContent = `Email: ${email}`;
        document.getElementById('coach-fecha-registro').textContent = `Miembro desde: ${fechaRegistro}`;

        // Iniciales del avatar
        const iniciales = nombre.split(' ')
            .filter(p => p.length > 0)
            .map(p => p[0].toUpperCase())
            .slice(0, 2)
            .join('');
        document.getElementById('coach-avatar-iniciales').innerHTML = `<span>${iniciales}</span>`;

        // Especialidad desde metadata
        const metadata = coachData.metadata || {};
        const especialidad = metadata.specialty || '';
        const espEl = document.getElementById('coach-especialidad');
        if (especialidad && espEl) {
            espEl.textContent = `Especialidad: ${capitalizar(especialidad)}`;
        }

        // Rellenar formulario de edición
        document.getElementById('coach-input-nombre').value = nombre;
        document.getElementById('coach-input-email').value = email;
        if (coachData.birth_date) {
            document.getElementById('coach-input-fecha').value = coachData.birth_date;
        }
        document.getElementById('coach-input-especialidad').value = especialidad;

    } catch (error) {
        console.error('Error al cargar datos del coach:', error);
    }

    // -------------------------------------------------------
    // 3. CARGAR LISTA DE ALUMNOS (usuarios con rol 'user')
    // -------------------------------------------------------
    let todosAlumnos = [];

    async function cargarAlumnos() {
        try {
            const res = await fetch(`${API_BASE}/users?role=user`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Error al cargar alumnos');

            const json = await res.json();
            todosAlumnos = json.data || json || [];

            // Actualizar stat
            document.getElementById('stat-alumnos').textContent = todosAlumnos.length;

            renderizarAlumnos(todosAlumnos);
        } catch (error) {
            console.error('Error cargando alumnos:', error);
            document.getElementById('cuerpo-tabla-alumnos').innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:30px; color:#e53935;">
                        ⚠ Error al cargar alumnos.
                    </td>
                </tr>`;
        }
    }

    function renderizarAlumnos(alumnos) {
        const tbody = document.getElementById('cuerpo-tabla-alumnos');

        if (!alumnos || alumnos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:30px; opacity:0.6;">
                        No hay alumnos registrados.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = alumnos.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>${escaparHTML(a.full_name)}</td>
                <td>${escaparHTML(a.email)}</td>
                <td>${formatearFecha(a.createdAt)}</td>
                <td>
                    <button class="btn-accion btn-ver-progreso" onclick="verProgreso(${a.id}, '${escaparHTML(a.full_name)}')">
                        📊 Ver Progreso
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Búsqueda de alumnos
    const inputBuscar = document.getElementById('buscar-alumno');
    if (inputBuscar) {
        inputBuscar.addEventListener('input', () => {
            const termino = inputBuscar.value.trim().toLowerCase();
            if (!termino) {
                renderizarAlumnos(todosAlumnos);
                return;
            }
            const filtrados = todosAlumnos.filter(a =>
                a.full_name.toLowerCase().includes(termino) ||
                a.email.toLowerCase().includes(termino)
            );
            renderizarAlumnos(filtrados);
        });
    }

    // Función global para ver progreso
    window.verProgreso = function (id, nombre) {
        alert(`📊 Progreso de "${nombre}" (ID: ${id})\n\nEsta función se integrará próximamente.`);
    };

    // -------------------------------------------------------
    // 4. EDITAR INFORMACIÓN DEL COACH
    // -------------------------------------------------------
    const formInfo = document.getElementById('form-coach-info');
    const msgInfo = document.getElementById('coach-msg-info');

    if (formInfo) {
        formInfo.addEventListener('submit', async (e) => {
            e.preventDefault();
            msgInfo.textContent = '';
            msgInfo.className = 'mensaje-form';

            const datos = {
                full_name: document.getElementById('coach-input-nombre').value.trim(),
                birth_date: document.getElementById('coach-input-fecha').value || null
            };

            if (!datos.full_name || datos.full_name.length < 3) {
                msgInfo.textContent = '❌ El nombre debe tener al menos 3 caracteres.';
                msgInfo.className = 'mensaje-form mensaje-error';
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/auth/me`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(datos)
                });

                if (res.ok) {
                    // Actualizar la UI
                    document.getElementById('coach-nombre').textContent = datos.full_name;
                    document.getElementById('coach-nombre-header').textContent = datos.full_name;
                    document.getElementById('coach-bienvenida').textContent =
                        `Bienvenido, ${datos.full_name}. Gestiona tu equipo y revisa tu agenda.`;

                    // Actualizar iniciales
                    const iniciales = datos.full_name.split(' ')
                        .filter(p => p.length > 0)
                        .map(p => p[0].toUpperCase())
                        .slice(0, 2)
                        .join('');
                    document.getElementById('coach-avatar-iniciales').innerHTML = `<span>${iniciales}</span>`;

                    msgInfo.textContent = '✅ Información actualizada correctamente.';
                    msgInfo.className = 'mensaje-form mensaje-exito';
                } else {
                    const err = await res.json();
                    msgInfo.textContent = '❌ ' + (err.message || 'Error al guardar.');
                    msgInfo.className = 'mensaje-form mensaje-error';
                }
            } catch (error) {
                console.error('Error al actualizar:', error);
                msgInfo.textContent = '❌ Error de conexión con el servidor.';
                msgInfo.className = 'mensaje-form mensaje-error';
            }
        });
    }

    // -------------------------------------------------------
    // 5. CAMBIAR CONTRASEÑA
    // -------------------------------------------------------
    const formPass = document.getElementById('form-coach-pass');
    const msgPass = document.getElementById('coach-msg-pass');

    if (formPass) {
        formPass.addEventListener('submit', async (e) => {
            e.preventDefault();
            msgPass.textContent = '';
            msgPass.className = 'mensaje-form';

            const actual = document.getElementById('coach-pass-actual').value;
            const nueva = document.getElementById('coach-pass-nueva').value;

            if (nueva.length < 8) {
                msgPass.textContent = '❌ La nueva contraseña debe tener mínimo 8 caracteres.';
                msgPass.className = 'mensaje-form mensaje-error';
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/auth/me/password`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        current_password: actual,
                        new_password: nueva,
                        confirm_password: nueva
                    })
                });

                if (res.ok) {
                    msgPass.textContent = '✅ Contraseña actualizada con éxito.';
                    msgPass.className = 'mensaje-form mensaje-exito';
                    formPass.reset();
                } else {
                    const err = await res.json();
                    msgPass.textContent = '❌ ' + (err.message || 'Error al cambiar contraseña.');
                    msgPass.className = 'mensaje-form mensaje-error';
                }
            } catch (error) {
                console.error('Error al cambiar contraseña:', error);
                msgPass.textContent = '❌ Error de conexión.';
                msgPass.className = 'mensaje-form mensaje-error';
            }
        });
    }

    // -------------------------------------------------------
    // 6. CERRAR SESIÓN
    // -------------------------------------------------------
    const btnCerrar = document.getElementById('btn-cerrar-sesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '../login.html';
        });
    }

    // -------------------------------------------------------
    // 7. UTILIDADES
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

    function escaparHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function capitalizar(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // -------------------------------------------------------
    // 8. INICIO
    // -------------------------------------------------------
    cargarAlumnos();
});
