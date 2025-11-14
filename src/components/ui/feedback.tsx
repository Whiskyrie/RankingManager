import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, Info, AlertCircle, X } from "lucide-react";
import { animations } from "@/lib/animations";

export type FeedbackVariant = "success" | "error" | "warning" | "info";

interface FeedbackBannerProps {
  variant: FeedbackVariant;
  title?: string;
  message: string;
  /** Conteúdo adicional */
  children?: ReactNode;
  /** Se pode ser fechado */
  dismissible?: boolean;
  /** Callback ao fechar */
  onDismiss?: () => void;
  /** Classes adicionais */
  className?: string;
}

const variantConfig: Record<
  FeedbackVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
    textColor: "text-green-900 dark:text-green-100",
    iconColor: "text-green-600 dark:text-green-500",
  },
  error: {
    icon: XCircle,
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-900 dark:text-red-100",
    iconColor: "text-red-600 dark:text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-900 dark:text-yellow-100",
    iconColor: "text-yellow-600 dark:text-yellow-500",
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-600 dark:text-blue-500",
  },
};

/**
 * Banner de feedback para sucesso, erro, aviso ou informação
 */
export function FeedbackBanner({
  variant,
  title,
  message,
  children,
  dismissible = false,
  onDismiss,
  className,
}: FeedbackBannerProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        config.bgColor,
        config.borderColor,
        animations.scaleIn,
        className
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={cn("h-5 w-5", config.iconColor)} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={cn("text-sm font-medium", config.textColor)}>{title}</h3>
          )}
          <div className={cn("text-sm", title ? "mt-1" : "", config.textColor)}>
            {message}
          </div>
          {children && <div className="mt-2">{children}</div>}
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className={cn(
                "inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2",
                config.textColor,
                "hover:opacity-75 transition-opacity"
              )}
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Badge inline de status
 */
export function StatusBadge({
  variant,
  children,
  className,
}: {
  variant: FeedbackVariant;
  children: ReactNode;
  className?: string;
}) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.bgColor,
        config.textColor,
        config.borderColor,
        "border",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {children}
    </span>
  );
}

/**
 * Ícone de status inline
 */
export function StatusIcon({
  variant,
  size = "sm",
  className,
}: {
  variant: FeedbackVariant;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return <Icon className={cn(sizeClasses[size], config.iconColor, className)} />;
}

/**
 * Card de feedback com ação
 */
export function FeedbackCard({
  variant,
  title,
  message,
  action,
  actionLabel,
  onAction,
  className,
}: {
  variant: FeedbackVariant;
  title: string;
  message: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-lg border p-6",
        config.bgColor,
        config.borderColor,
        animations.scaleIn,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("rounded-full p-2", config.bgColor)}>
          <Icon className={cn("h-6 w-6", config.iconColor)} />
        </div>
        <div className="flex-1">
          <h3 className={cn("text-base font-semibold", config.textColor)}>{title}</h3>
          <p className={cn("mt-1 text-sm", config.textColor)}>{message}</p>
          {(action || actionLabel) && (
            <div className="mt-4">
              {action || (
                <button
                  onClick={onAction}
                  className={cn(
                    "text-sm font-medium underline hover:no-underline",
                    config.textColor
                  )}
                >
                  {actionLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Mensagem inline de validação para formulários
 */
export function ValidationMessage({
  message,
  variant = "error",
  className,
}: {
  message: string;
  variant?: Extract<FeedbackVariant, "error" | "success" | "warning">;
  className?: string;
}) {
  const config = variantConfig[variant];
  const Icon = variant === "error" ? AlertCircle : config.icon;

  return (
    <p className={cn("flex items-center gap-1.5 text-sm mt-1.5", config.textColor, className)}>
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/**
 * Lista de erros de validação
 */
export function ValidationErrors({
  errors,
  title = "Por favor, corrija os seguintes erros:",
  className,
}: {
  errors: string[];
  title?: string;
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <FeedbackBanner
      variant="error"
      title={title}
      message=""
      className={className}
    >
      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </FeedbackBanner>
  );
}

/**
 * Indicador de campo obrigatório
 */
export function RequiredIndicator({ className }: { className?: string }) {
  return <span className={cn("text-red-500", className)}>*</span>;
}

/**
 * Empty state component
 */
export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-center py-12", className)}>
      {Icon && (
        <div className="flex justify-center mb-4">
          <Icon className="h-12 w-12 text-gray-400 dark:text-gray-600" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {message}
      </p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
}

/**
 * Progress indicator
 */
export function ProgressIndicator({
  steps,
  currentStep,
  className,
}: {
  steps: string[];
  currentStep: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                index < currentStep
                  ? "bg-green-600 text-white"
                  : index === currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              )}
            >
              {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-1 w-16 mx-2 transition-colors",
                  index < currentStep
                    ? "bg-green-600"
                    : "bg-gray-200 dark:bg-gray-700"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
        {steps.map((step, index) => (
          <span
            key={index}
            className={cn(
              "transition-colors",
              index === currentStep && "font-semibold text-blue-600 dark:text-blue-400"
            )}
          >
            {step}
          </span>
        ))}
      </div>
    </div>
  );
}
