import { useState } from "react";
import { ComerziaButton } from "../../../components/ui/ComerziaButton";
import { ComerziaInput } from "../../../components/ui/ComerziaInput";
import { ComerziaSelect, SelectOption } from "../../../components/ui/ComerziaSelect";

export const DashboardPage = () => {
  // Simulación de estado (como los Beans en JSF)
  const [loading, setLoading] = useState(false);

  // Opciones para el select
  const roles: SelectOption[] = [
    { value: "ADMIN", label: "Administrador" },
    { value: "VENDEDOR", label: "Vendedor" },
    { value: "ALMACEN", label: "Encargado de Almacén" },
  ];

  const handleGuardar = () => {
    setLoading(true);
    // Simulamos una petición al backend
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Showcase de Componentes</h1>
      
      {/* Tarjeta de Formulario de Prueba */}
      <div className="card bg-base-100 shadow-xl max-w-2xl">
        <div className="card-body">
            <h2 className="card-title">Prueba de "PrimeFaces" UI Kit</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inputs reutilizables */}
                <ComerziaInput 
                    label="Nombre del Producto" 
                    placeholder="Ej: Coca Cola 3L" 
                />
                
                <ComerziaInput 
                    label="Precio" 
                    type="number" 
                    placeholder="0.00" 
                />

                {/* Select reutilizable */}
                <ComerziaSelect 
                    label="Rol Asignado" 
                    options={roles} 
                />

                 {/* Input con Error simulado */}
                 <ComerziaInput 
                    label="Correo Electrónico" 
                    value="correo_invalido"
                    error="El formato del correo es incorrecto"
                    readOnly
                />
            </div>

            <div className="card-actions justify-end mt-4 items-center">
                {/* Botones Variantes */}
                <ComerziaButton variant="ghost" label="Cancelar" onClick={() => alert("Cancelado")} />
                <ComerziaButton variant="delete" label="Eliminar" />
                
                {/* Botón con estado de carga automático */}
                <ComerziaButton 
                    variant="save" 
                    label={loading ? "Guardando..." : "Guardar"} 
                    isLoading={loading}
                    onClick={handleGuardar}
                />
            </div>
        </div>
      </div>
    </div>
  );
};