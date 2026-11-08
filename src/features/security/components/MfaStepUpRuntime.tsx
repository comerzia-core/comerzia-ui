import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStepUp } from '../hooks/useStepUp';
import { registerStepUpHandler } from '../services/stepUpCoordinator';
import { MfaStepUpModal } from './MfaStepUpModal';
export function MfaStepUpRuntime() {
  const step = useStepUp();
  useEffect(() => registerStepUpHandler(intent => step.requestStepUp(intent.action, { targetId: intent.target, body: intent.body })), [step.requestStepUp]);
  return createPortal(<MfaStepUpModal isOpen={step.isStepUpOpen} action={step.stepUpAction} targetId={step.stepUpTarget}
    onSuccess={step.handleSuccess} onCancel={step.handleCancel} />, document.body);
}
