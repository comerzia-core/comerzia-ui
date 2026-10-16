import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateCompanyWizard } from '../components/companies/CreateCompanyWizard';
import { CompanyCredentialsModal } from '../components/companies/CompanyCredentialsModal';
import type { CompanyCreatedResponse } from '../types/company';
export function SaasOnboardingPage() {
  const navigate = useNavigate(); const completed = useRef(false); const [credentials, setCredentials] = useState<CompanyCreatedResponse | null>(null);
  return <div><h1 className="text-2xl font-bold">Alta de empresa</h1><CreateCompanyWizard isOpen={!credentials}
    onClose={() => { if (!completed.current) navigate('/saas/tenants'); }} onSuccess={value => { completed.current = true; setCredentials(value); }} />
    <CompanyCredentialsModal isOpen={!!credentials} data={credentials} onClose={() => navigate('/saas/tenants')} />
  </div>;
}
