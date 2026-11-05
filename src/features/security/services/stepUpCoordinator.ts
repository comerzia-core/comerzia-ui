import type { MfaStepUpActionType } from '../types/mfa';
export interface StepUpIntent { action: MfaStepUpActionType; target: string; body: unknown }
let handler: ((intent: StepUpIntent) => Promise<string>) | null = null;
export function registerStepUpHandler(value: (intent: StepUpIntent) => Promise<string>) {
  handler = value;
  return () => { if (handler === value) handler = null; };
}
export function authorizeRejectedOperation(intent: StepUpIntent): Promise<string> {
  return handler ? handler(intent) : Promise.reject(new Error('step_up_not_available'));
}
export function isStepUpAction(value: unknown): value is MfaStepUpActionType {
  return typeof value === 'string' && ['ASSIGN_ROLES','UPDATE_USER_ACCESS','MANAGE_SAAS_TEAM',
    'DEACTIVATE_MFA','REGENERATE_RECOVERY_CODES','REPLACE_MFA','ADMIN_MFA_RECOVERY','UPDATE_SECURITY_SETTINGS'].includes(value);
}
