const pool = require("./src/config/database");

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Conexión exitosa a PostgreSQL");
    console.log("Hora del servidor:", result.rows[0].now);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
    process.exit(1);
  }
}

testConnection();
