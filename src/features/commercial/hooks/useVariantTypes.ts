import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { variantTypeService } from '../services/variantTypeService';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../context/ToastContext';

export function useVariantTypes(enabled: boolean) {
  const userId = useAuthStore(state => state.userProfile?.id);
  const canManage = useAuthStore(state => state.hasPermission('COM_CATALOG_MANAGE'));
  const client = useQueryClient();
  const toast = useToast();
  const key = ['variant-types', userId];
  const query = useQuery({ queryKey: key, enabled, queryFn: variantTypeService.list });

  async function mutate<T>(action: () => Promise<T>): Promise<T> {
    try {
      const result = await action();
      await client.invalidateQueries({ queryKey: key });
      return result;
    } catch (error: unknown) {
      const code = isAxiosError<{ code?: string }>(error) ? error.response?.data.code : undefined;
      if (code === 'variant_type_in_use') {
        toast.warning('Reasigna primero todos los productos asociados a otro tipo de variante. También se incluyen los productos inactivos y eliminados.');
      } else {
        toast.error(code === 'resource_already_exists'
          ? 'Ya existe un tipo de variante con ese nombre.'
          : 'No se pudo guardar el tipo de variante. Revisa el nombre y vuelve a intentarlo.');
      }
      throw error;
    }
  }

  return {
    query, canManage,
    create: (name: string) => mutate(async () => (await variantTypeService.create(name)).id),
    update: (id: string, name: string) => mutate(() => variantTypeService.update(id, name)),
    remove: (id: string) => mutate(() => variantTypeService.remove(id)),
  };
}
