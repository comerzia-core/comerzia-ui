import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300 p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-error/10 text-error rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-base-content">
              Ocurrió un error inesperado
            </h2>
            <p className="text-sm text-base-content/70">
              La aplicación encontró un problema temporal. Puedes recargar la página para continuar.
            </p>
            {this.state.error?.message && (
              <div className="bg-base-200 rounded-xl p-3 text-xs font-mono text-base-content/60 break-words text-left overflow-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="btn btn-primary w-full gap-2 rounded-xl"
            >
              <RotateCcw size={18} />
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
