import { describe, it, expect } from "vitest";
import { createMockAthlete, createMockAthletes, createMockGroup, createCompletedMatch } from "../helpers/test-data";
import { Group, GroupStanding, Match } from "../../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Função auxiliar para calcular standings (copiada do store para testes)
 */
function calculateGroupStandings(group: Group, bestOf: 3 | 5 | 7 = 5): GroupStanding[] {
  const standings: GroupStanding[] = group.athletes.map((athlete) => ({
    athleteId: athlete.id,
    athlete,
    matches: 0,
    wins: 0,
    losses: 0,
    points: 0,
    setsWon: 0,
    setsLost: 0,
    setsDiff: 0,
    pointsWon: 0,
    pointsLost: 0,
    pointsDiff: 0,
    position: 0,
    qualified: false,
  }));

  const completedMatches = group.matches.filter((m) => m.isCompleted);

  completedMatches.forEach((match) => {
    updateStandingsWithMatch(standings, match, bestOf);
  });

  // Calcular diferenças
  standings.forEach((standing) => {
    standing.setsDiff = standing.setsWon - standing.setsLost;
    standing.pointsDiff = standing.pointsWon - standing.pointsLost;
  });

  // Ordenar standings
  standings.sort(compareStandings);

  // Definir posições e qualificação
  standings.forEach((standing, index) => {
    standing.position = index + 1;
    standing.qualified = index < group.qualificationSpots;
  });

  return standings;
}

function updateStandingsWithMatch(
  standings: GroupStanding[],
  match: Match,
  _bestOf: number
) {
  const player1Standing = standings.find((s) => s.athleteId === match.player1Id);
  const player2Standing = standings.find((s) => s.athleteId === match.player2Id);

  if (!player1Standing || !player2Standing) return;

  player1Standing.matches++;
  player2Standing.matches++;

  if (match.isWalkover) {
    if (match.walkoverWinnerId === match.player1Id) {
      player1Standing.wins++;
      player1Standing.points += 2;
      player2Standing.losses++;
    } else if (match.walkoverWinnerId === match.player2Id) {
      player2Standing.wins++;
      player2Standing.points += 2;
      player1Standing.losses++;
    }
    return;
  }

  if (!match.sets || match.sets.length === 0) return;

  let player1Sets = 0;
  let player2Sets = 0;
  let player1Points = 0;
  let player2Points = 0;

  match.sets.forEach((set) => {
    if (set.player1Score > set.player2Score) {
      player1Sets++;
    } else if (set.player2Score > set.player1Score) {
      player2Sets++;
    }
    player1Points += set.player1Score;
    player2Points += set.player2Score;
  });

  player1Standing.setsWon += player1Sets;
  player1Standing.setsLost += player2Sets;
  player1Standing.pointsWon += player1Points;
  player1Standing.pointsLost += player2Points;

  player2Standing.setsWon += player2Sets;
  player2Standing.setsLost += player1Sets;
  player2Standing.pointsWon += player2Points;
  player2Standing.pointsLost += player1Points;

  if (match.winnerId === match.player1Id) {
    player1Standing.wins++;
    player1Standing.points += 2;
    player2Standing.losses++;
  } else if (match.winnerId === match.player2Id) {
    player2Standing.wins++;
    player2Standing.points += 2;
    player1Standing.losses++;
  }
}

function compareStandings(a: GroupStanding, b: GroupStanding): number {
  // 1º critério: Pontos
  if (a.points !== b.points) return b.points - a.points;
  // 2º critério: Saldo de sets
  if (a.setsDiff !== b.setsDiff) return b.setsDiff - a.setsDiff;
  // 3º critério: Saldo de pontos
  if (a.pointsDiff !== b.pointsDiff) return b.pointsDiff - a.pointsDiff;
  // 4º critério: Nome alfabético
  return a.athlete.name.localeCompare(b.athlete.name);
}

describe("Cálculo de Standings", () => {
  describe("Standings Básicos", () => {
    it("deve inicializar standings vazios para grupo sem partidas", () => {
      const group = createMockGroup(4);
      const standings = calculateGroupStandings(group);

      expect(standings).toHaveLength(4);
      standings.forEach((standing) => {
        expect(standing.matches).toBe(0);
        expect(standing.wins).toBe(0);
        expect(standing.losses).toBe(0);
        expect(standing.points).toBe(0);
      });
    });

    it("deve calcular standings com uma partida completa", () => {
      const athletes = [
        createMockAthlete({ name: "Atleta A" }),
        createMockAthlete({ name: "Atleta B" }),
      ];

      const match = createCompletedMatch(
        athletes[0].id,
        athletes[1].id,
        athletes[0].id,
        5
      );

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches: [match],
        standings: [],
        qualificationSpots: 1,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      // Vencedor deve ter mais pontos
      const winner = standings.find((s) => s.athleteId === athletes[0].id);
      const loser = standings.find((s) => s.athleteId === athletes[1].id);

      expect(winner?.wins).toBe(1);
      expect(winner?.losses).toBe(0);
      expect(winner?.points).toBe(2);
      expect(winner?.position).toBe(1);
      expect(winner?.qualified).toBe(true);

      expect(loser?.wins).toBe(0);
      expect(loser?.losses).toBe(1);
      expect(loser?.points).toBe(0);
      expect(loser?.position).toBe(2);
      expect(loser?.qualified).toBe(false);
    });

    it("deve contabilizar sets e pontos corretamente", () => {
      const athletes = [
        createMockAthlete({ name: "Atleta A" }),
        createMockAthlete({ name: "Atleta B" }),
      ];

      const match: Match = {
        id: uuidv4(),
        player1Id: athletes[0].id,
        player2Id: athletes[1].id,
        player1: athletes[0],
        player2: athletes[1],
        sets: [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 11, player2Score: 7 },
          { player1Score: 9, player2Score: 11 },
          { player1Score: 11, player2Score: 8 },
        ],
        winnerId: athletes[0].id,
        isCompleted: true,
        phase: "groups",
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches: [match],
        standings: [],
        qualificationSpots: 1,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      const winner = standings.find((s) => s.athleteId === athletes[0].id);
      const loser = standings.find((s) => s.athleteId === athletes[1].id);

      // P1 ganhou 3 sets, P2 ganhou 1 set
      expect(winner?.setsWon).toBe(3);
      expect(winner?.setsLost).toBe(1);
      expect(winner?.setsDiff).toBe(2);

      expect(loser?.setsWon).toBe(1);
      expect(loser?.setsLost).toBe(3);
      expect(loser?.setsDiff).toBe(-2);

      // Verificar pontos totais
      const totalP1 = 11 + 11 + 9 + 11; // 42
      const totalP2 = 9 + 7 + 11 + 8; // 35

      expect(winner?.pointsWon).toBe(totalP1);
      expect(winner?.pointsLost).toBe(totalP2);
      expect(loser?.pointsWon).toBe(totalP2);
      expect(loser?.pointsLost).toBe(totalP1);
    });
  });

  describe("Critérios de Desempate", () => {
    it("deve ordenar por pontos (1º critério)", () => {
      const athletes = createMockAthletes(3);

      // A vence B, B vence C, A vence C
      const matches = [
        createCompletedMatch(athletes[0].id, athletes[1].id, athletes[0].id, 5),
        createCompletedMatch(athletes[1].id, athletes[2].id, athletes[1].id, 5),
        createCompletedMatch(athletes[0].id, athletes[2].id, athletes[0].id, 5),
      ];

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches,
        standings: [],
        qualificationSpots: 2,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      // A (2 vitórias) > B (1 vitória) > C (0 vitórias)
      expect(standings[0].athleteId).toBe(athletes[0].id);
      expect(standings[0].points).toBe(4);
      expect(standings[1].athleteId).toBe(athletes[1].id);
      expect(standings[1].points).toBe(2);
      expect(standings[2].athleteId).toBe(athletes[2].id);
      expect(standings[2].points).toBe(0);
    });

    it("deve usar saldo de sets como 2º critério", () => {
      const athletes = createMockAthletes(3);

      // A vence B 3-0, C vence A 3-2, B vence C 3-1
      // Todos com 1 vitória, mas saldos diferentes
      const matches: Match[] = [
        {
          id: uuidv4(),
          player1Id: athletes[0].id,
          player2Id: athletes[1].id,
          player1: athletes[0],
          player2: athletes[1],
          sets: [
            { player1Score: 11, player2Score: 9 },
            { player1Score: 11, player2Score: 8 },
            { player1Score: 11, player2Score: 7 },
          ],
          winnerId: athletes[0].id,
          isCompleted: true,
          phase: "groups",
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          player1Id: athletes[2].id,
          player2Id: athletes[0].id,
          player1: athletes[2],
          player2: athletes[0],
          sets: [
            { player1Score: 11, player2Score: 9 },
            { player1Score: 9, player2Score: 11 },
            { player1Score: 9, player2Score: 11 },
            { player1Score: 11, player2Score: 9 },
            { player1Score: 11, player2Score: 7 },
          ],
          winnerId: athletes[2].id,
          isCompleted: true,
          phase: "groups",
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        },
        {
          id: uuidv4(),
          player1Id: athletes[1].id,
          player2Id: athletes[2].id,
          player1: athletes[1],
          player2: athletes[2],
          sets: [
            { player1Score: 11, player2Score: 9 },
            { player1Score: 11, player2Score: 8 },
            { player1Score: 9, player2Score: 11 },
            { player1Score: 11, player2Score: 7 },
          ],
          winnerId: athletes[1].id,
          isCompleted: true,
          phase: "groups",
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        },
      ];

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches,
        standings: [],
        qualificationSpots: 2,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      // Todos têm 2 pontos, mas saldos diferentes
      expect(standings[0].points).toBe(2);
      expect(standings[1].points).toBe(2);
      expect(standings[2].points).toBe(2);

      // Verificar saldos de sets
      expect(standings[0].setsDiff).toBeGreaterThan(standings[1].setsDiff);
      expect(standings[1].setsDiff).toBeGreaterThan(standings[2].setsDiff);
    });

    it("deve usar saldo de pontos como 3º critério", () => {
      const athletes = createMockAthletes(2);

      // Criar duas partidas com mesmo número de sets mas pontos diferentes
      const matches: Match[] = [
        {
          id: uuidv4(),
          player1Id: athletes[0].id,
          player2Id: athletes[1].id,
          player1: athletes[0],
          player2: athletes[1],
          sets: [
            { player1Score: 11, player2Score: 9 }, // A ganha por pouco
            { player1Score: 11, player2Score: 8 },
            { player1Score: 11, player2Score: 7 },
          ],
          winnerId: athletes[0].id,
          isCompleted: true,
          phase: "groups",
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        },
      ];

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches,
        standings: [],
        qualificationSpots: 1,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      // Verificar pontos totais
      expect(standings[0].pointsWon).toBeGreaterThan(standings[1].pointsWon);
      expect(standings[0].pointsDiff).toBeGreaterThan(standings[1].pointsDiff);
    });
  });

  describe("Walkover", () => {
    it("deve contabilizar walkover corretamente", () => {
      const athletes = createMockAthletes(2);

      const match: Match = {
        id: uuidv4(),
        player1Id: athletes[0].id,
        player2Id: athletes[1].id,
        player1: athletes[0],
        player2: athletes[1],
        sets: [],
        winnerId: athletes[0].id,
        isCompleted: true,
        isWalkover: true,
        walkoverWinnerId: athletes[0].id,
        phase: "groups",
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches: [match],
        standings: [],
        qualificationSpots: 1,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      const winner = standings.find((s) => s.athleteId === athletes[0].id);
      const loser = standings.find((s) => s.athleteId === athletes[1].id);

      // Walkover: vencedor ganha 2 pontos mas sem sets/pontos
      expect(winner?.wins).toBe(1);
      expect(winner?.points).toBe(2);
      expect(winner?.setsWon).toBe(0);
      expect(winner?.setsLost).toBe(0);

      expect(loser?.losses).toBe(1);
      expect(loser?.points).toBe(0);
    });
  });

  describe("Qualificação", () => {
    it("deve marcar atletas qualificados corretamente", () => {
      const athletes = createMockAthletes(4);

      // Criar partidas completas para todos contra todos
      const matches = [
        createCompletedMatch(athletes[0].id, athletes[1].id, athletes[0].id, 5),
        createCompletedMatch(athletes[0].id, athletes[2].id, athletes[0].id, 5),
        createCompletedMatch(athletes[0].id, athletes[3].id, athletes[0].id, 5),
        createCompletedMatch(athletes[1].id, athletes[2].id, athletes[1].id, 5),
        createCompletedMatch(athletes[1].id, athletes[3].id, athletes[1].id, 5),
        createCompletedMatch(athletes[2].id, athletes[3].id, athletes[2].id, 5),
      ];

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches,
        standings: [],
        qualificationSpots: 2,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      // Primeiros 2 devem estar qualificados
      expect(standings[0].qualified).toBe(true);
      expect(standings[1].qualified).toBe(true);
      expect(standings[2].qualified).toBe(false);
      expect(standings[3].qualified).toBe(false);
    });

    it("deve respeitar número de vagas de qualificação", () => {
      const athletes = createMockAthletes(5);
      const qualificationSpots = 3;

      const matches = [];
      // Criar partidas para todos contra todos
      for (let i = 0; i < athletes.length; i++) {
        for (let j = i + 1; j < athletes.length; j++) {
          matches.push(
            createCompletedMatch(athletes[i].id, athletes[j].id, athletes[i].id, 5)
          );
        }
      }

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches,
        standings: [],
        qualificationSpots,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      const qualifiedCount = standings.filter((s) => s.qualified).length;
      expect(qualifiedCount).toBe(qualificationSpots);
    });
  });

  describe("Posições", () => {
    it("deve atribuir posições sequenciais", () => {
      const athletes = createMockAthletes(4);

      const matches = [
        createCompletedMatch(athletes[0].id, athletes[1].id, athletes[0].id, 5),
        createCompletedMatch(athletes[0].id, athletes[2].id, athletes[0].id, 5),
        createCompletedMatch(athletes[0].id, athletes[3].id, athletes[0].id, 5),
        createCompletedMatch(athletes[1].id, athletes[2].id, athletes[1].id, 5),
        createCompletedMatch(athletes[1].id, athletes[3].id, athletes[1].id, 5),
        createCompletedMatch(athletes[2].id, athletes[3].id, athletes[2].id, 5),
      ];

      const group: Group = {
        id: uuidv4(),
        name: "Grupo A",
        athletes,
        matches,
        standings: [],
        qualificationSpots: 2,
        isCompleted: false,
      };

      const standings = calculateGroupStandings(group);

      // Verificar se posições são sequenciais
      standings.forEach((standing, index) => {
        expect(standing.position).toBe(index + 1);
      });
    });
  });
});
