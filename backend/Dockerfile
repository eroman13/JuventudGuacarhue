FROM node:18-alpine

WORKDIR /app

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

# Limpiar devDependencies
RUN npm ci --only=production && npm cache clean --force

# Exponer puerto
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Ejecutar aplicación
CMD ["npm", "start"]
