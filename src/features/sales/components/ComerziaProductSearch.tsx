import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { salesService } from '../services/salesService';
import type { SalesCatalogSuggestionResponse, SalesProductResponse } from '../types/sales';

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
    <div className="relative flex-1" ref={wrapperRef}>
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-base-content/40" />
      <input
        type="text"
        placeholder="Escribe el nombre o código para buscar..."
        className="input input-bordered input-sm w-full pl-9 bg-base-50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
      />
      {isLoading && (
        <div className="absolute right-3 top-2">
          <span className="loading loading-spinner loading-xs text-primary"></span>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto overscroll-contain">
          <ul className="p-2 space-y-1">
            {suggestions.map((sug) => (
              <li key={sug.variantId} className="list-none">
                <button 
                  onClick={() => handleSelect(sug)} 
                  className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:shadow-sm border border-transparent hover:border-primary/20 flex flex-col gap-1"
                >
                  <span className="font-semibold text-sm block truncate w-full">{sug.label}</span>
                </button>
              </li>
            ))}
          </ul>
          {suggestions.length === 15 && (
            <div className="p-2 text-[10px] text-center text-base-content/50 bg-base-50 border-t border-base-200">
              Mostrando 15 resultados. Escribe más caracteres para afinar la búsqueda.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
