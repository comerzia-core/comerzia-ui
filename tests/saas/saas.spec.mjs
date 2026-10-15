import { test, expect } from '@playwright/test';
const company={id:'CompanyOpaque',legalName:'Empresa Ejemplo',commercialName:'Tienda ejemplo',taxId:'123456789',active:true,status:true,planName:'Inicial',subscriptionLabel:'Activa',saasCompanySettingsResponse:{timezone:'America/La_Paz',currencyCode:'BOB'},subscriptionHistory:[]};
const paged=rows=>({content:rows,totalElements:rows.length,totalPages:rows.length?1:0});
const access={operational:true,companyActive:true,planName:'Inicial',planTypeCode:702,validUntil:'2026-11-15T12:00:00Z',unlimited:false,branches:1,users:1,products:10,maxBranches:1,maxUsers:3,maxProducts:500};
const payment={id:'PaymentOpaque',companyName:'Tienda ejemplo',planName:'Inicial',planTypeCode:702,months:1,amount:49,currency:'BOB',reference:'BANCO-123',statusCode:1401,statusLabel:'Pendiente',pending:true,requestedAt:'2026-10-15T14:00:00Z',reviewedAt:null,message:null,receiptUrl:null};
const dictionaries={'plan-type':[{code:701,label:'Free'},{code:702,label:'Inicial'},{code:705,label:'Perpetuo'}],
 'saas-team-role':[{code:1301,label:'Administración'},{code:1302,label:'Finanzas'},{code:1303,label:'Soporte'}],
 'subscription-payment-status':[{code:1401,label:'Pendiente'},{code:1402,label:'Aprobado'}]};
async function prepare(page,role,path,extra=''){
 const calls=[],writes=[];
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),name=url.pathname.replace(/^.*?\/api/,'');calls.push(name);
  if(req.method()!=='GET'){
   writes.push({name,body:req.postData()});
   if(name.endsWith('/review'))return route.fulfill({json:{...payment,pending:false,statusLabel:'Aprobado'}});
   if(name==='/tenant/billing/requests')return route.fulfill({status:201,json:payment});
   if(name==='/saas/team')return route.fulfill({status:201,json:{username:'nuevo',temporaryPassword:'Temporal123!'}});
   return route.fulfill({json:{}});
  }
  let result;
  if(name.endsWith('/realtime/stream'))return route.fulfill({contentType:'text/event-stream',body:'event: connected\ndata: {}\n\n'});
  if(name==='/generic/dictionaries')result=dictionaries;
  else if(name==='/saas/directory'||name==='/saas/companies')result=paged([company]);
  else if(name==='/saas/companies/CompanyOpaque')result=company;
  else if(name.endsWith('/subscription-access')||name==='/tenant/billing/access')result=access;
  else if(name.endsWith('/branches'))result=paged([{id:'BranchOpaque',name:'Casa Matriz',address:'Centro',status:true}]);
  else if(name.endsWith('/users'))result=paged([{id:'TenantUserOpaque',fullName:'Dueña',username:'duena',roles:['Dueño'],statusLabel:'Activo',disabled:false,locked:true}]);
  else if(name==='/saas/team')result=paged([{id:'StaffOpaque',username:'soporte',fullName:'Agente soporte',disabled:false,locked:false,roles:['SAAS_SUPPORT'],roleCodes:[1303]}]);
  else if(name==='/saas/finances')result={collectedThisMonth:490,totalCollected:980,mrr:490,arr:5880,pendingReviews:1,currency:'BOB'};
  else if(name==='/saas/billing/settings')result={receiverName:'Comerzia',qrUrl:null,instructions:'Usa referencia',currency:'BOB'};
  else if(name.endsWith('/billing/requests'))result=paged([payment]);
  else if(name==='/tenant/subscriptions/plans')result=[{id:'InitialOpaque',code:702,name:'Inicial',monthlyPrice:49,baseMaxBranches:1,baseMaxUsers:3,baseMaxProducts:500}];
  else if(name==='/tenant/billing/quote')result={planTypeCode:702,planName:'Inicial',months:Number(url.searchParams.get('months')),amount:Number(url.searchParams.get('months'))*49,monthlyPrice:49,currency:'BOB',receiverName:'Comerzia',
   qrUrl:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=',instructions:'Usa referencia',validityRule:'Conserva los días vigentes al renovar.'};
  else if(name==='/saas/dashboard')result={companies:1,activeCompanies:1,suspendedCompanies:0,expiredSubscriptions:0};
  else return route.fulfill({status:404,json:{message:'Unexpected test route: '+name}});
  return route.fulfill({json:result});
 });
 await page.goto('/tests/saas/index.html?role='+role+'&path='+encodeURIComponent(path)+extra);
 return {calls,writes};
}
async function actions(page,info,text){
 const item=page.getByText(text,{exact:true}).filter({visible:true}).first();
 await item.click(info.project.name==='mobile'?{}:{button:'right'});
}
test('directorio y ficha conservan permisos, paginación y espacio móvil',async({page},info)=>{
 await prepare(page,'SAAS_OWNER','/saas/tenants');
 await expect(page.getByRole('heading',{name:'Empresas clientes'})).toBeVisible();
 await expect(page.getByText('CompanyOpaque',{exact:true})).toHaveCount(0);
 await actions(page,info,'Tienda ejemplo');await page.getByText('Ver empresa',{exact:true}).click();
 await expect(page.getByRole('heading',{name:'Tienda ejemplo'})).toBeVisible();
 await page.getByRole('button',{name:'Suscripción',exact:true}).click();
 await expect(page.getByText('1 / 3')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/saas-tenant-'+info.project.name+'.png'});
});
test('soporte no recibe controles de alta, planes o finanzas',async({page},info)=>{
 const {calls}=await prepare(page,'SAAS_SUPPORT','/saas/tenants');
 await expect(page.getByRole('heading',{name:'Empresas clientes'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Nueva empresa'})).toHaveCount(0);
 await actions(page,info,'Tienda ejemplo');await page.getByText('Ver empresa',{exact:true}).click();
 await expect(page.getByRole('button',{name:'Suspender empresa'})).toHaveCount(0);
 await page.getByRole('button',{name:'Suscripción',exact:true}).click();
 await expect(page.getByRole('button',{name:'Asignar o bonificar plan'})).toHaveCount(0);
 await page.evaluate(()=>window.saasTest.navigate('/saas/finances'));
 await expect(page.getByText(/Acceso denegado|No tienes permiso|No tiene permisos|Acceso Restringido/i).first()).toBeVisible();
 expect(calls).not.toContain('/saas/finances');
});
test('QR envía una solicitud solo al confirmar y evita endpoints anteriores',async({page})=>{
 const {writes}=await prepare(page,'OWNER','/organization/subscription');
 await page.getByRole('button',{name:'Pagar por QR'}).click();
 await expect(page.getByAltText('QR de pago a Comerzia')).toBeVisible();expect(writes).toHaveLength(0);
 await page.getByRole('textbox',{name:'Referencia de la transferencia'}).fill('BANCO-TEST');
 await page.getByRole('button',{name:'Enviar a revisión'}).click();
 await expect(page.getByAltText('QR de pago a Comerzia')).toHaveCount(0);
 expect(writes.filter(x=>x.name==='/tenant/billing/requests')).toHaveLength(1);
 expect(writes[0].body).toContain('expectedAmount');
 expect(writes.some(x=>x.name.includes('change-plan')||x.name.endsWith('/payments'))).toBe(false);
});
test('aprobar requiere confirmar la verificación bancaria',async({page},info)=>{
 const {writes}=await prepare(page,'SAAS_OWNER','/saas/finances');
 await actions(page,info,'Inicial');await page.getByText('Ver solicitud',{exact:true}).click();
 await page.getByRole('button',{name:'Aprobar',exact:true}).click();expect(writes).toHaveLength(0);
 await page.getByText('Verifiqué esta transferencia en la cuenta bancaria',{exact:true}).click();
 await page.getByRole('button',{name:'Aprobar',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(JSON.parse(writes[0].body)).toMatchObject({approved:true,bankVerified:true,receivedAmount:49});
 await expect(page.getByText('Pago de Tienda ejemplo',{exact:true})).toHaveCount(0);
});
test('alta del equipo presenta las credenciales tras guardar y sin IDs visibles',async({page})=>{
 const {writes}=await prepare(page,'SAAS_OWNER','/saas/team');
 await page.getByRole('button',{name:'Colaborador',exact:true}).click();
 await page.getByRole('textbox',{name:'Usuario',exact:true}).fill('nuevo');
 await page.getByRole('textbox',{name:'Nombres',exact:true}).fill('Ana');
 await page.getByRole('textbox',{name:'Apellidos',exact:true}).fill('Prueba');
 await page.getByRole('textbox',{name:'Correo',exact:true}).fill('ana@example.test');
 await page.getByText('Soporte',{exact:true}).filter({visible:true}).last().click();
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 await expect(page.getByText('Temporal123!',{exact:true})).toBeVisible();
 expect(writes).toHaveLength(1);expect(JSON.parse(writes[0].body)).toMatchObject({username:'nuevo',roleCodes:[1303]});
 await expect(page.getByText('StaffOpaque',{exact:true})).toHaveCount(0);
});
test('las cuentas de plataforma no montan el POS',async({page})=>{
 const {calls}=await prepare(page,'ROOT','/pos/terminal');
 await expect(page.getByRole('heading',{name:'Plataforma Comerzia'})).toBeVisible();
 await expect(page).toHaveURL(/\/saas\/dashboard/);
 expect(calls.some(name=>name.startsWith('/tenant/')&&!name.includes('realtime'))).toBe(false);
});
test('una suscripción vencida dirige a renovación sin montar el POS',async({page})=>{
 await prepare(page,'OWNER','/pos/terminal','&expired=true');
 await expect(page.getByRole('heading',{name:'Suscripción y pagos'})).toBeVisible();
 await expect(page).toHaveURL(/\/organization\/subscription/);
});
