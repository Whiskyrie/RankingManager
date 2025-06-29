import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import "./index.css";
import App from "./AppRouter";
import { logger } from "./lib/logger";
// Importar utilitários para registrar funções globais de debug
import "./utils/index.ts";

// Configurar logger para produção se necessário
if (import.meta.env.PROD) {
  logger.updateConfig({
    enableConsoleLog: false,
    logLevel: "warn",
    enableRemoteLog: true,
    remoteEndpoint: import.meta.env.VITE_LOG_ENDPOINT,
  });
}

// Log de inicialização da aplicação
logger.info("Application starting", {
  environment: import.meta.env.MODE,
  version: import.meta.env.VITE_APP_VERSION || "1.0.0",
});

console.log("🚀 [MAIN] Iniciando aplicação...");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
