import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ComerziaBarcodeScanner } from "../../src/components/ui/ComerziaBarcodeScanner";
import { BtnTab } from "../../src/components/ui/CrudButtons";
import "../../src/index.css";

export function CameraTestPage() {
  const [open, setOpen] = useState(true);
  return <main style={{ width: 336, margin: "20px auto" }}>
    <BtnTab label="Toggle scanner" onClick={() => setOpen(value => !value)} />
    {open && <ComerziaBarcodeScanner onScanSuccess={code => {
      document.body.dataset.scanned = code;
      document.body.dataset.scanCount = String(Number(document.body.dataset.scanCount || 0) + 1);
    }} />}
  </main>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><CameraTestPage /></StrictMode>);
