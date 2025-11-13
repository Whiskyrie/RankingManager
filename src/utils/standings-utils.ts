import { Group, GroupStanding, Match } from "../types";

/**
 * Calcula as classificações (standings) de um grupo
 */
export function calculateGroupStandings(
  group: Group,
  bestOf: 3 | 5 | 7 = 5
): GroupStanding[] {
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

/**
 * Atualiza os standings com os resultados de uma partida
 */
export function updateStandingsWithMatch(
  standings: GroupStanding[],
  match: Match,
  _bestOf: number
): void {
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

/**
 * Compara dois standings seguindo os critérios da CBTM/ITTF:
 * 1º: Pontos na classificação
 * 2º: Saldo de sets
 * 3º: Saldo de pontos
 * 4º: Nome (alfabético)
 */
export function compareStandings(a: GroupStanding, b: GroupStanding): number {
  // 1º critério: Pontos
  if (a.points !== b.points) return b.points - a.points;

  // 2º critério: Saldo de sets
  if (a.setsDiff !== b.setsDiff) return b.setsDiff - a.setsDiff;

  // 3º critério: Saldo de pontos
  if (a.pointsDiff !== b.pointsDiff) return b.pointsDiff - a.pointsDiff;

  // 4º critério: Nome (ordem alfabética)
  return a.athlete.name.localeCompare(b.athlete.name);
}
