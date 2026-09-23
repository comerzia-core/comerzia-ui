import { useRef } from "react";
import { ImagePlus, X, Star, ArrowUp, ArrowDown, Camera, Upload } from "lucide-react";
import { 
    MAX_FILE_SIZE_BYTES, 
    MAX_FILE_SIZE_MB, 
    ALLOWED_IMAGE_TYPES, 
    MAX_IMAGES_PER_PRODUCT 
} from "../../config/storage";
import { useToast } from "../../context/ToastContext";

export interface ImageItem {
    id: string; 
    preview: string; 
    file?: File; 
    isCover: boolean;
    name?: string;
}

interface Props {
    images: ImageItem[];
    onChange: (newImages: ImageItem[]) => void;
    error?: string;
    shakeKey?: number;
}

export const ComerziaImageUploader = ({ images, onChange, error, shakeKey }: Props) => {
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const { error: toastError, success: toastSuccess } = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            
            const validNewItems: ImageItem[] = [];
            let skippedCount = 0;
            let invalidTypeCount = 0;

            files.forEach(file => {
                // 1. Validar Tipo
                if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
                    invalidTypeCount++;
                    return;
                }

                // 2. Validar Tamaño (Max 5MB)
                if (file.size > MAX_FILE_SIZE_BYTES) {
                    skippedCount++;
                    return;
                }

                // Si pasa, lo preparamos
                validNewItems.push({
                    id: URL.createObjectURL(file),
                    preview: URL.createObjectURL(file),
                    file: file,
                    isCover: false,
                    name: file.name
                });
            });

            // 3. Validar Cantidad Total (Actuales + Nuevas Válidas)
            const currentTotal = images.length;
            const potentialTotal = currentTotal + validNewItems.length;

            if (potentialTotal > MAX_IMAGES_PER_PRODUCT) {
                toastError(`Solo puedes tener un máximo de ${MAX_IMAGES_PER_PRODUCT} imágenes por producto.`);
                
                const slotsAvailable = MAX_IMAGES_PER_PRODUCT - currentTotal;
                if (slotsAvailable > 0) {
                    const toAdd = validNewItems.slice(0, slotsAvailable);
                    const updatedList = [...images, ...toAdd];
                    updateListState(updatedList);
                    toastSuccess(`Se agregaron ${toAdd.length} imágenes.`);
                }
            } else {
                if (validNewItems.length > 0) {
                    const updatedList = [...images, ...validNewItems];
                    updateListState(updatedList);
                }
            }

            // 4. Notificaciones de Archivos Saltados
            if (skippedCount > 0) {
                toastError(`${skippedCount} imagen(es) ignorada(s) por exceder ${MAX_FILE_SIZE_MB}MB.`);
            }
            if (invalidTypeCount > 0) {
                toastError(`${invalidTypeCount} archivo(s) ignorado(s) por formato incorrecto.`);
            }
        }

        // Reset inputs
        if (galleryInputRef.current) galleryInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = "";
    };

    const updateListState = (list: ImageItem[]) => {
        const validatedList = list.map((img, index) => ({
            ...img,
            isCover: index === 0 
        }));
        onChange(validatedList);
    };

    const removeImage = (index: number) => {
        const newList = [...images];
        newList.splice(index, 1);
        updateListState(newList);
    };

    const moveImage = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === images.length - 1) return;

        const newList = [...images];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        updateListState(newList);
    };

    const getDisplayName = (img: ImageItem) => {
        if (img.name) return img.name;
        try {
            const parts = img.preview.split('/');
            return parts[parts.length - 1];
        } catch {
            return "Imagen";
        }
    };

    const openGallery = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        galleryInputRef.current?.click();
    };

    const openCamera = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        cameraInputRef.current?.click();
    };

    return (
        <div className={`space-y-4 ${shakeKey ? 'animate-shake' : ''}`}>
            
            {/* ZONA DE CARGA */}
            {images.length >= MAX_IMAGES_PER_PRODUCT ? (
                <div className="border-2 border-dashed border-base-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-base-200/50 cursor-not-allowed opacity-60">
                    <div className="bg-base-300 p-3 rounded-full mb-2">
                        <ImagePlus size={24} className="text-base-content/40" />
                    </div>
                    <p className="font-medium text-sm text-base-content/50">Límite de imágenes alcanzado ({MAX_IMAGES_PER_PRODUCT})</p>
                    <p className="text-xs text-base-content/40 mt-1">Borra una imagen para agregar otra</p>
                </div>
            ) : (
                <div 
                    className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center text-center transition-all bg-base-100
                        ${error ? 'border-error bg-error/5' : 'border-base-300 hover:bg-base-200/50 hover:border-primary/50'}
                    `}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Camera size={24} />
                        </div>
                        <div className="p-2 rounded-xl bg-base-200 text-base-content/70">
                            <ImagePlus size={24} />
                        </div>
                    </div>

                    <p className="font-bold text-sm text-base-content">
                        Subir o Capturar Imágenes del Producto
                    </p>
                    <p className="text-xs text-base-content/50 mt-0.5 mb-3">
                        Máx. {MAX_FILE_SIZE_MB}MB • {images.length}/{MAX_IMAGES_PER_PRODUCT} imágenes
                    </p>

                    {/* BOTONES DIRECTOS: TOMAR FOTO O SUBIR DE GALERÍA */}
                    <div className="flex items-center gap-2 w-full max-w-sm justify-center">
                        <button
                            type="button"
                            onClick={openCamera}
                            className="btn btn-sm bg-primary hover:bg-primary/90 text-primary-content border-none flex-1 gap-1.5 shadow-sm font-bold min-h-[38px] active:scale-95 transition-all"
                        >
                            <Camera size={17} />
                            <span className="text-xs sm:text-sm">Tomar Foto</span>
                        </button>

                        <button
                            type="button"
                            onClick={openGallery}
                            className="btn btn-sm bg-base-200 hover:bg-base-300 text-base-content border-base-300 flex-1 gap-1.5 font-semibold min-h-[38px] active:scale-95 transition-all"
                        >
                            <Upload size={16} />
                            <span className="text-xs sm:text-sm">Galería</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Input 1: Galería / Selector Múltiple de Archivos */}
            <input 
                ref={galleryInputRef}
                type="file" 
                multiple 
                accept="image/*,image/jpeg,image/png,image/webp,image/jpg" 
                className="hidden" 
                onChange={handleFileSelect}
            />

            {/* Input 2: Cámara directa */}
            <input 
                ref={cameraInputRef}
                type="file" 
                accept="image/*" 
                capture="environment"
                className="hidden" 
                onChange={handleFileSelect}
            />

            {error && <p className="text-xs text-error font-medium">{error}</p>}

            {/* LISTA DE IMÁGENES */}
            <div className="space-y-2">
                {images.map((img, index) => (
                    <div key={img.id} className={`flex items-center gap-3 p-2 rounded-lg border ${img.isCover ? 'border-primary bg-primary/5' : 'border-base-200 bg-base-100'}`}>
                        
                        <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-base-300">
                            <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" title={getDisplayName(img)}>
                                {getDisplayName(img)}
                            </p>
                            
                            <div className="flex gap-2 mt-1">
                                {img.file ? (
                                    <span className="badge badge-warning badge-xs opacity-70">NUEVA</span>
                                ) : (
                                    <span className="badge badge-ghost badge-xs opacity-50">GUARDADA</span>
                                )}
                                
                                {img.isCover && (
                                    <span className="badge badge-primary badge-xs gap-1">
                                        <Star size={8} fill="currentColor" /> PORTADA
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <button 
                                type="button"
                                disabled={index === 0}
                                onClick={() => moveImage(index, 'up')}
                                className="btn btn-xs btn-square btn-ghost disabled:bg-transparent disabled:opacity-20"
                            >
                                <ArrowUp size={14} />
                            </button>
                            <button 
                                type="button"
                                disabled={index === images.length - 1}
                                onClick={() => moveImage(index, 'down')}
                                className="btn btn-xs btn-square btn-ghost disabled:bg-transparent disabled:opacity-20"
                            >
                                <ArrowDown size={14} />
                            </button>
                        </div>

                        <button 
                            type="button"
                            onClick={() => removeImage(index)}
                            className="btn btn-sm btn-square btn-ghost text-error hover:bg-error/10"
                        >
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const TravesiaImageUploader = ComerziaImageUploader;