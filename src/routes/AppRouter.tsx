import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { UnderConstruction } from "../components/ui/UnderConstruction";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Sin Layout de Dashboard) */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* RUTAS PROTEGIDAS */}
        {/* Paso 1: Verificamos si está logueado */}
        <Route element={<ProtectedRoute />}>
            
            {/* Paso 2: Si pasa, cargamos el Layout (Sidebar + Navbar) */}
            <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* Aquí irán las futuras rutas */}
                {/* <Route path="/ventas" element={<VentasPage />} /> */}

                {/* 2. Rutas futuras (Cuando crees el archivo, lo agregas aquí) */}
                {/* <Route path="/inventory/products" element={<ProductListPage />} /> */}

                {/* 3. EL TRUCO: Ruta Comodín para todo lo demás */}
                {/* Cualquier ruta hija del layout que no esté definida arriba, caerá aquí */}
                <Route path="*" element={<UnderConstruction />} />

            </Route>

        </Route>

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};