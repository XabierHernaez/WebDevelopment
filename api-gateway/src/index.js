const express = require("express");
const cors = require("cors");
const proxy = require("express-http-proxy");

const app = express();
const PORT = 5000;

// ===== MIDDLEWARE =====
app.use(cors());

// Logging
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.json({
    message: "🚪 GeoRemind API Gateway",
    status: "running",
    services: {
      userService: "http://user-service:3001",
      geoService: "http://geo-service:8000",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ===== PROXY A USER SERVICE (Puerto 3001) =====
app.use(
  "/api/auth",
  proxy("http://user-service:3001", {  // ✅ CAMBIADO: usar nombre del servicio Docker
    proxyReqPathResolver: (req) => {
      const newPath = `/api/auth${req.url}`;
      console.log(`📤 User Service: ${newPath}`);
      return newPath;
    },
  })
);

app.use(
  "/api/reminders",
  proxy("http://user-service:3001", {  // ✅ CAMBIADO
    proxyReqPathResolver: (req) => {
      const newPath = `/api/reminders${req.url}`;
      console.log(`📤 User Service: ${newPath}`);
      return newPath;
    },
  })
);

app.use(
  "/api/friends",
  proxy("http://user-service:3001", {  // ✅ CAMBIADO
    proxyReqPathResolver: (req) => {
      const newPath = `/api/friends${req.url}`;
      console.log(`📤 User Service (Friends): ${newPath}`);
      return newPath;
    },
  })
);

app.use(
  "/api/groups",
  proxy("http://user-service:3001", {  // ✅ CAMBIADO
    proxyReqPathResolver: (req) => {
      const newPath = `/api/groups${req.url}`;
      console.log(`📤 User Service (Groups): ${newPath}`);
      return newPath;
    },
  })
);

// ===== PROXY A GEO SERVICE (Puerto 8000) =====
app.use(
  "/api/geocode",
  proxy("http://geo-service:8000", {  // ✅ CAMBIADO
    proxyReqPathResolver: (req) => {
      const cleanUrl = req.url === "/" ? "" : req.url;
      const newPath = `/api/geocode${cleanUrl}`;
      console.log(`📤 Geo Service: ${newPath}`);
      return newPath;
    },
  })
);

app.use(
  "/api/locations",
  proxy("http://geo-service:8000", {  // ✅ CAMBIADO
    proxyReqPathResolver: (req) => {
      const newPath = `/api/locations${req.url}`;
      console.log(`📤 Geo Service: ${newPath}`);
      return newPath;
    },
  })
);

// ===== INICIAR SERVIDOR =====
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚪 API GATEWAY ACTIVO                ║
║                                        ║
║   Puerto: ${PORT}                          ║
║   URL: http://localhost:${PORT}            ║
║                                        ║
║   Servicios conectados:                ║
║   • User Service    → :3001            ║
║   • Geo Service     → :8000            ║
╚════════════════════════════════════════╝
  `);
});