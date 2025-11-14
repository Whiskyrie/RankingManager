import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { cn } from "@/lib/utils";
import { AlertTriangle, Trash2, AlertCircle, Info } from "lucide-react";

export type ConfirmDialogVariant = "danger" | "warning" | "info" | "destructive";

export interface ConfirmDialogProps {
  /** Se o dialog está aberto */
  open: boolean;
  /** Callback para controlar o estado do dialog */
  onOpenChange: (open: boolean) => void;
  /** Título do dialog */
  title: string;
  /** Descrição/mensagem do dialog */
  description: string;
  /** Texto do botão de confirmação */
  confirmText?: string;
  /** Texto do botão de cancelamento */
  cancelText?: string;
  /** Callback executado ao confirmar */
  onConfirm: () => void | Promise<void>;
  /** Callback executado ao cancelar */
  onCancel?: () => void;
  /** Variante visual do dialog */
  variant?: ConfirmDialogVariant;
  /** Se deve mostrar loading ao confirmar */
  loading?: boolean;
  /** Ícone customizado (sobrescreve o ícone padrão) */
  icon?: React.ReactNode;
  /** Conteúdo adicional no corpo do dialog */
  children?: React.ReactNode;
}

const variantConfig: Record<
  ConfirmDialogVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconClassName: string;
    confirmClassName: string;
    confirmText: string;
  }
> = {
  danger: {
    icon: AlertTriangle,
    iconClassName: "text-red-600 dark:text-red-500",
    confirmClassName: "bg-red-600 hover:bg-red-700 focus:ring-red-600",
    confirmText: "Confirmar",
  },
  destructive: {
    icon: Trash2,
    iconClassName: "text-red-600 dark:text-red-500",
    confirmClassName: "bg-red-600 hover:bg-red-700 focus:ring-red-600",
    confirmText: "Excluir",
  },
  warning: {
    icon: AlertCircle,
    iconClassName: "text-yellow-600 dark:text-yellow-500",
    confirmClassName: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600",
    confirmText: "Continuar",
  },
  info: {
    icon: Info,
    iconClassName: "text-blue-600 dark:text-blue-500",
    confirmClassName: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-600",
    confirmText: "OK",
  },
};

/**
 * Dialog de confirmação para ações destrutivas ou importantes
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  variant = "danger",
  loading = false,
  icon,
  children,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error in confirm dialog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("flex-shrink-0 mt-0.5", config.iconClassName)}>
              {icon || <Icon className="h-6 w-6" />}
            </div>
            <div className="flex-1 space-y-2">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
              {children && <div className="pt-2">{children}</div>}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading || loading}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || loading}
            className={cn(config.confirmClassName)}
          >
            {isLoading || loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Processando...
              </>
            ) : (
              confirmText || config.confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook para usar o ConfirmDialog de forma imperativa
 */
export function useConfirmDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<Omit<ConfirmDialogProps, "open" | "onOpenChange">>({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const confirm = React.useCallback(
    (options: Omit<ConfirmDialogProps, "open" | "onOpenChange">) => {
      return new Promise<boolean>((resolve) => {
        setConfig({
          ...options,
          onConfirm: async () => {
            await options.onConfirm();
            resolve(true);
          },
          onCancel: () => {
            options.onCancel?.();
            resolve(false);
          },
        });
        setIsOpen(true);
      });
    },
    []
  );

  const ConfirmDialogComponent = React.useCallback(
    () => <ConfirmDialog {...config} open={isOpen} onOpenChange={setIsOpen} />,
    [config, isOpen]
  );

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent,
  };
}

/**
 * Confirmação específica para exclusão
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  onConfirm,
  ...props
}: Omit<ConfirmDialogProps, "title" | "description" | "variant"> & {
  itemName: string;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirmar exclusão"
      description={`Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`}
      variant="destructive"
      onConfirm={onConfirm}
      {...props}
    />
  );
}

/**
 * Confirmação para limpar dados
 */
export function ClearDataConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  dataType = "dados",
  ...props
}: Omit<ConfirmDialogProps, "title" | "description" | "variant"> & {
  dataType?: string;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Limpar dados"
      description={`Tem certeza que deseja limpar todos os ${dataType}? Esta ação não pode ser desfeita.`}
      variant="danger"
      confirmText="Limpar"
      onConfirm={onConfirm}
      {...props}
    />
  );
}

/**
 * Confirmação para sair sem salvar
 */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  ...props
}: Omit<ConfirmDialogProps, "title" | "description" | "variant" | "confirmText">) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Alterações não salvas"
      description="Você tem alterações não salvas. Tem certeza que deseja sair sem salvar?"
      variant="warning"
      confirmText="Sair sem salvar"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
}
