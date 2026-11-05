# Compatibilidad de estilos

La combinación ensayada de este frontend conserva Tailwind 3.4.19 y fija DaisyUI **5.5.14**, sin rango semántico. Es una medida de compatibilidad con el diseño existente, no una afirmación de soporte oficial de DaisyUI 5 sobre Tailwind 3.

Al actualizar DaisyUI a 5.7.50, su adaptación de capas mediante `nestCssLayers` produjo objetos serializados como `[object Object]` en el CSS de esta integración. El navegador descartaba reglas: los modales quedaban en el flujo normal y los menús perdían su distribución. La corrección recupera la versión anterior y actualiza el lockfile; no requiere cambios en lógica empresarial ni en cada vista.

La integración oficialmente documentada de DaisyUI 5 utiliza Tailwind 4: https://daisyui.com/docs/upgrade/. Esa migración debe planificarse y probarse por separado, incluyendo temas, colores, medidas y utilidades; no actualizar el plugin aisladamente.

## Controles obligatorios al actualizar estilos

- `npm run build` comprueba que los CSS generados no contengan `[object Object]`. El mismo control se ejecuta durante la construcción Docker.
- `npm run test:layout` prueba componentes reales en desarrollo y geometría CSS del build de producción, en móvil/escritorio y varias paletas. Verifica posición fija, superposición, límites de pantalla y distribución de menús.
- `npm test` conserva las regresiones de temas, catálogo, POS, seguridad y demás funcionalidades, e incluye el grupo de layout.
- `npm audit` debe revisarse después de regenerar el lockfile.

Las pruebas de visibilidad por sí solas no detectan esta regresión: un modal renderizado debajo del contenido también puede considerarse visible. Conservar las comprobaciones de estilos calculados y dimensiones al actualizar dependencias.

Para comprobar el despliegue local, reconstruir únicamente el frontend con `docker compose build frontend` y `docker compose up -d --no-deps --no-build frontend` desde el workspace superior. Validar también la página servida por Docker: el CSS de desarrollo no sustituye esa comprobación.
