import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '../features/public/components/PublicLayout';
import { LandingPage } from '../features/public/pages/LandingPage';
const RegistrationPage = lazy(() => import('../features/public/pages/RegistrationPage').then(module => ({ default: module.RegistrationPage })));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const PrivateRouter = lazy(() => import('./PrivateRouter'));

export function AppRouter() {
  return <BrowserRouter><Suspense fallback={<div className="public-route-loading" role="status">Cargando…</div>}><Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/registro" element={<RegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Route>
    <Route path="/*" element={<PrivateRouter />} />
  </Routes></Suspense></BrowserRouter>;
}
