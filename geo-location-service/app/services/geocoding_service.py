import httpx
from typing import Optional, Dict

# API de Nominatim (OpenStreetMap) - Gratuita
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org"

# User-Agent requerido por Nominatim
HEADERS = {
    "User-Agent": "GeoRemind/1.0 (contact@georemind.com)"
}

async def geocode_address(address: str) -> Optional[Dict]:
    """
    Convierte una dirección en coordenadas (lat, lng)
    
    Args:
        address: Dirección a geocodificar (ej: "Plaza Moyúa, Bilbao")
    
    Returns:
        Dict con lat, lng, display_name y boundingbox, o None si falla
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{NOMINATIM_BASE_URL}/search",
                params={
                    "q": address,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1
                },
                headers=HEADERS,
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data and len(data) > 0:
                    result = data[0]
                    return {
                        "lat": float(result["lat"]),
                        "lng": float(result["lon"]),
                        "display_name": result["display_name"],
                        "address": result.get("address", {}),
                        "boundingbox": result.get("boundingbox", [])
                    }
            
            return None
            
    except Exception as e:
        print(f"❌ Error en geocode_address: {e}")
        return None


async def reverse_geocode(lat: float, lng: float) -> Optional[Dict]:
    """
    Convierte coordenadas en una dirección (geocodificación inversa)
    
    Args:
        lat: Latitud
        lng: Longitud
    
    Returns:
        Dict con display_name y detalles de dirección, o None si falla
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{NOMINATIM_BASE_URL}/reverse",
                params={
                    "lat": lat,
                    "lon": lng,
                    "format": "json",
                    "addressdetails": 1
                },
                headers=HEADERS,
                timeout=10.0
            )
            
            if response.status_code == 200:
                result = response.json()
                
                return {
                    "lat": float(result["lat"]),
                    "lng": float(result["lon"]),
                    "display_name": result["display_name"],
                    "address": result.get("address", {})
                }
            
            return None
            
    except Exception as e:
        print(f"❌ Error en reverse_geocode: {e}")
        return None