import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Pruebas unitarias de las reglas de enrutamiento y políticas de plataforma
 * para los modos VPS Privado (Corporativo) vs VPS Público (SaaS Comercial).
 */

function resolvePublicRoute(path, config) {
  const isPrivate = config.platformMode === 'PRIVATE' || !config.publicLandingEnabled;
  const isRegEnabled = Boolean(config.publicRegistrationEnabled);
  const isCatalogEnabled = Boolean(config.publicCatalogsEnabled);

  if (isPrivate) {
    if (path === '/' || path === '/register' || path === '/registro') {
      return { action: 'REDIRECT', target: '/login' };
    }
    if (path === '/login') {
      return { action: 'RENDER', component: 'PrivateLoginPage' };
    }
  } else {
    if (path === '/') {
      return { action: 'RENDER', component: 'LandingPage' };
    }
    if (path === '/login') {
      return { action: 'RENDER', component: 'LoginPage' };
    }
    if (path === '/register' || path === '/registro') {
      if (!isRegEnabled) {
        return { action: 'REDIRECT', target: '/login' };
      }
      return { action: 'RENDER', component: 'RegistrationPage' };
    }
  }

  if (path.startsWith('/c/')) {
    if (!isCatalogEnabled) {
      return { action: 'REDIRECT', target: '/login' };
    }
    return { action: 'RENDER', component: 'StorefrontPage' };
  }

  return { action: 'RENDER', component: 'SharedPublicPage' };
}

test('1. VPS PRIVADO: la raíz "/" redirige automáticamente a "/login"', () => {
  const privateConfig = {
    platformMode: 'PRIVATE',
    publicRegistrationEnabled: false,
    publicLandingEnabled: false,
    publicCatalogsEnabled: false,
    brandName: 'Empresa Privada ERP'
  };

  const routeRoot = resolvePublicRoute('/', privateConfig);
  assert.equal(routeRoot.action, 'REDIRECT');
  assert.equal(routeRoot.target, '/login');

  const routeLogin = resolvePublicRoute('/login', privateConfig);
  assert.equal(routeLogin.action, 'RENDER');
  assert.equal(routeLogin.component, 'PrivateLoginPage');
});

test('2. VPS PRIVADO: las rutas de auto-registro redirigen a "/login"', () => {
  const privateConfig = {
    platformMode: 'PRIVATE',
    publicRegistrationEnabled: false,
    publicLandingEnabled: false,
    publicCatalogsEnabled: false
  };

  const routeReg = resolvePublicRoute('/register', privateConfig);
  assert.equal(routeReg.action, 'REDIRECT');
  assert.equal(routeReg.target, '/login');

  const routeRegLegacy = resolvePublicRoute('/registro', privateConfig);
  assert.equal(routeRegLegacy.action, 'REDIRECT');
  assert.equal(routeRegLegacy.target, '/login');
});

test('3. VPS PRIVADO: los catálogos públicos están inhabilitados y redirigen', () => {
  const privateConfig = {
    platformMode: 'PRIVATE',
    publicRegistrationEnabled: false,
    publicLandingEnabled: false,
    publicCatalogsEnabled: false
  };

  const routeStorefront = resolvePublicRoute('/c/mi-tienda', privateConfig);
  assert.equal(routeStorefront.action, 'REDIRECT');
  assert.equal(routeStorefront.target, '/login');
});

test('4. VPS PÚBLICO: la raíz "/" renderiza la Landing comercial de Comerzia', () => {
  const publicConfig = {
    platformMode: 'PUBLIC',
    publicRegistrationEnabled: true,
    publicLandingEnabled: true,
    publicCatalogsEnabled: false
  };

  const routeRoot = resolvePublicRoute('/', publicConfig);
  assert.equal(routeRoot.action, 'RENDER');
  assert.equal(routeRoot.component, 'LandingPage');

  const routeLogin = resolvePublicRoute('/login', publicConfig);
  assert.equal(routeLogin.action, 'RENDER');
  assert.equal(routeLogin.component, 'LoginPage');

  const routeReg = resolvePublicRoute('/register', publicConfig);
  assert.equal(routeReg.action, 'RENDER');
  assert.equal(routeReg.component, 'RegistrationPage');
});

test('5. Catálogos Públicos cuando SAAS Owner los habilita', () => {
  const enabledConfig = {
    platformMode: 'PUBLIC',
    publicRegistrationEnabled: true,
    publicLandingEnabled: true,
    publicCatalogsEnabled: true
  };

  const routeStorefront = resolvePublicRoute('/c/catalogo-oficial', enabledConfig);
  assert.equal(routeStorefront.action, 'RENDER');
  assert.equal(routeStorefront.component, 'StorefrontPage');
});

