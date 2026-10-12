# Pruebas del escáner en navegador

Estas pruebas usan Microsoft Edge en modo headless y streams de video generados con canvas. No acceden a las cámaras físicas, la API de Comerzia ni las impresoras. Un servidor Vite temporal escucha en localhost:5181 y se cierra al finalizar.

Para el caso de lectura de etiquetas, generar primero los fixtures desde el proyecto hermano comerzia:

~~~powershell
.\gradlew.bat test --tests '*LabelRendererTest'
~~~

Después, desde comerzia-ui:

~~~powershell
npm run test:camera
~~~

Se comprueba que el video sigue activo cuando no hay código, que ambas cámaras funcionan al alternar, que se liberan los streams al cerrar/reabrir bajo StrictMode, que los controles están dentro del cuadro y que la linterna se enciende al iniciar y al cambiar de lente cuando está disponible. object-cover conserva el cuadro lleno de la versión de producción.

Las pruebas de lectura introducen etiquetas reales del backend en un stream de video de canvas y verifican que el componente emite 7003000100006 y 12345678 una sola vez y libera la cámara. Esto comprueba captura, lector, callback y limpieza conjuntamente.

El escáner conserva BrowserMultiFormatReader, formatos EAN/UPC/CODE128/CODE39/ITF/CODABAR, restricciones de cámara del navegador y reintentos cada 100 ms como la versión de producción. Acepta la primera lectura válida. No utiliza TRY_HARDER, rotación personalizada ni confirmación de varias capturas.
