FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de compilación para bcrypt
RUN apk add --no-cache python3 make g++ libc-dev

COPY package*.json ./

# Instalar dependencias
RUN npm install

# Recompilar bcrypt desde fuente
RUN npm rebuild bcrypt --build-from-source

# Copiar el resto de los archivos
COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]