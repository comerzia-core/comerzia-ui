# Pruebas del escáner en navegador

Estas pruebas usan Microsoft Edge en modo headless y streams de video generados con canvas. No acceden a las cámaras físicas, la API de Comerzia ni las impresoras. Un servidor Vite temporal escucha en localhost:5181 y se cierra al finalizar.

Para el caso de lectura de etiquetas, generar primero los fixtures desde el proyecto hermano comerzia:

~~~powershell
.\gradlew.bat test --tests '*LabelRendererTest' --tests '*SmallLabelQrTest'
~~~

Después, desde comerzia-ui:

~~~powershell
npm run test:camera
~~~

Se comprueba que el video sigue activo cuando no hay código, que ambas cámaras funcionan al alternar, que se liberan los streams al cerrar/reabrir bajo StrictMode, que los controles están dentro del cuadro y que la linterna se enciende al iniciar y al cambiar de lente cuando está disponible. object-cover conserva el cuadro lleno de la versión de producción.

Las pruebas de lectura introducen etiquetas reales del backend en un stream de video de canvas y verifican que el componente emite 7003000100006 y 12345678 una sola vez y libera la cámara. Esto comprueba captura, lector, callback y limpieza conjuntamente.

Los motores de lectura conservan exactamente su configuración actual: detector nativo cada 60 ms y BrowserMultiFormatReader cada 80 ms, con TRY_HARDER y los formatos EAN/UPC/CODE128/CODE39/ITF/CODABAR/QR. Aceptan la primera lectura válida. No se modifican sus algoritmos, concurrencia, formatos ni tratamiento de imágenes.

El arranque solicita `facingMode: environment` sin bloquearse enumerando dispositivos antes del permiso. La enumeración posterior corre en segundo plano. Si identifica claramente una principal diferente al lente inicial, hace una sola corrección y libera el stream anterior; no prueba todos los lentes ni cambia de cámara por falta de linterna. Las etiquetas ambiguas no permiten garantizar qué sensor físico es el principal. Al girar se ofrecen la trasera seleccionada y la frontal reconocida.

Solo se reutiliza en memoria el ID de una trasera confirmada por orientación o etiqueta; se invalida con `devicechange` y se recuperan IDs vencidos y restricciones de resolución con un único reintento. Se conservan la solicitud de 1280×720, enfoque continuo y zoom 1.25 cuando son compatibles, separando sus restricciones opcionales para que un zoom no disponible no descarte la luz. Los cambios manuales de luz conservan enfoque, zoom y resolución.

La linterna se solicita encendida al iniciar. Su botón distingue encendida, apagada y estado no informado (`aria-pressed=mixed`), sin confundir una promesa resuelta con un cambio confirmado. Si no se informa el estado, el botón permite alternar las solicitudes sin afirmar que el LED esté encendido. La ausencia de soporte de linterna no interrumpe la lectura.

Las pruebas incluyen nombres ausentes antes del permiso, orden frontal/trasera, principal wide frente a ultra wide, restricciones ignoradas sin excepción, estado de luz desconocido, enumeración lenta, IDs vencidos, permisos denegados y cierre durante adquisición pendiente. Un caso mantiene el detector nativo activo sin resultados mientras ZXing lee la etiqueta real, y otro comprueba QR sin soporte de linterna.

Las pruebas de políticas y ajustes se ejecutan con `npm run test:scanner-camera`. Las pruebas con canvas no certifican latencia ni selección física de sensores del Samsung A50: eso requiere comprobar Chrome y la PWA en el dispositivo, también con etiquetas curvas. No se garantiza una lectura inferior a un segundo en todo hardware.

El fixture QR de 30×20 mm conserva 7003000100006 y su margen blanco. Se verifica la lectura con el mismo lector y flujo de cámara; el diálogo de etiquetas permite retirar logo, precio y nombre, y aplica las restricciones que devuelve el backend. No se realiza una impresión física.
