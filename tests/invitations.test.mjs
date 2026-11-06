import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isStepUpAction } from '../src/features/security/services/stepUpCoordinator.ts';
import { invitationLink, invitationErrorMessage, isVisibleInvitationRole } from '../src/features/employees/utils/invitationFlow.ts';
import { rememberGoogleRegistration, getGoogleRegistration, clearGoogleRegistration, rememberGoogleInvitation, getGoogleInvitation, clearGoogleInvitation } from '../src/features/auth/utils/oidcContinuation.ts';

test('production coordinator recognizes invitation step-up', () => {
  assert.equal(isStepUpAction('INVITE_EMPLOYEE'), true);
  assert.equal(isStepUpAction('UNKNOWN_ACTION'), false);
});
test('production display filter excludes platform roles; server remains authority', () => {
  assert.equal(isVisibleInvitationRole({ name: 'ROOT' }), false);
  assert.equal(isVisibleInvitationRole({ name: 'saas_admin' }), false);
  assert.equal(isVisibleInvitationRole({ name: 'OWNER' }), false);
  assert.equal(isVisibleInvitationRole({ name: 'OWNER' }, true), true);
  assert.equal(isVisibleInvitationRole({ name: 'ROOT' }, true), false);
  assert.equal(isVisibleInvitationRole({ name: 'SELLER' }), true);
});
test('production link parser removes credentials but preserves unrelated query', () => {
  assert.deepEqual(invitationLink('https://example.test/aceptar-invitacion?lang=es#token=fixture'), { token: 'fixture', cleanPath: '/aceptar-invitacion?lang=es' });
  assert.deepEqual(invitationLink('https://example.test/aceptar-invitacion?token=legacy&lang=es'), { token: 'legacy', cleanPath: '/aceptar-invitacion?lang=es' });
});
test('production error mapping has stable Spanish messages and safe unknown fallback', () => {
  assert.match(invitationErrorMessage('invitation_capacity_unavailable'), /propietario.*cupo/);
  assert.match(invitationErrorMessage('invitation_subscription_unavailable'), /suscripción activa/);
  assert.match(invitationErrorMessage('account_link_required'), /método habitual/);
  assert.equal(invitationErrorMessage('SQL secret detail'), invitationErrorMessage(undefined));
});
test('production continuations support SPA handoff and explicit cleanup', () => {
  rememberGoogleInvitation({ token: 'invitation-fixture', googleContinuationToken: 'google-fixture' });
  rememberGoogleRegistration({ registrationToken: 'registration-fixture', email: 'fixture@example.test' });
  assert.equal(getGoogleInvitation().token, 'invitation-fixture');
  assert.equal(getGoogleRegistration().registrationToken, 'registration-fixture');
  clearGoogleInvitation();
  clearGoogleRegistration();
  assert.equal(getGoogleInvitation(), null);
  assert.equal(getGoogleRegistration(), null);
});
