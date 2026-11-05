// src/features/employees/pages/EmployeePage.tsx
import { useState, useEffect, useCallback } from 'react';
import { Users, MailPlus, Mail } from 'lucide-react';
import { EmployeeModal } from '../components/EmployeeModal';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';
import { InviteEmployeeModal } from '../components/InviteEmployeeModal';
import { RevokeInvitationModal } from '../components/RevokeInvitationModal';
import { InvitationsTable } from '../components/InvitationsTable';
import { employeeService } from '../services/employeeService';
import { invitationService } from '../services/invitationService';
import type { EmployeeSummaryResponse, EmployeeCreatedResponse } from '../types/employee';
import type { TenantEmployeeInvitationResponse } from '../types/invitation';
import type { PageResponse } from '../../../types/api';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { EmployeeCredentialsModal } from '../components/EmployeeCredentialsModal';
import { EmployeeRolesModal } from '../components/EmployeeRolesModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { branchService } from '../../organization/services/branchService';
import type { TenantActiveBranchResponse } from '../../organization/types/branch';
import { useUrlParams } from '../../../hooks/useUrlState';

type EmployeeActionType = 'DELETE' | null;

export const EmployeePage = () => {
  const { hasPermission } = useAuthStore();
  const hasBranchesPermission = hasPermission('ORG_BRANCHES_ACTIVE_READ');
  const canModifyRoles = hasPermission('SEC_ROLES_READ');
  const canManageEmployees = hasPermission('HUM_EMPLOYEES_MANAGE');

  const { getParam, setParams } = useUrlParams();

  // URL state: IDs son strings ofuscados
  const urlDetailId = getParam('detail');
  const urlSearch = getParam('search') || '';
  const urlBranch = getParam('branch') || '';
  const urlPage = getParam('page');
  const page = urlPage ? Math.max(0, parseInt(urlPage, 10)) : 0;

  const [data, setData] = useState<PageResponse<EmployeeSummaryResponse> | null>(null);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(search, 350);

  const selectedBranchId = urlBranch;
  const [activeBranches, setActiveBranches] = useState<TenantActiveBranchResponse[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummaryResponse | null>(null);

  // Modal para modificar roles
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [rolesEmployee, setRolesEmployee] = useState<EmployeeSummaryResponse | null>(null);

  // Estado de Acciones Administrativas con Modal de Confirmación
  const [pendingAction, setPendingAction] = useState<EmployeeActionType>(null);
  const [targetEmployee, setTargetEmployee] = useState<EmployeeSummaryResponse | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [credentialsData, setCredentialsData] = useState<EmployeeCreatedResponse | null>(null);

  // Pestañas e Invitaciones
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'INVITATIONS'>('EMPLOYEES');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);
  const [invitationToRevoke, setInvitationToRevoke] = useState<TenantEmployeeInvitationResponse | null>(null);
  const [invitations, setInvitations] = useState<TenantEmployeeInvitationResponse[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  const { success, error } = useToast();

  const loadInvitations = useCallback(async () => {
    setIsLoadingInvitations(true);
    try {
      const res = await invitationService.listInvitations(0, 50);
      setInvitations(res.content || []);
    } catch {
      // Si la función está deshabilitada o falla
      setInvitations([]);
    } finally {
      setIsLoadingInvitations(false);
    }
  }, []);

  // Cargar lista de invitaciones en segundo plano al montar para el contador
  useEffect(() => {
    let active = true;
    invitationService.listInvitations(0, 50)
      .then(res => {
        if (active) setInvitations(res.content || []);
      })
      .catch(() => {
        if (active) setInvitations([]);
      });
    return () => {
      active = false;
    };
  }, []);

  // Sincronizar input local con URL si la URL cambia por navegación externa
  useEffect(() => {
    if (urlSearch !== search) {
      setSearch(urlSearch);
    }
  }, [urlSearch]);

  // Sincronizar debouncedSearch con URL
  useEffect(() => {
    const cleanSearch = debouncedSearch.trim();
    if (cleanSearch !== urlSearch) {
      // Si tiene 3+ caracteres o está vacío, sincronizamos a la URL
      if (cleanSearch.length === 0 || cleanSearch.length >= 3) {
        setParams({ search: cleanSearch.length >= 3 ? cleanSearch : null, page: null }, { replace: true });
      }
    }
  }, [debouncedSearch, urlSearch, setParams]);

  // Cargar sucursales activas si el usuario tiene el permiso
  useEffect(() => {
    if (hasBranchesPermission) {
      setIsLoadingBranches(true);
      branchService.getActiveBranches()
        .then(res => setActiveBranches(res || []))
        .catch(err => console.error('Error loading active branches:', err))
        .finally(() => setIsLoadingBranches(false));
    }
  }, [hasBranchesPermission]);

  const loadData = async (
    targetPage = page,
    targetSize = pageSize,
    q = urlSearch.trim().length >= 3 ? urlSearch.trim() : undefined,
    branchId = selectedBranchId
  ) => {
    setIsLoading(true);
    try {
      const response = await employeeService.getAll(
        targetPage,
        targetSize,
        ['branchName,asc', 'fullName,asc'],
        q,
        branchId || undefined
      );
      setData(response);
    } catch (err) {
      console.error('Error loading employees:', err);
      error('No se pudo cargar la lista de empleados.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar datos ante cambios en los parámetros de la URL
  useEffect(() => {
    const queryToSearch = urlSearch.trim().length >= 3 ? urlSearch.trim() : undefined;
    loadData(page, pageSize, queryToSearch, selectedBranchId);
  }, [page, pageSize, urlSearch, selectedBranchId]);

  const handlePageChange = (newPage: number) => {
    setParams({ page: newPage > 0 ? String(newPage) : null }, { replace: true });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setParams({ page: null }, { replace: true });
  };

  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: EmployeeSummaryResponse) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleModifyRoles = (employee: EmployeeSummaryResponse) => {
    setRolesEmployee(employee);
    setIsRolesModalOpen(true);
  };

  const handleViewDetails = (employee: EmployeeSummaryResponse) => {
    setParams({ detail: employee.id }, { replace: false });
  };

  const handleDeleteRequest = (employee: EmployeeSummaryResponse) => {
    setTargetEmployee(employee);
    setPendingAction('DELETE');
  };

  const handleConfirmAction = async () => {
    if (!targetEmployee || !pendingAction) return;

    try {
      setIsProcessingAction(true);
      if (pendingAction === 'DELETE') {
        await employeeService.delete(targetEmployee.id);
        success(`Empleado "${targetEmployee.fullName}" eliminado exitosamente.`);
        loadData(page, pageSize);
      }
      setPendingAction(null);
      setTargetEmployee(null);
    } catch (err: any) {
      console.error('Error handling employee action:', err);
      const apiMsg = err.response?.data?.message || err.response?.data?.error;
      error(apiMsg || 'Ocurrió un error al procesar la acción del empleado.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getConfirmationContent = () => {
    if (!targetEmployee || !pendingAction) {
      return { title: '', message: '', variant: 'warning' as const, confirmText: 'Confirmar' };
    }

    if (pendingAction === 'DELETE') {
      return {
        title: 'Eliminar Empleado',
        message: (
          <div className="space-y-2">
            <p className="text-base-content/80">
              ¿Estás seguro de que deseas eliminar al empleado{' '}
              <span className="font-bold text-primary">"{targetEmployee.fullName}"</span>?
            </p>
            <p className="text-xs text-error font-medium">
              * Se eliminará lógicamente su registro, persona y usuario asociado revocando su acceso.
            </p>
          </div>
        ),
        variant: 'danger' as const,
        confirmText: 'Sí, Eliminar'
      };
    }

    return { title: '', message: '', variant: 'warning' as const, confirmText: 'Confirmar' };
  };

  const confirmationContent = getConfirmationContent();

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Gestión de Empleados
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Administra el personal, asigna sucursales y configura sus accesos.
          </p>
        </div>
        {canManageEmployees && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              className="btn btn-outline btn-primary btn-sm gap-1.5 h-10 px-3.5 rounded-xl font-medium"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <MailPlus className="w-4 h-4" />
              Invitar Colaborador
            </button>
            <BtnCreate onClick={handleCreate} label="Nuevo Empleado" className="w-full sm:w-auto" />
          </div>
        )}
      </div>

      {/* PESTAÑAS: COLABORADORES ACTIVOS VS INVITACIONES PENDIENTES */}
      <div className="flex border-b border-base-200 gap-2">
        <button
          type="button"
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'EMPLOYEES'
              ? 'border-primary text-primary'
              : 'border-transparent text-base-content/60 hover:text-base-content'
          }`}
          onClick={() => setActiveTab('EMPLOYEES')}
        >
          <Users className="w-4 h-4" />
          Colaboradores Activos
        </button>
        <button
          type="button"
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'INVITATIONS'
              ? 'border-primary text-primary'
              : 'border-transparent text-base-content/60 hover:text-base-content'
          }`}
          onClick={() => {
            setActiveTab('INVITATIONS');
            loadInvitations();
          }}
        >
          <Mail className="w-4 h-4" />
          Invitaciones Pendientes
          {invitations.length > 0 && (
            <span className="badge badge-primary badge-xs font-mono px-1.5 py-0.5">
              {invitations.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'INVITATIONS' ? (
        <InvitationsTable
          invitations={invitations}
          isLoading={isLoadingInvitations}
          onRefresh={loadInvitations}
          onRevokeRequest={inv => {
            setInvitationToRevoke(inv);
            setIsRevokeModalOpen(true);
          }}
        />
      ) : (
        <>
          {/* BARRA DE FILTROS */}
          <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
              <div className="w-full sm:w-80">
                <ComerziaInput
                  icon="Search"
                  placeholder="Buscar por nombre, CI o celular... (mín. 3 caracteres)"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {hasBranchesPermission && (
                <div className="w-full sm:w-64">
                  <ComerziaSelect
                    placeholder="Todas las sucursales"
                    enableDefaultOption={true}
                    value={selectedBranchId}
                    onChange={e => {
                      setParams({ branch: e.target.value || null, page: null }, { replace: true });
                    }}
                    options={activeBranches.map(b => ({
                      value: b.id,
                      label: b.name
                    }))}
                    isLoading={isLoadingBranches}
                  />
                </div>
              )}
            </div>
          </div>

          {/* CONTENEDOR DE LA TABLA PAGINADA DE EMPLEADOS */}
          <div className="md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
            <div className="md:card-body md:p-0">
              <EmployeeTable
                data={data}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onViewDetails={handleViewDetails}
                onEdit={canManageEmployees ? handleEdit : undefined}
                onDelete={canManageEmployees ? handleDeleteRequest : undefined}
                onModifyRoles={canModifyRoles ? handleModifyRoles : undefined}
              />
            </div>
          </div>
        </>
      )}

      {/* MODAL CREAR / EDITAR EMPLEADO */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
        onSaved={newEmpCreds => {
          setIsModalOpen(false);
          loadData(page, pageSize);
          if (newEmpCreds && newEmpCreds.temporaryPassword) {
            setCredentialsData(newEmpCreds);
          }
        }}
      />

      {/* MODAL DETALLES DEL EMPLEADO */}
      <EmployeeDetailModal
        isOpen={Boolean(urlDetailId)}
        onClose={() => setParams({ detail: null }, { replace: false })}
        employeeId={urlDetailId}
      />

      {/* MODAL DE CREDENCIALES GENERADAS */}
      {credentialsData && (
        <EmployeeCredentialsModal
          isOpen={!!credentialsData}
          onClose={() => setCredentialsData(null)}
          data={credentialsData}
        />
      )}

      {/* MODAL MODIFICAR ROLES DEL EMPLEADO */}
      <EmployeeRolesModal
        isOpen={isRolesModalOpen}
        onClose={() => {
          setIsRolesModalOpen(false);
          setRolesEmployee(null);
        }}
        employee={rolesEmployee}
        onSuccess={() => loadData(page, pageSize)}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmationModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmationContent.title}
        message={confirmationContent.message}
        confirmText={confirmationContent.confirmText || 'Confirmar'}
        cancelText="Cancelar"
        variant={confirmationContent.variant}
        isLoading={isProcessingAction}
      />

      {/* MODAL INVITAR COLABORADOR */}
      <InviteEmployeeModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvitationCreated={() => {
          loadInvitations();
          setActiveTab('INVITATIONS');
        }}
      />

      {/* MODAL REVOCAR INVITACIÓN */}
      <RevokeInvitationModal
        isOpen={isRevokeModalOpen}
        onClose={() => {
          setIsRevokeModalOpen(false);
          setInvitationToRevoke(null);
        }}
        invitation={invitationToRevoke}
        onRevoked={loadInvitations}
      />
    </div>
  );
};
