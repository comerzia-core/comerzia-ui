---
trigger: model_decision
description: cuando queremos crear, modificar y agregar vistas, modals y demás diseños debemos usar estas reglas para la visualización en mobile
---

📱 Directivas de Diseño Responsivo Mobile para Comerzia UI
1. 🛡️ REGLA DE NO REGRESIÓN (Cero Alteración de Lógica y APIs)
Intacta la Lógica de Negocio: ESTRICTAMENTE PROHIBIDO alterar llamadas a APIs, servicios Axios, payloads de envío, interfaces de TypeScript, esquemas de validación o lógica de cálculo contable/financiero.
El diseño en PC está 100% aprobado: No modifiques ni rompas la vista de escritorio existente. La adaptación mobile debe convivir limpiamente usando clases condicionales de Tailwind (hidden md:block para Desktop / block md:hidden para Mobile).
2. 🗂️ TABLAS vs. CARDS (Mobile First sin Desbordes Horizontales)
En Desktop (hidden md:block): Mantén la tabla principal (<ComerziaTable /> o tablas HTML nativas de detalle).
En Mobile (block md:hidden):
Reemplaza el listado tabular por Cards (Tarjetas) individuales y compactas.
Diseña cada card con datos clave agrupados: Identificador/Título principal, badge de estado, chips informativos y valores monetarios destacados con tipografía font-mono font-bold text-primary.
Cero Desbordes: Usa min-w-0, truncate o break-words para evitar scrolls horizontales accidentales.
3. 👆 MENÚ CONTEXTUAL Y GESTOS MOBILE (Long Press)
Cero botones invasivos de 3 puntos en cards: En móvil no agregues botones redundantes de 3 puntos ni satures la tarjeta de botones secundarios.
Activación por Pulsación Larga (Long Press):
La tarjeta debe abrir el menú contextual (ComerziaContextMenu) al mantener presionada la fila/card durante 500 ms (onTouchStart, onTouchEnd, onTouchMove).
Agrega vibración háptica suave al activarse (if (navigator.vibrate) navigator.vibrate(40);).
Regla de Clic en Filas: Al hacer tap/clic regular en una fila o card NO se debe abrir automáticamente ningún modal pesado de detalles; la única forma de interactuar es a través de las opciones explícitas del menú contextual.
Auto-Scroll: Si una acción del menú contextual consulta la ficha/detalle en la misma página, realizar desplazamiento suave automático (customerDetailsRef.current?.scrollIntoView({ behavior: 'smooth' })).
4. 🔲 MODALES RESPONSIVOS Y FORMULARIOS
Grids de Inputs: Cambia clases rígidas como grid-cols-2 o grid-cols-3 a adaptativas: grid-cols-1 sm:grid-cols-2 o grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 para que los inputs se apilen verticalmente en pantallas estrechas sin aplastarse.
Subtablas dentro de Modales: Si un modal contiene una lista de ítems o productos en edición/devolución, aplica la misma técnica: tabla oculta en móvil (hidden md:block) y cards con inputs numéricos táctiles en móvil (block md:hidden).
Buscadores Predictivos / Dropdowns:
Asignar max-h-[60vh] sm:max-h-80 con overscroll-contain para que el listado flotante no tape la pantalla ni genere scroll doble.
Elementos de lista con altura mínima táctil accesible (min-h-[44px]).
5. 🔘 BOTONERAS DE ACCIÓN Y MODALES (Regla de Fila Única 50/50)
Prohibido Botones Crudos: Usa SIEMPRE los componentes del UI Kit (BtnCancel, BtnSave, BtnBack, ComerziaButton).
En Celular (Fila Única 50/50):
Los botones inferiores de confirmación/cancelación de modales deben mostrarse en una sola fila horizontal ocupando la mitad del espacio cada uno.
Estructura Estándar:
tsx
<div className="flex flex-row items-center gap-2 pt-3 border-t border-base-200 w-full sm:justify-end">
  <BtnCancel
    onClick={onClose}
    disabled={isSubmitting}
    responsive={true}
    className="flex-1 sm:flex-none sm:w-auto min-w-0"
  />
  <BtnSave
    onClick={handleSubmit}
    isLoading={isSubmitting}
    responsive={true}
    className="flex-1 sm:flex-none sm:w-auto min-w-0"
  />
</div>
responsive={true} oculta automáticamente el texto en móviles (hidden sm:inline) y deja únicamente el ícono centrado (<X /> o <Save />) en su respectivo 50% de ancho.
sm:justify-end sm:flex-none sm:w-auto restaura el tamaño natural y texto completo en PC.
6. 🎨 ESTÁNDAR VISUAL Y ICONOGRAFÍA
Librería de Iconos: Usa siempre lucide-react importando directamente cada ícono (ej. import { Save, X, Edit, Trash2, Home, ArrowLeft } from 'lucide-react').
Feedback Visual: Estados de carga con spinners DaisyUI (<span className="loading loading-spinner loading-xs text-primary"></span>) y efecto de vibración shakeKey ante errores de validación.
Validación de Compilación: Todo cambio debe superar npx tsc --noEmit y npm run build sin errores de tipo ni de importaciones.