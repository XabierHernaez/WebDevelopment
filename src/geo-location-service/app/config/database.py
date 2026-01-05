from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de MongoDB
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://georemind_user:georemind_pass123@localhost:27017/")
DATABASE_NAME = "georemind"

# Cliente de MongoDB
client = MongoClient(MONGODB_URI)
db = client[DATABASE_NAME]

# Colecciones
locations_collection = db["locations"]
external_places_collection = db["external_places"]

# Crear índice geoespacial en locations (si no existe)
try:
    locations_collection.create_index([("coordinates", "2dsphere")])
    print("✅ Índice geoespacial creado en 'locations'")
except Exception as e:
    print(f"⚠️ Índice geoespacial ya existe o error: {e}")

def get_database():
    return db