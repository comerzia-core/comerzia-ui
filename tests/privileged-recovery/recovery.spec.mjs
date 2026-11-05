import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
const request = { reference:'fictional-request', targetUsername:'fictional-root', identityCase:'IDENTITY-LAB-001', approvals:0, issued:false, expiresAt:'2030-01-01T00:00:00Z' };
async function setup(page, approvals = 0) {
  const state = { rows:approvals ? [{...request,approvals}] : [], mutations:0, grants:[] };
  await page.route('**/api/**',async route => {
    const req=route.request(); const path=new URL(req.url()).pathname;
    if(path.endsWith('/auth/csrf')) return route.fulfill({json:{token:'fictional-csrf'}});
    if(path.endsWith('/auth/mfa/step-up')) { state.grants.push(req.postDataJSON()); return route.fulfill({json:{grantToken:'fictional-step-up',expiresAt:'2030-01-01T00:00:00Z',action:'ADMIN_MFA_RECOVERY'}}); }
    if(path.endsWith('/recovery-readiness')) return route.fulfill({json:{webRehearsal:false,cliRehearsal:false,availableOfflineCodes:0,authorizedOperators:1,ownerApproved:false,blockers:['missing']}});
    if(path.endsWith('/privileged-recovery') && req.method()==='GET') return route.fulfill({json:state.rows});
    expect(req.headers()['x-mfa-step-up-grant']).toBe('fictional-step-up');state.mutations++;
    if(path.endsWith('/privileged-recovery')) { state.rows=[request];return route.fulfill({status:201,json:request}); }
    if(path.endsWith('/approve')) { expect(req.postDataJSON()).toEqual({identityVerified:true});state.rows=[{...request,approvals:2}];return route.fulfill({json:state.rows[0]}); }
    if(path.endsWith('/issue')) { state.rows=[];return route.fulfill({json:{token:'a'.repeat(64),expiresAt:new Date(Date.now()+600000).toISOString()}}); }
    return route.fulfill({status:404,json:{code:'not_found'}});
  });
  return state;
}
async function authorize(page) {
  await expect(page.getByRole('dialog',{name:'Confirmar recuperación administrativa de MFA'})).toBeVisible();
  await page.getByLabel('Código de la app autenticadora').fill('123456');
  await page.getByRole('button',{name:'Autorizar',exact:true}).click();
}
test('creation sends the signed operation only after step-up; absent evidence cannot be approved',async({page})=>{
  const state=await setup(page);await page.goto('/tests/privileged-recovery/index.html');
  await page.getByLabel('Usuario a recuperar').fill(request.targetUsername);
  await page.getByLabel('Expediente de identidad verificada').fill(request.identityCase);
  await page.getByRole('button',{name:'Crear solicitud',exact:true}).click();
  expect(state.mutations).toBe(0);await authorize(page);
  await expect(page.getByText(request.targetUsername,{exact:true})).toBeVisible();expect(state.mutations).toBe(1);
  const body=JSON.stringify({identityCase:request.identityCase,targetUsername:request.targetUsername});
  expect(state.grants[0].targetId).toBe('POST:/saas/security/privileged-recovery#'+createHash('sha256').update(body+'\n{}').digest('hex'));
  await expect(page.getByRole('button',{name:'Aprobar evidencias de recuperación'})).toBeDisabled();
});
test('identity attestation and independent approval precede one-time authority display',async({page})=>{
  const state=await setup(page,1);await page.goto('/tests/privileged-recovery/index.html');
  await expect(page.getByRole('button',{name:'Aprobar identidad'})).toBeDisabled();
  await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Aprobar identidad'}).click();await authorize(page);
  await expect(page.getByText('2 de 2 aprobaciones',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Emitir autorización'}).click();await authorize(page);
  await expect(page.getByRole('dialog',{name:'Autorización temporal'})).toBeVisible();
  await expect(page.getByLabel('Autorización',{exact:true})).toHaveValue('a'.repeat(64));
  const persisted=await page.evaluate(()=>JSON.stringify({local:localStorage,session:sessionStorage}));expect(persisted).not.toContain('a'.repeat(64));
  await page.getByRole('button',{name:'Cerrar ventana'}).click();await expect(page.getByLabel('Autorización',{exact:true})).toHaveCount(0);
  expect(state.mutations).toBe(2);
});
test('emergency login keeps business credentials absent while reenrollment is incomplete',async({page})=>{
  const calls=[];
  await page.route('**/api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;calls.push(path);
    if(path.endsWith('/auth/csrf')) return route.fulfill({json:{token:'fictional-csrf'}});
    if(path.endsWith('/emergency/consume')) {
      expect(req.postDataJSON()).toEqual({authorization:'b'.repeat(64)});expect(req.headers()['x-csrf-token']).toBe('fictional-csrf');
      return route.fulfill({json:{token:null,sessionId:'fictional-restricted',authenticationState:'RECOVERY_RESTRICTED',mfaType:'RECOVERY_RESTRICTED'}});
    }
    if(path.endsWith('/enroll/start')) return route.fulfill({json:{secret:'JBSWY3DPEHPK3PXP',otpauthUri:'otpauth://totp/Comerzia:fictional?secret=JBSWY3DPEHPK3PXP&issuer=Comerzia',expiresAt:'2030-01-01T00:00:00Z',digits:6,period:30}});
    return route.fulfill({status:404,json:{code:'not_found'}});
  });
  await page.goto('/tests/privileged-recovery/index.html?login');
  await page.getByRole('button',{name:'Tengo una autorización de recuperación'}).click();
  await page.getByLabel('Autorización temporal',{exact:true}).fill('b'.repeat(64));
  await page.getByRole('button',{name:'Verificar código de respaldo',exact:true}).click();
  await expect(page.getByLabel('Código de 6 dígitos mostrado en tu app')).toBeVisible();
  expect(calls.some(path=>path.includes('/tenant/') || path.includes('/saas/'))).toBe(false);
  expect(await page.evaluate(()=>JSON.stringify({local:localStorage,session:sessionStorage}))).not.toContain('b'.repeat(64));
});
