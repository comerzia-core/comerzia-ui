import { AppRouter } from "./routes/AppRouter";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { ThemePreferencePanel } from './features/security/components/ThemePreferencePanel';

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
      <ThemePreferencePanel />
    </ErrorBoundary>
  );
}

export default App;
