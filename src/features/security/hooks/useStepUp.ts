import { bindMfaOperation } from '../utils/mfaOperation';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { MfaStepUpActionType } from '../types/mfa';

interface StepUpState {
  isOpen: boolean;
  action: MfaStepUpActionType;
  title?: string;
  description?: string;
  targetId?: string;
}

export const useStepUp = () => {
  const [state, setState] = useState<StepUpState>({
    isOpen: false,
    action: 'ASSIGN_ROLES'
  });

  const sequence = useRef(0);
  const resolverRef = useRef<{
    resolve: (grantToken: string) => void;
    reject: (error: Error) => void;
  } | null>(null);

  const requestStepUp = useCallback(
    async (action: MfaStepUpActionType, options?: { title?: string; description?: string; targetId?: string; body?: unknown }): Promise<string> => {
      const requestSequence = ++sequence.current;
      const sessionGeneration = useAuthStore.getState().generation;
      resolverRef.current?.reject(new Error("step_up_superseded"));
      resolverRef.current = null;
      const targetId = await bindMfaOperation(action, options?.targetId, options?.body);
      if (sequence.current !== requestSequence || useAuthStore.getState().generation !== sessionGeneration) throw new Error("step_up_session_changed");
      return new Promise<string>((resolve, reject) => {
        resolverRef.current = { resolve, reject };
        setState({
          isOpen: true,
          action,
          title: options?.title,
          description: options?.description,
          targetId
        });
      });
    },
    []
  );

  const generation = useAuthStore(state => state.generation);
  useEffect(() => () => {
    sequence.current++;
    resolverRef.current?.reject(new Error('step_up_session_changed'));
    resolverRef.current = null;
  }, [generation]);

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
      resolverRef.current.reject(new Error('step_up_cancelled'));
      resolverRef.current = null;
    }
  }, []);

  return {
    isStepUpOpen: state.isOpen,
    stepUpAction: state.action,
    stepUpTarget: state.targetId,
    stepUpTitle: state.title,
    stepUpDescription: state.description,
    requestStepUp,
    handleSuccess,
    handleCancel
  };
};

