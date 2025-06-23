// Tipos principais do sistema CBTM
export type AthleteID = string;
export interface Athlete {
  id: AthleteID;
  name: string;
  isSeeded?: boolean;
  seedNumber?: number;
}

export interface SetResult {
  player1Score: number;
  player2Score: number;
  winnerId?: AthleteID;
}
export type Phase = "groups" | "knockout";

export interface Match {
  id: string;
  player1Id: AthleteID;
  player2Id: AthleteID;
  player1?: Athlete;
  player2?: Athlete;
  sets: SetResult[];
  winnerId?: AthleteID;
  isWalkover?: boolean;
  walkoverWinnerId?: AthleteID;
  isCompleted: boolean;
  phase: Phase;
  groupId?: string;
  round?: string;
  position?: number;
  isThirdPlace?: boolean;
  timeoutsUsed: {
    player1: boolean;
    player2: boolean;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface GroupStanding {
  athleteId: AthleteID;
  athlete: Athlete;
  matches: number;
  wins: number;
  losses: number;
  points: number;
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
  advancesTo?: string;
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
  date: Date | string; // ✅ CORREÇÃO: Permitir string também para flexibilidade
  status: "created" | "groups" | "knockout" | "completed";
  groupSize: 3 | 4 | 5;
  qualificationSpotsPerGroup: number;
  groupsBestOf: 3 | 5;
  knockoutBestOf: 3 | 5 | 7;
  hasThirdPlace: boolean;
  hasRepechage: boolean;
  athletes: Athlete[];
  totalAthletes: number;
  groups: Group[];
  knockoutBracket: KnockoutNode[];
  totalMatches: number;
  completedMatches: number;
  createdAt: Date | string; // ✅ CORREÇÃO: Permitir string também
  updatedAt: Date | string; // ✅ CORREÇÃO: Permitir string também
}

export interface TournamentConfig {
  name: string;
  date: Date | string; // ✅ CORREÇÃO: Permitir string também
  groupSize: 3 | 4 | 5;
  qualificationSpotsPerGroup: number;
  groupsBestOf: 3 | 5;
  knockoutBestOf: 3 | 5 | 7;
  hasThirdPlace: boolean;
  hasRepechage: boolean;
}
export interface MatchResult {
  matchId: string;
  sets: SetResult[];
  isWalkover?: boolean;
  walkoverWinnerId?: AthleteID;
  timeoutsUsed: {
    player1: boolean;
    player2: boolean;
  };
}

// Estados da aplicação
export interface AppState {
  currentChampionship?: Championship;
  championships: Championship[];
  isLoading: boolean;
  error?: string;
}

// Utilitários para validação de sets - CORRIGIDO
export const isValidSet = (set: SetResult): boolean => {
  const { player1Score, player2Score } = set;
  if (player1Score < 0 || player2Score < 0) return false;
  if (player1Score === 0 && player2Score === 0) return false;
  const maxScore = Math.max(player1Score, player2Score);
  const diff = Math.abs(player1Score - player2Score);
  if (maxScore < 11) return false;
  if (player1Score >= 10 && player2Score >= 10) {
    return diff === 2;
  }
  return diff >= 2;
};

export const getSetWinner = (set: SetResult): AthleteID | undefined => {
  if (!isValidSet(set)) return undefined;
  return set.player1Score > set.player2Score
    ? set.winnerId || undefined
    : set.winnerId || undefined;
};

// Função para determinar vencedor da partida - CORRIGIDA E UNIFICADA
export const getMatchWinner = (
  sets: SetResult[],
  bestOf: 3 | 5 | 7,
  player1Id: AthleteID,
  player2Id: AthleteID
): AthleteID | undefined => {
  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  let p1 = 0;
  let p2 = 0;
  for (const set of sets) {
    if (!isValidSet(set)) continue;
    if (set.player1Score > set.player2Score) p1++;
    else p2++;
    if (p1 === setsToWin) return player1Id;
    if (p2 === setsToWin) return player2Id;
  }
  return undefined;
};
// Função auxiliar para verificar se uma partida está completa
export const isMatchComplete = (
  sets: SetResult[],
  bestOf: 3 | 5 | 7
): boolean => getMatchWinner(sets, bestOf, "", "") !== undefined;

// Função para calcular estatísticas de uma partida
export interface MatchStats {
  totalSets: number;
  validSets: number;
  player1Sets: number;
  player2Sets: number;
  player1Points: number;
  player2Points: number;
  isComplete: boolean;
  winnerId?: AthleteID;
}

export const calculateMatchStats = (
  sets: SetResult[],
  bestOf: 3 | 5 | 7,
  player1Id: AthleteID,
  player2Id: AthleteID
): MatchStats => {
  const valid = sets.filter(isValidSet);
  let p1s = 0;
  let p2s = 0;
  let p1p = 0;
  let p2p = 0;
  for (const s of valid) {
    if (s.player1Score > s.player2Score) p1s++;
    else p2s++;
    p1p += s.player1Score;
    p2p += s.player2Score;
  }
  const winnerId = getMatchWinner(sets, bestOf, player1Id, player2Id);
  return {
    totalSets: sets.length,
    validSets: valid.length,
    player1Sets: p1s,
    player2Sets: p2s,
    player1Points: p1p,
    player2Points: p2p,
    isComplete: !!winnerId,
    winnerId,
  };
};
export const validateTournamentConfig = (
  config: Partial<TournamentConfig>
): string[] => {
  const errors: string[] = [];
  if (!config.name?.trim()) errors.push("Nome é obrigatório.");
  if (!config.date) errors.push("Data é obrigatória.");
  if (config.date && config.date < new Date())
    errors.push("Data no passado não permitted.");
  if (![3, 4, 5].includes(config.groupSize!))
    errors.push("Tamanho de grupo inválido.");
  if (![3, 5, 7].includes(config.knockoutBestOf!))
    errors.push("Formato de mata-mata inválido.");
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
  POINTS_PER_LOSS: 0,
} as const;
