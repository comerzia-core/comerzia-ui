import { TemporaryCredentialsModal } from '../TemporaryCredentialsModal';
import type { CompanyCreatedResponse } from '../../types/company';

interface Props { isOpen: boolean; onClose: () => void; data: CompanyCreatedResponse | null; }
export function CompanyCredentialsModal({ isOpen, onClose, data }: Props) {
  return <TemporaryCredentialsModal onClose={onClose} companyName={data?.businessName}
    value={isOpen && data ? { username: data.ownerUsername, temporaryPassword: data.temporaryPassword } : null} />;
}
