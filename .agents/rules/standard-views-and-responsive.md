---
trigger: model_decision
description: Reglas y plantilla estándar para la creación y modificación de vistas, páginas de módulos, filtros, tablas, cards mobile y menús contextuales en Comerzia UI
---

# 📐 Estándar Arquitectónico de Vistas, Tablas y Menú Contextual en Comerzia UI

Este documento establece la plantilla estándar y reglas obligatorias para todas las vistas y páginas de módulos (Empleados, Usuarios, Auditoría, Ventas, Inventario, etc.) en Comerzia UI.

---

## 1. 📋 Estructura Estándar de una Página de Módulo (`Page.tsx`)

Toda página debe implementar la siguiente estructura y clases:

```tsx
export const ExampleModulePage = () => {
  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <ModuleIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Título del Módulo
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Descripción clara del módulo y su función operativa.
            </p>
          </div>
        </div>
        {/* Botonera de cabecera (si aplica) */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BtnCreate onClick={handleCreate} label="Nuevo Registro" className="w-full sm:w-auto" />
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Selects de filtros adicionales aquí */}
        </div>
      </div>

      {/* 3. CONTENEDOR DE TABLA/CARDS */}
      <div className="md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
        <div className="md:card-body md:p-0">
          <ExampleModuleTable
            data={data}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            // Handlers de acciones
          />
        </div>
      </div>

      {/* 4. MODALES */}
    </div>
  );
};
```

---

## 2. 🚫 Regla de Oro: Cero Filas Seleccionables / Cero Modales Automáticos al Clic

- **PROHIBIDO** abrir modales pesados de detalle o ejecutar acciones al hacer un simple clic sobre una fila en Desktop.
- **Acceso a Acciones y Detalle:**
  - **En PC (Desktop):** Se accede exclusivamente mediante **Clic Derecho** (`onContextMenu`) en la fila, lo que abre el `ComerziaContextMenu` en las coordenadas del puntero.
  - **En Móvil (Mobile):** Se accede mediante un **Simple Tap** sobre la tarjeta, abriendo el `ComerziaContextMenu` centrado en pantalla.
  - La opción de consultar información detallada (ej. *"Ver ficha del empleado"*, *"Ver detalle de auditoría"*, *"Ver detalles"*) debe ser un ítem explícito dentro del menú contextual.

---

## 3. 📱 Comportamiento del Menú Contextual (`ComerziaContextMenu`)

El estado del menú contextual debe incluir la bandera `isCentered`:

```tsx
const [contextMenu, setContextMenu] = useState<{
  isOpen: boolean;
  x: number;
  y: number;
  isCentered?: boolean;
  item: EntityType | null;
}>({
  isOpen: false,
  x: 0,
  y: 0,
  isCentered: false,
  item: null
});
```

### Disparador en PC (Clic Derecho):
```tsx
const handleContextMenu = (e: React.MouseEvent, item: EntityType) => {
  e.preventDefault();
  setContextMenu({
    isOpen: true,
    x: e.clientX,
    y: e.clientY,
    isCentered: false,
    item
  });
};
```

### Disparador en Mobile (Simple Tap):
```tsx
const handleMobileCardTap = (e: React.MouseEvent, item: EntityType) => {
  e.stopPropagation();
  setContextMenu({
    isOpen: true,
    x: 0,
    y: 0,
    isCentered: true,
    item
  });
};
```

### Renderizado del Menú:
```tsx
<ComerziaContextMenu
  isOpen={contextMenu.isOpen}
  x={contextMenu.x}
  y={contextMenu.y}
  isCentered={contextMenu.isCentered}
  onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
>
  {contextMenu.item && (
    <>
      <ContextMenuItem
        icon={Eye}
        label="Ver detalles"
        onClick={() => handleViewDetails(contextMenu.item!)}
      />
      <ContextMenuItem
        icon={Edit}
        label="Editar"
        onClick={() => handleEdit(contextMenu.item!)}
      />
      <ContextMenuItem
        icon={Trash2}
        label="Eliminar"
        variant="error"
        onClick={() => handleDelete(contextMenu.item!)}
      />
    </>
  )}
</ComerziaContextMenu>
```

---

## 4. 🎴 Diseño Estándar de Cards en Mobile (`block md:hidden`)

En móvil no se muestra la tabla tradicional para evitar desbordes horizontales. Se renderizan tarjetas limpias:

```tsx
<div className="block md:hidden space-y-3">
  {isLoading ? (
    <div className="flex justify-center py-12">
      <span className="loading loading-spinner loading-md text-primary"></span>
    </div>
  ) : items.length === 0 ? (
    <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
      No se encontraron registros.
    </div>
  ) : (
    items.map((item, index) => (
      <article
        key={item.id}
        onClick={(e) => handleMobileCardTap(e, item)}
        className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
      >
        {/* FILA SUPERIOR: NUMERACIÓN, TÍTULO PRINCIPAL Y BADGE */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
              {page * pageSize + index + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                {item.title}
              </h3>
              <p className="text-xs font-mono text-base-content/60 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                <IdentifierIcon size={12} className="text-primary/70 shrink-0" /> {item.code}
              </p>
            </div>
          </div>

          <div className="shrink-0">
            <ComerziaBadge label={item.statusName} variant={item.statusVariant} />
          </div>
        </div>

        {/* CONTENIDO SECUNDARIO CON SANGRÍA DE 26px */}
        <div className="pl-[26px] flex items-center gap-1.5 text-xs text-base-content/70">
          <SecondaryIcon size={13} className="text-primary/70 shrink-0" />
          <span className="truncate">{item.secondaryDetail}</span>
        </div>

        {/* PIE DE TARJETA CON FECHA O AUDITORÍA */}
        <div className="pl-[26px] pt-1.5 border-t border-base-100 flex items-center text-[11px] text-base-content/60">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-base-content/40 shrink-0" />
          <span>
            Fecha: <strong className="font-medium text-base-content/80">{formatDateForUser(item.createdAt)}</strong>
          </span>
        </div>
      </article>
    ))
  )}
</div>
```

---

## 5. 📄 Paginación Mobile en Una Sola Fila

La paginación móvil debe mantener el texto de conteo y páginas en una sola línea sin saltos:

```tsx
<footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
  <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
    <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
      <span>Mostrar</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
        className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={25}>25</option>
      </select>
      <span className="whitespace-nowrap">de {data.totalElements} registros</span>
    </div>
    <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
      Página {page + 1} de {Math.max(1, data.totalPages)}
    </span>
  </div>

  {/* BOTONES DE NAVEGACIÓN */}
  <div className="flex items-center justify-center gap-1.5">
    <button
      type="button"
      aria-label="Primera página"
      disabled={page === 0 || isLoading}
      onClick={() => onPageChange(0)}
      className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
    >
      <ChevronsLeft className="w-4 h-4" />
    </button>
    <button
      type="button"
      aria-label="Página anterior"
      disabled={page === 0 || isLoading}
      onClick={() => onPageChange(Math.max(0, page - 1))}
      className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    <button
      type="button"
      aria-label="Página siguiente"
      disabled={page >= data.totalPages - 1 || isLoading}
      onClick={() => onPageChange(page + 1)}
      className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
    <button
      type="button"
      aria-label="Última página"
      disabled={page >= data.totalPages - 1 || isLoading}
      onClick={() => onPageChange(data.totalPages - 1)}
      className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
    >
      <ChevronsRight className="w-4 h-4" />
    </button>
  </div>
</footer>
```

---

## 6. 🎨 Tipografía, Alineación e Íconos

- **Íconos:** Siempre de `lucide-react` con `shrink-0`.
- **Textos Secundarios / Identificadores:**
  ```tsx
  <span className="font-mono text-xs text-base-content/60 inline-flex items-center gap-1 whitespace-nowrap">
    <Icon size={12} className="text-primary/70 shrink-0" /> {identifier}
  </span>
  ```
- **Fechas:** Siempre formateadas con `formatDateForUser(dateString)` respetando UTC y formato local del usuario.
