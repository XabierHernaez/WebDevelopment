const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Importar rutas
const userRoutes = require("./routes/userRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const friendRoutes = require("./routes/friendRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas básicas
app.get("/", (req, res) => {
  res.json({
    message: "👤 GeoRemind User & Reminder Service",
    version: "1.0.0",
    status: "running",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Rutas de usuarios
app.use("/api/auth", userRoutes);

// Rutas de recordatorios
app.use("/api/reminders", reminderRoutes);

// Rutas de amigos
app.use("/api/friends", friendRoutes);

// Rutas de grupos
app.use("/api/groups", groupRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`👤 User Service corriendo en http://localhost:${PORT}`);
});
