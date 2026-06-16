import { useState } from "react";
import { ComerziaModal } from "../../../../components/ui/ComerziaModal";
import { ComerziaButton } from "../../../../components/ui/ComerziaButton";
import { ComerziaInput } from "../../../../components/ui/ComerziaInput";
import { Copy, CheckCircle, ShieldAlert } from "lucide-react";
import type { CompanyCreatedResponse } from "../../types/company";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    data: CompanyCreatedResponse | null;
}

export const CompanyCredentialsModal = ({ isOpen, onClose, data }: Props) => {
    const [copied, setCopied] = useState(false);

    if (!data) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(data.temporaryPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Fallo al copiar al portapapeles", err);
        }
    };

    return (
        <ComerziaModal isOpen={isOpen} onClose={onClose} title="¡Tenant Creado Exitosamente!" size="md">
            <div className="flex flex-col gap-4 text-center items-center py-4">
                
                <CheckCircle size={48} className="text-success animate-bounce" />
                
                <h3 className="text-xl font-bold text-base-content">
                    {data.businessName}
                </h3>
                
                <p className="text-sm text-base-content/70 bg-warning/10 p-3 rounded-lg border border-warning/20">
                    <ShieldAlert size={16} className="inline mr-2 text-warning" />
                    <strong>¡Atención!</strong> Estas credenciales se muestran por <strong>única vez</strong>. 
                    Cópialas y entrégalas al cliente de forma segura.
                </p>

                <div className="w-full text-left bg-base-200 p-4 rounded-xl mt-2 grid gap-3 border border-base-300">
                    <ComerziaInput 
                        label="Usuario Administrador" 
                        value={data.ownerUsername} 
                        readOnly 
                        disabled
                    />
                    
                    <div className="form-control w-full">
                        <label className="label"><span className="label-text font-semibold">Contraseña Temporal</span></label>
                        <div className="flex gap-2">
                            {/* Input tipo password para enmascarar la contraseña */}
                            <input 
                                type="password" 
                                value={data.temporaryPassword} 
                                readOnly
                                disabled
                                className="input input-bordered w-full bg-base-100 font-mono tracking-widest text-lg"
                            />
                            {/* Botón dinámico de copiar */}
                            <ComerziaButton 
                                variant={copied ? "success" : "neutral"} 
                                onClick={handleCopy}
                                icon={copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                label={copied ? "Copiado" : "Copiar"}
                                className="min-w-[110px]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 flex justify-end">
                {/* Botón estandarizado de confirmación para cerrar */}
                <ComerziaButton 
                    variant="primary" 
                    label="Entendido, cerrar" 
                    onClick={onClose} 
                />
            </div>
        </ComerziaModal>
    );
};