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

// Utilitários para validação de sets
export const isValidSet = (set: Set): boolean => {
  const { player1Score, player2Score } = set;

  // Mínimo de 11 pontos para vencer
  if (Math.max(player1Score, player2Score) < 11) return false;

  // Diferença mínima de 2 pontos
  if (Math.abs(player1Score - player2Score) < 2) return false;

  // Se empatado em 10-10, pode ir além de 11
  if (player1Score >= 10 && player2Score >= 10) {
    return Math.abs(player1Score - player2Score) === 2;
  }

  // Um dos jogadores deve ter exatamente 11 e o outro menos que 10
  return (
    (player1Score === 11 && player2Score <= 9) ||
    (player2Score === 11 && player1Score <= 9)
  );
};

export const getSetWinner = (set: Set): "player1" | "player2" | undefined => {
  if (!isValidSet(set)) return undefined;
  return set.player1Score > set.player2Score ? "player1" : "player2";
};

export const getMatchWinner = (
  sets: Set[],
  bestOf: 3 | 5 | 7
): string | undefined => {
  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  let player1Sets = 0;
  let player2Sets = 0;

  for (const set of sets) {
    const winner = getSetWinner(set);
    if (winner === "player1") player1Sets++;
    if (winner === "player2") player2Sets++;
  }

  if (player1Sets >= setsToWin) return "player1";
  if (player2Sets >= setsToWin) return "player2";
  return undefined;
};
