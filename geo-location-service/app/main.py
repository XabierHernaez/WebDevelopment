from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import os
from dotenv import load_dotenv
from datetime import datetime

# Importar configuración y servicios
from app.config.database import locations_collection
from app.services.geocoding_service import geocode_address, reverse_geocode

load_dotenv()

app = FastAPI(
    title="GeoRemind Geo-Location Service",
    description="Servicio de geolocalización para GeoRemind",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic
class GeocodeRequest(BaseModel):
    address: str = Field(..., description="Dirección a geocodificar")

class ReverseGeocodeRequest(BaseModel):
    lat: float = Field(..., description="Latitud", ge=-90, le=90)
    lng: float = Field(..., description="Longitud", ge=-180, le=180)

class SaveLocationRequest(BaseModel):
    name: str = Field(..., description="Nombre de la ubicación")
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    user_id: int = Field(..., description="ID del usuario")

# Rutas básicas
@app.get("/")
def read_root():
    return {
        "message": "🗺️ GeoRemind Geo-Location Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "OK"}

# Endpoint de geocodificación
@app.post("/api/geocode")
async def geocode(request: GeocodeRequest):
    """
    Convierte una dirección en coordenadas (lat, lng)
    
    Ejemplo: "Plaza Moyúa, Bilbao" → {lat: 43.2627, lng: -2.9253}
    """
    if not request.address or len(request.address.strip()) < 3:
        raise HTTPException(status_code=400, detail="La dirección debe tener al menos 3 caracteres")
    
    result = await geocode_address(request.address)
    
    if result is None:
        raise HTTPException(
            status_code=404, 
            detail=f"No se encontraron resultados para: {request.address}"
        )
    
    return {
        "success": True,
        "data": result
    }

# Endpoint de geocodificación inversa
@app.post("/api/reverse-geocode")
async def reverse_geocode_endpoint(request: ReverseGeocodeRequest):
    """
    Convierte coordenadas en una dirección
    
    Ejemplo: {lat: 43.2627, lng: -2.9253} → "Plaza Moyúa, Bilbao"
    """
    result = await reverse_geocode(request.lat, request.lng)
    
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró dirección para las coordenadas: {request.lat}, {request.lng}"
        )
    
    return {
        "success": True,
        "data": result
    }

# Endpoint para guardar ubicación en MongoDB
@app.post("/api/locations")
async def save_location(request: SaveLocationRequest):
    """
    Guarda una ubicación en MongoDB con índice geoespacial
    """
    try:
        location_doc = {
            "name": request.name,
            "coordinates": {
                "type": "Point",
                "coordinates": [request.lng, request.lat]  # GeoJSON: [lng, lat]
            },
            "address": request.address,
            "user_id": request.user_id,
            "created_at": datetime.utcnow()
        }
        
        result = locations_collection.insert_one(location_doc)
        location_doc["_id"] = str(result.inserted_id)
        
        return {
            "success": True,
            "message": "Ubicación guardada exitosamente",
            "location_id": str(result.inserted_id),
            "data": {
                "name": request.name,
                "lat": request.lat,
                "lng": request.lng,
                "address": request.address
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al guardar ubicación: {str(e)}")

# Endpoint para obtener ubicaciones del usuario
@app.get("/api/locations/user/{user_id}")
async def get_user_locations(user_id: int):
    """
    Obtiene todas las ubicaciones de un usuario
    """
    try:
        locations = list(locations_collection.find({"user_id": user_id}))
        
        # Convertir ObjectId a string
        for loc in locations:
            loc["_id"] = str(loc["_id"])
            loc["created_at"] = loc["created_at"].isoformat()
        
        return {
            "success": True,
            "count": len(locations),
            "locations": locations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener ubicaciones: {str(e)}")
    
    # Endpoint para obtener ubicación por ID
@app.get("/api/locations/{location_id}")
async def get_location_by_id(location_id: str):
    """
    Obtiene los detalles de una ubicación específica por su ID
    """
    try:
        from bson import ObjectId
        
        # Buscar en MongoDB
        location = locations_collection.find_one({"_id": ObjectId(location_id)})
        
        if not location:
            raise HTTPException(
                status_code=404,
                detail=f"Ubicación no encontrada: {location_id}"
            )
        
        # Extraer coordenadas del formato GeoJSON
        coordinates = location.get("coordinates", {}).get("coordinates", [])
        
        if len(coordinates) < 2:
            raise HTTPException(
                status_code=500,
                detail="Coordenadas inválidas en la ubicación"
            )
        
        # GeoJSON guarda como [lng, lat], devolvemos como {lat, lng}
        return {
            "success": True,
            "data": {
                "id": str(location["_id"]),
                "name": location.get("name"),
                "lat": coordinates[1],  # Segundo elemento es latitud
                "lng": coordinates[0],  # Primer elemento es longitud
                "address": location.get("address"),
                "user_id": location.get("user_id"),
                "created_at": location.get("created_at").isoformat() if location.get("created_at") else None
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener ubicación: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)