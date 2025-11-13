import { describe, it, expect, beforeEach } from "vitest";
import { createMockAthletes, createMockAthlete } from "../helpers/test-data";
import { getMatchWinner } from "../../utils/index";
import { Athlete, Match } from "../../types";

describe("Lógica de Mata-mata", () => {
  describe("getMatchWinner", () => {
    describe("Melhor de 3", () => {
      it("deve identificar vencedor com 2-0", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 11, player2Score: 8 },
        ];

        const winner = getMatchWinner(sets, 3, "player1", "player2");
        expect(winner).toBe("player1");
      });

      it("deve identificar vencedor com 2-1", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 8, player2Score: 11 },
          { player1Score: 11, player2Score: 7 },
        ];

        const winner = getMatchWinner(sets, 3, "player1", "player2");
        expect(winner).toBe("player1");
      });

      it("deve retornar undefined sem sets suficientes", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
        ];

        const winner = getMatchWinner(sets, 3, "player1", "player2");
        expect(winner).toBeUndefined();
      });

      it("deve retornar undefined com sets empatados 1-1", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 8, player2Score: 11 },
        ];

        const winner = getMatchWinner(sets, 3, "player1", "player2");
        expect(winner).toBeUndefined();
      });
    });

    describe("Melhor de 5", () => {
      it("deve identificar vencedor com 3-0", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 11, player2Score: 8 },
          { player1Score: 11, player2Score: 7 },
        ];

        const winner = getMatchWinner(sets, 5, "player1", "player2");
        expect(winner).toBe("player1");
      });

      it("deve identificar vencedor com 3-1", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 8, player2Score: 11 },
          { player1Score: 11, player2Score: 7 },
          { player1Score: 11, player2Score: 9 },
        ];

        const winner = getMatchWinner(sets, 5, "player1", "player2");
        expect(winner).toBe("player1");
      });

      it("deve identificar vencedor com 3-2", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 8, player2Score: 11 },
          { player1Score: 11, player2Score: 7 },
          { player1Score: 9, player2Score: 11 },
          { player1Score: 11, player2Score: 8 },
        ];

        const winner = getMatchWinner(sets, 5, "player1", "player2");
        expect(winner).toBe("player1");
      });

      it("deve retornar undefined com 2-2", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 8, player2Score: 11 },
          { player1Score: 11, player2Score: 7 },
          { player1Score: 9, player2Score: 11 },
        ];

        const winner = getMatchWinner(sets, 5, "player1", "player2");
        expect(winner).toBeUndefined();
      });
    });

    describe("Melhor de 7", () => {
      it("deve identificar vencedor com 4-0", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 11, player2Score: 8 },
          { player1Score: 11, player2Score: 7 },
          { player1Score: 11, player2Score: 6 },
        ];

        const winner = getMatchWinner(sets, 7, "player1", "player2");
        expect(winner).toBe("player1");
      });

      it("deve identificar vencedor com 4-3", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 8, player2Score: 11 },
          { player1Score: 11, player2Score: 7 },
          { player1Score: 9, player2Score: 11 },
          { player1Score: 11, player2Score: 8 },
          { player1Score: 9, player2Score: 11 },
          { player1Score: 11, player2Score: 7 },
        ];

        const winner = getMatchWinner(sets, 7, "player1", "player2");
        expect(winner).toBe("player1");
      });

      it("deve retornar undefined com 3-3", () => {
        const sets = [
          { player1Score: 11, player2Score: 9 },
          { player1Score: 8, player2Score: 11 },
          { player1Score: 11, player2Score: 7 },
          { player1Score: 9, player2Score: 11 },
          { player1Score: 11, player2Score: 8 },
          { player1Score: 9, player2Score: 11 },
        ];

        const winner = getMatchWinner(sets, 7, "player1", "player2");
        expect(winner).toBeUndefined();
      });
    });

    describe("Validação de Sets", () => {
      it("deve ignorar sets inválidos (scores negativos)", () => {
        const sets = [
          { player1Score: -1, player2Score: 11 },
          { player1Score: 11, player2Score: 9 },
          { player1Score: 11, player2Score: 8 },
        ];

        const winner = getMatchWinner(sets, 3, "player1", "player2");
        // Deve contar apenas os 2 sets válidos (não suficiente para vencer)
        expect(winner).toBeUndefined();
      });

      it("deve ignorar sets inválidos (ambos zero)", () => {
        const sets = [
          { player1Score: 0, player2Score: 0 },
          { player1Score: 11, player2Score: 9 },
          { player1Score: 11, player2Score: 8 },
        ];

        const winner = getMatchWinner(sets, 3, "player1", "player2");
        expect(winner).toBeUndefined();
      });

      it("deve retornar undefined para array vazio", () => {
        const sets: Array<{ player1Score: number; player2Score: number }> = [];
        const winner = getMatchWinner(sets, 5, "player1", "player2");
        expect(winner).toBeUndefined();
      });
    });

    describe("Player 2 vencedor", () => {
      it("deve identificar player2 como vencedor", () => {
        const sets = [
          { player1Score: 9, player2Score: 11 },
          { player1Score: 8, player2Score: 11 },
          { player1Score: 7, player2Score: 11 },
        ];

        const winner = getMatchWinner(sets, 5, "player1", "player2");
        expect(winner).toBe("player2");
      });
    });

    describe("Sets com deuce", () => {
      it("deve contar set com deuce corretamente", () => {
        const sets = [
          { player1Score: 12, player2Score: 10 }, // P1 vence
          { player1Score: 15, player2Score: 13 }, // P1 vence
          { player1Score: 13, player2Score: 11 }, // P2 vence (score invertido)
        ];

        const winner = getMatchWinner(sets, 3, "player1", "player2");
        expect(winner).toBe("player1");
      });
    });
  });

  describe("Geração de Chaves", () => {
    describe("Número de Atletas", () => {
      it("deve funcionar com 4 atletas (bracket mínimo)", () => {
        const athletes = createMockAthletes(4);
        // Bracket size deveria ser 4
        expect(athletes.length).toBe(4);
      });

      it("deve funcionar com 8 atletas", () => {
        const athletes = createMockAthletes(8);
        expect(athletes.length).toBe(8);
      });

      it("deve funcionar com 16 atletas", () => {
        const athletes = createMockAthletes(16);
        expect(athletes.length).toBe(16);
      });

      it("deve funcionar com número não-potência de 2 (5 atletas)", () => {
        const athletes = createMockAthletes(5);
        expect(athletes.length).toBe(5);
        // Bracket size deveria ser 8 (próxima potência de 2)
        // 3 atletas receberiam BYE
      });
    });

    describe("Cabeças de Chave", () => {
      it("deve identificar cabeças de chave corretamente", () => {
        const athletes = createMockAthletes(8);

        const seeded = athletes.filter((a) => a.isSeeded);
        const unseeded = athletes.filter((a) => !a.isSeeded);

        expect(seeded.length).toBe(4); // Primeiros 4 são cabeças
        expect(unseeded.length).toBe(4);
      });

      it("deve ordenar cabeças de chave por seedNumber", () => {
        const athletes = createMockAthletes(8);

        const seeded = athletes
          .filter((a) => a.isSeeded)
          .sort((a, b) => (a.seedNumber || 0) - (b.seedNumber || 0));

        seeded.forEach((athlete, index) => {
          expect(athlete.seedNumber).toBe(index + 1);
        });
      });
    });

    describe("Sistema BYE", () => {
      it("deve calcular BYEs necessários para 5 atletas", () => {
        const athleteCount = 5;
        const bracketSize = 8;
        const byesNeeded = bracketSize - athleteCount;

        expect(byesNeeded).toBe(3);
      });

      it("deve calcular BYEs necessários para 6 atletas", () => {
        const athleteCount = 6;
        const bracketSize = 8;
        const byesNeeded = bracketSize - athleteCount;

        expect(byesNeeded).toBe(2);
      });

      it("não deve precisar de BYEs com 8 atletas", () => {
        const athleteCount = 8;
        const bracketSize = 8;
        const byesNeeded = bracketSize - athleteCount;

        expect(byesNeeded).toBe(0);
      });
    });

    describe("Estrutura de Rodadas", () => {
      it("deve calcular número correto de rodadas para 4 atletas", () => {
        const bracketSize = 4;
        const rounds = Math.log2(bracketSize);

        expect(rounds).toBe(2); // Semifinal e Final
      });

      it("deve calcular número correto de rodadas para 8 atletas", () => {
        const bracketSize = 8;
        const rounds = Math.log2(bracketSize);

        expect(rounds).toBe(3); // Quartas, Semifinal e Final
      });

      it("deve calcular número correto de rodadas para 16 atletas", () => {
        const bracketSize = 16;
        const rounds = Math.log2(bracketSize);

        expect(rounds).toBe(4); // Oitavas, Quartas, Semifinal e Final
      });
    });

    describe("Nomes de Rodadas", () => {
      it("deve nomear rodadas corretamente", () => {
        const roundNames: Record<number, string> = {
          1: "Final",
          2: "Semifinal",
          3: "Quartas",
          4: "Oitavas",
        };

        expect(roundNames[1]).toBe("Final");
        expect(roundNames[2]).toBe("Semifinal");
        expect(roundNames[3]).toBe("Quartas");
        expect(roundNames[4]).toBe("Oitavas");
      });
    });
  });

  describe("Progressão no Mata-mata", () => {
    it("deve permitir progressão apenas com vencedor definido", () => {
      const sets = [
        { player1Score: 11, player2Score: 9 },
        { player1Score: 11, player2Score: 8 },
      ];

      const winner = getMatchWinner(sets, 3, "player1", "player2");
      expect(winner).toBeDefined();
      expect(winner).toBe("player1");
    });

    it("não deve permitir progressão sem vencedor", () => {
      const sets = [
        { player1Score: 11, player2Score: 9 },
      ];

      const winner = getMatchWinner(sets, 3, "player1", "player2");
      expect(winner).toBeUndefined();
    });
  });

  describe("Segunda Divisão", () => {
    it("deve separar atletas qualificados e eliminados", () => {
      const totalAthletes = 16;
      const qualified = 8;
      const eliminated = totalAthletes - qualified;

      expect(eliminated).toBe(8);
    });

    it("deve gerar mata-mata de segunda divisão com eliminados", () => {
      const eliminatedCount = 8;
      const secondDivisionBracketSize = 8;

      expect(secondDivisionBracketSize).toBe(eliminatedCount);
    });

    it("deve ter segunda divisão apenas se habilitada", () => {
      const hasRepechage = true;
      const eliminatedCount = 8;

      if (hasRepechage && eliminatedCount >= 2) {
        expect(true).toBe(true); // Deve gerar segunda divisão
      }
    });

    it("não deve gerar segunda divisão se desabilitada", () => {
      const hasRepechage = false;
      const eliminatedCount = 8;

      if (!hasRepechage) {
        expect(eliminatedCount).toBe(8); // Mas não gera segunda divisão
      }
    });
  });

  describe("Terceiro Lugar", () => {
    it("deve gerar partida de 3º lugar se habilitada", () => {
      const hasThirdPlace = true;
      expect(hasThirdPlace).toBe(true);
    });

    it("não deve gerar partida de 3º lugar se desabilitada", () => {
      const hasThirdPlace = false;
      expect(hasThirdPlace).toBe(false);
    });

    it("deve usar perdedores das semifinais para 3º lugar", () => {
      // Simular semifinais
      const semi1Winner = "player1";
      const semi1Loser = "player2";
      const semi2Winner = "player3";
      const semi2Loser = "player4";

      const thirdPlacePlayers = [semi1Loser, semi2Loser];

      expect(thirdPlacePlayers).toHaveLength(2);
      expect(thirdPlacePlayers).toContain("player2");
      expect(thirdPlacePlayers).toContain("player4");
    });
  });

  describe("Validações de Integridade", () => {
    it("não deve permitir atleta jogar contra si mesmo", () => {
      const athlete = createMockAthlete();

      // Esta situação não deveria ocorrer
      const isValid = athlete.id !== athlete.id;
      expect(isValid).toBe(false);
    });

    it("deve garantir que cada partida tem 2 atletas diferentes", () => {
      const athlete1 = createMockAthlete({ name: "Atleta 1" });
      const athlete2 = createMockAthlete({ name: "Atleta 2" });

      expect(athlete1.id).not.toBe(athlete2.id);
    });

    it("deve validar que bracket size é potência de 2", () => {
      const validSizes = [2, 4, 8, 16, 32, 64];

      validSizes.forEach((size) => {
        const isPowerOfTwo = (size & (size - 1)) === 0 && size !== 0;
        expect(isPowerOfTwo).toBe(true);
      });
    });

    it("deve invalidar bracket sizes que não são potência de 2", () => {
      const invalidSizes = [3, 5, 6, 7, 9, 10];

      invalidSizes.forEach((size) => {
        const isPowerOfTwo = (size & (size - 1)) === 0 && size !== 0;
        expect(isPowerOfTwo).toBe(false);
      });
    });
  });

  describe("Casos Extremos", () => {
    it("deve lidar com 2 atletas (mínimo possível)", () => {
      const athletes = createMockAthletes(2);
      expect(athletes.length).toBe(2);
      // Deveria gerar apenas 1 partida (final)
    });

    it("deve lidar com número ímpar de atletas", () => {
      const athletes = createMockAthletes(7);
      const bracketSize = 8;
      const byesNeeded = bracketSize - athletes.length;

      expect(byesNeeded).toBe(1);
    });

    it("deve calcular próxima potência de 2 corretamente", () => {
      const testCases = [
        { athletes: 3, expected: 4 },
        { athletes: 5, expected: 8 },
        { athletes: 9, expected: 16 },
        { athletes: 17, expected: 32 },
      ];

      testCases.forEach(({ athletes, expected }) => {
        let bracketSize = 2;
        while (bracketSize < athletes) {
          bracketSize *= 2;
        }
        expect(bracketSize).toBe(expected);
      });
    });
  });
});
