const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function testConnection() {
  try {
    console.log("🔌 Intentando conectar a MongoDB...");
    await client.connect();
    console.log("✅ Conexión exitosa a MongoDB!");

    const db = client.db("georemind_db");

    // Crear colección de ubicaciones (si no existe)
    const locationsCollection = db.collection("locations");
    await locationsCollection.createIndex({ coordinates: "2dsphere" });
    console.log('✅ Colección "locations" creada con índice geoespacial');

    // Crear colección de notificaciones (si no existe)
    const notificationsCollection = db.collection("notifications");
    console.log('✅ Colección "notifications" creada');

    // Crear colección de lugares externos (si no existe)
    const externalPlacesCollection = db.collection("external_places");
    console.log('✅ Colección "external_places" creada');

    // Listar colecciones
    const collections = await db.listCollections().toArray();
    console.log("📊 Colecciones en la base de datos:");
    collections.forEach((col) => console.log("   -", col.name));

    // Insertar documento de prueba
    const testLocation = {
      name: "Casa",
      coordinates: {
        type: "Point",
        coordinates: [-2.9349852, 43.2630126], // Bilbao
      },
      address: "Bilbao, Basque Country",
      createdAt: new Date(),
    };

    const result = await locationsCollection.insertOne(testLocation);
    console.log("✅ Documento de prueba insertado:", result.insertedId);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
    console.log("🔌 Conexión cerrada");
  }
}

testConnection();
