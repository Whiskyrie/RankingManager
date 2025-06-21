// Tipos principais do sistema CBTM

export interface Athlete {
  id: string;
  name: string;
  isSeeded?: boolean;
  seedNumber?: number;
}

export interface Set {
  player1Score: number;
  player2Score: number;
  winner?: "player1" | "player2";
}

export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1?: Athlete;
  player2?: Athlete;
  sets: Set[];
  winner?: string;
  isWalkover?: boolean;
  walkoverWinner?: string;
  isCompleted: boolean;
  phase: "groups" | "knockout";
  groupId?: string;
  round?: string;
  position?: number;
  timeoutsUsed: {
    player1: boolean;
    player2: boolean;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface GroupStanding {
  athleteId: string;
  athlete: Athlete;
  matches: number;
  wins: number;
  losses: number;
  points: number; // Pontos na classificação (3 por vitória, 1 por empate se existir)
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsWon: number;
  pointsLost: number;
  pointsDiff: number;
  position: number;
  qualified: boolean;
}

export interface Group {
  id: string;
  name: string;
  athletes: Athlete[];
  matches: Match[];
  standings: GroupStanding[];
  qualificationSpots: number;
  isCompleted: boolean;
}

export interface KnockoutNode {
  id: string;
  round: string;
  position: number;
  match?: Match;
  advancesTo?: string; // ID do próximo nó
  player1Source?: {
    type: "group" | "knockout";
    sourceId: string;
    position: number;
  };
  player2Source?: {
    type: "group" | "knockout";
    sourceId: string;
    position: number;
  };
}

export interface Championship {
  id: string;
  name: string;
  date: Date;
  status: "created" | "groups" | "knockout" | "completed";

  // Configurações
  groupSize: 3 | 4 | 5;
  qualificationSpotsPerGroup: number;
  groupsBestOf: 3 | 5; // Melhor de 3 ou 5 sets para grupos
  knockoutBestOf: 3 | 5 | 7; // Melhor de 3, 5 ou 7 sets para mata-mata
  hasThirdPlace: boolean;
  hasRepechage: boolean;

  // Participantes
  athletes: Athlete[];
  totalAthletes: number;

  // Fases
  groups: Group[];
  knockoutBracket: KnockoutNode[];

  // Estatísticas
  totalMatches: number;
  completedMatches: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentConfig {
  name: string;
  date: Date;
  groupSize: 3 | 4 | 5;
  qualificationSpotsPerGroup: number;
  groupsBestOf: 3 | 5;
  knockoutBestOf: 3 | 5 | 7;
  hasThirdPlace: boolean;
  hasRepechage: boolean;
}

export interface MatchResult {
  matchId: string;
  sets: Set[];
  isWalkover?: boolean;
  walkoverWinner?: string;
  timeoutsUsed: {
    player1: boolean;
    player2: boolean;
  };
}

// Categorias oficiais CBTM
export const CATEGORIES = [
  "Absoluto Masculino",
  "Absoluto Feminino",
  "Sub-9 Masculino",
  "Sub-9 Feminino",
  "Sub-11 Masculino",
  "Sub-11 Feminino",
  "Sub-13 Masculino",
  "Sub-13 Feminino",
  "Sub-15 Masculino",
  "Sub-15 Feminino",
  "Sub-17 Masculino",
  "Sub-17 Feminino",
  "Sub-21 Masculino",
  "Sub-21 Feminino",
  "Veteranos 40+ Masculino",
  "Veteranos 40+ Feminino",
  "Veteranos 50+ Masculino",
  "Veteranos 50+ Feminino",
  "Veteranos 60+ Masculino",
  "Veteranos 60+ Feminino",
] as const;

export const PARALIMPIC_CLASSES = [
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
  "C7",
  "C8",
  "C9",
  "C10",
  "C11",
] as const;

export type CategoryType = (typeof CATEGORIES)[number];
export type ParalimpicClassType = (typeof PARALIMPIC_CLASSES)[number];

// Estados da aplicação
export interface AppState {
  currentChampionship?: Championship;
  championships: Championship[];
  isLoading: boolean;
  error?: string;
}

// Utilitários para validação de sets - CORRIGIDO
export const isValidSet = (set: Set): boolean => {
  const { player1Score, player2Score } = set;

  // Verificar se ambos os scores são números válidos
  if (isNaN(player1Score) || isNaN(player2Score)) return false;
  if (player1Score < 0 || player2Score < 0) return false;

  // Se ambos os scores são 0, considerar inválido
  if (player1Score === 0 && player2Score === 0) return false;

  // Mínimo de 11 pontos para vencer
  if (Math.max(player1Score, player2Score) < 11) return false;

  // Diferença mínima de 2 pontos
  if (Math.abs(player1Score - player2Score) < 2) return false;

  // Se empatado em 10-10 ou mais, deve ter diferença de exatamente 2
  if (player1Score >= 10 && player2Score >= 10) {
    return Math.abs(player1Score - player2Score) === 2;
  }

  // Um dos jogadores deve ter pelo menos 11 e diferença de pelo menos 2
  return (
    (player1Score >= 11 && player1Score - player2Score >= 2) ||
    (player2Score >= 11 && player2Score - player1Score >= 2)
  );
};

export const getSetWinner = (set: Set): "player1" | "player2" | undefined => {
  if (!isValidSet(set)) return undefined;
  return set.player1Score > set.player2Score ? "player1" : "player2";
};

// Função para determinar vencedor da partida - CORRIGIDA E UNIFICADA
export const getMatchWinner = (
  sets: Set[],
  bestOf: 3 | 5 | 7,
  player1Id?: string,
  player2Id?: string
): string | undefined => {
  if (sets.length === 0) return undefined;

  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  let player1Sets = 0;
  let player2Sets = 0;

  // Contar apenas sets válidos
  const validSets = sets.filter(isValidSet);

  for (const set of validSets) {
    const winner = getSetWinner(set);
    if (winner === "player1") player1Sets++;
    if (winner === "player2") player2Sets++;
  }

  // Verificar se algum jogador atingiu o número necessário de sets
  if (player1Sets >= setsToWin) {
    return player1Id || "player1";
  }
  if (player2Sets >= setsToWin) {
    return player2Id || "player2";
  }

  return undefined;
};

// Função auxiliar para verificar se uma partida está completa
export const isMatchComplete = (sets: Set[], bestOf: 3 | 5 | 7): boolean => {
  const winner = getMatchWinner(sets, bestOf);
  return winner !== undefined;
};

// Função para calcular estatísticas de uma partida
export interface MatchStats {
  totalSets: number;
  validSets: number;
  player1Sets: number;
  player2Sets: number;
  player1Points: number;
  player2Points: number;
  isComplete: boolean;
  winner?: "player1" | "player2";
}

export const calculateMatchStats = (
  sets: Set[],
  bestOf: 3 | 5 | 7
): MatchStats => {
  const validSets = sets.filter(isValidSet);
  let player1Sets = 0;
  let player2Sets = 0;
  let player1Points = 0;
  let player2Points = 0;

  validSets.forEach((set) => {
    const winner = getSetWinner(set);
    if (winner === "player1") player1Sets++;
    if (winner === "player2") player2Sets++;

    player1Points += set.player1Score;
    player2Points += set.player2Score;
  });

  const winner = getMatchWinner(sets, bestOf);

  return {
    totalSets: sets.length,
    validSets: validSets.length,
    player1Sets,
    player2Sets,
    player1Points,
    player2Points,
    isComplete: winner !== undefined,
    winner:
      winner === "player1"
        ? "player1"
        : winner === "player2"
        ? "player2"
        : undefined,
  };
};

// Função para validar configuração de campeonato
export const validateTournamentConfig = (
  config: Partial<TournamentConfig>
): string[] => {
  const errors: string[] = [];

  if (!config.name?.trim()) {
    errors.push("Nome do campeonato é obrigatório");
  }

  if (!config.date) {
    errors.push("Data do campeonato é obrigatória");
  }

  if (config.date && config.date < new Date()) {
    errors.push("Data do campeonato não pode ser no passado");
  }

  if (!config.groupSize || ![3, 4, 5].includes(config.groupSize)) {
    errors.push("Tamanho do grupo deve ser 3, 4 ou 5");
  }

  if (
    !config.qualificationSpotsPerGroup ||
    config.qualificationSpotsPerGroup < 1
  ) {
    errors.push("Número de classificados por grupo deve ser pelo menos 1");
  }

  if (
    config.groupSize &&
    config.qualificationSpotsPerGroup &&
    config.qualificationSpotsPerGroup >= config.groupSize
  ) {
    errors.push(
      "Número de classificados deve ser menor que o tamanho do grupo"
    );
  }

  if (!config.groupsBestOf || ![3, 5].includes(config.groupsBestOf)) {
    errors.push("Fase de grupos deve ser melhor de 3 ou 5 sets");
  }

  if (!config.knockoutBestOf || ![3, 5, 7].includes(config.knockoutBestOf)) {
    errors.push("Mata-mata deve ser melhor de 3, 5 ou 7 sets");
  }

  return errors;
};

// Tipos para relatórios e estatísticas
export interface TournamentReport {
  championship: Championship;
  totalMatches: number;
  completedMatches: number;
  pendingMatches: number;
  progressPercentage: number;
  groupsCompleted: number;
  totalGroups: number;
  qualifiedAthletes: Athlete[];
  eliminatedAthletes: Athlete[];
  topScorers: {
    athlete: Athlete;
    totalPoints: number;
    averagePointsPerSet: number;
  }[];
}

// Constantes para validação
export const VALIDATION_CONSTANTS = {
  MIN_SET_SCORE: 11,
  MIN_SCORE_DIFFERENCE: 2,
  OVERTIME_THRESHOLD: 10,
  MAX_ATHLETES_PER_GROUP: 5,
  MIN_ATHLETES_PER_GROUP: 3,
  POINTS_PER_WIN: 3,
  POINTS_PER_DRAW: 1, // Caso implementem empates no futuro
  POINTS_PER_LOSS: 0,
} as const;
