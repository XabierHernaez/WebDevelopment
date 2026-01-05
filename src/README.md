# 🗺️ GeoRemind

Plataforma web de gestión inteligente de recordatorios con geolocalización contextual.

## 🚀 Tecnologías

- **Backend**: Node.js (Express) + Python (FastAPI)
- **Bases de datos**: PostgreSQL + MongoDB
- **Frontend**: HTML5 + CSS + JavaScript
- **Contenedores**: Docker + Docker Compose

## 📁 Estructura del proyecto
```
georemind/
├── api-gateway/              # API Gateway (Node.js:5000)
├── user-reminder-service/    # Servicio de usuarios (Node.js:3001)
├── geo-location-service/     # Servicio de geolocalización (Python:8000)
├── frontend/                 # Interfaz web
├── docker-compose.yml        # Orquestación de contenedores
└── georemind_schema.sql      # Estructura de PostgreSQL
```

## 🛠️ Requisitos previos

Solo necesitas tener instalado:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (incluye Docker Compose)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/) con la extensión **Live Server**

> **Nota**: No necesitas instalar Node.js, Python, PostgreSQL ni MongoDB localmente. Docker se encarga de todo.

## 📦 Instalación y ejecución

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/XabierHernaez/WebDevelopment.git
cd WebDevelopment
```

### 2️⃣ Configurar credenciales SMTP (Opcional pero recomendado)

Para que funcione el sistema de 2FA por email, edita el archivo `docker-compose.yml` y actualiza estas variables en el servicio `user-service`:
```yaml
SMTP_USER: tu_email@gmail.com
SMTP_PASS: tu_app_password_de_gmail
EMAIL_FROM: tu_email@gmail.com
```

> **¿Cómo obtener la contraseña de aplicación de Gmail?**
> 1. Ve a tu [cuenta de Google](https://myaccount.google.com/)
> 2. Seguridad → Verificación en dos pasos (debes activarla)
> 3. Contraseñas de aplicaciones → Genera una nueva
> 4. Copia la contraseña de 16 caracteres

Si no configuras esto, el sistema funcionará pero **no podrás recibir códigos de verificación 2FA**.

### 3️⃣ Iniciar los servicios backend

Desde la carpeta `src`, ejecuta:
```bash
cd src
docker-compose up -d
```

Este comando:
- ✅ Descarga todas las imágenes necesarias
- ✅ Construye los contenedores de los servicios
- ✅ Crea las bases de datos PostgreSQL y MongoDB
- ✅ Importa automáticamente el esquema de PostgreSQL (`georemind_schema.sql`)
- ✅ Inicia todos los servicios en segundo plano

### 4️⃣ Verificar que todo esté corriendo
```bash
docker-compose ps
```

Deberías ver **5 contenedores** en estado "Up":
- `georemind_api_gateway`
- `georemind_user_service`
- `georemind_geo_service`
- `georemind_postgres`
- `georemind_mongo`

### 5️⃣ Abrir la aplicación con Live Server

1. **Abre Visual Studio Code**
2. **Abre la carpeta del proyecto**: `File → Open Folder → WebDevelopment/src`
3. **Navega a la carpeta frontend**: `src/frontend`
4. **Abre el archivo**: `index.html`
5. **Click derecho sobre `index.html`** → **"Open with Live Server"**

Live Server abrirá automáticamente tu navegador en:
```
http://127.0.0.1:5500 (o puerto similar)
```

¡Listo! 🎉 Ya puedes usar GeoRemind.

> **Nota**: Si no tienes Live Server instalado:
> 1. Ve a Extensiones en VS Code (Ctrl+Shift+X)
> 2. Busca "Live Server" por Ritwick Dey
> 3. Instala la extensión
> 4. Reinicia VS Code

## 📊 Arquitectura y puertos
```
                    ┌─────────────────────────┐
                    │   NAVEGADOR WEB         │
                    │   127.0.0.1:5500        │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   Live Server (VSCode)  │
                    │   Sirve: /frontend      │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │   API Gateway           │
                    │   (Node.js:5000)        │
                    └───────┬─────────┬───────┘
                            │         │
              ┌─────────────┘         └─────────────┐
              │                                     │
    ┌─────────▼──────────┐              ┌──────────▼─────────┐
    │  User Service      │              │  Geo Service       │
    │  (Node.js:3001)    │              │  (Python:8000)     │
    └─────┬──────────────┘              └──────────┬─────────┘
          │                                        │
    ┌─────▼─────┐  ┌──────────────────────────────▼─────┐
    │ PostgreSQL│  │         MongoDB                    │
    │ (:5432)   │  │         (:27017)                   │
    └───────────┘  └────────────────────────────────────┘
```

| Servicio | Puerto | URL |
|----------|--------|-----|
| Live Server (Frontend) | 5500 | http://127.0.0.1:5500 |
| API Gateway | 5000 | http://localhost:5000 |
| User Service | 3001 | http://localhost:3001 |
| Geo Service | 8000 | http://localhost:8000 |
| Geo Service Docs | 8000 | http://localhost:8000/docs |
| PostgreSQL | 5432 | localhost:5432 |
| MongoDB | 27017 | localhost:27017 |

## 🔧 Comandos útiles de Docker

### Ver logs de todos los servicios
```bash
docker-compose logs -f
```

### Ver logs de un servicio específico
```bash
docker-compose logs -f api-gateway
docker-compose logs -f user-service
docker-compose logs -f geo-service
```

### Detener todos los servicios
```bash
docker-compose down
```

### Detener y eliminar volúmenes (resetear bases de datos)
```bash
docker-compose down -v
```

### Reiniciar un servicio específico
```bash
docker-compose restart user-service
```

### Reconstruir contenedores tras cambios en el código
```bash
docker-compose up -d --build
```

### Ver estado de los contenedores
```bash
docker-compose ps
```

## 🛠️ Desarrollo local (sin Docker)

Si prefieres desarrollar sin Docker (para debugging, etc.):

### Requisitos adicionales
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL corriendo en :5432
- MongoDB corriendo en :27017

### Instalar dependencias

**API Gateway:**
```bash
cd api-gateway
npm install
```

**User Service:**
```bash
cd user-reminder-service
npm install
```

**Geo Service:**
```bash
cd geo-location-service
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### Ejecutar servicios

Necesitas **3 terminales**:
```bash
# Terminal 1 - API Gateway
cd api-gateway
npm run dev

# Terminal 2 - User Service
cd user-reminder-service
npm run dev

# Terminal 3 - Geo Service
cd geo-location-service
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

## 🔧 Solución de problemas

### ❌ Error: "Cannot connect to Docker daemon"
```bash
# Asegúrate de que Docker Desktop esté corriendo
docker --version
```

### ❌ Puerto ya en uso
```bash
# Ver qué está usando el puerto
netstat -ano | findstr :5000

# Detener los contenedores y cambiar el puerto en docker-compose.yml si es necesario
docker-compose down
```

### ❌ Los contenedores no inician correctamente
```bash
# Ver logs detallados
docker-compose logs

# Reconstruir desde cero
docker-compose down -v
docker-compose up -d --build
```

### ❌ No puedo acceder a la aplicación
1. Verifica que todos los contenedores estén "Up":
```bash
   docker-compose ps
```
2. Verifica logs del API Gateway:
```bash
   docker-compose logs api-gateway
```
3. Asegúrate de usar Live Server en VS Code para abrir el frontend

### ❌ El 2FA no envía emails
- Verifica que configuraste correctamente `SMTP_USER`, `SMTP_PASS` y `EMAIL_FROM` en `docker-compose.yml`
- Asegúrate de usar una contraseña de aplicación de Gmail, no tu contraseña normal
- Reinicia el user-service: `docker-compose restart user-service`

### 🔄 Resetear la base de datos
```bash
docker-compose down -v
docker-compose up -d
```

Esto eliminará todos los datos y volverá a crear las bases de datos desde cero.

### 🗺️ Resetear permisos de ubicación en el navegador
```javascript
// Abrir consola del navegador (F12) y ejecutar:
localStorage.removeItem("location_permission_asked");
```
Luego recarga la página.

## 🌟 Funcionalidades principales

- 🔐 **Autenticación**: Registro y login con 2FA por email
- 📝 **Recordatorios**: CRUD completo con editor enriquecido
- 🗺️ **Geolocalización**: Recordatorios activados por ubicación (geofencing)
- 🔄 **Recurrencia**: Recordatorios diarios, semanales, mensuales y anuales
- 👥 **Social**: Sistema de amigos y grupos
- 🤝 **Compartir**: Comparte recordatorios con amigos o grupos
- 🔔 **Notificaciones**: Alertas en tiempo real por fecha/hora y proximidad
- 📅 **Calendario**: Vista mensual de todos tus recordatorios
- 🌐 **Multiidioma**: Soporte completo en español e inglés
- 🎙️ **Comandos de voz**: Crea recordatorios hablando (Chrome, Edge, Safari)

## 📝 Documentación de la API

Documentación interactiva de FastAPI disponible en:
```
http://localhost:8000/docs
```

## 🏗️ Stack tecnológico completo

**Backend:**
- Node.js + Express.js
- Python + FastAPI
- JWT para autenticación
- Nodemailer para emails

**Bases de datos:**
- PostgreSQL (usuarios, recordatorios, amigos, grupos)
- MongoDB (ubicaciones, datos geográficos)

**Frontend:**
- HTML5, CSS3, JavaScript vanilla
- Leaflet.js para mapas interactivos
- Quill.js para editor de texto enriquecido
- Web Speech API para reconocimiento de voz

**DevOps:**
- Docker + Docker Compose
- Arquitectura de microservicios
- API Gateway pattern

**APIs externas:**
- OpenStreetMap + Nominatim (geocodificación)
- Overpass API (puntos de interés)

## 👤 Autor

**Xabier Hernaez**
- GitHub: [@XabierHernaez](https://github.com/XabierHernaez)
- Email: xabierhernaez106@gmail.com

---

## 📄 Licencia

Este proyecto ha sido desarrollado como trabajo académico para la asignatura de Desarrollo Web.