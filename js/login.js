document.addEventListener('DOMContentLoaded', () => {
    const formulariologin = document.getElementById("formulario-login");
    const mensajeError = document.getElementById("mensaje-error"); 

    if (!formulariologin) return;

    formulariologin.addEventListener("submit", async (evento) => {
        evento.preventDefault(); 
        mensajeError.textContent = "Cargando...";
        mensajeError.style.color = "blue";
        
        const email = document.getElementById("email").value;
        const password = document.getElementById("pass").value; 
        
        console.log("PASO 1: Botón presionado. Intentando ingresar con: " + email);

        try {
            console.log("PASO 2: Enviando petición fetch al backend en localhost:3000...");
            const respuesta = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            console.log("PASO 3: El backend respondió con status:", respuesta.status);

            const resultado = await respuesta.json();
            console.log("PASO 4: JSON extraído de la respuesta:", resultado);

            if (respuesta.ok) {
                console.log("PASO 5: Todo correcto, buscando token y rol...");
                const token = resultado.token || (resultado.data && resultado.data.token);
                const rol = resultado.user?.role || (resultado.data && resultado.data.user?.role);

                localStorage.setItem("token", token);
                console.log(`Rol detectado: ${rol}. Redirigiendo...`);
                
                if (rol === "admin") {
                    window.location.href = "dashboard/admin.html";
                } else if (rol === "coach") {
                    window.location.href = "dashboard/coach.html";
                } else {
                    window.location.href = "dashboard/usuario.html";
                }
            } else {
                console.log("PASO 5 (Error): El backend dice que los datos son incorrectos.");
                mensajeError.textContent = resultado.message || "Credenciales incorrectas";
                mensajeError.style.color = "red";
            }
        } catch (error) {
            console.error("ERROR CRÍTICO:", error);
            mensajeError.textContent = "El servidor está apagado o rechazó la conexión.";
            mensajeError.style.color = "red";
        }
    });
});
