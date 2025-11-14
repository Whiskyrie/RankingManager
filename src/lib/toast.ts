import { toast as sonnerToast, ExternalToast } from "sonner";
import { logger } from "./logger";

/**
 * Opções customizadas para toasts
 */
export interface ToastOptions extends ExternalToast {
  /** Se deve fazer log da mensagem */
  logMessage?: boolean;
  /** Categoria do log (se logMessage = true) */
  logCategory?: string;
  /** Contexto adicional para o log */
  logContext?: Record<string, any>;
}

/**
 * Configurações padrão para toasts
 */
const defaultOptions: ToastOptions = {
  duration: 4000,
  logMessage: true,
};

/**
 * Sistema de toasts aprimorado com integração ao logger
 */
export const toast = {
  /**
   * Toast de sucesso
   */
  success(message: string, options?: ToastOptions) {
    const opts = { ...defaultOptions, ...options };

    if (opts.logMessage) {
      logger.info(`Toast: ${message}`, opts.logContext, opts.logCategory || "toast");
    }

    return sonnerToast.success(message, opts);
  },

  /**
   * Toast de erro
   */
  error(message: string, options?: ToastOptions) {
    const opts = { ...defaultOptions, duration: 6000, ...options };

    if (opts.logMessage) {
      logger.error(`Toast: ${message}`, opts.logContext, opts.logCategory || "toast");
    }

    return sonnerToast.error(message, opts);
  },

  /**
   * Toast de informação
   */
  info(message: string, options?: ToastOptions) {
    const opts = { ...defaultOptions, ...options };

    if (opts.logMessage) {
      logger.info(`Toast: ${message}`, opts.logContext, opts.logCategory || "toast");
    }

    return sonnerToast.info(message, opts);
  },

  /**
   * Toast de aviso
   */
  warning(message: string, options?: ToastOptions) {
    const opts = { ...defaultOptions, duration: 5000, ...options };

    if (opts.logMessage) {
      logger.warn(`Toast: ${message}`, opts.logContext, opts.logCategory || "toast");
    }

    return sonnerToast.warning(message, opts);
  },

  /**
   * Toast de carregamento
   */
  loading(message: string, options?: ToastOptions) {
    const opts = { ...defaultOptions, duration: Infinity, ...options };

    if (opts.logMessage) {
      logger.info(`Toast (loading): ${message}`, opts.logContext, opts.logCategory || "toast");
    }

    return sonnerToast.loading(message, opts);
  },

  /**
   * Toast para operações assíncronas com promise
   */
  promise<T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) {
    const opts = { ...defaultOptions, ...options };

    if (opts.logMessage) {
      logger.info(`Toast (promise): ${messages.loading}`, opts.logContext, opts.logCategory || "toast");
    }

    // Sonner's promise method only accepts 2 arguments
    return sonnerToast.promise(promise, {
      ...messages,
      ...opts,
    });
  },

  /**
   * Toast customizado
   */
  custom(message: string, options?: ToastOptions) {
    const opts = { ...defaultOptions, ...options };

    if (opts.logMessage) {
      logger.info(`Toast (custom): ${message}`, opts.logContext, opts.logCategory || "toast");
    }

    return sonnerToast(message, opts);
  },

  /**
   * Atualiza um toast existente
   */
  update(toastId: string | number, options: ToastOptions & { message?: string }) {
    return sonnerToast.success(options.message || "", {
      id: toastId,
      ...options,
    });
  },

  /**
   * Dismisses a specific toast
   */
  dismiss(toastId?: string | number) {
    return sonnerToast.dismiss(toastId);
  },

  /**
   * Toast de confirmação com ação
   */
  confirm(
    message: string,
    options: ToastOptions & {
      onConfirm: () => void;
      confirmText?: string;
      cancelText?: string;
    }
  ) {
    const { onConfirm, confirmText = "Confirmar", cancelText = "Cancelar", ...toastOptions } = options;

    return sonnerToast(message, {
      ...toastOptions,
      duration: 10000,
      action: {
        label: confirmText,
        onClick: onConfirm,
      },
      cancel: {
        label: cancelText,
        onClick: () => sonnerToast.dismiss(),
      },
    });
  },
};

/**
 * Toasts específicos do domínio
 */
export const championshipToasts = {
  created: (name: string) =>
    toast.success(`Campeonato "${name}" criado com sucesso!`, {
      logCategory: "championship",
      logContext: { action: "created", championshipName: name },
    }),

  updated: (name: string) =>
    toast.success(`Campeonato "${name}" atualizado!`, {
      logCategory: "championship",
      logContext: { action: "updated", championshipName: name },
    }),

  deleted: () =>
    toast.success("Campeonato removido com sucesso", {
      logCategory: "championship",
      logContext: { action: "deleted" },
    }),

  groupsGenerated: (count: number) =>
    toast.success(`${count} grupo(s) gerado(s) com sucesso!`, {
      logCategory: "championship",
      logContext: { action: "groups_generated", groupCount: count },
    }),

  bracketGenerated: () =>
    toast.success("Chave de mata-mata gerada com sucesso!", {
      logCategory: "championship",
      logContext: { action: "bracket_generated" },
    }),

  started: () =>
    toast.success("Campeonato iniciado!", {
      logCategory: "championship",
      logContext: { action: "started" },
    }),

  completed: () =>
    toast.success("Campeonato finalizado! Parabéns ao campeão!", {
      duration: 6000,
      logCategory: "championship",
      logContext: { action: "completed" },
    }),
};

export const athleteToasts = {
  added: (name: string) =>
    toast.success(`Atleta "${name}" adicionado!`, {
      logCategory: "athlete",
      logContext: { action: "added", athleteName: name },
    }),

  removed: (name: string) =>
    toast.info(`Atleta "${name}" removido`, {
      logCategory: "athlete",
      logContext: { action: "removed", athleteName: name },
    }),

  updated: (name: string) =>
    toast.success(`Atleta "${name}" atualizado!`, {
      logCategory: "athlete",
      logContext: { action: "updated", athleteName: name },
    }),

  imported: (count: number) =>
    toast.success(`${count} atleta(s) importado(s) com sucesso!`, {
      logCategory: "athlete",
      logContext: { action: "imported", count },
    }),
};

export const matchToasts = {
  resultSaved: (player1: string, player2: string) =>
    toast.success(`Resultado salvo: ${player1} vs ${player2}`, {
      logCategory: "match",
      logContext: { action: "result_saved", player1, player2 },
    }),

  walkoverSet: (winner: string) =>
    toast.info(`W.O. atribuído para ${winner}`, {
      logCategory: "match",
      logContext: { action: "walkover_set", winner },
    }),

  invalidSet: (reason: string) =>
    toast.error(`Set inválido: ${reason}`, {
      duration: 5000,
      logCategory: "match",
      logContext: { action: "invalid_set", reason },
    }),
};

export const systemToasts = {
  dataExported: (format: string) =>
    toast.success(`Dados exportados em ${format.toUpperCase()}`, {
      logCategory: "system",
      logContext: { action: "data_exported", format },
    }),

  dataImported: () =>
    toast.success("Dados importados com sucesso!", {
      logCategory: "system",
      logContext: { action: "data_imported" },
    }),

  dataSaved: () =>
    toast.success("Dados salvos automaticamente", {
      duration: 2000,
      logCategory: "system",
      logContext: { action: "data_saved" },
    }),

  offline: () =>
    toast.warning("Você está offline. Os dados serão sincronizados quando voltar online.", {
      duration: 8000,
      logCategory: "system",
      logContext: { action: "offline" },
    }),

  online: () =>
    toast.success("Conexão restabelecida!", {
      duration: 3000,
      logCategory: "system",
      logContext: { action: "online" },
    }),

  updateAvailable: () =>
    toast.info("Nova versão disponível! Recarregue a página para atualizar.", {
      duration: 10000,
      action: {
        label: "Recarregar",
        onClick: () => window.location.reload(),
      },
      logCategory: "system",
      logContext: { action: "update_available" },
    }),
};

/**
 * Hook para usar toasts em componentes React
 */
export const useToast = () => {
  return {
    toast,
    championshipToasts,
    athleteToasts,
    matchToasts,
    systemToasts,
  };
};

export default toast;
