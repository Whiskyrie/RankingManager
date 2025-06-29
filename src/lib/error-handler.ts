import { toast } from "sonner";

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp?: Date;
  context?: Record<string, any>;
}

export class ValidationError extends Error implements AppError {
  code = "VALIDATION_ERROR";
  statusCode = 400;
  details: string[];
  timestamp: Date;

  constructor(message: string, details: string[] = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
    this.timestamp = new Date();
    Object.defineProperty(this, "timestamp", {
      value: new Date(),
      writable: false,
      enumerable: true,
    });
  }
}

export class NetworkError extends Error implements AppError {
  code = "NETWORK_ERROR";
  statusCode: number;
  timestamp: Date;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
    Object.defineProperty(this, "timestamp", {
      value: new Date(),
      writable: false,
      enumerable: true,
    });
  }
}

export class BusinessLogicError extends Error implements AppError {
  code = "BUSINESS_LOGIC_ERROR";
  statusCode = 422;
  context?: Record<string, any>;
  timestamp: Date;

  constructor(message: string, context?: Record<string, any>) {
    super(message);
    this.name = "BusinessLogicError";
    this.context = context;
    Object.defineProperty(this, "timestamp", {
      value: new Date(),
      writable: false,
      enumerable: true,
    });
  }
}

export class DataIntegrityError extends Error implements AppError {
  code = "DATA_INTEGRITY_ERROR";
  statusCode = 409;
  timestamp: Date;

  constructor(message: string) {
    super(message);
    this.name = "DataIntegrityError";
    Object.defineProperty(this, "timestamp", {
      value: new Date(),
      writable: false,
      enumerable: true,
    });
  }
}

type ErrorHandler = (error: AppError) => void;

class ErrorHandlerService {
  private handlers: Map<string, ErrorHandler[]> = new Map();
  private globalHandlers: ErrorHandler[] = [];

  // Registrar handler para tipo específico de erro
  registerHandler(errorType: string, handler: ErrorHandler) {
    if (!this.handlers.has(errorType)) {
      this.handlers.set(errorType, []);
    }
    this.handlers.get(errorType)?.push(handler);
  }

  // Registrar handler global
  registerGlobalHandler(handler: ErrorHandler) {
    this.globalHandlers.push(handler);
  }

  // Processar erro
  handleError(error: Error | AppError) {
    const appError = this.normalizeError(error);

    // Log do erro
    this.logError(appError);

    // Executar handlers específicos
    const specificHandlers = this.handlers.get(appError.name) || [];
    specificHandlers.forEach((handler) => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error("Erro no handler:", handlerError);
      }
    });

    // Executar handlers globais
    this.globalHandlers.forEach((handler) => {
      try {
        handler(appError);
      } catch (handlerError) {
        console.error("Erro no handler global:", handlerError);
      }
    });

    // Handler padrão se nenhum específico foi registrado
    if (specificHandlers.length === 0 && this.globalHandlers.length === 0) {
      this.defaultErrorHandler(appError);
    }
  }

  private normalizeError(error: Error | AppError): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    // Converter Error comum para AppError
    const appError: AppError = new Error(error.message);
    appError.name = error.name;
    appError.stack = error.stack;
    appError.timestamp = new Date();
    appError.code = "UNKNOWN_ERROR";
    appError.statusCode = 500;

    return appError;
  }

  private isAppError(error: any): error is AppError {
    return error && typeof error === "object" && "code" in error;
  }

  private logError(error: AppError) {
    const errorLog = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      stack: error.stack,
      context: error.context,
      details: (error as any).details,
    };

    console.group(`🚨 [ERROR] ${error.name}`);
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Status:", error.statusCode);
    console.error("Timestamp:", error.timestamp);
    if (error.context) console.error("Context:", error.context);
    if ((error as any).details)
      console.error("Details:", (error as any).details);
    console.error("Stack:", error.stack);
    console.groupEnd();

    // Salvar no localStorage para debug
    try {
      const errors = JSON.parse(localStorage.getItem("app_error_logs") || "[]");
      errors.push(errorLog);
      // Manter apenas os últimos 20 erros
      localStorage.setItem("app_error_logs", JSON.stringify(errors.slice(-20)));
    } catch (storageError) {
      console.error("Falha ao salvar erro no localStorage:", storageError);
    }
  }

  private defaultErrorHandler(error: AppError) {
    // Toast de erro baseado no tipo
    switch (error.name) {
      case "ValidationError":
        toast.error("Dados inválidos", {
          description: error.message,
          duration: 5000,
        });
        break;

      case "NetworkError":
        toast.error("Erro de conexão", {
          description: "Verifique sua conexão e tente novamente",
          duration: 5000,
        });
        break;

      case "BusinessLogicError":
        toast.error("Operação não permitida", {
          description: error.message,
          duration: 5000,
        });
        break;

      case "DataIntegrityError":
        toast.error("Erro de integridade", {
          description: "Os dados estão inconsistentes. Recarregue a página.",
          duration: 8000,
        });
        break;

      default:
        toast.error("Erro inesperado", {
          description: "Algo deu errado. Nossa equipe foi notificada.",
          duration: 5000,
        });
    }
  }

  // Limpar handlers (útil para testes)
  clearHandlers() {
    this.handlers.clear();
    this.globalHandlers = [];
  }

  // Obter logs de erro
  getErrorLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem("app_error_logs") || "[]");
    } catch {
      return [];
    }
  }

  // Limpar logs de erro
  clearErrorLogs() {
    localStorage.removeItem("app_error_logs");
  }
}

// Instância singleton
export const errorHandler = new ErrorHandlerService();

// Função utilitária para criar erros tipados
export const createError = {
  validation: (message: string, details: string[] = []) =>
    new ValidationError(message, details),
  network: (message: string, statusCode?: number) =>
    new NetworkError(message, statusCode),
  businessLogic: (message: string, context?: Record<string, any>) =>
    new BusinessLogicError(message, context),
  dataIntegrity: (message: string) => new DataIntegrityError(message),
};

// Hook para usar o error handler de forma mais React-friendly
export const useErrorHandler = () => {
  const handle = (error: Error | AppError) => {
    errorHandler.handleError(error);
  };

  const handleAsync = async <T>(
    asyncFn: () => Promise<T>,
    fallbackValue?: T
  ): Promise<T | undefined> => {
    try {
      return await asyncFn();
    } catch (error) {
      handle(error as Error);
      return fallbackValue;
    }
  };

  return { handle, handleAsync };
};

// Setup inicial dos handlers
errorHandler.registerGlobalHandler((error: AppError) => {
  // Aqui você pode integrar com serviços externos como Sentry
  if (process.env.NODE_ENV === "production") {
    // Exemplo: Sentry.captureException(error);
  }
});
