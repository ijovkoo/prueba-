document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificamos el Token
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "../login.html"; 
        return;
    }

    // ==========================================
    // A. CARGAR DATOS REALES (Sincronización Inicial)
    // ==========================================
    try {
        const respuesta = await fetch('http://localhost:3000/api/auth/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
            const usuario = data.data || data;

            // Rellenamos los inputs del formulario de Información Personal
            document.getElementById('nombre').value = usuario.full_name || "";
            document.getElementById('email').value = usuario.email || "";
            
            // Rellenamos los campos adicionales si existen en la DB
            if(usuario.birth_date) document.getElementById('fecha').value = usuario.birth_date;
            if(usuario.sport) document.getElementById('deporte').value = usuario.sport;
            if(usuario.interests) document.getElementById('intereses').value = usuario.interests;
            
            // Regla de oro: El email no se puede editar
            document.getElementById('email').disabled = true;
            document.getElementById('email').style.backgroundColor = "#e9ecef";

            // Actualizamos la tarjeta visual de la izquierda
            document.getElementById('display-nombre').textContent = usuario.full_name;
            document.getElementById('display-email').textContent = `Email: ${usuario.email}`;
            document.getElementById('display-rol').textContent = `Rol: ${usuario.role}`;
        } else {
            localStorage.removeItem("token");
            window.location.href = "../login.html";
        }
    } catch (error) {
        console.error("Error al cargar datos:", error);
    }

    // ==========================================
    // B. ACTUALIZAR INFORMACIÓN PERSONAL (Persistencia)
    // ==========================================
    const formInfo = document.getElementById('form-info');
    if (formInfo) {
        formInfo.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const datosActualizados = {
                full_name: document.getElementById('nombre').value,
                birth_date: document.getElementById('fecha').value,
                sport: document.getElementById('deporte').value,
                interests: document.getElementById('intereses').value
            };

            try {
                const res = await fetch('http://localhost:3000/api/auth/me', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(datosActualizados)
                });

                if (res.ok) {
                    document.getElementById('display-nombre').textContent = datosActualizados.full_name;
                    alert("¡Información actualizada y guardada permanentemente!");
                } else {
                    const errorData = await res.json();
                    console.error("Respuesta del servidor:", errorData);
                    alert("No se pudo guardar la información. Revisa el formato de los datos.");
                }
            } catch (error) {
                console.error("Error en la conexión:", error);
            }
        });
    }

    // ==========================================
    // C. CAMBIAR CONTRASEÑA (Con Confirmación)
    // ==========================================
    const formPass = document.getElementById('form-pass');
    if (formPass) {
        formPass.addEventListener('submit', async (e) => {
            e.preventDefault();
            const actual = document.getElementById('pass-actual').value;
            const nueva = document.getElementById('pass-nueva').value;

            if (nueva.length < 8) {
                alert("La nueva contraseña debe tener mínimo 8 caracteres");
                return;
            }

            try {
                const res = await fetch('http://localhost:3000/api/auth/me/password', {
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
                    alert("¡Contraseña actualizada con éxito!");
                    formPass.reset();
                } else {
                    const errorData = await res.json();
                    alert(errorData.message || "Error al cambiar contraseña. Verifica la actual.");
                }
            } catch (error) {
                console.error("Error al conectar:", error);
            }
        });
    }

    // ==========================================
    // D. CERRAR SESIÓN
    // ==========================================
    const btnCerrar = document.getElementById('btn-cerrar-sesion');
    if (btnCerrar) {
        btnCerrar.addEventListener('click', () => {
            localStorage.removeItem("token");
            window.location.href = "../login.html";
        });
    }
});
