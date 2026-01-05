const { Pool } = require("pg");
require("dotenv").config(); // ⬅️ IMPORTANTE: Cargar variables de entorno

// Configuración de PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || "georemind",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
});

// Verificar conexión
pool.on("connect", () => {
  console.log("✅ Conectado a PostgreSQL");
});

pool.on("error", (err) => {
  console.error("❌ Error en PostgreSQL:", err);
});

module.exports = pool;
