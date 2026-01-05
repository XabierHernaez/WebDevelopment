const { Client } = require("pg");
require("dotenv").config();

const client = new Client({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

async function testConnection() {
  try {
    console.log("🔌 Intentando conectar a PostgreSQL...");
    await client.connect();
    console.log("✅ Conexión exitosa a PostgreSQL!");

    // Probar una query simple
    const result = await client.query("SELECT NOW()");
    console.log("⏰ Hora del servidor:", result.rows[0].now);

    // Crear tabla de usuarios (si no existe)
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "users" creada o ya existe');

    // Crear tabla de recordatorios (si no existe)
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reminder_type VARCHAR(50) NOT NULL,
        datetime TIMESTAMP,
        location_id VARCHAR(100),
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "reminders" creada o ya existe');

    // Listar tablas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("📊 Tablas en la base de datos:");
    tables.rows.forEach((row) => console.log("   -", row.table_name));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
    console.log("🔌 Conexión cerrada");
  }
}

testConnection();
