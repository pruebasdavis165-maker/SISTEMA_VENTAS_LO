# Stage 1: Build de la Aplicación React con Vite
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Servidor Web Nginx Alpine de Alto Rendimiento
FROM nginx:alpine AS final
WORKDIR /usr/share/nginx/html

# Limpiar archivos por defecto de Nginx
RUN rm -rf ./*

# Copiar build de React
COPY --from=build /app/dist .

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
