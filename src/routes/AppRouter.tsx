import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { PublicLayout } from '../features/public/components/PublicLayout';
import { LegacyPublicRedirect } from './LegacyPublicRedirect';
import { LoginRoute } from './LoginRoute';
import { LandingPage } from '../features/public/pages/LandingPage';
import { PrivacyPolicyPage } from '../features/public/pages/PrivacyPolicyPage';
import { TermsAndConditionsPage } from '../features/public/pages/TermsAndConditionsPage';
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
  const { data: config } = usePlatformConfig();

  // En caso de carga o modo privado, se asume privado por defecto para máxima seguridad
  const isPrivate = config ? (config.platformMode === 'PRIVATE' || !config.publicLandingEnabled) : true;
  const isRegEnabled = config ? config.publicRegistrationEnabled : false;
  const isCatalogEnabled = config ? config.publicCatalogsEnabled : false;

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="public-route-loading" role="status">Cargando…</div>}>
        <Routes>
          {/* Rutas según el modo del servidor */}
          {isPrivate ? (
            <>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginRoute><PrivateLoginPage /></LoginRoute>} />
              <Route path="/register" element={<Navigate to="/login" replace />} />
              <Route path="/registro" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginRoute><LoginPage /></LoginRoute>} />
              <Route path="/register" element={isRegEnabled ? <RegistrationPage /> : <Navigate to="/login" replace />} />
              <Route path="/registro" element={<LegacyPublicRedirect to="/register" />} />
            </Route>
          )}

          <Route path="/change-email" element={<EmailChangePage />} />

          {/* Rutas públicas compartidas de identidad, recuperación y legal */}
          <Route element={<PublicLayout />}>
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
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

          {/* Catálogos Públicos (Storefront): Inhabilitado hasta activación por SAAS Owner */}
          {isCatalogEnabled ? (
            <Route path="/c/:slug" element={<StorefrontPage />} />
          ) : (
            <Route path="/c/:slug" element={<Navigate to="/login" replace />} />
          )}

          {/* Aplicación Privada */}
          <Route path="/*" element={<PrivateRouter />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
