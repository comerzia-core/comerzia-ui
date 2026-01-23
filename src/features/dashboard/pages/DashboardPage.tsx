import { useState } from "react";
import { ComerziaSelect, SelectOption } from "../../../components/ui/ComerziaSelect";
import { ComerziaInput } from "../../../components/ui/ComerziaInput";
import { 
    BtnSave, 
    BtnCancel, 
    BtnEdit, 
    BtnDeleteIcon, 
    BtnExcel, 
    BtnPDF 
} from "../../../components/ui/CrudButtons"; // Importas tus botones listos

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
    <div className="space-y-8 p-4">
      
      {/* SECCIÓN 1: FORMULARIO TÍPICO */}
      <div className="card bg-base-100 shadow-xl max-w-3xl">
        <div className="card-body">
            <h2 className="card-title mb-4">Editar Producto</h2>
            
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

            {/* BARRA DE ACCIONES ESTÁNDAR */}
            <div className="card-actions justify-end mt-6 border-t pt-4">
                {/* Ya no configuras nada, solo los llamas */}
                <BtnCancel onClick={() => alert("Cancelando...")} />
                
                <BtnSave 
                    isLoading={loading} 
                    onClick={() => setLoading(!loading)} 
                />
            </div>
        </div>
      </div>


      {/* SECCIÓN 2: SIMULACIÓN DE TABLA */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
            <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Listado de Productos</h2>
                <div className="flex gap-2">
                    <BtnExcel />
                    <BtnPDF />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="hover">
                            <td>1</td>
                            <td>Laptop Gamer</td>
                            <td className="flex justify-center gap-2">
                                {/* BOTONES DE ACCIÓN RÁPIDA (REDONDOS) */}
                                <BtnEdit onClick={() => console.log("Editando 1")} />
                                <BtnDeleteIcon onClick={() => console.log("Borrando 1")} />
                            </td>
                        </tr>
                        <tr className="hover">
                            <td>2</td>
                            <td>Mouse Inalámbrico</td>
                            <td className="flex justify-center gap-2">
                                <BtnEdit />
                                <BtnDeleteIcon />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>

    </div>
  );
};