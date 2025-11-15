import {
  Athlete,
  Match,
  Group,
  Championship,
  TournamentConfig,
} from "../../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Cria um atleta mock para testes
 */
export function createMockAthlete(overrides?: Partial<Athlete>): Athlete {
  return {
    id: uuidv4(),
    name: "Atleta Teste",
    isSeeded: false,
    isVirtual: false,
    ...overrides,
  };
}

/**
 * Cria múltiplos atletas mock
 */
export function createMockAthletes(count: number): Athlete[] {
  return Array.from({ length: count }, (_, i) => {
    const isSeeded = i < 4; // Primeiros 4 são cabeças de chave
    const baseName = `Atleta ${String.fromCharCode(65 + (i % 26))}`;
    return createMockAthlete({
      name: baseName,
      isSeeded,
      seedNumber: isSeeded ? i + 1 : undefined,
    });
  });
}

/**
 * Cria uma partida mock
 */
export function createMockMatch(overrides?: Partial<Match>): Match {
  const athlete1 =
    overrides?.player1 || createMockAthlete({ name: "Jogador Alpha" });
  const athlete2 =
    overrides?.player2 || createMockAthlete({ name: "Jogador Beta" });

  const baseMatch = {
    id: uuidv4(),
    player1Id: overrides?.player1Id || athlete1.id,
    player2Id: overrides?.player2Id || athlete2.id,
    player1: athlete1,
    player2: athlete2,
    sets: [],
    isCompleted: false,
    phase: "groups" as const,
    timeoutsUsed: { player1: false, player2: false },
    createdAt: new Date(),
  };

  return {
    ...baseMatch,
    ...overrides,
  };
}

/**
 * Cria uma partida completa com sets
 */
export function createCompletedMatch(
  player1Id: string,
  player2Id: string,
  winnerId: string,
  bestOf: 3 | 5 | 7 = 5,
  player1?: Athlete,
  player2?: Athlete
): Match {
  const setsNeededToWin = Math.ceil(bestOf / 2);
  const sets = [];

  let player1Sets = 0;
  let player2Sets = 0;

  // Gerar sets até alguém vencer
  for (
    let i = 0;
    i < bestOf && Math.max(player1Sets, player2Sets) < setsNeededToWin;
    i++
  ) {
    const setWinner =
      winnerId === player1Id && player1Sets < setsNeededToWin
        ? player1Id
        : player2Id;

    if (setWinner === player1Id) {
      sets.push({
        player1Score: 11,
        player2Score: Math.floor(Math.random() * 9),
      });
      player1Sets++;
    } else {
      sets.push({
        player1Score: Math.floor(Math.random() * 9),
        player2Score: 11,
      });
      player2Sets++;
    }
  }

  // Criar atletas se não fornecidos
  const athlete1 =
    player1 || createMockAthlete({ id: player1Id, name: "Atleta Alpha" });
  const athlete2 =
    player2 || createMockAthlete({ id: player2Id, name: "Atleta Beta" });

  return {
    id: uuidv4(),
    player1Id,
    player2Id,
    player1: athlete1,
    player2: athlete2,
    sets,
    winnerId,
    isCompleted: true,
    phase: "groups",
    timeoutsUsed: { player1: false, player2: false },
    createdAt: new Date(),
    completedAt: new Date(),
  };
}

/**
 * Cria um grupo mock
 */
export function createMockGroup(
  athleteCount: number = 4,
  overrides?: Partial<Group>
): Group {
  const athletes = createMockAthletes(athleteCount);
  const matches: Match[] = [];

  // Gerar partidas todos contra todos
  for (let i = 0; i < athletes.length; i++) {
    for (let j = i + 1; j < athletes.length; j++) {
      matches.push(
        createMockMatch({
          player1Id: athletes[i].id,
          player2Id: athletes[j].id,
          player1: athletes[i],
          player2: athletes[j],
        })
      );
    }
  }

  return {
    id: uuidv4(),
    name: "Grupo A",
    athletes,
    matches,
    standings: [],
    qualificationSpots: 2,
    isCompleted: false,
    ...overrides,
  };
}

/**
 * Cria uma configuração de torneio mock
 */
export function createMockTournamentConfig(
  overrides?: Partial<TournamentConfig>
): TournamentConfig {
  return {
    name: "Torneio Teste",
    date: new Date(Date.now() + 86400000), // Amanhã
    groupSize: 4,
    qualificationSpotsPerGroup: 2,
    groupsBestOf: 5,
    knockoutBestOf: 5,
    hasThirdPlace: true,
    hasRepechage: false,
    ...overrides,
  };
}

/**
 * Cria um campeonato mock completo
 */
export function createMockChampionship(
  athleteCount: number = 16,
  overrides?: Partial<Championship>
): Championship {
  const athletes = createMockAthletes(athleteCount);
  const config = createMockTournamentConfig();

  return {
    id: uuidv4(),
    name: config.name,
    date: config.date,
    status: "created",
    groupSize: config.groupSize,
    qualificationSpotsPerGroup: config.qualificationSpotsPerGroup,
    groupsBestOf: config.groupsBestOf,
    knockoutBestOf: config.knockoutBestOf,
    hasThirdPlace: config.hasThirdPlace,
    hasRepechage: config.hasRepechage,
    athletes,
    totalAthletes: athletes.length,
    groups: [],
    knockoutBracket: [],
    totalMatches: 0,
    completedMatches: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Cria sets válidos para uma partida
 */
export function createValidSets(setsCount: number = 3) {
  return Array.from({ length: setsCount }, (_, i) => ({
    player1Score: i % 2 === 0 ? 11 : 9,
    player2Score: i % 2 === 0 ? 9 : 11,
  }));
}

/**
 * Cria sets inválidos para testes
 */
export function createInvalidSets() {
  return [
    { player1Score: 10, player2Score: 9 }, // Score muito baixo
    { player1Score: 11, player2Score: 11 }, // Empate sem diferença de 2
    { player1Score: 100, player2Score: 5 }, // Score muito alto
  ];
}
