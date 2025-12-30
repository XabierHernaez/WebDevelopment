# 🗺️ GeoRemind

Plataforma web de gestión inteligente de recordatorios con geolocalización contextual.

## 🚀 Tecnologías

- **Backend**: Node.js (Express) + Python (FastAPI)
- **Bases de datos**: PostgreSQL + MongoDB
- **Frontend**: HTML5 + CSS + JavaScript
- **Contenedores**: Docker

## 📁 Estructura del proyecto
```
georemind/
├── api-gateway/              # API Gateway (Node.js:5000)
├── user-reminder-service/    # Servicio de usuarios (Node.js:3001)
├── geo-location-service/     # Servicio de geolocalización (Python:8000)
├── frontend/                 # Interfaz web
├── docker-compose.yml        # Configuración de contenedores
└── georemind_schema.sql      # Estructura de PostgreSQL
```

## 🛠️ Requisitos previos

Antes de comenzar, asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (v18 o superior)
- [Python](https://www.python.org/) (v3.10 o superior)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

## 📦 Instalación

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/XabierHernaez/WebDevelopment.git
cd WebDevelopment
```

### 2️⃣ Configurar variables de entorno

Crea archivos `.env` en cada servicio basándote en los `.env.example`:

**API Gateway:**
```bash
cd api-gateway
copy .env.example .env
# Edita .env si es necesario
```

**User Service:**
```bash
cd ../user-reminder-service
copy .env.example .env
# IMPORTANTE: Configura tus credenciales SMTP para el 2FA
```

**Geo Service:**
```bash
cd ../geo-location-service
copy .env.example .env
```

### 3️⃣ Levantar bases de datos con Docker

Desde la raíz del proyecto:
```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en puerto `5432`
- MongoDB en puerto `27017`

Verifica que estén corriendo:
```bash
docker ps
```

### 4️⃣ Importar estructura de PostgreSQL
```bash
docker exec -i georemind_postgres psql -U georemind_user -d georemind_db < georemind_schema.sql
```

Verifica la importación:
```bash
docker exec -it georemind_postgres psql -U georemind_user -d georemind_db -c "\dt"
```

Deberías ver 7 tablas: `users`, `reminders`, `friendships`, `groups`, `group_members`, `group_reminders`, `shared_reminders`

### 5️⃣ Configurar MongoDB
```bash
docker exec -it georemind_mongo mongosh -u georemind_user -p georemind_pass123 --authenticationDatabase admin
```

Dentro de MongoDB, ejecuta:
```javascript
use georemind_db
db.createCollection("locations")
db.createCollection("notifications")
db.createCollection("external_places")
db.locations.createIndex({ location: "2dsphere" })
exit
```

### 6️⃣ Instalar dependencias

**API Gateway:**
```bash
cd api-gateway
npm install
```

**User Service:**
```bash
cd ../user-reminder-service
npm install
```

**Geo Service:**
```bash
cd ../geo-location-service

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

## ▶️ Ejecutar el proyecto

Necesitas **3 terminales** abiertas simultáneamente:

### Terminal 1 - API Gateway
```bash
cd api-gateway
npm run dev
```
✅ Debería mostrar: `API GATEWAY ACTIVO en puerto 5000`

### Terminal 2 - User Service
```bash
cd user-reminder-service
npm run dev
```
✅ Debería mostrar: `User Service corriendo en http://localhost:3001`

### Terminal 3 - Geo Service
```bash
cd geo-location-service
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
uvicorn app.main:app --reload --port 8000
```
✅ Debería mostrar: `Uvicorn running on http://0.0.0.0:8000`

### Abrir la aplicación

Abre tu navegador en:
```
http://localhost:5000
```

## 📊 Puertos utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| API Gateway | 5000 | http://localhost:5000 |
| User Service | 3001 | http://localhost:3001 |
| Geo Service | 8000 | http://localhost:8000 |
| PostgreSQL | 5432 | localhost:5432 |
| MongoDB | 27017 | localhost:27017 |

## 🔧 Solución de problemas

### Docker no inicia
```bash
# Verificar que Docker Desktop esté corriendo
docker --version
docker ps

# Reiniciar contenedores
docker-compose down
docker-compose up -d
```

### Error de permisos en MongoDB
```bash
# Recrear contenedores desde cero
docker-compose down -v
docker-compose up -d
# Volver a ejecutar el paso 5 (Configurar MongoDB)
```

### Error "module not found" en Python
```bash
# Asegúrate de estar en el entorno virtual
cd geo-location-service
venv\Scripts\activate
pip install -r requirements.txt
```

### Resetear permisos de ubicación en el navegador
```javascript
// Abrir consola del navegador (F12) y ejecutar:
localStorage.removeItem("location_permission_asked");
```

## 🌟 Funcionalidades principales

- 🔐 Registro y autenticación con 2FA por email
- 📝 CRUD completo de recordatorios
- 🗺️ Recordatorios basados en geolocalización (geofencing)
- 🔄 Recordatorios recurrentes (diario, semanal, mensual, anual)
- 👥 Sistema de amigos y grupos
- 🔔 Notificaciones en tiempo real
- 📅 Vista de calendario
- 🌐 Soporte multiidioma (ES/EN)
- 🎙️ Creación de recordatorios por voz

## 📝 Documentación de la API

Una vez iniciado el Geo Service, la documentación interactiva está disponible en:
```
http://localhost:8000/docs
```

## 👤 Autor

**Xabier Hernaez**
- GitHub: [@XabierHernaez](https://github.com/XabierHernaez)
- Email: xabierhernaez106@gmail.com



