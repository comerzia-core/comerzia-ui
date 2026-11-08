# Etapa 1: frontend

- Axios y dependencias actualizadas dentro de sus versiones mayores actuales; usar `npm ci` y el lockfile versionado. No se ejecutó `npm audit fix --force`.
- Nuevas contraseñas: 15–64 puntos de código y hasta 72 bytes UTF-8. Se permiten frases. El login conserva compatibilidad con contraseñas antiguas; la validación definitiva está en el backend.
- HTTP 429 muestra un enfriamiento temporal y HTTP 503 informa indisponibilidad temporal, sin inventar un bloqueo administrativo.
- Los modales de roles y sucursal cancelan respuestas de cargas obsoletas al cerrarse o cambiar de persona. No se usan datos de otra selección para completar una petición.
- Variables `VITE_*`: solo lista pública explícita en `vite.config.ts`. Nunca poner contraseñas, claves JWT, Redis o Cloudinary en React. Este guard comprueba nombres; no puede reconocer que un operador pegó un secreto dentro de un campo público autorizado.
- `.env` estaba versionado pese al ignore: se retiró del índice y se conservó el archivo local. La plantilla pública es `.env.example`; la comprobación final no encontró claves de credenciales del backend en ese `.env` frontend.
- El servidor de desarrollo escucha solo en loopback. Para pruebas móviles autorizadas usar `npm run dev:lan` y configurar CORS/HTTPS de desarrollo; no exponer Vite como servidor productivo.

## Contenedor y reverse proxy

La imagen Nginx no usa root y escucha en **8080**, antes 80. Actualizar el destino de Nginx Proxy Manager, mapeos de Docker y healthchecks. No se cambió el puerto público HTTPS del dominio.

El build genera `/etc/nginx/security-headers.conf`: CSP con scripts propios, hash del arranque de tema, WebAssembly para escáner, imágenes Cloudinary/locales y conexión al origen API del build. Añade `nosniff`, `DENY`, `no-referrer` y permisos de cámara limitados al propio origen. Estilos inline siguen permitidos por compatibilidad con los componentes actuales. No ampliar la CSP a `*` si aparece una integración nueva: revisar su origen y uso.

Si se reemplaza `nginx.conf` con un volumen, incluir este archivo también en las ubicaciones que declaren sus propios `add_header`; Nginx no hereda automáticamente las cabeceras de niveles anteriores en ese caso. La simulación del proyecto raíz ya lo incluye.

El proxy TLS debe proporcionar HTTPS y HSTS. La simulación HTTP de localhost no activa HSTS. Los JWT permanecen en localStorage en esta etapa; no se implementaron refresh tokens, cookies ni OAuth.

## Verificación

```sh
npm ci
npm audit
npm run build
npm run lint:security
npm test
```

Para CI Linux: `PLAYWRIGHT_BROWSER_CHANNEL=chromium` y `npx playwright install --with-deps chromium`. El comportamiento local conserva Edge. Los tests de cámara usan frames y dispositivos simulados; no certifican todos los teléfonos físicos.

El guard de lint ejecuta reglas estrictas sobre los archivos sensibles definidos en `scripts/lint-security.mjs` y no permite aumentar los errores heredados por archivo/regla. Sigue existiendo deuda global: `npm run lint` no está completamente limpio. Modificar el baseline requiere revisión; no debe regenerarse para esconder errores de una entrega.

Para revisar la imagen construida:

```sh
docker build --build-arg VITE_API_URL=/api -t comerzia-security-frontend:local .
docker run -d --name frontend-security -p 127.0.0.1:18081:8080 comerzia-security-frontend:local
npx playwright test --config playwright.security.config.mjs
docker stop frontend-security
docker rm frontend-security
```

El workflow de seguridad no despliega. Los resultados reales de GitHub Actions y las reglas de protección de rama deben comprobarse al subir esta entrega; no se han ejecutado desde el entorno local.
