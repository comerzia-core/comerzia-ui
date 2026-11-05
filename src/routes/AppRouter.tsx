import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PublicLayout } from '../features/public/components/PublicLayout';
import { LandingPage } from '../features/public/pages/LandingPage';
const RegistrationPage = lazy(() => import('../features/public/pages/RegistrationPage').then(module => ({ default: module.RegistrationPage })));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const PrivateRouter = lazy(() => import('./PrivateRouter'));
const StorefrontPage = lazy(() => import('../features/storefront/pages/StorefrontPage').then(module => ({ default: module.StorefrontPage })));
const EmailVerificationPage = lazy(() => import('../features/public/pages/EmailVerificationPage').then(module => ({ default: module.EmailVerificationPage })));
const PasswordResetPage = lazy(() => import('../features/public/pages/PasswordResetPage').then(module => ({ default: module.PasswordResetPage })));
const EmailChangePage = lazy(() => import('../features/public/pages/EmailChangePage').then(module => ({ default: module.EmailChangePage })));

export function AppRouter() {
  return <BrowserRouter><Suspense fallback={<div className="public-route-loading" role="status">Cargando…</div>}><Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<LandingPage />} />
      <Route path="/registro" element={<RegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/recuperar-contrasena" element={<PasswordResetPage />} />
      <Route path="/verificar-email" element={<EmailVerificationPage />} />
      <Route path="/cambiar-email" element={<EmailChangePage />} />
    </Route>
    <Route path="/c/:slug" element={<StorefrontPage />} />
    <Route path="/*" element={<PrivateRouter />} />
  </Routes></Suspense></BrowserRouter>;
}
