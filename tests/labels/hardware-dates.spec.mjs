import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'UTC' });

test('hardware dates use the company timezone instead of the browser timezone', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    const body = path.includes('/devices/')
      ? { id: 'printer', name: 'PHILO', deviceType: 1111, calibrationSupported: false, loadedRollName: 'Compacto', lastCalibratedAt: '2026-10-02T14:14:15.060316Z' }
      : path.includes('/lookups/') ? { content: [], totalPages: 1 } : {};
    return route.fulfill({ json: body });
  });
  await page.goto('/tests/labels/index.html?view=calibration');
  const result = await page.evaluate(async () => {
    const { useAuthStore } = await import('/src/stores/useAuthStore.ts');
    const { formatDateForUser } = await import('/src/utils/date.ts');
    useAuthStore.setState(state => ({ userProfile: { ...state.userProfile, companySettings: { ...state.userProfile.companySettings, timezone: 'America/La_Paz' } } }));
    const value = '2026-10-02T14:14:15.060316Z';
    return { browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone, formatted: formatDateForUser(value) };
  });
  expect(result.browserTimezone).toBe('UTC');
  expect(result.formatted).toContain('10:14');
  await expect(page.getByText(`Última calibración: ${result.formatted}`)).toBeVisible();
});
