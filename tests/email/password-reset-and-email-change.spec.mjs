import { test, expect } from '@playwright/test';

const testToken = 'a'.repeat(64);
const otherToken = 'b'.repeat(64);

test.describe('Ciclo 04: Recuperación de Contraseña y Cambio Seguro de Email', () => {
  test('network failure does not claim accepted or delivered recovery instructions', async ({ page }) => {
    await page.route('**/api/public/password-reset/request', route => route.abort());
    await page.goto('/password-reset');
    await page.locator('#reset-email').fill('person@example.test');
    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click();
    await expect(page.getByText('Sin conexión. Intenta nuevamente.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Solicitud recibida' })).toHaveCount(0);
  });

  test.beforeEach(async ({ page }) => {
    // Interceptar llamadas automáticas de sesión anónima de AuthStage
    await page.route('**/api/auth/csrf', async route => {
      await route.fulfill({ status: 200, json: { token: 'csrf-test' } });
    });
    await page.route('**/api/auth/refresh', async route => {
      await route.fulfill({ status: 401, json: { code: 'session_expired' } });
    });
  });

  test('login page contains working forgot password link', async ({ page }) => {
    await page.goto('/login');
    const forgotLink = page.getByRole('link', { name: '¿Olvidaste tu contraseña?' });
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/password-reset$/);
    await expect(page.getByRole('heading', { name: '¿Olvidaste tu contraseña?' })).toBeVisible();
  });

  for (const mobile of [false, true]) {
    test(`password reset request displays generic confirmation (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 });
      let requestPayload = null;

      await page.route('**/api/public/password-reset/request', async route => {
        requestPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          json: { success: true, message: 'Si la dirección ingresada corresponde a una cuenta elegible, recibirás las instrucciones en breve.' }
        });
      });

      await page.goto('/password-reset');
      await page.locator('#reset-email').fill('usuario@empresa.com');
      await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click();

      // Muestra confirmación genérica anti-enumeración
      await expect(page.getByRole('heading', { name: 'Solicitud recibida' })).toBeVisible();
      await expect(page.getByText('Si la dirección ingresada corresponde a una cuenta elegible')).toBeVisible();

      expect(requestPayload).toEqual({ email: 'usuario@empresa.com' });

      // Verificación de ancho móvil (no desborda pantalla)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test('password reset request handles rate limiting (429) gracefully', async ({ page }) => {
    await page.route('**/api/public/password-reset/request', async route => {
      await route.fulfill({
        status: 429,
        json: { code: 'too_many_requests', message: 'Demasiadas solicitudes.' }
      });
    });

    await page.goto('/password-reset');
    await page.locator('#reset-email').fill('spam@empresa.com');
    await page.getByRole('button', { name: 'Enviar enlace de recuperación' }).click();

    await expect(page.getByText('Demasiadas solicitudes. Por favor espera antes de intentar nuevamente.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Solicitud recibida' })).toHaveCount(0);
  });

  for (const mobile of [false, true]) {
    test(`password reset link scrubs token, inspects, and confirms with new password (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 });
      let confirmPayload = null;

      await page.route('**/api/public/password-reset/inspect', async route => {
        const body = route.request().postDataJSON();
        expect(body.token).toBe(testToken);
        await route.fulfill({
          status: 200,
          json: { valid: true, status: 'PENDING', maskedEmail: 'u***@comerzia.com', message: 'Enlace válido.' }
        });
      });

      await page.route('**/api/public/password-reset/confirm', async route => {
        confirmPayload = route.request().postDataJSON();
        await route.fulfill({
          status: 200,
          json: { success: true, message: 'Tu contraseña ha sido restablecida exitosamente.' }
        });
      });

      await page.goto(`/password-reset#token=${testToken}`);

      // URL scrubbed inmediatamente
      await expect(page).toHaveURL(/\/password-reset$/);

      // Verificación de memoria limpia (el token no viaja a storage)
      const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
      expect(storage).not.toContain(testToken);

      // Inspección muestra email enmascarado
      await expect(page.getByText('u***@comerzia.com')).toBeVisible();

      // Completar formulario con nueva contraseña
      await page.locator('#reset-new-password').fill('NuevaPasswordValida#2026!');
      await page.locator('#reset-confirm-password').fill('NuevaPasswordValida#2026!');

      await page.getByRole('button', { name: 'Restablecer contraseña' }).click();

      // Éxito y confirmación visible
      await expect(page.getByRole('heading', { name: '¡Contraseña Actualizada!' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Iniciar Sesión con Nueva Contraseña' })).toBeVisible();

      expect(confirmPayload).toEqual({
        token: testToken,
        newPassword: 'NuevaPasswordValida#2026!'
      });
    });
  }

  test('password reset link handles expired or invalid token gracefully', async ({ page }) => {
    await page.route('**/api/public/password-reset/inspect', async route => {
      await route.fulfill({
        status: 200,
        json: { valid: false, status: 'EXPIRED', message: 'El enlace ha expirado.' }
      });
    });

    await page.goto(`/password-reset#token=${testToken}`);
    await expect(page.getByRole('heading', { name: 'Enlace No Válido o Expirado' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Solicitar un nuevo enlace' })).toBeVisible();
  });

  for (const mobile of [false, true]) {
    test(`email change link scrubs token, inspects, and confirms successfully (${mobile ? 'mobile' : 'desktop'})`, async ({ page }) => {
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 });
      let confirmCalled = false;

      await page.route('**/api/public/email-change/inspect', async route => {
        const body = route.request().postDataJSON();
        expect(body.token).toBe(otherToken);
        await route.fulfill({
          status: 200,
          json: { valid: true, status: 'PENDING', maskedEmail: 'n***@comerzia.com', message: 'Desafío pendiente.' }
        });
      });

      await page.route('**/api/profile/email-change/confirm', async route => {
        confirmCalled = true;
        await route.fulfill({
          status: 200,
          json: { success: true, message: 'Tu correo ha sido actualizado.' }
        });
      });

      await page.goto(`/change-email#token=${otherToken}`);

      // URL scrubbed
      await expect(page).toHaveURL(/\/change-email$/);

      // Verificación de email enmascarado
      await expect(page.getByText('n***@comerzia.com')).toBeVisible();

      // Botón explícito de confirmación
      const confirmButton = page.getByRole('button', { name: 'Confirmar mi nuevo correo electrónico' });
      await expect(confirmButton).toBeVisible();
      await confirmButton.click();

      // Éxito visible
      await expect(page.getByRole('heading', { name: '¡Correo Actualizado!' })).toBeVisible();
      expect(confirmCalled).toBe(true);

      // No se filtran tokens en storage
      const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
      expect(storage).not.toContain(otherToken);
    });
  }

  test('email change link detects and alerts session mismatch (session isolation)', async ({ page }) => {
    await page.route('**/api/public/email-change/inspect', async route => {
      await route.fulfill({
        status: 200,
        json: { valid: true, status: 'PENDING', maskedEmail: 'victima@comerzia.com' }
      });
    });

    await page.route('**/api/profile/email-change/confirm', async route => {
      await route.fulfill({
        status: 400,
        json: {
          code: 'email_change_session_mismatch',
          message: 'The current session does not match the account requesting the email change.'
        }
      });
    });

    await page.goto(`/change-email#token=${otherToken}`);
    await page.getByRole('button', { name: 'Confirmar mi nuevo correo electrónico' }).click();

    await expect(page.getByRole('heading', { name: 'Aislamiento de Sesión' })).toBeVisible();
    await expect(page.getByText('Cierra la otra sesión antes de confirmar este cambio.')).toBeVisible();
  });

});
