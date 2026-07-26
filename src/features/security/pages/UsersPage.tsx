// src/features/security/pages/UsersPage.tsx
import { useState } from 'react';
import { Users, RefreshCw } from 'lucide-react';
import { UsersTable } from '../components/users/UsersTable';
import { UserRolesModal } from '../components/users/UserRolesModal';
import { UserTemporaryPasswordModal } from '../components/users/UserTemporaryPasswordModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useTenantUsers } from '../hooks/useTenantUsers';
import { userService } from '../services/userService';
import { useToast } from '../../../context/ToastContext';
import type { UserResponse, ResetPasswordResponse } from '../types/user';

type UserActionType = 'TOGGLE_ACCESS' | 'UNLOCK' | 'RESET_PASSWORD' | null;

export const UsersPage = () => {
  const { addToast: showToast } = useToast();

  const {
    data,
    isLoading,
    page,
    pageSize,
    searchQuery,
    setSearchQuery,
    handlePageChange,
    handlePageSizeChange,
    refetch
  } = useTenantUsers({ initialPageSize: 5 });

  // Estado del usuario seleccionado y tipo de acción
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);
  const [pendingAction, setPendingAction] = useState<UserActionType>(null);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  // Modal de Roles (Directo sin modal de advertencia previa)
  const [isRolesModalOpen, setIsRolesModalOpen] = useState<boolean>(false);

  // Modal de Contraseña Temporal (Generada después de confirmar reset)
  const [resetCredentials, setResetCredentials] = useState<ResetPasswordResponse | null>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);

  // --- SOLICITUDES DESDE EL MENÚ CONTEXTUAL ---
  const handleToggleAccessRequest = (user: UserResponse) => {
    setSelectedUser(user);
    setPendingAction('TOGGLE_ACCESS');
  };

  const handleUnlockRequest = (user: UserResponse) => {
    setSelectedUser(user);
    setPendingAction('UNLOCK');
  };

  const handleResetPasswordRequest = (user: UserResponse) => {
    setSelectedUser(user);
    setPendingAction('RESET_PASSWORD');
  };

  const handleModifyRolesRequest = (user: UserResponse) => {
    setSelectedUser(user);
    setIsRolesModalOpen(true);
  };

  // --- CONFIRMACIÓN Y EJECUCIÓN DE ACCIONES CON ADVERTENCIA ---
  const handleConfirmAction = async () => {
    if (!selectedUser || !pendingAction) return;

    try {
      setIsProcessingAction(true);

      if (pendingAction === 'TOGGLE_ACCESS') {
        const newDisabledState = !selectedUser.disabled;
        await userService.updateUserAccess(selectedUser.id, newDisabledState);
        showToast(
          newDisabledState
            ? `Acceso deshabilitado para el usuario @${selectedUser.username}`
            : `Acceso habilitado para el usuario @${selectedUser.username}`,
          'success'
        );
        refetch();
      } else if (pendingAction === 'UNLOCK') {
        await userService.unlockUserAccount(selectedUser.id);
        showToast(`Cuenta del usuario @${selectedUser.username} desbloqueada exitosamente`, 'success');
        refetch();
      } else if (pendingAction === 'RESET_PASSWORD') {
        const creds = await userService.resetUserPassword(selectedUser.id);
        setResetCredentials(creds);
        setIsPasswordModalOpen(true);
      }

      setPendingAction(null);
    } catch (error) {
      console.error('Error executing user administrative action:', error);
      showToast('Error al ejecutar la acción administrativa en la cuenta del usuario', 'error');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Generación de título y mensaje dinámico para el ConfirmationModal
  const getConfirmationContent = () => {
    if (!selectedUser || !pendingAction) return { title: '', message: '', variant: 'warning' as const };

    if (pendingAction === 'TOGGLE_ACCESS') {
      const willDisable = !selectedUser.disabled;
      return {
        title: willDisable ? 'Desactivar Acceso de Usuario' : 'Activar Acceso de Usuario',
        message: (
          <div className="space-y-2">
            <p className="text-base-content/80">
              ¿Estás seguro de que deseas{' '}
              <strong className="text-base-content font-bold">
                {willDisable ? 'desactivar' : 'activar'}
              </strong>{' '}
              el acceso al sistema para el usuario{' '}
              <span className="font-bold text-primary">"{selectedUser.fullName}"</span> (@
              {selectedUser.username})?
            </p>
            {willDisable && (
              <p className="text-xs text-error font-medium">
                * El usuario perderá el acceso a la plataforma inmediatamente.
              </p>
            )}
          </div>
        ),
        variant: willDisable ? ('danger' as const) : ('warning' as const),
        confirmText: willDisable ? 'Sí, Desactivar' : 'Sí, Activar'
      };
    }

    if (pendingAction === 'UNLOCK') {
      return {
        title: 'Desbloquear Cuenta de Usuario',
        message: (
          <p className="text-base-content/80">
            ¿Estás seguro de que deseas desbloquear la cuenta del usuario{' '}
            <span className="font-bold text-primary">"{selectedUser.fullName}"</span> (@
            {selectedUser.username})? Se restablecerán los intentos fallidos de inicio de sesión.
          </p>
        ),
        variant: 'warning' as const,
        confirmText: 'Sí, Desbloquear'
      };
    }

    if (pendingAction === 'RESET_PASSWORD') {
      return {
        title: 'Resetear Contraseña de Usuario',
        message: (
          <div className="space-y-2">
            <p className="text-base-content/80">
              ¿Estás seguro de que deseas generar una nueva contraseña temporal para el usuario{' '}
              <span className="font-bold text-primary">"{selectedUser.fullName}"</span> (@
              {selectedUser.username})?
            </p>
            <p className="text-xs text-warning font-medium">
              * Se invalidará su contraseña actual y se le obligará a cambiarla en su próximo inicio de sesión.
            </p>
          </div>
        ),
        variant: 'warning' as const,
        confirmText: 'Sí, Resetear'
      };
    }

    return { title: '', message: '', variant: 'warning' as const, confirmText: 'Confirmar' };
  };

  const confirmationContent = getConfirmationContent();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Administración de Usuarios
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            Gestión centralizada de cuentas de usuario del sistema, control de estado de acceso, desbloqueo y roles
          </p>
        </div>

        <button
          type="button"
          onClick={refetch}
          className="btn btn-ghost btn-sm gap-2 border border-base-300 hover:bg-base-200"
          title="Recargar listado de usuarios"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTRADO */}
      <div className="card bg-base-100 border border-base-200 shadow-xs p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-96">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar por usuario, nombre o rol..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-xs text-base-content/60 italic font-medium">
            * Haz clic derecho sobre cualquier usuario para abrir las opciones de administración
          </span>
        </div>
      </div>

      {/* TABLA PAGINADA DE USUARIOS */}
      <div className="card bg-base-100 shadow-xs border border-base-200 rounded-2xl overflow-hidden">
        <div className="card-body p-0">
          <UsersTable
            data={data}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onToggleAccessRequest={handleToggleAccessRequest}
            onUnlockRequest={handleUnlockRequest}
            onResetPasswordRequest={handleResetPasswordRequest}
            onModifyRolesRequest={handleModifyRolesRequest}
          />
        </div>
      </div>

      {/* COMPONENTE DE ADVERTENCIA PARA CONFIRMAR ACCIONES DEL MENÚ CONTEXTUAL */}
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

      {/* MODAL PARA MODIFICAR ROLES (DIRECTO AL HACER CLIC EN /roles) */}
      <UserRolesModal
        isOpen={isRolesModalOpen}
        onClose={() => setIsRolesModalOpen(false)}
        user={selectedUser}
        onSuccess={refetch}
      />

      {/* MODAL DE CREDENCIALES TEMPORALES TRAS RESETEAR CONTRASEÑA */}
      <UserTemporaryPasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          refetch();
        }}
        credentials={resetCredentials}
      />
    </div>
  );
};
