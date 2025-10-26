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
├── api-gateway/              # API Gateway (Node.js)
├── user-reminder-service/    # Servicio de usuarios (Node.js)
├── geo-location-service/     # Servicio de geolocalización (Python)
├── frontend/                 # Interfaz web
└── docker-compose.yml        # Configuración de BBDD
```

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd georemind
```

### 2. Iniciar bases de datos

```bash
docker-compose up -d
```

### 3. Iniciar API Gateway

```bash
cd api-gateway
npm install
npm run dev
```

### 4. Iniciar User Service

```bash
cd user-reminder-service
npm install
npm run dev
```

### 5. Iniciar Geo Service

```bash
cd geo-location-service
.\venv\Scripts\Activate
python app/main.py
```

### 6. Abrir Frontend

Abre `frontend/index.html` en tu navegador

## 📊 Puertos

- API Gateway: `http://localhost:3000`
- User Service: `http://localhost:3001`
- Geo Service: `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- MongoDB: `localhost:27017`

## 👤 Autor

Xabier H.S.
