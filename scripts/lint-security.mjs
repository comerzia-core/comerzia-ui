import { ESLint } from 'eslint';
import { readFileSync, writeFileSync } from 'node:fs';
const eslint = new ESLint();
const results = await eslint.lintFiles(['src', 'vite.config.ts']);
const counts = {};
const strictPaths = new Set([
  'src/features/security/hooks/useEmailVerification.ts',
  'src/features/security/hooks/useUserNotifications.ts',
  'src/features/security/services/emailVerificationService.ts',
  'src/features/security/hooks/usePublicEmailVerification.ts',
  'src/features/security/components/EmailVerificationPanel.tsx',
  'src/features/security/services/notificationService.ts',
  'src/components/layout/NotificationBell.tsx',
  'src/features/public/pages/EmailVerificationPage.tsx',
  'src/lib/axios.ts', 'src/stores/useAuthStore.ts', 'src/routes/ProtectedRoute.tsx',
  'src/features/auth/services/browserSessionService.ts', 'src/features/auth/components/BrowserSessionRuntime.tsx',
  'src/features/security/services/browserSessions.ts', 'src/features/security/hooks/useBrowserSessions.ts',
  'src/features/security/components/BrowserSessionsPanel.tsx',
  'src/features/auth/utils/passwordPolicy.ts', 'src/features/auth/hooks/useLogin.ts',
  'src/features/auth/components/PasswordChecklist.tsx', 'src/features/public/hooks/useRegistration.ts',
  'src/features/public/pages/RegistrationPage.tsx', 'src/features/security/pages/ProfilePage.tsx',
  'src/features/security/services/userService.ts',
  'src/features/security/components/users/UserRolesModal.tsx',
  'src/features/security/components/users/DemotionBranchModal.tsx', 'vite.config.ts',
]);
const strictFailures = [];
for (const result of results) {
  const path = result.filePath.replaceAll('\\', '/').replace(process.cwd().replaceAll('\\', '/') + '/', '');
  for (const message of result.messages.filter(message => message.severity === 2)) {
    if (strictPaths.has(path)) strictFailures.push(`${path}:${message.line}: ${message.ruleId}`);
    const key = `${path}:${message.ruleId}`;
    counts[key] = (counts[key] || 0) + 1;
  }
}
if (process.argv.includes('--record-baseline')) {
  writeFileSync('scripts/lint-baseline.json', JSON.stringify(counts, null, 2) + '\n');
  console.log(`Recorded ${Object.values(counts).reduce((a, b) => a + b, 0)} existing lint errors; review debt before using baseline.`);
} else {
  const baseline = JSON.parse(readFileSync('scripts/lint-baseline.json', 'utf8'));
  const failures = Object.entries(counts).filter(([key, count]) => count > (baseline[key] || 0));
  for (const [key, count] of failures) console.error(`${key}: ${count} errors (baseline ${baseline[key] || 0})`);
  for (const failure of strictFailures) console.error(failure);
  console.log(`Existing lint errors: ${Object.values(counts).reduce((a, b) => a + b, 0)}; increased groups: ${failures.length}`);
  console.log(`Strict security-file errors: ${strictFailures.length}`);
  process.exitCode = failures.length || strictFailures.length ? 1 : 0;
}
