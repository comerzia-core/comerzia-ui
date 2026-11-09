import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../context/ToastContext';
import { priceTypeService } from '../services/priceTypeService';
import type { PriceTypeSettings, SavePriceTypeRequest } from '../types/priceType';

function priceTypeError(error: unknown): string {
  const code = isAxiosError<{ code?: string }>(error) ? error.response?.data.code : undefined;
  const messages: Record<string, string> = {
    price_type_in_use: 'Este tipo ya se utilizó. Puedes cambiar su nombre y descripción, pero no su equivalencia ni eliminarlo.',
    resource_already_exists: 'Ya existe un tipo de precio con ese nombre.',
    data_integrity_violation: 'El registro entra en conflicto con otro tipo de precio. Actualiza la lista e inténtalo nuevamente.',
    resource_not_found: 'El tipo de precio ya no está disponible. Actualiza la lista.',
    validation_error: 'Revisa el nombre y la equivalencia. Debe ser un número entero entre 1 y 1.000.000.',
    malformed_json: 'Ingresa una equivalencia numérica válida.',
  };
  return messages[code ?? ''] ?? 'No se pudo guardar el cambio. Inténtalo nuevamente.';
}

export function usePriceTypeSettings() {
  const canManage = useAuthStore(state => state.hasPermission('ORG_SETTINGS_MANAGE'));
  const canRead = useAuthStore(state => state.hasPermission('ORG_SETTINGS_READ')) || canManage;
  const userId = useAuthStore(state => state.userProfile?.id);
  const client = useQueryClient();
  const { success, error: showError } = useToast();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [editor, setEditor] = useState<PriceTypeSettings | null | undefined>();
  const [deleting, setDeleting] = useState<PriceTypeSettings | null>(null);
  const [form, setForm] = useState<SavePriceTypeRequest>({ name: '', description: '', equivalenceFactor: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const queryKey = ['price-type-settings', userId, page, size];
  const query = useQuery({ queryKey, queryFn: () => priceTypeService.list(page, size), enabled: canRead });

  useEffect(() => {
    setEditor(undefined);
    setDeleting(null);
    setPage(0);
    setError('');
    setShakeKey(0);
  }, [userId]);

  function openEditor(value: PriceTypeSettings | null) {
    setEditor(value);
    setForm({ name: value?.name ?? '', description: value?.description ?? '', equivalenceFactor: value?.equivalenceFactor ?? 1 });
    setError('');
    setShakeKey(0);
  }

  async function save() {
    if (busy || !canManage) return;
    const generation = useAuthStore.getState().generation;
    const request = { name: form.name.trim(), description: form.description?.trim() || null, equivalenceFactor: form.equivalenceFactor };
    setBusy(true);
    setShakeKey(value => value + 1);
    setError('');
    try {
      if (editor) await priceTypeService.update(editor.id, request);
      else await priceTypeService.create(request);
      if (generation !== useAuthStore.getState().generation) return;
      setEditor(undefined);
      success('Tipo de precio guardado.');
      await client.invalidateQueries({ queryKey: ['price-type-settings', userId] });
    } catch (cause) {
      if (generation === useAuthStore.getState().generation) setError(priceTypeError(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting || busy || !canManage) return;
    const generation = useAuthStore.getState().generation;
    setBusy(true);
    try {
      await priceTypeService.remove(deleting.id);
      if (generation !== useAuthStore.getState().generation) return;
      setDeleting(null);
      success('Tipo de precio eliminado.');
      if (page > 0 && query.data?.content.length === 1) setPage(page - 1);
      await client.invalidateQueries({ queryKey: ['price-type-settings', userId] });
    } catch (cause) {
      if (generation === useAuthStore.getState().generation) showError(priceTypeError(cause));
    } finally {
      setBusy(false);
    }
  }

  return { canManage, canRead, query, page, setPage, size, setSize, editor, setEditor, openEditor,
    deleting, setDeleting, form, setForm, busy, error, shakeKey, save, remove };
}
