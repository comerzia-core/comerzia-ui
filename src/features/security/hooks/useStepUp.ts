import { useState, useCallback, useRef } from 'react';
import type { MfaStepUpActionType } from '../types/mfa';

interface StepUpState {
  isOpen: boolean;
  action: MfaStepUpActionType;
  title?: string;
  description?: string;
}

export const useStepUp = () => {
  const [state, setState] = useState<StepUpState>({
    isOpen: false,
    action: 'ASSIGN_ROLES'
  });

  const resolverRef = useRef<{
    resolve: (grantToken: string) => void;
    reject: (error: Error) => void;
  } | null>(null);

  const requestStepUp = useCallback(
    (action: MfaStepUpActionType, options?: { title?: string; description?: string }): Promise<string> => {
      return new Promise<string>((resolve, reject) => {
        resolverRef.current = { resolve, reject };
        setState({
          isOpen: true,
          action,
          title: options?.title,
          description: options?.description
        });
      });
    },
    []
  );

  const handleSuccess = useCallback((grantToken: string) => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current.resolve(grantToken);
      resolverRef.current = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current.reject(new Error('Step-Up cancelado por el usuario.'));
      resolverRef.current = null;
    }
  }, []);

  return {
    isStepUpOpen: state.isOpen,
    stepUpAction: state.action,
    stepUpTitle: state.title,
    stepUpDescription: state.description,
    requestStepUp,
    handleSuccess,
    handleCancel
  };
};

