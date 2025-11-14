import React, { createContext, useContext, useState, useCallback } from "react";
import { ConfirmDialog, ConfirmDialogProps, ConfirmDialogVariant } from "@/components/ui/confirm-dialog";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

interface ConfirmDialogContextValue {
  /** Mostra um dialog de confirmação e retorna uma Promise que resolve com true/false */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Mostra um dialog de confirmação de exclusão */
  confirmDelete: (itemName: string, onConfirm: () => void | Promise<void>) => Promise<boolean>;
  /** Mostra um dialog de confirmação para limpar dados */
  confirmClear: (dataType: string, onConfirm: () => void | Promise<void>) => Promise<boolean>;
  /** Mostra um dialog de alterações não salvas */
  confirmUnsavedChanges: (onConfirm: () => void | Promise<void>) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | undefined>(undefined);

interface DialogState {
  open: boolean;
  config: Omit<ConfirmDialogProps, "open" | "onOpenChange">;
  resolve?: (value: boolean) => void;
}

/**
 * Provider para gerenciar dialogs de confirmação globalmente
 */
export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [dialogState, setDialogState] = useState<DialogState>({
    open: false,
    config: {
      title: "",
      description: "",
      onConfirm: () => {},
    },
  });

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        resolve,
        config: {
          ...options,
          onConfirm: async () => {
            // Dialog irá fechar automaticamente após onConfirm
            resolve(true);
          },
          onCancel: () => {
            resolve(false);
          },
        },
      });
    });
  }, []);

  const confirmDelete = useCallback(
    (itemName: string, onConfirm: () => void | Promise<void>): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          resolve,
          config: {
            title: "Confirmar exclusão",
            description: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
            variant: "destructive",
            confirmText: "Excluir",
            onConfirm: async () => {
              await onConfirm();
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          },
        });
      });
    },
    []
  );

  const confirmClear = useCallback(
    (dataType: string, onConfirm: () => void | Promise<void>): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          resolve,
          config: {
            title: "Limpar dados",
            description: `Tem certeza que deseja limpar todos os ${dataType}? Esta ação não pode ser desfeita.`,
            variant: "danger",
            confirmText: "Limpar",
            onConfirm: async () => {
              await onConfirm();
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          },
        });
      });
    },
    []
  );

  const confirmUnsavedChanges = useCallback(
    (onConfirm: () => void | Promise<void>): Promise<boolean> => {
      return new Promise((resolve) => {
        setDialogState({
          open: true,
          resolve,
          config: {
            title: "Alterações não salvas",
            description: "Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?",
            variant: "warning",
            confirmText: "Sair sem salvar",
            onConfirm: async () => {
              await onConfirm();
              resolve(true);
            },
            onCancel: () => {
              resolve(false);
            },
          },
        });
      });
    },
    []
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Se o dialog está fechando sem confirmação, resolve como false
        dialogState.resolve?.(false);
      }
      setDialogState((prev) => ({ ...prev, open }));
    },
    [dialogState.resolve]
  );

  const contextValue: ConfirmDialogContextValue = {
    confirm: showConfirm,
    confirmDelete,
    confirmClear,
    confirmUnsavedChanges,
  };

  return (
    <ConfirmDialogContext.Provider value={contextValue}>
      {children}
      <ConfirmDialog {...dialogState.config} open={dialogState.open} onOpenChange={handleOpenChange} />
    </ConfirmDialogContext.Provider>
  );
}

/**
 * Hook para usar o sistema de confirmação global
 *
 * @example
 * ```tsx
 * const { confirm, confirmDelete } = useConfirm();
 *
 * // Confirmação genérica
 * const confirmed = await confirm({
 *   title: "Confirmar ação",
 *   description: "Deseja continuar?",
 *   variant: "warning"
 * });
 *
 * // Confirmação de exclusão
 * const deleted = await confirmDelete("Campeonato XYZ", async () => {
 *   await deleteChampionship();
 * });
 *
 * if (deleted) {
 *   toast.success("Excluído com sucesso!");
 * }
 * ```
 */
export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return context;
}
