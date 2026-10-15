import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../src/App';
import { ToastProvider } from '../../src/context/ToastContext';
import { useAuthStore } from '../../src/stores/useAuthStore';
import type { UserProfile } from '../../src/features/auth/types';
import '../../src/index.css';
const params = new URLSearchParams(location.search); const role = params.get('role') ?? 'SAAS_OWNER';
const permissions: Record<string, string[]> = {
  SAAS_OWNER: ['SYS_DASHBOARD_READ','SYS_COMPANIES_READ','SYS_COMPANIES_MANAGE','SYS_BILLING_MANAGE','SYS_TEAM_READ','SYS_TEAM_MANAGE','SYS_FINANCE_READ','SYS_FINANCE_MANAGE','SYS_BILLING_SETTINGS_MANAGE','SYS_TENANT_USERS_READ','SYS_TENANT_USERS_SUPPORT','SYS_AUDIT_READ'],
  SAAS_SUPPORT: ['SYS_DASHBOARD_READ','SYS_COMPANIES_READ','SYS_TENANT_USERS_READ','SYS_TENANT_USERS_SUPPORT'],
  ROOT: ['SYS_DASHBOARD_READ','SYS_COMPANIES_READ','SYS_DATA_RECOVERY','SYS_TECHNICAL_READ'],
  OWNER: ['ORG_BILLING_MANAGE','ORG_SUBSCRIPTIONS_READ'],
};
const profile: UserProfile = { id:'TestAccount',username:'ana',firstName:'Ana',paternalLastName:'Prueba',maternalFirstName:null,
  fullName:'Ana Prueba',email:'ana@example.test',imageUrl:null,roles:[role],permissions:permissions[role],theme:'light',
  operational:params.get('expired')!=='true',companySettings:role==='OWNER'?{id:'CompanyOpaque',commercialName:'Tienda ejemplo',timezone:'America/La_Paz',currencyCode:'BOB',logoUrl:null}:null };
useAuthStore.setState({token:'test-session',userProfile:profile,isAuthenticated:true,isSessionReady:true,
  menuTree:role==='OWNER'?[{id:1,name:'Tienda',route:'/organization',children:[{id:2,name:'Suscripción y pagos',route:'/organization/subscription'}]}]:
    [{id:3,name:'Plataforma SaaS',route:'/saas',children:[{id:4,name:'Empresas',route:'/saas/tenants'},{id:5,name:'Resumen',route:'/saas/dashboard'}]}]});
localStorage.setItem('token','test-session');
declare global { interface Window { saasTest: {navigate:(path:string)=>void}; } }
window.saasTest={navigate:path=>{history.pushState(null,'',path);dispatchEvent(new PopStateEvent('popstate'));}};
history.replaceState(null,'',params.get('path')??'/saas/tenants');
createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false}}})}><ToastProvider><App/></ToastProvider></QueryClientProvider>);
