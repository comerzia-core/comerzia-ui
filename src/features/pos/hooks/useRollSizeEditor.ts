import { useState } from 'react';
import type { RollSize, SaveRollSizeRequest } from '../types/labels';

export const useRollSizeEditor = (persist: (id: string | null, request: SaveRollSizeRequest) => Promise<boolean>) => {
  const [editing, setEditing] = useState<RollSize | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState({ name: '', widthMm: '50', heightMm: '30', gapMm: '2', active: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const openEditor = (item: RollSize | null) => {
    setEditing(item); setErrors({});
    setForm(item ? { name: item.name, widthMm: String(item.widthMm), heightMm: String(item.heightMm), gapMm: String(item.gapMm), active: item.active }
      : { name: '', widthMm: '50', heightMm: '30', gapMm: '2', active: false });
    setIsEditorOpen(true);
  };
  const save = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim() || form.name.length > 100) nextErrors.name = 'Ingrese un nombre de hasta 100 caracteres.';
    const dimensions = [{ key: 'widthMm', value: form.widthMm, min: 12, max: 108 }, { key: 'heightMm', value: form.heightMm, min: 12, max: 200 }, { key: 'gapMm', value: form.gapMm, min: 0, max: 20 }];
    dimensions.forEach(field => { if (!/^\d+$/.test(field.value) || Number(field.value) < field.min || Number(field.value) > field.max) nextErrors[field.key] = `Ingrese un entero entre ${field.min} y ${field.max} mm.`; });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setShakeKey(value => value + 1); return; }
    const request: SaveRollSizeRequest = { name: form.name.trim(), widthMm: Number(form.widthMm), heightMm: Number(form.heightMm), gapMm: Number(form.gapMm), active: form.active };
    if (await persist(editing?.id || null, request)) setIsEditorOpen(false);
  };
  return { editing, isEditorOpen, setIsEditorOpen, form, setForm, errors, shakeKey, openEditor, save };
};
