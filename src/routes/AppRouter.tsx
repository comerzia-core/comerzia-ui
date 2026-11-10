import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { PublicLayout } from '../features/public/components/PublicLayout';
import { LegacyPublicRedirect } from './LegacyPublicRedirect';
import { LoginRoute } from './LoginRoute';
import { LandingPage } from '../features/public/pages/LandingPage';
import { PrivacyPolicyPage } from '../features/public/pages/PrivacyPolicyPage';
import { TermsAndConditionsPage } from '../features/public/pages/TermsAndConditionsPage';
import { PrivatePublicLayout } from '../features/public/components/PrivatePublicLayout';
import { PrivateLandingPage } from '../features/public/pages/PrivateLandingPage';
import { PrivatePrivacyPolicyPage } from '../features/public/pages/PrivatePrivacyPolicyPage';
import { PrivateTermsAndConditionsPage } from '../features/public/pages/PrivateTermsAndConditionsPage';
import { BtnRefresh } from '../components/ui/CrudButtons';
import { usePlatformConfig } from '../hooks/usePlatformConfig';

const RegistrationPage = lazy(() => import('../features/public/pages/RegistrationPage').then(module => ({ default: module.RegistrationPage })));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage').then(module => ({ default: module.LoginPage })));
const PrivateLoginPage = lazy(() => import('../features/auth/pages/PrivateLoginPage').then(module => ({ default: module.PrivateLoginPage })));
const PrivateRouter = lazy(() => import('./PrivateRouter'));
const StorefrontPage = lazy(() => import('../features/storefront/pages/StorefrontPage').then(module => ({ default: module.StorefrontPage })));
const EmailVerificationPage = lazy(() => import('../features/public/pages/EmailVerificationPage').then(module => ({ default: module.EmailVerificationPage })));
const PasswordResetPage = lazy(() => import('../features/public/pages/PasswordResetPage').then(module => ({ default: module.PasswordResetPage })));
const EmailChangePage = lazy(() => import('../features/public/pages/EmailChangePage').then(module => ({ default: module.EmailChangePage })));
const GoogleAuthResultPage = lazy(() => import('../features/auth/pages/GoogleAuthResultPage').then(module => ({ default: module.GoogleAuthResultPage })));
const AcceptInvitationPage = lazy(() => import('../features/public/pages/AcceptInvitationPage').then(module => ({ default: module.AcceptInvitationPage })));

export function AppRouter() {
  const { data: config, isPending, isError, refetch } = usePlatformConfig();
  if (isPending) return <div role="status" className="min-h-screen grid place-items-center">Cargando…</div>;
  if (isError || !config) return <div role="alert" className="min-h-screen grid place-content-center gap-4 text-center p-6"><p>No se pudo cargar la configuración del sitio.</p><BtnRefresh label="Reintentar" onClick={() => void refetch()} /></div>;
  const isPrivate = config.platformMode === 'PRIVATE';
  const isRegEnabled = !isPrivate && config.publicRegistrationEnabled;
  const PublicViewLayout = isPrivate ? PrivatePublicLayout : PublicLayout;

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="public-route-loading" role="status">Cargando…</div>}>
        <Routes>
          <Route element={<PublicViewLayout />}>
            <Route path="/" element={isPrivate || !config.publicLandingEnabled ? <PrivateLandingPage /> : <LandingPage />} />
            <Route path="/login" element={<LoginRoute>{isPrivate ? <PrivateLoginPage /> : <LoginPage />}</LoginRoute>} />
            <Route path="/register" element={isRegEnabled ? <RegistrationPage /> : <Navigate to="/login" replace />} />
            <Route path="/registro" element={<LegacyPublicRedirect to="/register" />} />
            <Route path="/change-email" element={<EmailChangePage />} />
            <Route path="/privacy-policy" element={isPrivate ? <PrivatePrivacyPolicyPage /> : <PrivacyPolicyPage />} />
            <Route path="/terms-and-conditions" element={isPrivate ? <PrivateTermsAndConditionsPage /> : <TermsAndConditionsPage />} />
            <Route path="/password-reset" element={<PasswordResetPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/auth/google/result" element={<GoogleAuthResultPage />} />
            <Route path="/accept-invitation" element={<AcceptInvitationPage />} />
            <Route path="/recuperar-contrasena" element={<LegacyPublicRedirect to="/password-reset" />} />
            <Route path="/verificar-email" element={<LegacyPublicRedirect to="/verify-email" />} />
            <Route path="/cambiar-email" element={<LegacyPublicRedirect to="/change-email" />} />
            <Route path="/auth/google/resultado" element={<LegacyPublicRedirect to="/auth/google/result" />} />
            <Route path="/invitacion" element={<LegacyPublicRedirect to="/accept-invitation" />} />
            <Route path="/aceptar-invitacion" element={<LegacyPublicRedirect to="/accept-invitation" />} />
          </Route>

          <Route path="/c/:slug" element={config.publicCatalogsEnabled ? <StorefrontPage /> :
            <main className="min-h-screen bg-base-200 grid place-content-center text-center p-6 gap-4"><h1 className="text-2xl font-bold">Catálogo no disponible</h1><p>Los catálogos públicos están desactivados en esta instalación.</p></main>} />

          {/* Aplicación Privada */}
          <Route path="/*" element={<PrivateRouter />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
