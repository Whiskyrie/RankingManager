type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
  category?: string;
  sessionId: string;
  userId?: string;
}

interface LogConfig {
  enableConsoleLog: boolean;
  enableLocalStorage: boolean;
  enableRemoteLog: boolean;
  maxLocalStorageEntries: number;
  logLevel: LogLevel;
  categories: string[];
  remoteEndpoint?: string;
}

class Logger {
  private config: LogConfig;
  private sessionId: string;
  private userId?: string;
  private logQueue: LogEntry[] = [];
  private isFlushingQueue = false;

  constructor(config: Partial<LogConfig> = {}) {
    this.config = {
      enableConsoleLog: process.env.NODE_ENV === "development",
      enableLocalStorage: true,
      enableRemoteLog: process.env.NODE_ENV === "production",
      maxLocalStorageEntries: 100,
      logLevel: process.env.NODE_ENV === "development" ? "debug" : "info",
      categories: [],
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeLogger();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeLogger() {
    // Registrar handler de erro global
    window.addEventListener("error", (event) => {
      this.error("Global Error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Registrar handler de promise rejeitada
    window.addEventListener("unhandledrejection", (event) => {
      this.error("Unhandled Promise Rejection", {
        reason: event.reason,
        promise: event.promise,
      });
    });

    // Log de inicialização
    this.info("Logger initialized", {
      sessionId: this.sessionId,
      config: this.config,
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  setUserId(userId: string) {
    this.userId = userId;
    this.info("User logged in", { userId });
  }

  clearUserId() {
    this.info("User logged out", { userId: this.userId });
    this.userId = undefined;
  }

  private shouldLog(level: LogLevel, category?: string): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);

    // Verificar nível
    if (messageLevelIndex < currentLevelIndex) {
      return false;
    }

    // Verificar categoria se especificada
    if (category && this.config.categories.length > 0) {
      return this.config.categories.includes(category);
    }

    return true;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    category?: string
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date(),
      category,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    category?: string
  ) {
    if (!this.shouldLog(level, category)) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, context, category);

    // Console log
    if (this.config.enableConsoleLog) {
      this.logToConsole(logEntry);
    }

    // Local storage
    if (this.config.enableLocalStorage) {
      this.logToLocalStorage(logEntry);
    }

    // Remote log
    if (this.config.enableRemoteLog) {
      this.queueForRemoteLog(logEntry);
    }
  }

  private logToConsole(entry: LogEntry) {
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp.toISOString()}`;
    const category = entry.category ? ` [${entry.category}]` : "";
    const message = `${prefix}${category} ${entry.message}`;

    switch (entry.level) {
      case "debug":
        console.debug(message, entry.context);
        break;
      case "info":
        console.info(message, entry.context);
        break;
      case "warn":
        console.warn(message, entry.context);
        break;
      case "error":
        console.error(message, entry.context);
        break;
    }
  }

  private logToLocalStorage(entry: LogEntry) {
    try {
      const logs = this.getLocalStorageLogs();
      logs.push(entry);

      // Manter apenas os logs mais recentes
      if (logs.length > this.config.maxLocalStorageEntries) {
        logs.splice(0, logs.length - this.config.maxLocalStorageEntries);
      }

      localStorage.setItem("app_logs", JSON.stringify(logs));
    } catch (error) {
      console.error("Failed to save log to localStorage:", error);
    }
  }

  private queueForRemoteLog(entry: LogEntry) {
    this.logQueue.push(entry);

    // Flush automático para erros
    if (entry.level === "error") {
      this.flushQueue();
    }
  }

  private async flushQueue() {
    if (
      this.isFlushingQueue ||
      this.logQueue.length === 0 ||
      !this.config.remoteEndpoint
    ) {
      return;
    }

    this.isFlushingQueue = true;
    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logs: logsToSend,
          metadata: {
            sessionId: this.sessionId,
            userId: this.userId,
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
        }),
      });
    } catch (error) {
      console.error("Failed to send logs to remote endpoint:", error);
      // Re-adicionar logs na fila se falhar
      this.logQueue.unshift(...logsToSend);
    } finally {
      this.isFlushingQueue = false;
    }
  }

  // Métodos públicos para cada nível
  debug(message: string, context?: Record<string, any>, category?: string) {
    this.log("debug", message, context, category);
  }

  info(message: string, context?: Record<string, any>, category?: string) {
    this.log("info", message, context, category);
  }

  warn(message: string, context?: Record<string, any>, category?: string) {
    this.log("warn", message, context, category);
  }

  error(message: string, context?: Record<string, any>, category?: string) {
    this.log("error", message, context, category);
  }

  // Métodos para categorias específicas
  performance(message: string, context?: Record<string, any>) {
    this.info(message, context, "performance");
  }

  user(message: string, context?: Record<string, any>) {
    this.info(message, context, "user");
  }

  api(message: string, context?: Record<string, any>) {
    this.info(message, context, "api");
  }

  business(message: string, context?: Record<string, any>) {
    this.info(message, context, "business");
  }

  // Métodos utilitários
  getLocalStorageLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem("app_logs");
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  clearLocalStorageLogs() {
    localStorage.removeItem("app_logs");
    this.info("Local storage logs cleared");
  }

  exportLogs(): string {
    const logs = this.getLocalStorageLogs();
    return JSON.stringify(logs, null, 2);
  }

  async flushRemoteLogs() {
    await this.flushQueue();
  }

  updateConfig(newConfig: Partial<LogConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.info("Logger config updated", { newConfig });
  }

  // Métodos para métricas de performance
  startTimer(label: string): () => void {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      this.performance(`Timer: ${label}`, { duration, label });
      return duration;
    };
  }

  measureAsync<T>(label: string, asyncFn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    return asyncFn().finally(() => {
      const duration = performance.now() - startTime;
      this.performance(`Async: ${label}`, { duration, label });
    });
  }

  // Log estruturado para diferentes contextos
  championship(action: string, context?: Record<string, any>) {
    this.business(`Championship: ${action}`, context);
  }

  match(action: string, context?: Record<string, any>) {
    this.business(`Match: ${action}`, context);
  }

  athlete(action: string, context?: Record<string, any>) {
    this.business(`Athlete: ${action}`, context);
  }
}

// Instância singleton
export const logger = new Logger();

// Hook para usar o logger em componentes React
export const useLogger = (category?: string) => {
  return {
    debug: (message: string, context?: Record<string, any>) =>
      logger.debug(message, context, category),
    info: (message: string, context?: Record<string, any>) =>
      logger.info(message, context, category),
    warn: (message: string, context?: Record<string, any>) =>
      logger.warn(message, context, category),
    error: (message: string, context?: Record<string, any>) =>
      logger.error(message, context, category),
    startTimer: (label: string) => logger.startTimer(label),
    measureAsync: <T>(label: string, asyncFn: () => Promise<T>) =>
      logger.measureAsync(label, asyncFn),
  };
};

// Decorador para log automático de métodos
export function logMethod(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const method = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const className = target.constructor.name;
    const methodName = propertyName;

    logger.debug(`Method called: ${className}.${methodName}`, {
      className,
      methodName,
      args: args.length,
    });

    try {
      const result = method.apply(this, args);

      if (result instanceof Promise) {
        return result.catch((error) => {
          logger.error(`Method error: ${className}.${methodName}`, {
            className,
            methodName,
            error: error.message,
            stack: error.stack,
          });
          throw error;
        });
      }

      return result;
    } catch (error) {
      logger.error(`Method error: ${className}.${methodName}`, {
        className,
        methodName,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }
  };

  return descriptor;
}

export default logger;
