import { useEffect, useState } from 'react';
import { ComerziaSingleImageUploader, type SingleImageValue } from '../../../components/ui/ComerziaSingleImageUploader';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { usePlatformAction } from '../hooks/usePlatformData';
import { platformService } from '../services/platformService';
export function SaasStaffPhoto({ id, imageUrl }: { id: string; imageUrl: string | null }) {
  const [selected, setSelected] = useState<SingleImageValue | null>(null);
  useEffect(() => () => { if (selected?.file) URL.revokeObjectURL(selected.preview); }, [selected]);
  const save = usePlatformAction(async () => {
    if (!selected?.file) return;
    const body = new FormData(); body.append('file', selected.file);
    await platformService.post('/saas/team/members/' + encodeURIComponent(id) + '/photo', body);
  });
  const remove = usePlatformAction(() => platformService.delete('/saas/team/members/' + encodeURIComponent(id) + '/photo'));
  return <div className="space-y-3 mb-5"><ComerziaSingleImageUploader label="Foto del colaborador" compact enableImageZoom={false}
    value={selected ?? (imageUrl ? { preview: imageUrl } : null)} onChange={value => {
      if (save.isPending || remove.isPending) return;
      if (value === null && !selected && imageUrl) remove.mutate(undefined); else setSelected(value);
    }} />
    {selected?.file && <BtnSave responsive={false} label="Guardar foto" isLoading={save.isPending} onClick={() => save.mutate(undefined, { onSuccess: () => setSelected(null) })} />}
  </div>;
}
