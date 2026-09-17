import { useState, useEffect, useRef } from 'react';
import { Search, Package, ScanBarcode, Barcode } from 'lucide-react';
import { salesService } from '../../sales/services/salesService';
import type { SalesCatalogSuggestionResponse } from '../../sales/types/sales';
import { getThumbnailUrl } from '../../../utils/image';
import { BarcodeScannerModal } from '../../../components/ui/BarcodeScannerModal';

interface CommercialProductSearchBarProps {
  onSearchBarcode: (barcode: string) => void;
  onSelectSuggestion?: (suggestion: SalesCatalogSuggestionResponse) => void;
  branchId?: string | null;
  isLoading?: boolean;
  placeholder?: string;
  shakeKey?: number;
  autoFocus?: boolean;
  className?: string;
}

export const CommercialProductSearchBar = ({
  onSearchBarcode,
  onSelectSuggestion,
  branchId,
  isLoading = false,
  placeholder = 'Buscar por nombre, SKU o escanear código...',
  shakeKey = 0,
  autoFocus = true,
  className = ''
}: CommercialProductSearchBarProps) => {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SalesCatalogSuggestionResponse[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Manejo de clic fuera del componente para cerrar sugerencias
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda predictiva con debounce
  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsFetchingSuggestions(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const results = await salesService.getSuggestions(trimmed, controller.signal, branchId);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setIsOpen(results.length > 0);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED' && !controller.signal.aborted) {
          console.error('Error fetching suggestions:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsFetchingSuggestions(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [term, branchId]);

  const handleSelectSuggestion = (sug: SalesCatalogSuggestionResponse) => {
    setIsOpen(false);
    setTerm('');
    if (onSelectSuggestion) {
      onSelectSuggestion(sug);
    } else if (sug.barCode) {
      onSearchBarcode(sug.barCode);
    } else {
      onSearchBarcode(sug.variantId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = term.trim();
      if (!trimmed) return;
      setIsOpen(false);
      setTerm('');
      onSearchBarcode(trimmed);
    }
  };

  const handleCameraScan = (scannedCode: string) => {
    setIsScannerOpen(false);
    setTerm('');
    setIsOpen(false);
    onSearchBarcode(scannedCode);
  };

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      <div 
        className={`flex items-center gap-2 ${shakeKey > 0 ? 'animate-shake' : ''}`} 
        key={shakeKey}
      >
        {/* Input de Búsqueda */}
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-3 sm:left-3.5 flex items-center pointer-events-none text-base-content/40 z-10">
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setIsOpen(true);
            }}
            disabled={isLoading}
            className="input input-bordered w-full pl-9 sm:pl-11 pr-9 sm:pr-10 h-10 sm:h-12 bg-base-100 text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 border-base-300 transition-all placeholder:text-base-content/40"
          />

          {(isLoading || isFetchingSuggestions) && (
            <div className="absolute inset-y-0 right-3 flex items-center z-10">
              <span className="loading loading-spinner loading-xs text-primary"></span>
            </div>
          )}
        </div>

        {/* Botón de Escáner de Cámara */}
        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          disabled={isLoading}
          className="btn btn-primary h-10 sm:h-12 min-h-0 px-3 sm:px-4 rounded-xl sm:rounded-2xl shadow-xs flex items-center gap-1.5 shrink-0 transition-all"
          title="Escanear con cámara"
        >
          <ScanBarcode size={18} className="sm:w-5 sm:h-5" />
          <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Escanear</span>
        </button>
      </div>

      {/* Dropdown de Sugerencias */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-2xl shadow-2xl z-50 max-h-[60vh] sm:max-h-80 overflow-y-auto overscroll-contain animate-fade-in">
          <ul className="p-2 space-y-1">
            {suggestions.map((sug) => (
              <li key={sug.variantId} className="list-none">
                <button
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  className="w-full text-left p-2.5 sm:p-3 rounded-xl transition-all duration-150 hover:bg-primary/10 hover:border-primary/20 border border-transparent flex items-center gap-3 sm:gap-3.5 group min-h-[44px]"
                >
                  {/* Thumbnail de la Variante */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-base-200/80 border border-base-300 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {sug.imageUrl ? (
                      <img
                        src={getThumbnailUrl(sug.imageUrl, 120)}
                        alt={sug.label}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="w-5 h-5 text-base-content/30 group-hover:text-primary transition-colors" />
                    )}
                  </div>

                  {/* Detalle: Nombre y Código de Barras */}
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs sm:text-sm text-base-content group-hover:text-primary transition-colors block truncate leading-snug">
                      {sug.label}
                    </span>
                    {sug.barCode && (
                      <span className="font-mono text-[11px] text-base-content/60 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                        <Barcode size={12} className="text-primary/70 shrink-0" /> {sug.barCode}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {suggestions.length === 15 && (
            <div className="p-2 text-[11px] text-center text-base-content/50 bg-base-200/50 border-t border-base-200 rounded-b-2xl">
              Escribe más caracteres para afinar la búsqueda.
            </div>
          )}
        </div>
      )}

      {/* Modal de Escáner de Cámara */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleCameraScan}
        title="Escanear Código de Barras / QR"
      />
    </div>
  );
};
