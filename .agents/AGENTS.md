# Reglas y Preferencias del Proyecto

- Usar **siempre** la librería `lucide-react` para los íconos de la interfaz gráfica en lugar de utilizar código SVG plano (Raw SVGs) u otras librerías. Importar el ícono directamente, ejemplo: `import { Barcode } from 'lucide-react'`.

## Reglas de Oro Arquitectónicas (De ARCHITECTURE.md)

### 1. REGLAS BASE
- **Idioma:** Todo el código, variables, funciones, interfaces y logs (console.log, console.error) DEBEN estar en INGLÉS. Los comentarios explicativos DEBEN estar en ESPAÑOL.
- **Calidad:** Proporciona el código COMPLETO. Prohibido usar `TODO` o dejar funciones a medias.
- **Tipado:** TypeScript estricto. Prohibido el uso de `any`. Define interfaces claras.
- **Stack:** React 18, Vite, TypeScript, Tailwind CSS, DaisyUI, Lucide-react, Zustand, Axios, React Router v6.
- **No repitas estilos:** Si usas las mismas clases de Tailwind más de 3 veces, crea un componente en `/components/ui`.
- **Separación de responsabilidades:** La lógica compleja va en un *hook*, la vista en un *componente*.

### 2. ARQUITECTURA (Feature-Sliced Design)
El proyecto usa una separación estricta entre componentes visuales puros y lógica de negocio:
- `src/components/ui/`: UI Kit centralizado ("Dumb Components"). NO agregues lógica de negocio aquí. Utiliza los componentes existentes (`ComerziaTable`, `ComerziaInput`, `ComerziaSelect`, `ComerziaModal`, `BtnCreate`, etc.).
- `src/features/{module}/`: Aquí vive la lógica de negocio. Se divide en:
  - `types/`: Interfaces específicas del módulo.
  - `services/`: Llamadas Axios a la API.
  - `components/`: "Smart Components".
  - `pages/`: Las vistas orquestadoras conectadas al Router. No hacen peticiones directas, orquestan componentes.

### 3. CONVENCIONES DE UI Y LÓGICA DE NEGOCIO
- **Formularios e Inputs:** Usa SIEMPRE los componentes del UI Kit (ej. `<ComerziaInput isRequired />`). El manejo de errores y vibración ya está blindado internamente.
- **Botones:** Usa SIEMPRE la fábrica de botones en `src/components/ui/CrudButtons.tsx`. NUNCA uses etiquetas `<button>` crudas si un botón estandarizado sirve.
- **Tablas:** Usa `<ComerziaTable />` pasándole las columnas (`columns`) y la data. Para acciones de fila, usa un Context Menu o `CrudButtons`.
- **Selects y Diccionarios (Lookups):** PROHIBIDO hardcodear arreglos de opciones para `<ComerziaSelect />` o hacer `fetch` locales. Debes agregar la llave en `DICTIONARIES` (en `src/config/dictionaries.ts`), usar `useLoadDictionaries`, y pasarlo al componente selectivo.

### 4. MANEJO DE FECHAS Y ZONAS HORARIAS (TIMEZONES)
- **Lectura (Visualización):** PROHIBIDO usar el objeto `Date` nativo de Javascript para formatear fechas en las vistas si hay timezone involucrada. Se prefiere la función utilitaria `formatDateForUser(utcString)` (o nativo en casos simples) pero no asumir que la BD envía local. El Backend envía UTC (ISO-8601 con Z).
- **Escritura (Envío al Backend):** Convertir siempre la fecha capturada en UI a UTC (`.toISOString()`) antes de enviarla vía Axios.

### 5. TABLAS, PAGINACIÓN Y ORDENAMIENTO
- **Componente Base:** SIEMPRE usa `<ComerziaTable>` para listados de datos. Es un "Dumb Component"; PROHIBIDO mutar, filtrar u ordenar el arreglo de datos directamente dentro del componente de tabla.
- **Paginación (Server-Side):** Para endpoints de Spring Boot que usan `Pageable`, utiliza la propiedad `pagination` (`TablePaginationConfig`). RECUERDA: Spring Boot cuenta las páginas desde `0`.
- **Numeración Continua:** Usa `showRowNumbers={true}` en `<ComerziaTable>` para enumerar matemáticamente, NO mapees un índice manualmente.

### 6. VALIDACIONES Y EFECTO SHAKE
- **Indicador Visual:** Para campos fallidos, pásale la propiedad `error` al componente (ej. `<ComerziaInput error="Obligatorio" />`).
- **Efecto Vibración (Shake):** Alerta visualmente intentos de envío fallidos: usa un estado `shakeKey` e increméntalo `setShakeKey(prev => prev + 1)` en el submit, pasándolo a todos los inputs (`<ComerziaInput shakeKey={shakeKey} ... />`).

### 7. RENDERIZADO DE TIPOS Y CATÁLOGOS (DICCIONARIOS)
- **Cero Hardcoding:** Está ESTRICTAMENTE PROHIBIDO usar `switch` locales o validaciones ternarias (ej. `type === 1 ? 'Merma' : 'Sobrante'`) para pintar etiquetas en tablas o vistas que provengan del backend.
- **Uso de Diccionarios:** Siempre que el backend envíe un ID o código numérico que corresponda a un catálogo, se debe utilizar el hook global `useLoadDictionaries` con la llave correspondiente en `DICTIONARIES` (ej. `DICTIONARIES.ADJUSTMENT_TYPE`). Luego, buscar dinámicamente el `label` usando `.find()` sobre las opciones devueltas.
