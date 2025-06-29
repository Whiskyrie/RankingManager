import React from "react";
import { AlertTriangle, RefreshCw, Bug, Copy, CheckCircle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  copied: boolean;
}

const serializeError = (error: Error, errorInfo?: ErrorInfo) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  return JSON.stringify(errorData, null, 2);
};

const generateErrorId = () => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  },
  ErrorBoundaryState
> {
  private retryTimeoutId: number | null = null;

  constructor(props: {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 [ERROR BOUNDARY] Erro capturado:", error, errorInfo);

    this.setState({ errorInfo });

    // Chamar callback de erro personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log para analytics/monitoring se necessário
    this.logErrorToService(error, errorInfo);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Aqui você pode integrar com serviços como Sentry, LogRocket, etc.
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Salvar no localStorage para debug
      const errors = JSON.parse(localStorage.getItem("app_errors") || "[]");
      errors.push(errorData);
      // Manter apenas os últimos 10 erros
      localStorage.setItem("app_errors", JSON.stringify(errors.slice(-10)));

      console.group(`🐛 [ERROR LOG] ${this.state.errorId}`);
      console.error("Error:", error);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    } catch (logError) {
      console.error("Falha ao logar erro:", logError);
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: "",
      copied: false,
    });
  };

  private handleCopyError = async () => {
    if (!this.state.error) return;

    try {
      const errorText = serializeError(
        this.state.error,
        this.state.errorInfo || undefined
      );
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });

      // Reset copied state after 2 seconds
      setTimeout(() => {
        this.setState({ copied: false });
      }, 2000);
    } catch (err) {
      console.error("Falha ao copiar erro:", err);
    }
  };

  private handleReportBug = () => {
    const errorText = this.state.error
      ? serializeError(this.state.error, this.state.errorInfo || undefined)
      : "";
    const subject = encodeURIComponent(`Bug Report - ${this.state.errorId}`);
    const body = encodeURIComponent(`
Descrição do problema:
[Descreva o que estava fazendo quando o erro ocorreu]

Detalhes técnicos:
${errorText}
    `);

    // Abrir email ou sistema de issues
    window.open(`mailto:suporte@example.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Se um componente fallback personalizado foi fornecido
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            retry={this.handleRetry}
          />
        );
      }

      // Fallback padrão melhorado
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Ops! Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <strong>ID do Erro:</strong> {this.state.errorId}
                  <br />
                  Ocorreu um erro inesperado na aplicação. Nossa equipe foi
                  notificada.
                </AlertDescription>
              </Alert>

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleCopyError}
                  className="flex items-center gap-2"
                >
                  {this.state.copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Detalhes
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={this.handleReportBug}
                  className="flex items-center gap-2"
                >
                  <Bug className="h-4 w-4" />
                  Reportar Bug
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && (
                <details className="bg-gray-100 p-4 rounded-lg">
                  <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                    Detalhes Técnicos (Desenvolvimento)
                  </summary>
                  <pre className="text-xs text-gray-600 overflow-auto">
                    {serializeError(
                      this.state.error,
                      this.state.errorInfo || undefined
                    )}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
