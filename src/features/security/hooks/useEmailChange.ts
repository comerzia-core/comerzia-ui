import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailChangeService } from '../services/emailChangeService';
import { useAuthStore } from '../../../stores/useAuthStore';

export function useEmailChange() {
  const queryClient = useQueryClient();
  const generation = useAuthStore(state => state.generation);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Consulta del estado pendiente de cambio de correo
  const {
    data: pendingData,
    isLoading: isPendingLoading,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['email-change-pending', generation],
    queryFn: () => emailChangeService.getPendingChange(),
    enabled: isAuthenticated,
    staleTime: 30000,
    gcTime: 0,
  });

  // Mutación para cancelar solicitud pendiente
  const cancelMutation = useMutation({
    mutationFn: () => emailChangeService.cancelChange(),
    onSuccess: () => {
      setSuccessMessage('La solicitud de cambio de correo ha sido cancelada.');
      void queryClient.invalidateQueries({ queryKey: ['email-change-pending'] });
    },
    onError: () => {
      setSuccessMessage(null);
    },
    gcTime: 0,
  });

  const handleOpenModal = () => {
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return {
    pendingData,
    isPendingLoading,
    refetchPending,
    isModalOpen,
    handleOpenModal,
    handleCloseModal,
    successMessage,
    setSuccessMessage,
    cancelMutation,
  };
}
