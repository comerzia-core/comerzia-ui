# Sincronización del frontend

El layout protegido mantiene una conexión SSE autenticada mediante el encabezado Bearer actual. El módulo `src/features/realtime` contiene transporte, parser, estado de conexión, invalidación y hooks; el UI Kit no incluye lógica de negocio del canal.

`useRealtimeRefresh(['PRODUCT', 'STOCK'], refresh)` registra una carga de lectura de la vista. Conserva su callback más reciente, agrupa ráfagas y serializa recargas disparadas por eventos. Los filtros, la página y los campos en edición pertenecen a la vista y no se reinicializan por el aviso. No registrar handlers de guardado, cobro, impresión, borrado ni inicializadores de formularios en este hook.

El mismo canal invalida claves de TanStack Query mediante `realtimeInvalidation.ts`. Al crear consultas nuevas, usar una familia de clave declarada allí e incluir empresa/sucursal y filtros en los siguientes elementos de la clave. No compartir datos de dos empresas bajo una única clave sin contexto. Al salir del layout o cambiar de sesión/contexto se limpia la caché anterior.

La conexión se pausa con la pestaña oculta o sin Internet y se reabre al volver. Cada handshake confirmado vuelve a consultar los datos visibles para recuperar cambios perdidos. La sesión SSE se renueva para revalidar la autorización; no hay sondeo frecuente de listados. Los errores 401/403 detienen los reintentos.

El indicador compacto muestra En vivo, Reconectando o Sin conexión, con texto accesible y un icono de lucide-react en móvil.

Pruebas: `npm run test:realtime` y `npm run test:checkout`. El arnés de tiempo real usa HTTP REST interceptado y un stream controlado; el backend tiene además pruebas con servidor HTTP real y H2 aislado.

La guía completa de contrato, alcance, seguridad, recursos y Nginx está en el backend: `comerzia/docs/sincronizacion-tiempo-real-implementacion.md`. La producción confirmada usa una instancia; múltiples réplicas necesitan distribución de eventos entre servidores.

## Actualizaciones sin parpadeo

Las cargas de lectura reciben un parámetro `background` opcional: las recargas por SSE y reconexión lo activan, mientras la carga inicial y los cambios de filtros/página conservan sus indicadores. El modo de segundo plano actualiza datos sin activar los spinners ni desmontar tablas, tarjetas o formularios. En la terminal también se usa después del cobro y la cancelación.

Los fallos temporales de red, 429 y 5xx conservan el último resultado válido. Los errores de autorización y las validaciones de negocio mantienen su tratamiento habitual. Las tarjetas nuevas de cobro entran con una animación breve que respeta `prefers-reduced-motion`; las existentes mantienen su identidad y foco.

Las pruebas con respuestas REST demoradas comprueban que permanecen conectados los mismos nodos de tarjetas y filas, que se recuperan cambios al volver a la pestaña y que un formulario de cobro abierto conserva su importe y foco.
