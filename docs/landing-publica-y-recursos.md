# Landing pública y registro Free

Implementación en `feature/public-landing-signup`, en los repositorios frontend y backend. La landing comparte el frontend existente y utiliza un layout propio, estilos acotados, componentes públicos y carga diferida del router privado.

## Rutas y comportamiento

- `/`: landing pública con modo claro/oscuro, presentación visual y catálogo obtenido de la API.
- `/registro`: tres pasos: datos personales; usuario y contraseña; empresa y primera tienda. Se admite apellido paterno, materno o ambos. El correo es obligatorio y único entre cuentas de todo el sistema.
- `/login`: acceso con usuario o correo, conservando bloqueos, empresa deshabilitada y cambio obligatorio de contraseñas temporales del alta administrativa.
- `/app`: entrada protegida que deriva al workspace correspondiente. Las rutas operativas anteriores continúan disponibles.

El registro público crea Free, una tienda, un empleado y una cuenta con los cuatro roles tenant. Muestra los roles y la caja fija antes de confirmar. La caja inicial es `CAJA 01 - 001`, con código `001`; su algoritmo se comparte en backend con el alta normal de cajas. No se abre ningún turno ni se crean productos, ventas o dinero ficticio.

Solo Free permite registro en esta entrega. Los planes pagos se muestran con precio y cupos actuales de la API; su contratación aparece como próxima. No se expone Perpetuo. Google es un botón deshabilitado, sin SDK ni autenticación simulada.

El formulario no guarda contraseñas ni datos personales en localStorage. El cliente público no agrega tokens privados. Después del alta, se establece la sesión siguiendo el flujo existente y se cargan perfil y menú. Los errores por usuario o correo reservado vuelven al campo correspondiente sin perder los otros pasos. Una sesión ya abierta no se reemplaza desde el registro.

## Imagen incluida y vídeo pendiente

Ya está instalada esta imagen generada con IA y optimizada a WebP (aproximadamente 120 KB):

`public/media/landing/merchants-poster.webp`

Se usa como fondo del hero y del panel izquierdo de acceso/registro. La demostración del producto es una composición ilustrativa HTML/CSS con datos ficticios, identificada como ejemplo. No se presentan testimonios ni métricas reales inventadas.

El vídeo se reconocerá automáticamente al agregar este archivo exacto:

`C:\Users\WILL\Projects\Comerzia\01. web\comerzia-app\comerzia-ui\public\media\landing\merchants-loop.mp4`

Para producción, agregarlo al repositorio y volver a construir/desplegar el frontend. No basta con copiarlo al directorio fuente de un contenedor que ya sirve un build anterior. También se puede instalar directamente como `/media/landing/merchants-loop.mp4` en el directorio estático publicado.

Especificación: MP4 H.264 compatible con Chrome, 1920×1080 o 1280×720, 24/30 fps, 8–12 segundos, sin pista de audio, bucle continuo. Buscar un archivo de 2–5 MB; usar `faststart` para reproducción progresiva. No usar GIF. El código ya reproduce en silencio, en línea, con bucle y dos intensidades de filtro. Si falta el vídeo, falla su formato o el navegador bloquea reproducción, se conserva la imagen. Respeta movimiento reducido y ahorro de datos; pausa al salir de pantalla o cambiar de pestaña y ofrece control para pausar el fondo.

En móvil, los formularios ocupan el ancho disponible y ocultan la columna decorativa. Esto mantiene visibles los campos y evita descargar un vídeo innecesario en esa columna. La landing sí conserva su fondo adaptado a móvil.

### Prompt para el vídeo

Usar la imagen incluida como fotograma de referencia si la herramienta lo permite:

> Cinematic photorealistic background video for a modern retail business management website in Bolivia. Two adult Latin American small-business owners, a woman and a man, naturally smiling while checking their shop on a laptop at a clean wooden checkout counter in a welcoming neighborhood grocery store. Authentic everyday products on softly blurred shelves, warm natural daylight, subtle forest-green and neutral tones. Medium-wide shot, people and laptop mostly center-right, darker atmospheric negative space on the left for website text. Very slow, steady camera movement and restrained natural gestures: a glance at the screen, a small smile, a hand pointing gently. The laptop screen is angled away with no readable interface. Realistic anatomy and consistent faces. Seamless 10-second loop, 16:9, 1080p, 24 fps. No camera cuts, no sound, no narration, no captions, no text, no logos, no watermark, no exaggerated expressions, no distorted fingers, no rapidly changing screen content.

Exportar como `merchants-loop.mp4` en la carpeta indicada. No hace falta cambiar código.

### Prompt de la imagen incluida o para reemplazarla

Generada con la herramienta integrada `imagegen`, luego convertida a WebP e instalada en el proyecto:

> Wide landscape 16:9 natural editorial photograph of two adult Latin American small-business owners, a woman and a man, smiling naturally while reviewing their shop on a laptop at a clean wooden checkout counter in a contemporary neighborhood grocery store in Bolivia. Softly blurred aisle with everyday products, warm daylight, authentic friendly atmosphere, realistic hands and faces. Slight side angle, medium-wide framing, owners and laptop mostly center-right with atmospheric darker negative space on the left for website text. Laptop screen angled away, no readable UI or fabricated text. Restrained warm neutral palette with subtle forest-green surroundings, photographic detail and gentle depth of field. No brands, logos, text or watermark.

Para reemplazarla, exportar WebP horizontal de hasta 1920 px y guardarla como `merchants-poster.webp` en la misma carpeta. Mantener peso razonable, idealmente menor de 200 KB.

El icono de Google se conserva como recurso local en `public/media/landing/google-g.png`, procedente de Google. Referencia: [guía oficial de marca](https://developers.google.com/identity/branding-guidelines). No se recrea con una letra o un icono inventado.

## Apariencia, PWA y rendimiento

La preferencia pública se guarda en `comerzia.public.theme`; no sobrescribe el tema del usuario del ERP. El tema operativo se restaura al entrar al sistema. Los manifiestos nuevos inician en `/app`; las instalaciones previas que abren `/` en modo standalone se redirigen a esa entrada. Esto no agrega un service worker ni habilita operaciones sin conexión.

Las pantallas privadas, el formulario y el acceso se cargan por separado. Los planes públicos usan caché de cinco minutos. La imagen de fondo es local y no consume transformaciones de Cloudinary. Los metadatos están presentes en el HTML; la aplicación continúa siendo una SPA y no se añadió un servidor SSR ni generación estática completa del catálogo.

## Validación

Ejecutar `npm run build` y `npm run test:public`. Las pruebas cubren escritorio/móvil, pasos, validación, roles/caja fijos, API anónima, sesión, correo duplicado, tema independiente, ausencia de desbordamiento y fondo alternativo. Las capturas de revisión se generan en `test-results/public`.

Para desplegar, aplicar también las instrucciones y comprobaciones de identidad del backend en `comerzia/docs/registro-publico-free.md`. Actualizar ambos proyectos: el frontend no crea empresas por su cuenta ni sustituye validaciones del servidor.
