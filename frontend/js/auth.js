// Configuración de la API
const API_URL = "http://localhost:5000/api";

// Variables para el flujo 2FA
let pendingVerificationEmail = null;

// Elementos del DOM
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const verifyForm = document.getElementById("verifyForm");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");
const backToLoginLink = document.getElementById("backToLogin");
const resendCodeLink = document.getElementById("resendCode");
const verifyEmailSpan = document.getElementById("verifyEmail");
const authMessage = document.getElementById("authMessage");

// Cambiar a formulario de registro
showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.style.display = "none";
  registerForm.style.display = "block";
  verifyForm.style.display = "none";
  authMessage.style.display = "none";

  document.getElementById("registerName").value = "";
  document.getElementById("registerEmail").value = "";
  document.getElementById("registerPassword").value = "";
});

// Cambiar a formulario de login
showLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.style.display = "none";
  loginForm.style.display = "block";
  verifyForm.style.display = "none";
  authMessage.style.display = "none";
});

// Volver al login desde verificación
backToLoginLink.addEventListener("click", (e) => {
  e.preventDefault();
  verifyForm.style.display = "none";
  loginForm.style.display = "block";
  authMessage.style.display = "none";
  pendingVerificationEmail = null;

  document.getElementById("verifyCode").value = "";
});

// Reenviar código
resendCodeLink.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!pendingVerificationEmail) return;

  showMessage("Reenviando código...", "info");

  try {
    const response = await fetch(`${API_URL}/auth/resend-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: pendingVerificationEmail }),
    });

    const data = await response.json();

    if (data.success) {
      showMessage("✅ Nuevo código enviado a tu email", "success");
    } else {
      showMessage(data.message || "Error al reenviar código", "error");
    }
  } catch (error) {
    showMessage("Error de conexión con el servidor", "error");
    console.error("Error:", error);
  }
});

// Mostrar mensajes
function showMessage(message, type) {
  authMessage.textContent = message;
  authMessage.className = `message ${type}`;
  authMessage.style.display = "block";
}

// Mostrar formulario de verificación
function showVerifyForm(email) {
  loginForm.style.display = "none";
  registerForm.style.display = "none";
  verifyForm.style.display = "block";
  verifyEmailSpan.textContent = email;
  pendingVerificationEmail = email;

  // Dar foco al input del código
  setTimeout(() => {
    document.getElementById("verifyCode").focus();
  }, 100);
}

// Login (Paso 1)
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  showMessage("Verificando credenciales...", "info");

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success && data.requiresVerification) {
      showMessage("📧 Código enviado a tu email", "success");

      setTimeout(() => {
        showVerifyForm(data.email);
        authMessage.style.display = "none";
      }, 1000);
    } else if (!data.success) {
      showMessage(data.message || "Error al iniciar sesión", "error");
    }
  } catch (error) {
    showMessage("Error de conexión con el servidor", "error");
    console.error("Error:", error);
  }
});

// Verificar código (Paso 2)
verifyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const code = document.getElementById("verifyCode").value;

  if (code.length !== 6) {
    showMessage("El código debe tener 6 dígitos", "error");
    return;
  }

  showMessage("Verificando código...", "info");

  try {
    const response = await fetch(`${API_URL}/auth/verify-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: pendingVerificationEmail,
        code: code,
      }),
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      showMessage("✅ ¡Login exitoso! Redirigiendo...", "success");

      setTimeout(() => {
        window.location.href = "reminders-list.html";
      }, 1000);
    } else {
      showMessage(data.message || "Código incorrecto", "error");
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
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (data.success) {
      showMessage("¡Registro exitoso! Ahora puedes iniciar sesión", "success");

      setTimeout(() => {
        registerForm.style.display = "none";
        loginForm.style.display = "block";
        authMessage.style.display = "none";

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
