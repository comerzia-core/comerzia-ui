import React, { useState, useRef, useEffect } from "react";
import { useShake } from "../../hooks/useShake";
import { Search, Plus, MoreHorizontal, X } from "lucide-react";
import { ConfirmationModal } from "./ConfirmationModal";
import { BtnDelete } from "./CrudButtons";

export interface SelectOption {
    value: string | number;
    label: string;
}

interface Props {
    label?: string;
    options: SelectOption[];
    value: string | number;
    onChange: (value: string | number) => void;
    onCreate?: (inputValue: string) => Promise<string | number>;
    onUpdate?: (id: string | number, newLabel: string) => Promise<void>;
    onDelete?: (id: string | number) => Promise<void>;
    entityName?: string;
    error?: string;
    placeholder?: string;
    isLoading?: boolean;
    isRequired?: boolean;
    shakeKey?: number;
    disabled?: boolean;
    className?: string;
}

export const ComerziaCreatableSelect: React.FC<Props> = ({
    label,
    options,
    value,
    onChange,
    onCreate,
    onUpdate,
    onDelete,
    entityName = "Elemento",
    error,
    placeholder = "Buscar o crear...",
    isLoading = false,
    isRequired = false,
    shakeKey,
    disabled = false,
    className = "",
}) => {
    const isShaking = useShake(shakeKey);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    
    // Inline Edit State
    const [editOptionId, setEditOptionId] = useState<string | number | null>(null);
    const [editOptionLabel, setEditOptionLabel] = useState("");
    const [isDeletingId, setIsDeletingId] = useState<string | number | null>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync search term with selected value label when not open
    useEffect(() => {
        if (!isOpen) {
            const selectedOpt = options.find((o) => o.value === value);
            setSearchTerm(selectedOpt ? selectedOpt.label : "");
            setEditOptionId(null);
        }
    }, [value, options, isOpen]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt => 
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exactMatch = options.find(opt => opt.label.toLowerCase() === searchTerm.toLowerCase());
    const canCreate = onCreate && searchTerm.trim() !== "" && !exactMatch;

    const handleSelect = (selectedValue: string | number) => {
        onChange(selectedValue);
        setIsOpen(false);
    };

    const handleCreate = async () => {
        if (!onCreate || !canCreate) return;
        setIsCreating(true);
        try {
            const newValue = await onCreate(searchTerm.trim());
            onChange(newValue);
            setIsOpen(false);
        } catch (e) {
            console.error("Error creating option", e);
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (filteredOptions.length > 0 && !canCreate) {
                handleSelect(filteredOptions[0].value);
            } else if (canCreate) {
                handleCreate();
            }
        }
    };

    const startEditing = (e: React.MouseEvent, opt: SelectOption) => {
        e.stopPropagation();
        setEditOptionId(opt.value);
        setEditOptionLabel(opt.label);
    };

    const handleUpdate = async () => {
        if (!editOptionId || !onUpdate) return;
        const opt = options.find(o => o.value === editOptionId);
        if (opt && opt.label !== editOptionLabel.trim() && editOptionLabel.trim() !== "") {
            try {
                await onUpdate(editOptionId, editOptionLabel.trim());
                // If it was the selected one, update local search term
                if (value === editOptionId) setSearchTerm(editOptionLabel.trim());
            } catch (error) {
                console.error("Update failed", error);
            }
        }
        setEditOptionId(null);
    };

    const handleConfirmDelete = async () => {
        if (!isDeletingId || !onDelete) return;
        try {
            await onDelete(isDeletingId);
            if (value === isDeletingId) {
                onChange("");
                setSearchTerm("");
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setIsDeletingId(null);
        }
    };

    return (
        <div ref={wrapperRef} className={`form-control w-full relative ${isShaking ? "animate-shake" : ""} ${className}`}>
            {label && (
                <label className="label py-1">
                    <span className={`label-text font-semibold flex gap-1 ${error ? "text-error" : ""}`}>
                        {label}
                        {isRequired && <span className="text-error" title="Campo obligatorio">*</span>}
                    </span>
                </label>
            )}
            
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className={`
                        input input-bordered w-full transition-colors pr-16 uppercase
                        focus:border-primary focus:ring-1 focus:ring-primary/20
                        ${error ? "input-error bg-error/5" : ""} 
                        ${disabled ? "bg-base-200 text-base-content/50 cursor-not-allowed" : ""}
                    `}
                    placeholder={placeholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value.toUpperCase());
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || isLoading || isCreating}
                />
                
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                    {isLoading || isCreating ? (
                        <span className="loading loading-spinner loading-sm text-primary"></span>
                    ) : (
                        <>
                            {value && !disabled && (
                                <button 
                                    className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/20"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onChange("");
                                        setSearchTerm("");
                                    }}
                                    title="Limpiar selección"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <div className="pointer-events-none px-1">
                                <Search className="w-4 h-4 text-base-content/50" />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <label className="label py-1 pb-0">
                    <span className="label-text-alt text-error font-medium">{error}</span>
                </label>
            )}

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-base-100 rounded-xl shadow-xl border border-base-200 max-h-80 overflow-auto top-full">
                    <ul className="menu menu-sm p-2 w-full">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <li key={opt.value} className="relative group w-full">
                                    {editOptionId === opt.value ? (
                                        <div className="flex flex-col gap-2 p-2" onClick={e => e.stopPropagation()}>
                                            <input 
                                                ref={editInputRef}
                                                autoFocus
                                                type="text" 
                                                className="input input-sm input-bordered w-full uppercase" 
                                                value={editOptionLabel}
                                                onChange={e => setEditOptionLabel(e.target.value.toUpperCase())}
                                                onBlur={handleUpdate}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') handleUpdate();
                                                    if (e.key === 'Escape') setEditOptionId(null);
                                                }}
                                            />
                                            {onDelete && (
                                                <BtnDelete 
                                                    label={`Eliminar ${entityName}`}
                                                    className="btn-sm w-full mt-1"
                                                    responsive={false}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault(); // Prevents input blur before click
                                                        setEditOptionId(null);
                                                        setIsOpen(false);
                                                        setIsDeletingId(opt.value);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <a 
                                            className={`flex justify-between items-center w-full ${opt.value === value ? "active" : ""}`}
                                            onClick={() => handleSelect(opt.value)}
                                        >
                                            <span className="flex-1 truncate">{opt.label}</span>
                                            {onUpdate && (
                                                <button 
                                                    className="btn btn-ghost btn-xs btn-square opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                    onClick={(e) => startEditing(e, opt)}
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                            )}
                                        </a>
                                    )}
                                </li>
                            ))
                        ) : !canCreate ? (
                            <li className="disabled w-full"><a className="text-base-content/50 italic w-full">No se encontraron resultados</a></li>
                        ) : null}

                        {canCreate && (
                            <li className="w-full">
                                <a 
                                    className="text-primary font-medium flex items-center gap-2 hover:bg-primary/10 w-full"
                                    onClick={handleCreate}
                                >
                                    <Plus className="w-4 h-4" />
                                    Crear "{searchTerm}"
                                </a>
                            </li>
                        )}
                    </ul>
                </div>
            )}
            
            <ConfirmationModal
                isOpen={isDeletingId !== null}
                onClose={() => setIsDeletingId(null)}
                onConfirm={handleConfirmDelete}
                title={`Eliminar ${entityName}`}
                message={`¿Estás seguro de eliminar este registro de ${entityName}? Si hay productos asociados a este registro, se perderán o desvincularán.`}
                confirmText="Sí, eliminar"
            />
        </div>
    );
};
