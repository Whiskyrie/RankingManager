import { Match, MatchResult, Championship, SetResult } from "../types";
import { getMatchWinner } from "../utils";

/**
 * Service para gerenciar lógica de partidas
 */
export class MatchService {
  /**
   * Atualiza uma partida com novo resultado
   */
  static updateMatchResult(
    championship: Championship,
    result: MatchResult
  ): Championship {
    const updatedChampionship = { ...championship };
    let matchFound = false;

    // Encontrar e atualizar a partida
    for (const group of updatedChampionship.groups) {
      const matchIndex = group.matches.findIndex((m) => m.id === result.matchId);

      if (matchIndex !== -1) {
        const match = group.matches[matchIndex];

        // Determinar vencedor
        const winnerId = result.isWalkover
          ? result.walkoverWinnerId
          : getMatchWinner(
              result.sets,
              match.phase === "groups"
                ? updatedChampionship.groupsBestOf
                : updatedChampionship.knockoutBestOf,
              match.player1Id,
              match.player2Id
            );

        // Atualizar partida
        group.matches[matchIndex] = {
          ...match,
          sets: result.sets,
          winnerId,
          isCompleted: !!winnerId,
          isWalkover: result.isWalkover || false,
          walkoverWinnerId: result.walkoverWinnerId,
          timeoutsUsed: result.timeoutsUsed,
          completedAt: new Date(),
        };

        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      throw new Error("Partida não encontrada");
    }

    // Recalcular contadores
    const allMatches = updatedChampionship.groups.flatMap((g) => g.matches);
    const validMatches = allMatches.filter(
      (m) => m.player1?.id && m.player2?.id && m.player1.id !== m.player2.id
    );

    updatedChampionship.totalMatches = validMatches.length;
    updatedChampionship.completedMatches = validMatches.filter(
      (m) => m.isCompleted
    ).length;
    updatedChampionship.updatedAt = new Date();

    return updatedChampionship;
  }

  /**
   * Define walkover para uma partida
   */
  static setWalkover(
    championship: Championship,
    matchId: string,
    winnerId: string
  ): Championship {
    const result: MatchResult = {
      matchId,
      sets: [],
      isWalkover: true,
      walkoverWinnerId: winnerId,
      timeoutsUsed: { player1: false, player2: false },
    };

    return this.updateMatchResult(championship, result);
  }

  /**
   * Valida se um set é válido segundo as regras de tênis de mesa
   */
  static isValidSet(set: SetResult): boolean {
    const { player1Score, player2Score } = set;

    // Verificar se ambos os scores são válidos
    if (
      isNaN(player1Score) ||
      isNaN(player2Score) ||
      player1Score < 0 ||
      player2Score < 0
    ) {
      return false;
    }

    // Se ambos são zero, é inválido
    if (player1Score === 0 && player2Score === 0) {
      return false;
    }

    // Um dos jogadores deve ter pelo menos 11 pontos
    const maxScore = Math.max(player1Score, player2Score);
    const minScore = Math.min(player1Score, player2Score);

    if (maxScore < 11) {
      return false;
    }

    // Se foi para deuce (10-10 ou mais), diferença deve ser >= 2
    if (minScore >= 10) {
      return maxScore - minScore >= 2;
    }

    // Caso normal: vencedor tem 11+ e perdedor tem < 11
    return maxScore >= 11 && minScore < 11;
  }

  /**
   * Calcula estatísticas de uma partida
   */
  static getMatchStats(match: Match): {
    totalSets: number;
    player1Sets: number;
    player2Sets: number;
    totalPoints: number;
    player1Points: number;
    player2Points: number;
    duration?: number;
  } {
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

    return {
      totalSets: match.sets.length,
      player1Sets,
      player2Sets,
      totalPoints: player1Points + player2Points,
      player1Points,
      player2Points,
      duration: match.completedAt && match.createdAt
        ? match.completedAt.getTime() - match.createdAt.getTime()
        : undefined,
    };
  }
}
