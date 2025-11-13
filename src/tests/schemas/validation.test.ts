import { describe, it, expect } from "vitest";
import {
  validateData,
  AthleteSchema,
  CreateAthleteSchema,
  SetResultSchema,
  MatchSchema,
  GroupSchema,
  TournamentConfigSchema,
  ChampionshipSchema,
  MatchResultSchema,
} from "../../schemas/validation";
import { ValidationError } from "../../lib/error-handler";
import { createMockAthlete, createMockMatch, createMockGroup, createMockChampionship } from "../helpers/test-data";
import { v4 as uuidv4 } from "uuid";

describe("Validation Schemas", () => {
  describe("AthleteSchema", () => {
    it("deve validar um atleta válido", () => {
      const athlete = {
        id: uuidv4(),
        name: "João Silva",
        isSeeded: false,
        isVirtual: false,
      };

      const result = validateData(AthleteSchema, athlete);
      expect(result).toEqual(athlete);
    });

    it("deve validar atleta com seed", () => {
      const athlete = {
        id: uuidv4(),
        name: "Maria Santos",
        isSeeded: true,
        seedNumber: 1,
        isVirtual: false,
      };

      const result = validateData(AthleteSchema, athlete);
      expect(result).toEqual(athlete);
    });

    it("deve falhar quando seed não tem número", () => {
      const athlete = {
        id: uuidv4(),
        name: "João Silva",
        isSeeded: true,
        isVirtual: false,
      };

      expect(() => validateData(AthleteSchema, athlete)).toThrow(ValidationError);
    });

    it("deve falhar com nome muito curto", () => {
      const athlete = {
        id: uuidv4(),
        name: "J",
        isSeeded: false,
        isVirtual: false,
      };

      expect(() => validateData(AthleteSchema, athlete)).toThrow(ValidationError);
    });

    it("deve falhar com nome inválido (números)", () => {
      const athlete = {
        id: uuidv4(),
        name: "João123",
        isSeeded: false,
        isVirtual: false,
      };

      expect(() => validateData(AthleteSchema, athlete)).toThrow(ValidationError);
    });

    it("deve remover espaços do nome", () => {
      const athlete = {
        id: uuidv4(),
        name: "  João Silva  ",
        isSeeded: false,
        isVirtual: false,
      };

      const result = validateData(AthleteSchema, athlete);
      expect(result.name).toBe("João Silva");
    });

    it("deve validar nome com hífen e apóstrofo", () => {
      const athlete = {
        id: uuidv4(),
        name: "Jean-Pierre D'Arcy",
        isSeeded: false,
        isVirtual: false,
      };

      const result = validateData(AthleteSchema, athlete);
      expect(result.name).toBe("Jean-Pierre D'Arcy");
    });
  });

  describe("CreateAthleteSchema", () => {
    it("deve validar criação de atleta sem ID", () => {
      const athlete = {
        name: "João Silva",
        isSeeded: false,
        isVirtual: false,
      };

      const result = validateData(CreateAthleteSchema, athlete);
      expect(result).toEqual(athlete);
      expect(result).not.toHaveProperty("id");
    });
  });

  describe("SetResultSchema", () => {
    it("deve validar set normal (11-9)", () => {
      const set = {
        player1Score: 11,
        player2Score: 9,
      };

      const result = validateData(SetResultSchema, set);
      expect(result).toEqual(set);
    });

    it("deve validar set com deuce (12-10)", () => {
      const set = {
        player1Score: 12,
        player2Score: 10,
      };

      const result = validateData(SetResultSchema, set);
      expect(result).toEqual(set);
    });

    it("deve validar set com deuce prolongado (15-13)", () => {
      const set = {
        player1Score: 15,
        player2Score: 13,
      };

      const result = validateData(SetResultSchema, set);
      expect(result).toEqual(set);
    });

    it("deve falhar com score muito baixo", () => {
      const set = {
        player1Score: 10,
        player2Score: 8,
      };

      expect(() => validateData(SetResultSchema, set)).toThrow(ValidationError);
    });

    it("deve falhar com diferença menor que 2 após 10-10", () => {
      const set = {
        player1Score: 11,
        player2Score: 10,
      };

      expect(() => validateData(SetResultSchema, set)).toThrow(ValidationError);
    });

    it("deve falhar com empate", () => {
      const set = {
        player1Score: 11,
        player2Score: 11,
      };

      expect(() => validateData(SetResultSchema, set)).toThrow(ValidationError);
    });

    it("deve falhar com score negativo", () => {
      const set = {
        player1Score: -1,
        player2Score: 11,
      };

      expect(() => validateData(SetResultSchema, set)).toThrow(ValidationError);
    });

    it("deve falhar com score muito alto", () => {
      const set = {
        player1Score: 100,
        player2Score: 11,
      };

      expect(() => validateData(SetResultSchema, set)).toThrow(ValidationError);
    });
  });

  describe("MatchSchema", () => {
    it("deve validar partida básica", () => {
      const match = createMockMatch();
      const result = validateData(MatchSchema, match);
      expect(result).toBeDefined();
    });

    it("deve validar partida completa com sets", () => {
      const match = createMockMatch({
        sets: [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 11, player2Score: 8 },
          { player1Score: 11, player2Score: 7 },
        ],
        isCompleted: true,
      });

      const result = validateData(MatchSchema, match);
      expect(result.isCompleted).toBe(true);
      expect(result.sets.length).toBe(3);
    });

    it("deve validar walkover", () => {
      const player1 = createMockAthlete();
      const player2 = createMockAthlete();

      const match = createMockMatch({
        player1Id: player1.id,
        player2Id: player2.id,
        player1,
        player2,
        isWalkover: true,
        walkoverWinnerId: player1.id,
      });

      const result = validateData(MatchSchema, match);
      expect(result.isWalkover).toBe(true);
      expect(result.walkoverWinnerId).toBe(player1.id);
    });

    it("deve falhar quando jogador joga contra si mesmo", () => {
      const player = createMockAthlete();
      const match = {
        id: uuidv4(),
        player1Id: player.id,
        player2Id: player.id,
        player1: player,
        player2: player,
        sets: [],
        isCompleted: false,
        phase: "groups" as const,
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };

      expect(() => validateData(MatchSchema, match)).toThrow(ValidationError);
    });

    it("deve falhar quando walkover não tem vencedor", () => {
      const match = createMockMatch({
        isWalkover: true,
        walkoverWinnerId: undefined,
      });

      expect(() => validateData(MatchSchema, match)).toThrow(ValidationError);
    });

    it("deve falhar quando vencedor do walkover não é um dos jogadores", () => {
      const match = createMockMatch({
        isWalkover: true,
        walkoverWinnerId: uuidv4(), // ID diferente
      });

      expect(() => validateData(MatchSchema, match)).toThrow(ValidationError);
    });

    it("deve validar timeouts", () => {
      const match = createMockMatch({
        timeoutsUsed: { player1: true, player2: false },
      });

      const result = validateData(MatchSchema, match);
      expect(result.timeoutsUsed.player1).toBe(true);
      expect(result.timeoutsUsed.player2).toBe(false);
    });
  });

  describe("GroupSchema", () => {
    it("deve validar grupo com 4 atletas", () => {
      const group = createMockGroup(4);
      const result = validateData(GroupSchema, group);
      expect(result.athletes.length).toBe(4);
    });

    it("deve validar grupo com 3 atletas", () => {
      const group = createMockGroup(3);
      const result = validateData(GroupSchema, group);
      expect(result.athletes.length).toBe(3);
    });

    it("deve validar grupo com 5 atletas", () => {
      const group = createMockGroup(5);
      const result = validateData(GroupSchema, group);
      expect(result.athletes.length).toBe(5);
    });

    it("deve falhar com menos de 3 atletas", () => {
      const group = createMockGroup(2);
      expect(() => validateData(GroupSchema, group)).toThrow(ValidationError);
    });

    it("deve falhar com mais de 5 atletas", () => {
      const group = createMockGroup(6);
      expect(() => validateData(GroupSchema, group)).toThrow(ValidationError);
    });

    it("deve falhar quando vagas >= número de atletas", () => {
      const group = createMockGroup(4, {
        qualificationSpots: 4,
      });

      expect(() => validateData(GroupSchema, group)).toThrow(ValidationError);
    });
  });

  describe("TournamentConfigSchema", () => {
    it("deve validar configuração válida", () => {
      const config = {
        name: "Torneio Teste",
        date: new Date(Date.now() + 86400000), // Amanhã
        groupSize: 4 as const,
        qualificationSpotsPerGroup: 2,
        groupsBestOf: 5 as const,
        knockoutBestOf: 5 as const,
        hasThirdPlace: true,
        hasRepechage: false,
      };

      const result = validateData(TournamentConfigSchema, config);
      expect(result).toBeDefined();
      expect(result.name).toBe("Torneio Teste");
    });

    it("deve validar diferentes tamanhos de grupo", () => {
      const configs = [3, 4, 5].map((size) => ({
        name: "Teste",
        date: new Date(Date.now() + 86400000),
        groupSize: size as 3 | 4 | 5,
        qualificationSpotsPerGroup: 2,
        groupsBestOf: 5 as const,
        knockoutBestOf: 5 as const,
        hasThirdPlace: true,
        hasRepechage: false,
      }));

      configs.forEach((config) => {
        const result = validateData(TournamentConfigSchema, config);
        expect(result.groupSize).toBe(config.groupSize);
      });
    });

    it("deve validar melhor de 3, 5 e 7", () => {
      const bestOfs: Array<3 | 5 | 7> = [3, 5, 7];

      bestOfs.forEach((bestOf) => {
        const config = {
          name: "Teste",
          date: new Date(Date.now() + 86400000),
          groupSize: 4 as const,
          qualificationSpotsPerGroup: 2,
          groupsBestOf: 5 as const,
          knockoutBestOf: bestOf,
          hasThirdPlace: true,
          hasRepechage: false,
        };

        const result = validateData(TournamentConfigSchema, config);
        expect(result.knockoutBestOf).toBe(bestOf);
      });
    });

    it("deve falhar com tamanho de grupo inválido", () => {
      const config = {
        name: "Teste",
        date: new Date(Date.now() + 86400000),
        groupSize: 6,
        qualificationSpotsPerGroup: 2,
        groupsBestOf: 5,
        knockoutBestOf: 5,
        hasThirdPlace: true,
        hasRepechage: false,
      };

      expect(() => validateData(TournamentConfigSchema, config)).toThrow(ValidationError);
    });

    it("deve falhar quando classificados >= tamanho do grupo", () => {
      const config = {
        name: "Teste",
        date: new Date(Date.now() + 86400000),
        groupSize: 4 as const,
        qualificationSpotsPerGroup: 4,
        groupsBestOf: 5 as const,
        knockoutBestOf: 5 as const,
        hasThirdPlace: true,
        hasRepechage: false,
      };

      expect(() => validateData(TournamentConfigSchema, config)).toThrow(ValidationError);
    });

    it("deve remover espaços do nome", () => {
      const config = {
        name: "  Torneio Teste  ",
        date: new Date(Date.now() + 86400000),
        groupSize: 4 as const,
        qualificationSpotsPerGroup: 2,
        groupsBestOf: 5 as const,
        knockoutBestOf: 5 as const,
        hasThirdPlace: true,
        hasRepechage: false,
      };

      const result = validateData(TournamentConfigSchema, config);
      expect(result.name).toBe("Torneio Teste");
    });
  });

  describe("ChampionshipSchema", () => {
    it("deve validar campeonato completo", () => {
      const championship = createMockChampionship(16);
      const result = validateData(ChampionshipSchema, championship);
      expect(result.totalAthletes).toBe(16);
    });

    it("deve falhar quando totalAthletes não bate com array", () => {
      const championship = createMockChampionship(16, {
        totalAthletes: 20, // Incorreto
      });

      expect(() => validateData(ChampionshipSchema, championship)).toThrow(ValidationError);
    });

    it("deve falhar quando completadas > total", () => {
      const championship = createMockChampionship(16, {
        totalMatches: 10,
        completedMatches: 15, // Impossível
      });

      expect(() => validateData(ChampionshipSchema, championship)).toThrow(ValidationError);
    });

    it("deve validar diferentes status", () => {
      const statuses: Array<"created" | "groups" | "knockout" | "completed"> = [
        "created",
        "groups",
        "knockout",
        "completed",
      ];

      statuses.forEach((status) => {
        const championship = createMockChampionship(16, { status });
        const result = validateData(ChampionshipSchema, championship);
        expect(result.status).toBe(status);
      });
    });
  });

  describe("MatchResultSchema", () => {
    it("deve validar resultado de partida", () => {
      const result = {
        matchId: uuidv4(),
        sets: [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 11, player2Score: 8 },
          { player1Score: 11, player2Score: 7 },
        ],
        timeoutsUsed: { player1: false, player2: false },
      };

      const validated = validateData(MatchResultSchema, result);
      expect(validated.sets.length).toBe(3);
    });

    it("deve validar resultado com walkover", () => {
      const winnerId = uuidv4();
      const result = {
        matchId: uuidv4(),
        sets: [],
        isWalkover: true,
        walkoverWinnerId: winnerId,
      };

      const validated = validateData(MatchResultSchema, result);
      expect(validated.isWalkover).toBe(true);
      expect(validated.walkoverWinnerId).toBe(winnerId);
    });

    it("deve falhar quando walkover sem vencedor", () => {
      const result = {
        matchId: uuidv4(),
        sets: [],
        isWalkover: true,
      };

      expect(() => validateData(MatchResultSchema, result)).toThrow(ValidationError);
    });
  });
});
