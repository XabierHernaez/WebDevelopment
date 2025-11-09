// Configuración de la API
const API_URL = "http://localhost:3001/api";

// Elementos del DOM
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");
const authMessage = document.getElementById("authMessage");

// Cambiar entre formularios
showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.style.display = "none";
  registerForm.style.display = "block";
  authMessage.style.display = "none";
});

showLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.style.display = "none";
  loginForm.style.display = "block";
  authMessage.style.display = "none";
});

// Mostrar mensajes
function showMessage(message, type) {
  authMessage.textContent = message;
  authMessage.className = `message ${type}`;
  authMessage.style.display = "block";
}

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Guardar token y usuario en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMessage("¡Login exitoso! Redirigiendo...", "success");

      // Redirigir al dashboard
      setTimeout(() => {
        window.location.href = "reminders-list.html";
      }, 1000);
    } else {
      showMessage(data.message || "Error al iniciar sesión", "error");
    }
  } catch (error) {
    showMessage("Error de conexión con el servidor", "error");
    console.error("Error:", error);
  }
});

// Registro
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  if (password.length < 6) {
    showMessage("La contraseña debe tener al menos 6 caracteres", "error");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (data.success) {
      showMessage("¡Registro exitoso! Ahora puedes iniciar sesión", "success");

      // Cambiar a formulario de login después de 1.5 segundos
      setTimeout(() => {
        registerForm.style.display = "none";
        loginForm.style.display = "block";
        authMessage.style.display = "none";

        // Prellenar el email
        document.getElementById("loginEmail").value = email;
      }, 1500);
    } else {
      showMessage(data.message || "Error al registrarse", "error");
    }
  } catch (error) {
    showMessage("Error de conexión con el servidor", "error");
    console.error("Error:", error);
  }
});

// Verificar si ya hay sesión activa
if (localStorage.getItem("token")) {
  window.location.href = "reminders-list.html";
}
