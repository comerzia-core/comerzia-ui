# Arquitectura Frontend - Comerzia

Este proyecto utiliza una **Arquitectura Basada en Features (Funcionalidades)** para garantizar escalabilidad, mantenimiento y orden, similar a un enfoque modular en el backend.

## 🛠 Tech Stack
- **Core:** React + TypeScript + Vite
- **Estilos:** Tailwind CSS + DaisyUI
- **Estado:** (Por definir: Context API / Zustand)
- **Routing:** React Router DOM

## 📂 Estructura de Directorios

### `/src/features` (El Corazón del Negocio)
Aquí vive la lógica de negocio dividida por dominios. Cada carpeta aquí representa un módulo funcional del sistema.
*Ejemplo: `features/inventory`*
- **/components:** Componentes visuales únicos de este módulo (ej: `ProductTable`).
- **/hooks:** Lógica de estado y llamadas a API específicas (ej: `useProducts`).
- **/types:** Interfaces y DTOs del módulo (ej: `interface Product`).
- **/services:** Llamadas directas a endpoints (ej: `getProductById`).

### `/src/components` (Tu "PrimeFaces" Personalizado)
Componentes visuales reutilizables y agnósticos al negocio.
- **/ui:** Elementos base envueltos (Wrappers). Aquí configuramos DaisyUI.
  - Ejemplo: `ComerziaButton`, `ComerziaInput`, `ComerziaModal`.
  - **Regla:** Si necesitas un botón, NO uses `<button className="btn...">` directamente en las páginas. Usa `<ComerziaButton />`.
- **/layout:** Componentes de estructura como `Navbar`, `Sidebar`, `Footer`.

### `/src/pages`
Las vistas finales que el usuario ve. Actúan como el "pegamento" que une los componentes de las *features* y los *layouts*.
- Ejemplo: `InventoryPage.tsx` (Contiene el `Sidebar` + `ProductTable`).

### `/src/layouts`
Plantillas maestras que envuelven las páginas.
- `MainLayout`: Sidebar + Header + Content (para usuarios logueados).
- `AuthLayout`: Centrado + Fondo limpio (para Login/Register).

### `/src/utils` & `/src/hooks`
- **utils:** Funciones puras de ayuda (formatear moneda, fechas).
- **hooks:** Hooks globales compartidos (ej: `useTheme`, `useAuth`).

## rules 🚨 Reglas de Oro
1. **No repitas estilos:** Si usas las mismas clases de Tailwind más de 3 veces, crea un componente en `/components/ui`.
2. **Tipado fuerte:** No uses `any`. Define interfaces en `types`.
3. **Separación de responsabilidades:** La lógica compleja va en un *hook*, la vista en un *componente*.