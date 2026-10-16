import { test, expect } from '@playwright/test';
const company={id:'CompanyOpaque',legalName:'Empresa Ejemplo',commercialName:'Tienda ejemplo',taxId:'123456789',active:true,status:true,planName:'Inicial',subscriptionLabel:'Activa',saasCompanySettingsResponse:{timezone:'America/La_Paz',currencyCode:'BOB'},subscriptionHistory:[]};
const paged=rows=>({content:rows,totalElements:rows.length,totalPages:rows.length?1:0});
const access={operational:true,companyActive:true,planName:'Inicial',planTypeCode:702,validUntil:'2026-11-15T12:00:00Z',unlimited:false,branches:1,users:1,products:10,maxBranches:1,maxUsers:3,maxProducts:500};
const payment={id:'PaymentOpaque',companyName:'Tienda ejemplo',planName:'Inicial',planTypeCode:702,months:1,amount:49,currency:'BOB',reference:'BANCO-123',statusCode:1401,statusLabel:'Pendiente',pending:true,requestedAt:'2026-10-15T14:00:00Z',reviewedAt:null,message:null,receiptUrl:null};
const dictionaries={'document-type':[{code:101,label:'Cédula de Identidad'}],'document-extension':[{code:201,label:'La Paz'}],
 'plan-type':[{code:701,label:'Free'},{code:702,label:'Inicial'},{code:705,label:'Perpetuo'}],
 'saas-team-role':[{code:1301,label:'Administración'},{code:1302,label:'Finanzas'},{code:1303,label:'Soporte'}],
 'subscription-payment-status':[{code:1401,label:'Pendiente'},{code:1402,label:'Aprobado'}]};
async function prepare(page,role,path,extra=''){
 const calls=[],writes=[],requests=[];
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),name=url.pathname.replace(/^.*?\/api/,'');calls.push(name);
  requests.push({name,search:url.search});
  if(req.method()!=='GET'){
   writes.push({name,body:req.postData()});
   if(name.endsWith('/review'))return route.fulfill({json:{...payment,pending:false,statusLabel:'Aprobado'}});
   if(name==='/tenant/billing/requests')return route.fulfill({status:201,json:payment});
   if(name==='/saas/team/accounts')return route.fulfill({status:201,json:{username:'nuevo',temporaryPassword:'Temporal123!'}});
   if(name==='/saas/companies')return route.fulfill({status:201,json:{companyId:'NewOpaque',businessName:'Tienda nueva',ownerUsername:'nuevo.owner',temporaryPassword:'Temporal456!'}});
   return route.fulfill({json:{}});
  }
  let result;
  if(name.endsWith('/realtime/stream'))return route.fulfill({contentType:'text/event-stream',body:'event: connected\ndata: {}\n\n'});
  if(name==='/generic/dictionaries')result=dictionaries;
  else if(name==='/saas/directory'||name==='/saas/companies')result=paged([company]);
  else if(name==='/saas/companies/CompanyOpaque')result=company;
  else if(name==='/saas/plans')result=[{code:701,name:'Free',monthlyPrice:0,maxBranches:1,maxUsers:1,maxProducts:50,requiresExpiry:false,unlimited:false},{code:702,name:'Inicial',monthlyPrice:49,maxBranches:1,maxUsers:3,maxProducts:500,requiresExpiry:true,unlimited:false}];
  else if(name==='/saas/cities')result=paged([{id:'CityOpaque',name:'La Paz',country:'Bolivia'}]);
  else if(name==='/saas/audit')result=paged([{id:'AuditOpaque',occurredAt:'2026-10-15T12:00:00Z',companyName:'Tienda ejemplo',username:'ana',module:'SAAS',action:'UPDATE',entity:'Tenant',before:'{"status":true}',after:'{"status":false}'}]);
  else if(name.endsWith('/subscription-access')||name==='/tenant/billing/access')result=access;
  else if(name.endsWith('/branches'))result=paged([{id:'BranchOpaque',name:'Casa Matriz',address:'Centro',status:true}]);
  else if(name.endsWith('/users'))result=paged([{id:'TenantUserOpaque',fullName:'Dueña',username:'duena',roles:['Dueño'],statusLabel:'Activo',disabled:false,locked:true}]);
  else if(name==='/saas/team/members')result=paged([{id:'MemberOpaque',fullName:'Ana Personal',email:'ana@example.test',jobTitle:'Soporte',active:true}]);
  else if(name==='/saas/support/accounts')result=paged([{id:'AccountOpaque',companyId:'CompanyOpaque',companyName:'Tienda ejemplo',fullName:'Ana Caja',username:'acaja',email:'ana@example.test',locked:true,disabled:false,requiresPasswordChange:false}]);
  else if(name==='/saas/support/audit-log')result=paged([{id:'LogOpaque',occurredAt:'2026-10-15T12:00:00Z',operator:'soporte',companyName:'Tienda ejemplo',target:'acaja',action:'UNLOCK',reason:'Solicitud autorizada'}]);
  else if(name==='/saas/billing/history')result=paged([{id:'PaymentOpaque',companyName:'Tienda ejemplo',planName:'Inicial',amount:49,statusLabel:'Aprobado',reference:'BANCO-123',operator:'finanzas',occurredAt:'2026-10-15T12:00:00Z'}]);
  else if(name==='/saas/dashboard/financial')result={mrr:49,arr:588,arpu:49,collectedThisMonth:49,collectedLastMonth:0,observedLifetimeValue:49,activePaidTenants:1,pendingReviews:1,pendingAmount:49,expiredTenants:0,churnRatePercentage:null,historyCoverageFrom:null,currency:'BOB',revenueHistory:[{yearMonth:'2026-10',amount:49,paymentsCount:1}],planDistribution:[{code:702,name:'Inicial',count:1,mrr:49}],expiringTenants:[]};
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
 await page.goto('/tests/saas/index.html?role='+role+'&path='+encodeURIComponent(path)+extra,{waitUntil:'domcontentloaded'});
 return {calls,writes,requests};
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
 const {writes,calls}=await prepare(page,'SAAS_OWNER','/saas/finances');
 await actions(page,info,'Inicial');await page.getByText('Ver solicitud',{exact:true}).click();
 await page.getByRole('button',{name:'Aprobar',exact:true}).click();expect(writes).toHaveLength(0);
 await page.getByText('Verifiqué esta transferencia en la cuenta bancaria',{exact:true}).click();
 await page.getByRole('button',{name:'Aprobar',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(JSON.parse(writes[0].body)).toMatchObject({approved:true,bankVerified:true,receivedAmount:49});
 await expect(page.getByText('Pago de Tienda ejemplo',{exact:true})).toHaveCount(0);
 expect(calls).not.toContain('/saas/finances');
 expect(calls).not.toContain('/saas/billing/settings');
});
test('alta del equipo presenta las credenciales tras guardar y sin IDs visibles',async({page})=>{
 const {writes}=await prepare(page,'SAAS_OWNER','/saas/team');
 await page.getByRole('button',{name:'Crear acceso',exact:true}).click();
 await page.getByRole('combobox',{name:'Colaborador',exact:true}).selectOption('MemberOpaque');
 await page.getByRole('textbox',{name:'Usuario (opcional)',exact:true}).fill('nuevo');
 await page.getByText('Soporte',{exact:true}).filter({visible:true}).last().click();
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 await expect(page.getByText('Temporal123!',{exact:true})).toBeVisible();
 expect(writes).toHaveLength(1);expect(JSON.parse(writes[0].body)).toMatchObject({username:'nuevo',memberId:'MemberOpaque',roleCodes:[1303]});
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

test('alta Free envía el contrato acordado sin una fecha de vencimiento',async({page})=>{
 const {writes}=await prepare(page,'SAAS_OWNER','/saas/tenants');
 await page.getByRole('button',{name:'Nueva empresa',exact:true}).click();
 await page.getByRole('textbox',{name:'Razón Social',exact:true}).fill('Empresa nueva');
 await page.getByRole('textbox',{name:'Nombre Comercial',exact:true}).fill('Tienda nueva');
 await page.getByRole('textbox',{name:'NIT / Tax ID',exact:true}).fill('99887766');
 await page.getByRole('dialog').getByRole('button',{name:'Siguiente',exact:true}).click();
 await page.getByRole('textbox',{name:'Nombres',exact:true}).fill('Ana');
 await page.getByRole('textbox',{name:'Apellido Paterno',exact:true}).fill('Prueba');
 await page.getByRole('combobox',{name:'Tipo de Documento',exact:true}).selectOption('101');
 await page.getByRole('textbox',{name:'Número de Documento',exact:true}).fill('77889900');
 await page.getByRole('textbox',{name:'Correo Electrónico',exact:true}).fill('ana@example.test');
 await page.getByRole('textbox',{name:'Teléfono',exact:true}).fill('70000000');
 await page.getByRole('dialog').getByRole('button',{name:'Siguiente',exact:true}).click();
 await page.getByRole('combobox',{name:'Plan Inicial',exact:true}).selectOption('701');
 await expect(page.getByText('Este plan no tiene vencimiento.')).toBeVisible();
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 await expect(page.getByText('Temporal456!',{exact:true})).toBeVisible();
 const submitted=JSON.parse(writes.find(write=>write.name==='/saas/companies').body);
 expect(submitted.subscription).toEqual({planTypeCode:701,validUntil:null,extraBranches:0,extraUsers:0});
 expect(submitted.owner).toMatchObject({documentType:101,extension:null});
 await expect(page.getByText('NewOpaque',{exact:true})).toHaveCount(0);
});

test('auditoría filtra la empresa sin mostrar su referencia y convierte fechas a UTC',async({page},info)=>{
 const {calls,requests}=await prepare(page,'SAAS_OWNER','/saas/audit');
 await expect(page.getByRole('heading',{name:'Auditoría global'})).toBeVisible();
 await page.getByRole('button',{name:'Filtrar empresa',exact:true}).click();
 await actions(page.getByRole('dialog'),info,'Tienda ejemplo');await page.getByText('Seleccionar empresa',{exact:true}).click();
 await expect.poll(()=>calls.filter(name=>name==='/saas/audit').length).toBeGreaterThan(1);
 await expect(page.getByRole('button',{name:'Tienda ejemplo',exact:true})).toBeVisible();
 await expect(page.getByText('CompanyOpaque',{exact:true})).toHaveCount(0);
 await page.locator('input[type="datetime-local"]').first().fill('2026-10-15T08:00');
 const expected=await page.evaluate(()=>new Date('2026-10-15T08:00').toISOString());
 await expect.poll(()=>requests.some(request=>request.name==='/saas/audit' && new URLSearchParams(request.search).get('from')===expected && new URLSearchParams(request.search).get('companyId')==='CompanyOpaque')).toBe(true);
});

test('catálogo global permite editar ciudades con controles adaptados a móvil',async({page},info)=>{
 const {writes}=await prepare(page,'ROOT','/saas/cities');
 await expect(page.getByRole('heading',{name:'Ciudades',exact:true})).toBeVisible();
 await actions(page,info,'La Paz');await page.getByText('Editar ciudad',{exact:true}).click();
 await page.getByRole('textbox',{name:'Ciudad',exact:true}).fill('La Paz centro');
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0]).toMatchObject({name:'/saas/cities/CityOpaque'});
 expect(JSON.parse(writes[0].body)).toEqual({name:'La Paz centro',country:'Bolivia'});
 await expect(page.getByText('CityOpaque',{exact:true})).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('personal se registra sin cuenta y acepta solo apellido materno',async({page})=>{
 const {writes}=await prepare(page,'SAAS_OWNER','/saas/team/members');
 await page.getByRole('button',{name:'Colaborador',exact:true}).click();
 await page.getByRole('textbox',{name:'Nombres',exact:true}).fill('Ana');
 await page.getByRole('textbox',{name:'Apellido materno',exact:true}).fill('Personal');
 await page.getByRole('button',{name:'Guardar',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].name).toBe('/saas/team/members');
 expect(JSON.parse(writes[0].body).person).toMatchObject({firstName:'Ana',maternalSurname:'Personal',documentType:null});
 expect(writes.some(write=>write.name==='/saas/team/accounts')).toBe(false);
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('soporte solicita motivo y no muestra herramientas financieras',async({page},info)=>{
 const {writes,calls}=await prepare(page,'SAAS_SUPPORT','/saas/support/access-hub');
 await actions(page,info,'Ana Caja');await page.getByText('Desbloquear cuenta',{exact:true}).click();
 await expect(page.getByRole('button',{name:'Confirmar',exact:true})).toBeDisabled();
 await page.getByRole('textbox',{name:'Motivo de asistencia',exact:true}).fill('Solicitud del titular');
 await page.getByRole('button',{name:'Confirmar',exact:true}).click();
 await expect.poll(()=>writes.length).toBe(1);
 expect(writes[0].name).toBe('/saas/companies/CompanyOpaque/users/AccountOpaque/unlock');
 expect(JSON.parse(writes[0].body)).toEqual({reason:'Solicitud del titular'});
 expect(calls).not.toContain('/saas/finances');
 await expect(page.getByText('AccountOpaque',{exact:true})).toHaveCount(0);
});

test('finanzas usa su dashboard sin montar el resumen operativo',async({page})=>{
 const {calls}=await prepare(page,'SAAS_FINANCE','/saas/dashboard');
 await expect(page.getByRole('heading',{name:'Resumen financiero de Comerzia'})).toBeVisible();
 expect(calls).toContain('/saas/dashboard/financial');expect(calls).not.toContain('/saas/dashboard');
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('historial contable vive fuera de la cola de verificación',async({page})=>{
 const {calls}=await prepare(page,'SAAS_FINANCE','/saas/billing/history');
 await expect(page.getByRole('heading',{name:'Historial de cobros'})).toBeVisible();
 await expect(page.getByText('BANCO-123',{exact:true}).filter({visible:true}).first()).toBeVisible();
 expect(calls).not.toContain('/saas/billing/requests');
 await expect(page.getByRole('button',{name:'Aprobar',exact:true})).toHaveCount(0);
});
