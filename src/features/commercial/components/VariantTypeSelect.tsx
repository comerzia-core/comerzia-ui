import { ComerziaCreatableSelect } from '../../../components/ui/ComerziaCreatableSelect';
import { useVariantTypes } from '../hooks/useVariantTypes';

interface Props {
  isOpen: boolean;
  value: string;
  onChange: (value: string) => void;
  shakeKey: number;
  disabled?: boolean;
}

export function VariantTypeSelect({ isOpen, value, onChange, shakeKey, disabled }: Props) {
  const types = useVariantTypes(isOpen);
  return <ComerziaCreatableSelect
    label="Tipo de variante" entityName="tipo de variante" isRequired
    options={(types.query.data ?? []).map(type => ({ value: type.id, label: type.name }))}
    value={value} onChange={next => onChange(String(next))}
    canManage={types.canManage} showStatusSwitch={false}
    deleteMessage="¿Deseas eliminar este tipo de variante? Primero debes reasignar todos sus productos a otro tipo."
    onCreate={types.create}
    onUpdate={(id, name) => types.update(String(id), name)}
    onDelete={id => types.remove(String(id))}
    isLoading={types.query.isLoading} disabled={disabled || types.query.isError}
    error={types.query.isError ? 'No se pudieron cargar los tipos de variante. Reabre el formulario para reintentar.' : !value && shakeKey > 0 ? 'Requerido' : ''}
    shakeKey={shakeKey}
  />;
}
