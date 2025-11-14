import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ThemeProvider } from "./components/ThemeProvider";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { GroupsManagement } from "./pages/GroupsManagement";
import { KnockoutBracket } from "./pages/KnockoutBracket";
import { AthletesManagement } from "./pages/AthletesManagement";
import { ChampionshipSettings } from "./pages/ChampionshipSettings";
import { useChampionshipData } from "./hooks/performance";
import { useLogger } from "./lib/logger";
import { useEffect } from "react";
import "./App.css";

function AppContent() {
  const { championship, isLoading } = useChampionshipData();
  const logger = useLogger("app");

  useEffect(() => {
    logger.info("App mounted", {
      hasChampionship: !!championship,
      championshipStatus: championship?.status,
    });
  }, [championship, logger]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-secondary">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/athletes" element={<AthletesManagement />} />
        <Route path="/groups" element={<GroupsManagement />} />
        <Route path="/knockout" element={<KnockoutBracket />} />
        <Route path="/settings" element={<ChampionshipSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AppContent />
          <Toaster
            position="top-right"
            expand={true}
            richColors={true}
            closeButton={true}
          />
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
