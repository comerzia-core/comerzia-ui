import { useState, useEffect, useRef } from 'react';
import { Search, Package } from 'lucide-react';
import { salesService } from '../services/salesService';
import type { SalesCatalogSuggestionResponse, SalesProductResponse } from '../types/sales';
import { getThumbnailUrl } from '../../../utils/image';

interface ComerziaProductSearchProps {
  onProductSelect: (product: SalesProductResponse) => void;
  onError?: (msg: string) => void;
}

export const ComerziaProductSearch = ({ onProductSelect, onError }: ComerziaProductSearchProps) => {
  const [term, setTerm] = useState('');
  const [suggestions, setSuggestions] = useState<SalesCatalogSuggestionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (term.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const results = await salesService.getSuggestions(term.trim(), controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setIsOpen(true);
        }
      } catch (err: any) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED' && !controller.signal.aborted) {
          console.error('Error fetching suggestions:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [term]);

  const handleSelect = async (suggestion: SalesCatalogSuggestionResponse) => {
    setIsOpen(false);
    setTerm('');
    try {
      const product = await salesService.getProductDetailsById(suggestion.variantId);
      onProductSelect(product);
    } catch (err) {
      if (onError) onError('No se pudo cargar el detalle del producto.');
    }
  };

  return (
    <div className="relative flex-1 w-full min-w-0" ref={wrapperRef}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40 pointer-events-none" />
      <input
        type="text"
        placeholder="Buscar por nombre o código..."
        className="input input-bordered input-sm w-full pl-9 pr-8 bg-base-50 focus:bg-base-100 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
      />
      {isLoading && (
        <div className="absolute right-2.5 top-2.5">
          <span className="loading loading-spinner loading-xs text-primary"></span>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-2xl shadow-2xl z-50 max-h-[65vh] sm:max-h-96 overflow-y-auto overscroll-contain">
          <ul className="p-2 space-y-1.5">
            {suggestions.map((sug) => (
              <li key={sug.variantId} className="list-none">
                <button 
                  onClick={() => handleSelect(sug)} 
                  className="w-full text-left p-2.5 sm:p-3 rounded-2xl transition-all duration-200 hover:bg-primary/10 hover:shadow-xs border border-transparent hover:border-primary/20 flex items-center gap-3 sm:gap-4 group"
                >
                  {/* Thumbnail del Producto con Optimización Cloudinary */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-base-200/70 border border-base-300/80 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {sug.imageUrl ? (
                      <img
                        src={getThumbnailUrl(sug.imageUrl, 120)}
                        alt={sug.label}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Package className="w-6 h-6 text-base-content/30 group-hover:text-primary transition-colors" />
                    )}
                  </div>

                  {/* Nombre y detalles de la variante */}
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-sm sm:text-base text-base-content group-hover:text-primary transition-colors block break-words leading-snug">
                      {sug.label}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {suggestions.length === 15 && (
            <div className="p-2.5 text-xs text-center text-base-content/50 bg-base-200/50 border-t border-base-200 rounded-b-2xl">
              Mostrando 15 resultados. Escribe más caracteres para afinar la búsqueda.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
