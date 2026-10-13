import { PrintJobList } from '../../src/features/pos/components/hardware/PrintJobList';
import { PrinterRollCalibrationModal } from '../../src/features/pos/components/hardware/PrinterRollCalibrationModal';
import { BtnCalibrate } from '../../src/components/ui/CrudButtons';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import api from '../../src/lib/axios';
import { ProductLabelPrintDialog } from '../../src/features/commercial/components/ProductLabelPrintDialog';
import { RollSizeList } from '../../src/features/pos/components/hardware/RollSizeList';
import type { ProductResponse } from '../../src/features/commercial/types/commercial';
import '../../src/index.css';

// Todas las peticiones de este arnés son interceptadas por Playwright; no usa la API cotidiana.
api.defaults.baseURL = `${window.location.origin}/api`;
const product: ProductResponse = {
  id: 'product', name: 'Producto', status: true, variantType: 1, variantName: 'Unidad',
  brand: { id: 'brand', name: 'Marca', status: true, segment: {
    id: 'segment', name: 'Segmento', status: true, category: { id: 'category', name: 'Categoría', status: true },
  } },
};
const view = new URLSearchParams(window.location.search).get('view');
const rolls = view === 'rolls';
if (view === 'calibration' || view === 'catalog-calibration' || view === 'jobs') useAuthStore.setState({ userProfile: {
  id: 'owner', username: 'owner', firstName: 'Owner', paternalLastName: 'Test', maternalFirstName: null,
  fullName: 'Owner Test', email: 'owner@example.test', imageUrl: null, roles: ['OWNER'],
  permissions: ['HW_DEVICES_MANAGE', 'HW_DEVICES_READ', 'HW_PRINT_EXECUTE', 'HW_PRINT_JOBS_READ'], companySettings: null,
} });
const CalibrationHarness = () => {
  const [open, setOpen] = useState(true);
  return open ? <PrinterRollCalibrationModal deviceId="printer" onClose={() => setOpen(false)} />
    : <BtnCalibrate label="Reabrir calibración" onClick={() => setOpen(true)} />;
};
createRoot(document.getElementById('root')!).render(<StrictMode>
  {view === 'jobs' ? <PrintJobList jobs={[{ id: 'PRIVATE-JOB-ID', deviceId: 'PRIVATE-DEVICE-ID', deviceName: 'Impresora visible', agentName: 'Terminal visible', requestedByEmployeeName: 'Persona visible', jobType: 1131, status: 1145, errorMessage: 'Sin papel' }]} isLoading={false} onRefresh={() => {}} onRetryJob={() => {}} onCancelJob={() => {}} /> : view === 'calibration' ? <CalibrationHarness /> : rolls ? <main className="p-4"><RollSizeList refreshKey={0} /></main> : <ProductLabelPrintDialog product={product} onClose={() => {}} />}
</StrictMode>);
