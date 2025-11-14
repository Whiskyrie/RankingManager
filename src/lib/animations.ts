/**
 * Utilitários para animações e transições
 */

/**
 * Classes de animação prontas para uso
 */
export const animations = {
  // Fade animations
  fadeIn: "animate-in fade-in duration-200",
  fadeOut: "animate-out fade-out duration-200",
  fadeInSlow: "animate-in fade-in duration-500",
  fadeOutSlow: "animate-out fade-out duration-500",

  // Slide animations
  slideInFromTop: "animate-in slide-in-from-top duration-300",
  slideInFromBottom: "animate-in slide-in-from-bottom duration-300",
  slideInFromLeft: "animate-in slide-in-from-left duration-300",
  slideInFromRight: "animate-in slide-in-from-right duration-300",

  slideOutToTop: "animate-out slide-out-to-top duration-300",
  slideOutToBottom: "animate-out slide-out-to-bottom duration-300",
  slideOutToLeft: "animate-out slide-out-to-left duration-300",
  slideOutToRight: "animate-out slide-out-to-right duration-300",

  // Zoom animations
  zoomIn: "animate-in zoom-in duration-200",
  zoomOut: "animate-out zoom-out duration-200",
  zoomIn95: "animate-in zoom-in-95 duration-200",
  zoomOut95: "animate-out zoom-out-95 duration-200",

  // Spin
  spin: "animate-spin",
  spinSlow: "animate-spin duration-1000",
  spinFast: "animate-spin duration-300",

  // Pulse
  pulse: "animate-pulse",

  // Bounce
  bounce: "animate-bounce",

  // Combined animations
  fadeInUp: "animate-in fade-in slide-in-from-bottom duration-300",
  fadeInDown: "animate-in fade-in slide-in-from-top duration-300",
  fadeOutUp: "animate-out fade-out slide-out-to-top duration-300",
  fadeOutDown: "animate-out fade-out slide-out-to-bottom duration-300",

  // Scale + Fade
  scaleIn: "animate-in fade-in zoom-in-95 duration-200",
  scaleOut: "animate-out fade-out zoom-out-95 duration-200",
};

/**
 * Classes de transição para hover/focus/active
 */
export const transitions = {
  all: "transition-all duration-200 ease-in-out",
  colors: "transition-colors duration-200 ease-in-out",
  transform: "transition-transform duration-200 ease-in-out",
  opacity: "transition-opacity duration-200 ease-in-out",
  shadow: "transition-shadow duration-200 ease-in-out",

  // Slower transitions
  slow: "transition-all duration-500 ease-in-out",
  colorsSlow: "transition-colors duration-500 ease-in-out",

  // Fast transitions
  fast: "transition-all duration-100 ease-in-out",
  colorsFast: "transition-colors duration-100 ease-in-out",
};

/**
 * Classes de easing customizadas
 */
export const easings = {
  easeInOut: "ease-in-out",
  easeIn: "ease-in",
  easeOut: "ease-out",
  linear: "linear",
  spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Efeito de mola
  smooth: "cubic-bezier(0.4, 0, 0.2, 1)", // Material Design
};

/**
 * Delays para animações em sequência
 */
export const delays = {
  none: "delay-0",
  xs: "delay-75",
  sm: "delay-100",
  md: "delay-150",
  lg: "delay-200",
  xl: "delay-300",
  "2xl": "delay-500",
  "3xl": "delay-700",
  "4xl": "delay-1000",
};

/**
 * Durations para animações
 */
export const durations = {
  fast: "duration-100",
  normal: "duration-200",
  slow: "duration-300",
  slower: "duration-500",
  slowest: "duration-700",
};

/**
 * Hook para animação de entrada com delay
 */
export const useStaggeredAnimation = (baseDelay = 50) => {
  return (index: number) => ({
    className: `${animations.fadeInUp} ${delays.none}`,
    style: {
      animationDelay: `${index * baseDelay}ms`,
    },
  });
};

/**
 * Classes para hover effects
 */
export const hoverEffects = {
  lift: "hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-200",
  scale: "hover:scale-105 transition-transform duration-200",
  scaleSmall: "hover:scale-102 transition-transform duration-200",
  glow: "hover:shadow-xl hover:shadow-blue-500/50 transition-shadow duration-200",
  brighten: "hover:brightness-110 transition-all duration-200",
  rotate: "hover:rotate-3 transition-transform duration-200",
};

/**
 * Classes para focus effects
 */
export const focusEffects = {
  ring: "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
  ringDark: "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
  outline: "focus:outline-none focus:ring-2 focus:ring-blue-500",
};

/**
 * Classes para active effects (quando clicado)
 */
export const activeEffects = {
  scale: "active:scale-95 transition-transform duration-100",
  press: "active:translate-y-0.5 transition-transform duration-100",
  fade: "active:opacity-80 transition-opacity duration-100",
};

/**
 * Classes combinadas para elementos interativos
 */
export const interactive = {
  button: `${transitions.all} ${hoverEffects.scale} ${activeEffects.scale} ${focusEffects.ring}`,
  card: `${transitions.all} ${hoverEffects.lift} cursor-pointer`,
  link: `${transitions.colors} hover:text-blue-600 dark:hover:text-blue-400`,
};

/**
 * Animações de skeleton/loading
 */
export const loadingAnimations = {
  skeleton: "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700",
  shimmer: "animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent",
  progress: "animate-progress bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500",
};

/**
 * Animações de entrada para listas
 */
export const listAnimations = {
  item: (index: number, baseDelay = 50) => ({
    className: animations.fadeInUp,
    style: {
      animationDelay: `${index * baseDelay}ms`,
      animationFillMode: "both",
    },
  }),
};

/**
 * Animações de sucesso/erro/warning
 */
export const statusAnimations = {
  success: `${animations.scaleIn} bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800`,
  error: `${animations.scaleIn} bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800`,
  warning: `${animations.scaleIn} bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800`,
  info: `${animations.scaleIn} bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800`,
};

/**
 * Função helper para combinar classes de animação
 */
export const combineAnimations = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

/**
 * Animações de página
 */
export const pageTransitions = {
  enter: "animate-in fade-in slide-in-from-bottom-4 duration-300",
  exit: "animate-out fade-out slide-out-to-top-4 duration-200",
};

/**
 * Animações de modal/dialog
 */
export const modalAnimations = {
  overlay: {
    enter: "animate-in fade-in duration-200",
    exit: "animate-out fade-out duration-200",
  },
  content: {
    enter: "animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200",
    exit: "animate-out fade-out zoom-out-95 slide-out-to-top-4 duration-200",
  },
};

/**
 * Animações de dropdown/menu
 */
export const dropdownAnimations = {
  enter: "animate-in fade-in slide-in-from-top-2 duration-150",
  exit: "animate-out fade-out slide-out-to-top-2 duration-150",
};

/**
 * Animações de tooltip
 */
export const tooltipAnimations = {
  enter: "animate-in fade-in zoom-in-95 duration-100",
  exit: "animate-out fade-out zoom-out-95 duration-100",
};

export default {
  animations,
  transitions,
  easings,
  delays,
  durations,
  hoverEffects,
  focusEffects,
  activeEffects,
  interactive,
  loadingAnimations,
  listAnimations,
  statusAnimations,
  combineAnimations,
  pageTransitions,
  modalAnimations,
  dropdownAnimations,
  tooltipAnimations,
  useStaggeredAnimation,
};
