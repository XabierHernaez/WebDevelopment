const axios = require("axios");

// URL del Geo Service (Python)
const GEO_SERVICE_URL = process.env.GEO_SERVICE_URL || "http://localhost:8000";

/**
 * Geocodificar una dirección (dirección → coordenadas)
 */
const geocodeAddress = async (address) => {
  try {
    const response = await axios.post(`${GEO_SERVICE_URL}/api/geocode`, {
      address: address,
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    }

    return {
      success: false,
      error: "No se pudo geocodificar la dirección",
    };
  } catch (error) {
    console.error("❌ Error al geocodificar dirección:", error.message);
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        "Error al conectar con el servicio de geolocalización",
    };
  }
};

/**
 * Guardar ubicación en MongoDB (a través del Geo Service)
 */
const saveLocation = async (locationData) => {
  try {
    const response = await axios.post(
      `${GEO_SERVICE_URL}/api/locations`,
      locationData
    );

    if (response.data.success) {
      return {
        success: true,
        location_id: response.data.location_id,
        data: response.data.data,
      };
    }

    return {
      success: false,
      error: "No se pudo guardar la ubicación",
    };
  } catch (error) {
    console.error("❌ Error al guardar ubicación:", error.message);
    return {
      success: false,
      error: error.response?.data?.detail || "Error al guardar ubicación",
    };
  }
};

/**
 * Obtener ubicaciones de un usuario
 */
const getUserLocations = async (userId) => {
  try {
    const response = await axios.get(
      `${GEO_SERVICE_URL}/api/locations/user/${userId}`
    );

    if (response.data.success) {
      return {
        success: true,
        locations: response.data.locations,
      };
    }

    return {
      success: false,
      error: "No se pudieron obtener las ubicaciones",
    };
  } catch (error) {
    console.error("❌ Error al obtener ubicaciones:", error.message);
    return {
      success: false,
      error: error.response?.data?.detail || "Error al obtener ubicaciones",
    };
  }
};

/**
 * Eliminar ubicación de MongoDB
 */
const deleteLocation = async (locationId) => {
  try {
    const response = await axios.delete(
      `${GEO_SERVICE_URL}/api/locations/${locationId}`
    );

    if (response.data.success) {
      return {
        success: true,
        message: "Ubicación eliminada correctamente",
      };
    }

    return {
      success: false,
      error: "No se pudo eliminar la ubicación",
    };
  } catch (error) {
    console.error("❌ Error al eliminar ubicación:", error.message);
    // Si la ubicación no existe (404), considerarlo éxito
    if (error.response?.status === 404) {
      return {
        success: true,
        message: "Ubicación ya no existe",
      };
    }
    return {
      success: false,
      error: error.response?.data?.detail || "Error al eliminar ubicación",
    };
  }
};

module.exports = {
  geocodeAddress,
  saveLocation,
  getUserLocations,
  deleteLocation,
};
