// 1. LISTA DE USUARIOS (Nuestra "Base de Datos")
const usuarios = [
    { user: "user1@sportclub.cl", password: "1234", role: "user" },
    { user: "coach1@sportclub.cl", password: "1234", role: "coach" }, 
    { user: "admin1@sportclub.cl", password: "1234", role: "admin" } 
];

// 2. FUNCIÓN DE LOGIN (Se activa desde el botón)
function validarEntrada() {
    const correo = document.getElementById("email").value;
    const clave = document.getElementById("pass").value;
    const mensaje = document.getElementById("mensaje");

    const econtrar = usuarios.find(u => u.user === correo && u.password === clave);

    if (econtrar) {
        // Guardamos en la mochila
        localStorage.setItem("user", JSON.stringify(econtrar));
        // Redirigir al dashboard correspondiente según el rol
        if (econtrar.role === "admin") {
            window.location.href = "dashboard/admin.html";
        } else if (econtrar.role === "coach") {
            window.location.href = "dashboard/coach.html";
        } else {
            window.location.href = "dashboard/usuario.html";
        }
    } else {
        // Error sin alert
        mensaje.textContent = "Clave incorrecta, intenta de nuevo";
        mensaje.style.color = "red";
    }
}

// La función comparar ya no es necesaria porque cada dashboard es independiente.