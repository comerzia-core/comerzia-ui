// src/features/organization/components/branches/BranchesGrid.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Store, Pencil, Trash2 } from 'lucide-react';
import { BranchCard } from './BranchCard';
import { ComerziaContextMenu, ContextMenuItem } from '../../../../components/ui/ComerziaContextMenu';
import type { BranchResponse } from '../../types/branch';

interface Props {
  branches: BranchResponse[];
  isLoadingInitial: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onFetchNextPage: () => void;
  onEdit: (branch: BranchResponse) => void;
  onDelete: (branch: BranchResponse) => void;
}

export const BranchesGrid = ({
  branches,
  isLoadingInitial,
  isLoadingMore,
  hasMore,
  onFetchNextPage,
  onEdit,
  onDelete
}: Props) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Estado para el menú contextual de clic derecho
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    branch: BranchResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    branch: null
  });

  // Manejador del evento de clic derecho / long-press en la tarjeta
  const handleContextMenu = (e: React.MouseEvent | { clientX: number; clientY: number; preventDefault?: () => void }, branch: BranchResponse) => {
    if (e.preventDefault) e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      branch
    });
  };

  // Configurar IntersectionObserver para detectar cuando el usuario llega al final de la página
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || isLoadingMore || isLoadingInitial) return;

    const observer = new IntersectionObserver(
      entries => {
        const first = entries[0];
        if (first.isIntersecting) {
          onFetchNextPage();
        }
      },
      {
        root: null,
        rootMargin: '200px', // Cargar 200px antes de llegar al fondo
        threshold: 0.1
      }
    );

    const currentSentinel = sentinelRef.current;
    observer.observe(currentSentinel);

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [hasMore, isLoadingMore, isLoadingInitial, onFetchNextPage]);

  // RENDERIZADO EN ESTADO DE CARGA INICIAL (Skeletons)
  if (isLoadingInitial) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 space-y-4 animate-pulse"
          >
            <div className="flex justify-between items-center">
              <div className="w-10 h-10 rounded-xl bg-base-300" />
              <div className="w-16 h-6 rounded-full bg-base-300" />
            </div>
            <div className="space-y-2">
              <div className="h-5 bg-base-300 rounded-md w-3/4" />
              <div className="h-4 bg-base-300 rounded-md w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // RENDERIZADO EN ESTADO VACÍO
  if (branches.length === 0) {
    return (
      <div className="card bg-base-100 border border-base-200 p-12 text-center rounded-2xl shadow-xs">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
          <Store className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-base-content">No se encontraron sucursales</h3>
        <p className="text-sm text-base-content/60 mt-1 max-w-md mx-auto">
          No hay sucursales registradas o no coinciden con los criterios de búsqueda seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CUADRÍCULA RESPONSIVA DE TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {branches.map(branch => (
          <BranchCard key={branch.id} branch={branch} onContextMenu={handleContextMenu} />
        ))}

        {/* SKELETONS AL HACER SCROLL INFINITO */}
        {isLoadingMore &&
          Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`loading-more-${index}`}
              className="card bg-base-100 border border-base-200 shadow-xs rounded-2xl p-5 space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-xl bg-base-300" />
                <div className="w-16 h-6 rounded-full bg-base-300" />
              </div>
              <div className="space-y-2">
                <div className="h-5 bg-base-300 rounded-md w-3/4" />
                <div className="h-4 bg-base-300 rounded-md w-full" />
              </div>
            </div>
          ))}
      </div>

      {/* MENÚ CONTEXTUAL AL HACER CLIC DERECHO EN UNA TARJETA */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.branch && (
          <>
            <ContextMenuItem
              icon={Pencil}
              label="Editar Sucursal"
              onClick={() => {
                if (contextMenu.branch) onEdit(contextMenu.branch);
              }}
            />
            <ContextMenuItem
              icon={Trash2}
              label="Eliminar Sucursal"
              variant="error"
              onClick={() => {
                if (contextMenu.branch) onDelete(contextMenu.branch);
              }}
            />
          </>
        )}
      </ComerziaContextMenu>

      {/* ELEMENTO CENTINELA PARA EL OBSERVER DE SCROLL */}
      <div ref={sentinelRef} className="h-4" />
    </div>
  );
};
