# Catálogo público y configuración del tenant

La ruta `/c/:slug` carga una feature independiente del panel privado. El renderer comparte plantilla y comportamiento entre publicación y preview autorizado, pero utiliza clientes HTTP distintos: público sin JWT y privado con la sesión del administrador.

## Uso

1. Iniciar sesión de nuevo después de la migración para recibir los permisos de publicación.
2. En Organización → Catálogo público, completar nombre público, dirección, país, número local de WhatsApp y plantilla. La vista exige permisos y suscripción elegible activa.
3. Guardar borrador y seleccionar los productos visibles; usar su menú contextual para personalizar variantes. También deben tener un precio de venta vigente y padres activos.
4. Previsualizar; confirmar publicación si la empresa tiene suscripción elegible.
5. Compartir la URL que devuelve el backend. Los dominios no se concatenan con una marca fija en la vista.

Las plantillas Estudio, Boutique y Menú usan CSS propio, responsive; el visitante elige claro/oscuro desde la cabecera, independiente del tema personal del ERP. No se aceptan CSS, HTML ni scripts del cliente.

Las tarjetas muestran producto padre y marca. Al abrirlo se elige variante y presentación entre los precios de venta actuales. No se devuelven ni dibujan precios mínimos de negociación/descuento.

Los filtros y la paginación se resuelven en backend. La búsqueda tiene debounce; las cargas conservan resultados anteriores durante actualización. Las imágenes comparten los presets del proyecto, evitan descargas de originales y usan carga bajo demanda.

El carrito es local a la pestaña y al comercio. «Continuar» revisa la selección con la API. El total final visible procede de esa respuesta. El enlace de WhatsApp se abre solo por acción del comprador y no confirma una transacción bancaria.

## Permisos y errores

La sección de administración aparece con `ORG_PUBLIC_CATALOG_READ`. Editar/seleccionar requiere `ORG_PUBLIC_CATALOG_MANAGE`; publicar/despublicar requiere `ORG_PUBLIC_CATALOG_PUBLISH`. La elegibilidad se recibe de backend, y la API vuelve a comprobarla al publicar.

Los códigos de error se traducen en `catalogError` a mensajes breves. No mostrar errores SQL, referencias internas o contenido bruto de excepciones. Los IDs de variantes solo se utilizan como referencias técnicas, no como columnas visibles.

## Compilación y pruebas

```sh
npm run build
npm run test:storefront
```

Las pruebas usan API simulada para verificar UI; el backend tiene pruebas HTTP reales sobre MariaDB. No confundir estas dos verificaciones.

`VITE_API_URL` conserva el origen/base de la API (`.../api` o `/api` con proxy). No incluir secretos en variables `VITE_*`. Nginx debe servir `index.html` al navegar directamente a `/c/*`; los endpoints `/api/*` se reenvían al backend y nunca deben caer en el fallback SPA.

El origen usado para los enlaces de publicación se configura en el backend mediante `PUBLIC_SITE_URL`. Consultar la guía de migraciones del backend para preparar producción con `ddl-auto=validate` y Flyway antes de actualizar la aplicación.

## Administración revisada

Los filtros Categoría → Rubro → Marca y el buscador muestran productos padre. Un producto uniforme tiene switch; una selección mixta muestra «Personalizado». El menú contextual se abre con clic derecho en escritorio o toque en la tarjeta móvil y permite personalizar variantes o restablecer todas visibles/ocultas.

Al elegir una categoría, rubro o marca aparece su switch de grupo. Afecta a todo ese grupo en backend, no solamente a la página actual ni a los resultados de búsqueda. Los totales y el estado parcial proceden de la API.

Los países de WhatsApp se cargan mediante `DICTIONARIES.CATALOG_PHONE_COUNTRY` y `useLoadDictionaries`. React envía país y número nacional; el backend valida y agrega el prefijo internacional. El tema del visitante se guarda en `public-catalog-theme`, separado del tema de administración.

La navegación oculta el catálogo cuando no es elegible, el guard de la página vuelve a comprobarlo y las APIs validan cada lectura/modificación. Free no accede a la administración ni al preview. El menú se filtra también en backend.

El perfil de empresa conserva sus campos en dos pestañas y mantiene una sola representación de los switches de clientes y tickets. Su lógica se encuentra en `useCompanyProfileSettings`.

Esta revisión requiere la migración V3; no se deben modificar V1/V2 ya aplicadas.
