# Pruebas de rollos de varias columnas

Desde el backend generar las imágenes con `gradlew.bat test --tests '*LabelRendererTest' --tests '*SmallLabelQrTest'`.
Desde el frontend ejecutar `npm run test:labels` y `npm run test:labels-ui`.

El arnés usa los componentes y hooks reales con API interceptada: no inicia sesión, no usa la API cotidiana y no crea trabajos físicos. Comprueba separación entre filas/columnas, ancho total permitido, payload del CRUD, mínimo/paso/máximo de cantidad, bloqueo de filas parciales, cambio de rollo y envío de seis etiquetas una sola vez.

Requiere Microsoft Edge y usa Vite HTTPS en el puerto 5182, separado del desarrollo normal. El fixture PNG de tres columnas proviene del renderer del backend. El protocolo real HTTP/WSS se verifica en `LabelHttpFlowTest`; la conversión a TSPL, cantidad de filas y transporte TCP simulado se verifican en `ComerziaPrintAgent.Tests`.

El fixture QR de 30×20 mm conserva 7003000100006 y su margen blanco. Se verifica la lectura con el mismo lector y flujo de cámara; el diálogo de etiquetas permite retirar logo, precio y nombre, y aplica las restricciones que devuelve el backend. No se realiza una impresión física.

`calibration.spec.mjs` comprueba calibración explícita, confirmación física con FEED, reapertura sin repetir, cambio de formato sin confirmar un trabajo anterior, agente antiguo, cola ocupada, errores sin reintento automático y recuperación de la impresión desde el catálogo. Las llamadas de calibración se interceptan: no mueven papel ni se conectan al hardware del usuario.
