import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { animations, transitions, hoverEffects, activeEffects } from "@/lib/animations";

interface AnimatedProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Tipo de animação de entrada */
  animation?: keyof typeof animations;
  /** Delay da animação em ms */
  delay?: number;
  /** Duração customizada em ms */
  duration?: number;
  /** Se deve aplicar hover effect */
  hover?: boolean;
  /** Tipo de hover effect */
  hoverType?: keyof typeof hoverEffects;
}

/**
 * Componente genérico para elementos animados
 */
export function Animated({
  children,
  className,
  animation = "fadeIn",
  delay = 0,
  duration,
  hover = false,
  hoverType = "lift",
  style,
  ...props
}: AnimatedProps) {
  const animationClass = animations[animation];
  const hoverClass = hover ? hoverEffects[hoverType] : "";

  return (
    <div
      className={cn(animationClass, hoverClass, className)}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        animationDuration: duration ? `${duration}ms` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

interface AnimatedListProps {
  children: ReactNode[];
  /** Delay base entre items em ms */
  staggerDelay?: number;
  /** Animação para cada item */
  itemAnimation?: keyof typeof animations;
  /** Classe adicional para cada item */
  itemClassName?: string;
  /** Classe do container */
  className?: string;
  /** Se deve aplicar hover nos items */
  itemHover?: boolean;
}

/**
 * Componente para listas com animação escalonada
 */
export function AnimatedList({
  children,
  staggerDelay = 50,
  itemAnimation = "fadeInUp",
  itemClassName,
  className,
  itemHover = false,
}: AnimatedListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <Animated
          key={index}
          animation={itemAnimation}
          delay={index * staggerDelay}
          hover={itemHover}
          className={itemClassName}
        >
          {child}
        </Animated>
      ))}
    </div>
  );
}

interface PageTransitionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Componente para transições de página
 */
export function PageTransition({ children, className, ...props }: PageTransitionProps) {
  return (
    <div className={cn(animations.fadeInUp, className)} {...props}>
      {children}
    </div>
  );
}

interface InteractiveCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Se o card é clicável */
  clickable?: boolean;
}

/**
 * Card interativo com animações
 */
export function InteractiveCard({
  children,
  className,
  clickable = true,
  onClick,
  ...props
}: InteractiveCardProps) {
  return (
    <div
      className={cn(
        transitions.all,
        clickable && hoverEffects.lift,
        clickable && activeEffects.scale,
        clickable && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Se deve fazer fade in quando visível */
  whenVisible?: boolean;
  /** Delay em ms */
  delay?: number;
}

/**
 * Componente simples de fade in
 */
export function FadeIn({ children, className, delay = 0, style, ...props }: FadeInProps) {
  return (
    <div
      className={cn(animations.fadeIn, className)}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Componente para slides
 */
export function SlideIn({
  children,
  className,
  direction = "bottom",
  delay = 0,
  ...props
}: {
  children: ReactNode;
  className?: string;
  direction?: "top" | "bottom" | "left" | "right";
  delay?: number;
} & HTMLAttributes<HTMLDivElement>) {
  const animationMap = {
    top: animations.slideInFromTop,
    bottom: animations.slideInFromBottom,
    left: animations.slideInFromLeft,
    right: animations.slideInFromRight,
  };

  return (
    <div
      className={cn(animationMap[direction], className)}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Componente para zoom in
 */
export function ZoomIn({
  children,
  className,
  delay = 0,
  ...props
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(animations.zoomIn, className)}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Componente para elementos que aparecem com escala
 */
export function ScaleIn({
  children,
  className,
  delay = 0,
  ...props
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(animations.scaleIn, className)}
      style={{ animationDelay: delay ? `${delay}ms` : undefined }}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Componente de pulso (para indicar loading ou atenção)
 */
export function Pulse({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(animations.pulse, className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Componente de bounce (para chamar atenção)
 */
export function Bounce({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(animations.bounce, className)} {...props}>
      {children}
    </div>
  );
}
