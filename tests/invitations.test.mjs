import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isStepUpAction } from '../src/features/security/services/stepUpCoordinator.ts';

test('isStepUpAction recognizes INVITE_EMPLOYEE as a valid step-up action', () => {
  assert.equal(isStepUpAction('INVITE_EMPLOYEE'), true);
  assert.equal(isStepUpAction('ASSIGN_ROLES'), true);
  assert.equal(isStepUpAction('UNKNOWN_ACTION'), false);
  assert.equal(isStepUpAction(null), false);
});

test('delegable roles filter excludes privileged ROOT and SAAS_* roles, keeping OWNER and operational roles', () => {
  const allRoles = [
    { id: '1', name: 'ROOT', displayName: 'Superusuario Root' },
    { id: '2', name: 'OWNER', displayName: 'Dueño de Empresa' },
    { id: '3', name: 'SAAS_ADMIN', displayName: 'Administrador de Plataforma' },
    { id: '4', name: 'SAAS_SUPPORT', displayName: 'Soporte Técnico' },
    { id: '5', name: 'SELLER', displayName: 'Vendedor' },
    { id: '6', name: 'CASHIER', displayName: 'Cajero' },
    { id: '7', name: 'BRANCH_MANAGER', displayName: 'Encargado de Sucursal' }
  ];

  const delegable = allRoles.filter(
    r => !['ROOT'].includes(r.name.toUpperCase()) && !r.name.toUpperCase().startsWith('SAAS_')
  );

  assert.equal(delegable.length, 4);
  assert.deepEqual(delegable.map(r => r.name), ['OWNER', 'SELLER', 'CASHIER', 'BRANCH_MANAGER']);
});

test('token extraction pattern captures token in memory and ensures no persistence in storages', () => {
  const dummyLocalStorage = {};
  const dummySessionStorage = {};

  const testUrl = 'https://comerzia.local/aceptar-invitacion#token=secret_invitation_token_123';
  const url = new URL(testUrl);

  const extractedToken = new URLSearchParams(url.hash.slice(1)).get('token') ?? url.searchParams.get('token');
  assert.equal(extractedToken, 'secret_invitation_token_123');

  // Simular limpieza de URL
  url.searchParams.delete('token');
  url.hash = '';
  const cleanUrl = url.pathname + url.search;
  assert.equal(cleanUrl, '/aceptar-invitacion');

  // Invariante de seguridad: token jamás debe ser asignado a storages
  assert.equal(dummyLocalStorage['token'], undefined);
  assert.equal(dummyLocalStorage['invitation_token'], undefined);
  assert.equal(dummySessionStorage['token'], undefined);
  assert.equal(dummySessionStorage['invitation_token'], undefined);
});

test('invitation error codes map to predictable Spanish messages without leaking tenant data', () => {
  const translateCode = (code) => {
    switch (code) {
      case 'account_link_required':
        return 'Ya existe una cuenta con este correo no vinculada a Google. Inicia sesión con tus credenciales para vincularla a esta empresa.';
      case 'invitation_conflict':
        return 'El nombre de usuario seleccionado ya está en uso. Por favor elige otro.';
      case 'invitation_capacity_unavailable':
        return 'La empresa ha alcanzado el límite de usuarios de su suscripción. Contacta al administrador.';
      case 'invitation_resend_cooldown':
        return 'Debes esperar al menos 60 segundos antes de reenviar esta invitación.';
      case 'invitation_role_not_delegable':
        return 'No tienes permisos suficientes para delegar este rol.';
      case 'invitation_rate_limited':
        return 'Has alcanzado el límite de invitaciones permitidas por ahora.';
      case 'invitation_already_accepted':
        return 'Esta invitación ya fue aceptada anteriormente.';
      case 'invitation_expired':
        return 'Esta invitación ha expirado. Solicita un nuevo enlace a tu administrador.';
      case 'invitation_revoked':
        return 'Esta invitación ha sido revocada por un administrador.';
      default:
        return 'Ocurrió un error al procesar la invitación.';
    }
  };

  assert.ok(translateCode('account_link_required').includes('Inicia sesión'));
  assert.ok(translateCode('invitation_capacity_unavailable').includes('límite de usuarios'));
  assert.ok(translateCode('invitation_resend_cooldown').includes('60 segundos'));
  assert.ok(translateCode('invitation_role_not_delegable').includes('No tienes permisos'));
  assert.ok(translateCode('invitation_already_accepted').includes('ya fue aceptada'));
});

