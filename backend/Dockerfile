FROM node:20-slim

WORKDIR /app

# Actualizar e instalar OpenSSL (solución raíz)
RUN apt-get update -y && apt-get install -y openssl && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY src ./src
COPY tsconfig.json ./

# Build
RUN npm run build && npm run prisma:generate

# Carpeta de uploads: en Railway el volumen montado la reemplaza, asi la
# imagen ya trae el punto de montaje creado.
RUN mkdir -p public/uploads

# Limpiar cache de npm
RUN npm cache clean --force

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Ejecutar migraciones y luego levantar API
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
