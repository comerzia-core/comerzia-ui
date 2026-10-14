import { useState } from "react";
import { ComerziaModal } from "../../../components/ui/ComerziaModal";
import { ComerziaButton } from "../../../components/ui/ComerziaButton";
import { ComerziaInput } from "../../../components/ui/ComerziaInput";
import { Copy, CheckCircle, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useToast } from "../../../context/ToastContext";
import type { EmployeeCreatedResponse } from "../types/employee";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: EmployeeCreatedResponse | null;
}

export const EmployeeCredentialsModal = ({ isOpen, onClose, data }: Props) => {
    const [copied, setCopied] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { success: toastSuccess } = useToast();

    if (!data) return null;

    const handleCopy = async () => {
        try {
            const textToCopy = `usuario: ${data.username}\ncontraseña: ${data.temporaryPassword || ''}`;
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            toastSuccess('Credenciales copiadas al portapapeles');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Fallo al copiar al portapapeles", err);
        }
    };

    return (
        <ComerziaModal
            isOpen={isOpen}
            onClose={onClose}
            title="¡Empleado Creado Exitosamente!"
            size="md"
            actions={
                <div className="flex flex-row items-center justify-center sm:justify-end gap-2 w-full">
                    <ComerziaButton 
                        variant="primary" 
                        label="Cerrar" 
                        onClick={onClose} 
                        responsive={true}
                        className="w-full sm:w-auto"
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-4 text-center items-center py-2">
                <CheckCircle size={44} className="text-success animate-bounce" />
                
                <h3 className="text-xl font-bold text-base-content">
                    {data.fullName}
                </h3>
                
                <p className="text-xs sm:text-sm text-base-content/70 bg-warning/10 p-3 rounded-xl border border-warning/20 text-left w-full">
                    <ShieldAlert size={16} className="inline mr-2 text-warning shrink-0" />
                    <strong>¡Atención!</strong> Estas credenciales se muestran por <strong>única vez</strong>. 
                    Cópialas y entrégalas al empleado de forma segura.
                </p>

                <div className="w-full text-left bg-base-200/70 p-4 rounded-xl mt-1 flex flex-col gap-3.5 border border-base-300">
                    <ComerziaInput 
                        label="Usuario" 
                        value={data.username} 
                        readOnly 
                        disabled
                    />
                    
                    <div className="form-control w-full">
                        <label className="label py-1">
                            <span className="label-text font-semibold text-xs text-base-content/70">Contraseña Temporal</span>
                        </label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={data.temporaryPassword || ''} 
                                readOnly
                                disabled
                                className="input input-bordered w-full bg-base-100 font-mono tracking-widest text-base pr-10 text-base-content"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary transition-colors cursor-pointer"
                                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Botón para copiar ambas credenciales */}
                    <div className="pt-1">
                        <ComerziaButton 
                            type="button"
                            variant={copied ? "success" : "neutral"} 
                            onClick={handleCopy}
                            icon={copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                            label={copied ? "¡Credenciales Copiadas!" : "Copiar Usuario y Contraseña"}
                            className="w-full font-bold shadow-xs active:scale-[0.99] transition-transform"
                        />
                    </div>
                </div>
            </div>
        </ComerziaModal>
    );
};
