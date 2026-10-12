import { useState } from 'react';
import type { RollSize, SaveRollSizeRequest } from '../types/labels';
import { getRollWidthMm } from '../utils/labelRolls';

export const useRollSizeEditor = (persist: (id: string | null, request: SaveRollSizeRequest) => Promise<boolean>) => {
  const [editing, setEditing] = useState<RollSize | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState({ name: '', widthMm: '50', heightMm: '30', gapMm: '2', columns: '1', columnGapMm: '0', active: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const openEditor = (item: RollSize | null) => {
    setEditing(item); setErrors({});
    setForm(item ? { name: item.name, widthMm: String(item.widthMm), heightMm: String(item.heightMm), gapMm: String(item.gapMm), columns: String(item.columns), columnGapMm: String(item.columnGapMm), active: item.active }
      : { name: '', widthMm: '50', heightMm: '30', gapMm: '2', columns: '1', columnGapMm: '0', active: false });
    setIsEditorOpen(true);
  };
  const save = async () => {
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim() || form.name.length > 100) nextErrors.name = 'Ingrese un nombre de hasta 100 caracteres.';
    const dimensions = [{ key: 'widthMm', value: form.widthMm, min: 12, max: 108 }, { key: 'heightMm', value: form.heightMm, min: 12, max: 200 }, { key: 'gapMm', value: form.gapMm, min: 0, max: 20 }];
    dimensions.forEach(field => { if (!/^\d+$/.test(field.value) || Number(field.value) < field.min || Number(field.value) > field.max) nextErrors[field.key] = `Ingrese un entero entre ${field.min} y ${field.max} mm.`; });
    if (!/^\d+$/.test(form.columns) || Number(form.columns) < 1 || Number(form.columns) > 9) nextErrors.columns = 'Ingrese entre 1 y 9 columnas.';
    const columnGapMm = Number(form.columns) === 1 ? 0 : Number(form.columnGapMm);
    if (Number(form.columns) > 1 && (!/^\d+(\.\d{1,2})?$/.test(form.columnGapMm) || columnGapMm < 0 || columnGapMm > 20))
      nextErrors.columnGapMm = 'Ingrese entre 0 y 20 mm, con hasta dos decimales.';
    if (!nextErrors.widthMm && !nextErrors.columns && !nextErrors.columnGapMm && getRollWidthMm(Number(form.widthMm), Number(form.columns), columnGapMm) > 108)
      nextErrors.widthMm = 'El ancho total de las columnas y sus separaciones no puede superar 108 mm.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setShakeKey(value => value + 1); return; }
    const request: SaveRollSizeRequest = { name: form.name.trim(), widthMm: Number(form.widthMm), heightMm: Number(form.heightMm), gapMm: Number(form.gapMm), columns: Number(form.columns), columnGapMm, active: form.active };
    if (await persist(editing?.id || null, request)) setIsEditorOpen(false);
  };
  const totalWidthMm = getRollWidthMm(Number(form.widthMm), Number(form.columns), Number(form.columns) === 1 ? 0 : Number(form.columnGapMm));
  return { editing, isEditorOpen, setIsEditorOpen, form, setForm, errors, shakeKey, openEditor, save, totalWidthMm };
};
