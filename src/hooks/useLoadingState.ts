import { useState, useCallback } from "react";

/**
 * Hook para gerenciar estados de loading de forma consistente
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState<Error | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((err: Error | string) => {
    setIsLoading(false);
    setError(err instanceof Error ? err : new Error(err));
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  /**
   * Wrapper para executar funções async com loading automático
   */
  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | null> => {
      try {
        startLoading();
        const result = await fn();
        stopLoading();
        return result;
      } catch (err) {
        setLoadingError(err as Error);
        return null;
      }
    },
    [startLoading, stopLoading, setLoadingError]
  );

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    reset,
    withLoading,
  };
}

/**
 * Hook para gerenciar múltiplos estados de loading
 */
export function useMultipleLoadingStates<K extends string>(
  keys: readonly K[]
) {
  const [loadingStates, setLoadingStates] = useState<Record<K, boolean>>(
    {} as Record<K, boolean>
  );
  const [errors, setErrors] = useState<Record<K, Error | null>>(
    {} as Record<K, Error | null>
  );

  const startLoading = useCallback((key: K) => {
    setLoadingStates((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  }, []);

  const stopLoading = useCallback((key: K) => {
    setLoadingStates((prev) => ({ ...prev, [key]: false }));
  }, []);

  const setError = useCallback((key: K, error: Error | string) => {
    setLoadingStates((prev) => ({ ...prev, [key]: false }));
    setErrors((prev) => ({
      ...prev,
      [key]: error instanceof Error ? error : new Error(error),
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(Boolean);

  return {
    loadingStates,
    errors,
    startLoading,
    stopLoading,
    setError,
    isAnyLoading,
    isLoading: (key: K) => loadingStates[key] || false,
    getError: (key: K) => errors[key],
  };
}
