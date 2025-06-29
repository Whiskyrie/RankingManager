import { useMemo, useCallback, useRef, useEffect } from "react";
import { useChampionshipStore } from "../store/championship";
import { Championship, Match, Athlete, Group } from "../types";
import { debounce } from "../lib/utils";

// Hook para dados do campeonato com seletores otimizados
export const useChampionshipData = () => {
  const championship = useChampionshipStore(
    (state) => state.currentChampionship
  );
  const isLoading = useChampionshipStore((state) => state.isLoading);
  const error = useChampionshipStore((state) => state.error);

  // Memoizar cálculos pesados
  const stats = useMemo(() => {
    if (!championship) return null;

    const totalMatches = championship.totalMatches;
    const completedMatches = championship.completedMatches;
    const progress =
      totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    const groupMatches = championship.groups.reduce(
      (total, group) =>
        total + group.matches.filter((m) => m.phase === "groups").length,
      0
    );

    const knockoutMatches = championship.groups.reduce(
      (total, group) =>
        total + group.matches.filter((m) => m.phase === "knockout").length,
      0
    );

    return {
      totalMatches,
      completedMatches,
      pendingMatches: totalMatches - completedMatches,
      progress: Math.round(progress),
      groupMatches,
      knockoutMatches,
    };
  }, [championship]);

  const athletes = useMemo(() => {
    if (!championship) return [];
    return championship.athletes;
  }, [championship]);

  const groups = useMemo(() => {
    if (!championship) return [];
    return championship.groups;
  }, [championship]);

  return {
    championship,
    stats,
    athletes,
    groups,
    isLoading,
    error,
  };
};

// Hook para gerenciar atletas com operações otimizadas
export const useAthletes = () => {
  const { athletes } = useChampionshipData();
  const addAthlete = useChampionshipStore((state) => state.addAthlete);
  const updateAthlete = useChampionshipStore((state) => state.updateAthlete);
  const removeAthlete = useChampionshipStore((state) => state.removeAthlete);

  // Memoizar estatísticas dos atletas
  const athleteStats = useMemo(() => {
    const total = athletes.length;
    const seeded = athletes.filter((a) => a.isSeeded).length;
    const unseeded = total - seeded;

    return { total, seeded, unseeded };
  }, [athletes]);

  // Memoizar atletas ordenados
  const sortedAthletes = useMemo(() => {
    return [...athletes].sort((a, b) => {
      // Cabeças primeiro, ordenados por número
      if (a.isSeeded && b.isSeeded) {
        return (a.seedNumber || 0) - (b.seedNumber || 0);
      }
      if (a.isSeeded) return -1;
      if (b.isSeeded) return 1;

      // Depois por nome
      return a.name.localeCompare(b.name);
    });
  }, [athletes]);

  // Callbacks otimizados
  const addAthleteOptimized = useCallback(
    async (athleteData: Omit<Athlete, "id">) => {
      await addAthlete(athleteData);
    },
    [addAthlete]
  );

  const updateAthleteOptimized = useCallback(
    async (athlete: Athlete) => {
      await updateAthlete(athlete);
    },
    [updateAthlete]
  );

  const removeAthleteOptimized = useCallback(
    async (athleteId: string) => {
      await removeAthlete(athleteId);
    },
    [removeAthlete]
  );

  return {
    athletes: sortedAthletes,
    stats: athleteStats,
    addAthlete: addAthleteOptimized,
    updateAthlete: updateAthleteOptimized,
    removeAthlete: removeAthleteOptimized,
  };
};

// Hook para busca otimizada com debounce
export const useSearch = <T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  debounceMs: number = 300
) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce da query
  const debouncedSetQuery = useMemo(
    () =>
      debounce((value: string) => {
        setDebouncedQuery(value);
      }, debounceMs),
    [debounceMs]
  );

  useEffect(() => {
    debouncedSetQuery(query);
  }, [query, debouncedSetQuery]);

  // Filtrar items baseado na query
  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items;

    const lowercaseQuery = debouncedQuery.toLowerCase();
    return items.filter((item) => searchFn(item, lowercaseQuery));
  }, [items, debouncedQuery, searchFn]);

  return {
    query,
    setQuery,
    filteredItems,
    isSearching: query !== debouncedQuery,
  };
};

// Hook para paginação otimizada
export const usePagination = <T>(items: T[], pageSize: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset para página 1 quando items mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  const totalPages = Math.ceil(items.length / pageSize);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    },
    [totalPages]
  );

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    pageSize,
    paginatedItems,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

// Hook para gerenciar cache de dados computados
export const useComputedCache = <K extends string | number, V>(
  computeFn: (key: K) => V,
  dependencies: any[] = []
) => {
  const cacheRef = useRef(new Map<K, { value: V; timestamp: number }>());
  const maxAge = 5 * 60 * 1000; // 5 minutos

  const compute = useCallback(
    (key: K): V => {
      const cache = cacheRef.current;
      const cached = cache.get(key);
      const now = Date.now();

      // Verificar se cache é válido
      if (cached && now - cached.timestamp < maxAge) {
        return cached.value;
      }

      // Computar novo valor
      const value = computeFn(key);
      cache.set(key, { value, timestamp: now });

      // Limpar cache antigo (máximo 100 entradas)
      if (cache.size > 100) {
        const entries = Array.from(cache.entries());
        const sortedEntries = entries.sort(
          (a, b) => b[1].timestamp - a[1].timestamp
        );
        const toKeep = sortedEntries.slice(0, 50);

        cache.clear();
        toKeep.forEach(([k, v]) => cache.set(k, v));
      }

      return value;
    },
    [computeFn, maxAge]
  );

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const invalidateKey = useCallback((key: K) => {
    cacheRef.current.delete(key);
  }, []);

  return { compute, clearCache, invalidateKey };
};

// Hook para otimizar re-renders com shallow comparison
export const useShallowMemo = <T>(value: T): T => {
  const ref = useRef<T>(value);

  const isEqual = useMemo(() => {
    if (typeof value !== "object" || value === null) {
      return value === ref.current;
    }

    if (Array.isArray(value) && Array.isArray(ref.current)) {
      if (value.length !== ref.current.length) return false;
      return value.every((item, index) => item === ref.current[index]);
    }

    if (typeof value === "object" && typeof ref.current === "object") {
      const keys1 = Object.keys(value);
      const keys2 = Object.keys(ref.current);

      if (keys1.length !== keys2.length) return false;

      return keys1.every(
        (key) => (value as any)[key] === (ref.current as any)[key]
      );
    }

    return false;
  }, [value]);

  if (!isEqual) {
    ref.current = value;
  }

  return ref.current;
};

// Hook para lazy loading de dados
export const useLazyData = <T>(
  loadFn: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadedRef = useRef(false);

  const load = useCallback(async () => {
    if (loadedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const result = await loadFn();
      setData(result);
      loadedRef.current = true;
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadFn]);

  const reload = useCallback(async () => {
    loadedRef.current = false;
    await load();
  }, [load]);

  return { data, loading, error, load, reload };
};

import { useState } from "react";

// Fix missing import
export { useState };
