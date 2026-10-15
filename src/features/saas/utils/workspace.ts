import type { UserProfile } from '../../auth/types';

const platformRoles = new Set(['ROOT', 'SAAS_OWNER', 'SAAS_ADMIN', 'SAAS_FINANCE', 'SAAS_SUPPORT']);
export const isPlatformUser = (profile: UserProfile | null) => profile?.roles.some(role => platformRoles.has(role)) ?? false;
export const workspaceHome = (profile: UserProfile | null) => isPlatformUser(profile) ? '/saas/dashboard' : '/dashboard';
