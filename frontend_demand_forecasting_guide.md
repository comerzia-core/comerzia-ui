# Guía de Arquitectura y Negocio: Pronóstico de Demanda (BI)

Esta es la vista **"Premium"** del sistema de inventarios, diseñada para llevar la gestión logística al nivel de **Business Intelligence (BI)**. No se trata de un simple registro de existencias, sino de un motor de decisiones predictivas y estratégicas.

A continuación, se detalla la propuesta completa de arquitectura, KPIs, APIs y diseño Frontend para implementar esta vista.

---

## 1. Concepto y Enfoque de la Vista

El objetivo principal es pasar de la pregunta *"¿Cuánto tengo?"* a *"¿Cuánto me va a durar?"* y *"¿Qué hago con lo que tengo?"*.
Esta vista permitirá a los gerentes y dueños de negocio:
1.  **Prevenir Quiebres de Stock (Stockouts):** Saber exactamente cuándo pedir mercadería antes de quedarse en cero.
2.  **Identificar Fugas de Capital:** Detectar productos que ocupan espacio en el almacén sin generar ventas (Stock Muerto / Perros).
3.  **Maximizar Rentabilidad:** Entender qué productos son las "Estrellas" (se venden rápido y dejan mucha ganancia) para potenciar su compra.

---

## 2. Indicadores Clave de Rendimiento (KPIs - Tarjetas Superiores)

La pantalla debe abrir con 4 métricas de alto impacto (Tarjetas):

1.  **Índice de Rotación General:** Qué tan rápido se renueva el inventario total.
2.  **Velocidad de Venta Global (Sell-through Rate):** Promedio de unidades que salen del almacén por día.
3.  **Días de Inventario Promedio:** ¿Para cuántos días de venta alcanza el stock actual de forma consolidada?
4.  **Capital en Stock Muerto:** Monto de dinero (en la moneda local) inmovilizado en productos que no han tenido movimiento en los últimos 90 días (configurable).

---

## 3. Arquitectura de Endpoints (Backend APIs Propuestas)

Para soportar esta vista limpia y orientada a BI, propondremos 3 endpoints bajo el prefijo `/tenant/stock/demand`:

### API 1: Métricas de Demanda (KPIs)
*   **Endpoint:** `GET /tenant/stock/demand-metrics`
*   **Query Params:** `branchId`, `daysHistory` (ej: 30, 90, 180), `categoryId`
*   **Respuesta JSON (Ejemplo):**
    ```json
    {
      "globalVelocity": 145.5,         // 145 unidades vendidas al día promedio
      "averageDaysRemaining": 24,      // El stock total dura 24 días
      "deadStockCapital": 12500.00,    // $12,500 atrapados en productos sin movimiento
      "turnoverRate": 4.5              // Rotación del inventario
    }
    ```

### API 2: Gráficas Analíticas y Matriz BCG
*   **Endpoint:** `GET /tenant/stock/demand-charts`
*   **Query Params:** `branchId`, `daysHistory` (rango de análisis), `categoryId`
*   **Datos que devuelve:**
    *   `trendChart`: Datos cronológicos (puntos X, Y) que muestran la curva de ventas de las últimas semanas para detectar estacionalidad (ej. picos en Diciembre).
    *   `bcgMatrix`: Lista de puntos de dispersión para armar la Matriz BCG. Cada punto representará una Categoría o Producto (dependiendo del filtro de drill-down), devolviendo: `{ id, name, velocity, marginPercentage, totalSales }`.

### API 3: Reporte de Acción (Tabla Paginada)
*   **Endpoint:** `GET /tenant/stock/demand-report`
*   **Query Params:** `branchId`, `categoryId`, `rotationStatus` (HIGH, MEDIUM, LOW, DEAD), `page`, `size`
*   **Columnas/Campos por fila:**
    *   Producto / Variante (Info básica)
    *   `currentStock`: Inventario actual.
    *   `dailyVelocity`: Unidades vendidas por día (basado en el historial).
    *   `daysRemaining`: = `currentStock / dailyVelocity` (Días de vida del inventario).
    *   `rotationStatus`: Enum/String para etiquetar semánticamente (Ej. `"DEAD"`, `"HIGH"`).
    *   `suggestedAction`: Una recomendación calculada por el backend (Ej. `"REORDER"`, `"LIQUIDATE"`, `"HOLD"`).

---

## 4. Visualizaciones en el Frontend (Consumo y UI)

### 4.1. Barra de Herramientas y Contexto
*   **Filtros principales:** Selector de Tienda (Branch) y un **Selector de Período de Análisis** (Últimos 30, 90 o 180 días). Esto es crucial porque la "velocidad de venta" se calcula mirando al pasado; el usuario debe poder elegir si quiere un pronóstico a corto o largo plazo.

### 4.2. Gráfica 1: Línea de Tendencia (Line Chart)
*   **Objetivo:** Ver la estacionalidad y los picos de demanda.
*   **Eje X:** Eje de tiempo (Días o Semanas).
*   **Eje Y:** Volumen de ventas (Unidades o Dinero).
*   **Recomendación UI:** Usar curvas suaves (spline) y tooltips interactivos al pasar el mouse por encima de los nodos.

### 4.3. Gráfica 2: Matriz BCG (Scatter Plot / Gráfico de Dispersión)
Esta es la "joya de la corona" para el dueño del negocio. El Frontend debe renderizar un gráfico de dispersión dividido en 4 cuadrantes fijos (usando guías transversales X e Y):
*   **Eje X (Horizontal):** Rotación / Velocidad de venta (Baja a la izq, Alta a la der).
*   **Eje Y (Vertical):** Margen de Ganancia % (Bajo abajo, Alto arriba).
*   **Cuadrantes (Regiones de la gráfica):**
    1.  ⭐ **Estrellas (Alta Rotación, Alto Margen):** Arriba a la derecha. "Lo mejor del negocio".
    2.  🐄 **Vacas Lecheras (Alta Rotación, Bajo Margen):** Abajo a la derecha. "Traen flujo de caja".
    3.  ❓ **Signos de Interrogación (Baja Rotación, Alto Margen):** Arriba a la izquierda. "Potencial desaprovechado".
    4.  🐕 **Perros / Stock Muerto (Baja Rotación, Bajo Margen):** Abajo a la izquierda. "Hay que liquidarlos o rematarlos".
*   **Interactividad:** Cada punto en el gráfico es un producto. Al hacer *hover*, un tooltip debe decir: `"Helado de Fresa - Margen: 45% - Vende: 10/día - Recomendación: Mantener Stock"`.

### 4.4. Tabla de Decisiones y Estado (Data Grid)
*   En lugar de celdas aburridas con números, esta tabla debe usar indicadores visuales (Semáforos).
*   **Columna "Días Restantes" (Days Remaining):**
    *   🔴 *Fondo Rojo / Ícono Alerta:* < 7 días (Peligro de quiebre inminente).
    *   🟢 *Fondo Verde:* 15 - 45 días (Inventario Saludable).
    *   🟠 *Fondo Naranja:* > 90 días (Exceso de inventario, capital inmovilizado).
*   **Columna "Rotación":** Badges que digan "Alta", "Baja", "Dead Stock".
*   **Columna "Acción Sugerida":** Un botón o Badge de solo lectura que el Backend mande (Ej. un botón que diga "Generar Orden de Compra" si está en rojo).

---

## 5. Validaciones y Lógica en el Frontend

Para asegurar que la vista no explote y sea coherente, el equipo Frontend debe contemplar:

1.  **División por Cero e Infinito:** Si un producto tiene 100 unidades en stock pero se ha vendido **0** veces en el mes, la velocidad de venta es `0`. Si el Frontend (o el Backend) intenta calcular `Días Restantes = Stock / 0`, dará infinito (`Infinity`). El Frontend debe detectar si `daysRemaining == null` o `Infinity` y mostrar un símbolo como `∞` o un texto descriptivo como `"Sin movimiento"`.
2.  **Prevención de Sobrecarga (Debounce):** Si el usuario filtra rangos de fechas largos (ej. 365 días), la consulta en el backend será pesada porque debe recorrer todos los tickets de venta históricos. El Frontend debe limitar el rango máximo de análisis a 6 meses o 1 año mediante un date picker restringido, para no ralentizar el sistema.
3.  **Skeleton Loaders:** Las gráficas de dispersión (BCG) y tendencias requieren cálculos analíticos; el Frontend debe usar "Skeleton Loaders" (pantallas fantasma animadas) de alta fidelidad mientras espera la respuesta del Backend, para que el usuario sienta que es un reporte complejo cargando.
