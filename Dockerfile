# ETAPA 1: Construcción (Node)
FROM node:25-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS build
RUN apk upgrade --no-cache

WORKDIR /app

# Copiamos package.json primero (Caché)
COPY package*.json ./
RUN npm ci

# Copiamos el resto del código
COPY . .

# --- AQUÍ ESTÁ EL TRUCO ---
# Declaramos que aceptamos un argumento llamado VITE_API_URL
ARG VITE_API_URL
# Lo convertimos en variable de entorno para que Vite lo vea durante el build
ENV VITE_API_URL=$VITE_API_URL

# Construimos la app (genera la carpeta dist)
RUN npm run build && node scripts/write-security-headers.mjs

# ETAPA 2: Servidor Web (Nginx)
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
USER root
# Exigir el parche evita reutilizar una capa anterior vulnerable de Alpine.
RUN apk upgrade --no-cache && apk add --no-cache 'libexpat>=2.10.0-r0'

# Copiamos nuestra config de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados desde la etapa 1
COPY --from=build /app/dist /usr/share/nginx/html
RUN mv /usr/share/nginx/html/security-headers.conf /etc/nginx/security-headers.conf
USER 101:101

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
