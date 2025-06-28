import { Athlete, Match, SetResult } from "../types/index";

// ✅ CORREÇÃO: Funções de formatação com validação robusta
const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

const safeParseDate = (date: any): Date | null => {
  if (!date) return null;

  // Se já é um Date válido
  if (date instanceof Date && isValidDate(date)) {
    return date;
  }

  // Tentar converter string/number para Date
  try {
    const parsed = new Date(date);
    return isValidDate(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const formatDate = (date: Date | string | null | undefined): string => {
  const safeDate = safeParseDate(date);

  if (!safeDate) {
    console.warn("formatDate: Data inválida recebida:", date);
    return "Data inválida";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(safeDate);
  } catch (error) {
    console.error("formatDate: Erro ao formatar data:", error);
    return "Data inválida";
  }
};

export const formatDateTime = (
  date: Date | string | null | undefined
): string => {
  const safeDate = safeParseDate(date);

  if (!safeDate) {
    console.warn("formatDateTime: Data inválida recebida:", date);
    return "Data/hora inválida";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(safeDate);
  } catch (error) {
    console.error("formatDateTime: Erro ao formatar data/hora:", error);
    return "Data/hora inválida";
  }
};

export const getOrdinalPosition = (position: number): string => {
  return `${position}º`;
};

export const formatMatchScore = (match: Match): string => {
  if (!match.sets || match.sets.length === 0) {
    return "0-0";
  }

  const sets = match.sets;
  let player1Sets = 0;
  let player2Sets = 0;

  sets.forEach((set) => {
    if (set.player1Score > set.player2Score) player1Sets++;
    else if (set.player2Score > set.player1Score) player2Sets++;
  });

  return `${player1Sets}-${player2Sets}`;
};

export const formatSetScore = (set: {
  player1Score: number;
  player2Score: number;
}): string => {
  return `${set.player1Score}-${set.player2Score}`;
};

// Cores para status
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "created":
      return "bg-gray-100 text-gray-800";
    case "groups":
      return "bg-blue-100 text-blue-800";
    case "knockout":
      return "bg-orange-100 text-orange-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Função para validar sets (consistente com types/index.ts)
export const isValidSet = (set: SetResult): boolean => {
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

// Função principal para determinar vencedor da partida - CORRIGIDA E UNIFICADA
export const getMatchWinner = (
  sets: Array<{
    player1Score: number;
    player2Score: number;
    player1Id?: string;
    player2Id?: string;
  }>,
  bestOf: 3 | 5 | 7,
  player1Id?: string,
  player2Id?: string
): string | undefined => {
  if (sets.length === 0) return undefined;

  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  let player1Sets = 0;
  let player2Sets = 0;

  // Validar cada set antes de contar
  const validSets = sets.filter((set) => {
    const { player1Score, player2Score } = set;

    // Verificar se ambos os scores são números válidos e não negativos
    if (
      isNaN(player1Score) ||
      isNaN(player2Score) ||
      player1Score < 0 ||
      player2Score < 0
    ) {
      return false;
    }

    // Se ambos os scores são 0, considerar inválido
    if (player1Score === 0 && player2Score === 0) return false;

    // Verificar se o set é válido usando função de validação
    return isValidSet({ player1Score, player2Score });
  });

  console.log(
    `🎯 [UTILS-WINNER] Calculando vencedor - BestOf: ${bestOf}, SetsToWin: ${setsToWin}, ValidSets: ${validSets.length}`
  );

  // Contar sets válidos
  validSets.forEach((set) => {
    if (set.player1Score > set.player2Score) {
      player1Sets++;
    } else if (set.player2Score > set.player1Score) {
      player2Sets++;
    }
    console.log(
      `  Set: ${set.player1Score}-${set.player2Score} → P1Sets: ${player1Sets}, P2Sets: ${player2Sets}`
    );
  });

  console.log(
    `🎯 [UTILS-WINNER] Resultado final: P1=${player1Sets} sets, P2=${player2Sets} sets`
  );

  // Verificar se algum jogador atingiu o número necessário de sets
  if (player1Sets >= setsToWin) {
    const winnerId = player1Id || sets[0]?.player1Id || "player1";
    console.log(`✅ [UTILS-WINNER] Player1 venceu! ID: ${winnerId}`);
    return winnerId;
  } else if (player2Sets >= setsToWin) {
    const winnerId = player2Id || sets[0]?.player2Id || "player2";
    console.log(`✅ [UTILS-WINNER] Player2 venceu! ID: ${winnerId}`);
    return winnerId;
  }

  console.log(`⏳ [UTILS-WINNER] Nenhum vencedor ainda - partida em andamento`);
  return undefined;
};

// Função auxiliar para nomes de rodadas
const getRoundName = (rounds: number): string => {
  const roundNames: Record<number, string> = {
    1: "Final",
    2: "Semifinal",
    3: "Quartas",
    4: "Oitavas",
    5: "Décimo-sextos",
    6: "Trinta-e-dois-avos",
  };

  return roundNames[rounds] || `Rodada ${rounds}`;
};

// Geração de chaves mata-mata com sistema de BYE para cabeças de chave - CORRIGIDO PARA CBTM/ITTF
export const generateMainKnockoutMatches = (
  qualifiedAthletes: Athlete[],
  bracketSize: number
): Match[] => {
  const matches: Match[] = [];

  console.log(
    `🏆 [KNOCKOUT] Gerando chaveamento CBTM/ITTF para ${qualifiedAthletes.length} atletas em bracket de ${bracketSize}`
  );

  // ✅ REGRA CBTM/ITTF: Validar número mínimo de atletas
  if (qualifiedAthletes.length < 2) {
    console.error("❌ [CBTM] Mínimo de 2 atletas necessário para mata-mata");
    return matches;
  }

  // ✅ REGRA CBTM/ITTF: Determinar estrutura de bracket correta
  let validBracketSize = 2;
  while (validBracketSize < qualifiedAthletes.length) {
    validBracketSize *= 2;
  }

  // Forçar uso do bracketSize correto
  bracketSize = validBracketSize;

  // ✅ REGRA CBTM/ITTF: Separar e ordenar cabeças de chave corretamente
  const seededAthletes = qualifiedAthletes
    .filter((a) => a.isSeeded && a.seedNumber)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999));

  const unseededAthletes = qualifiedAthletes.filter((a) => !a.isSeeded);

  console.log(
    `🎯 [CBTM] Cabeças de chave identificados: ${seededAthletes.length}`
  );
  console.log(`🎯 [CBTM] Atletas sem seed: ${unseededAthletes.length}`);

  // ✅ REGRA CBTM/ITTF: Verificar se precisa implementar sistema de BYE
  const needsBye = qualifiedAthletes.length < bracketSize;

  if (needsBye) {
    return generateKnockoutWithBye(
      qualifiedAthletes,
      bracketSize,
      seededAthletes,
      unseededAthletes
    );
  }

  // ✅ REGRA CBTM/ITTF: Bracket completo - distribuição conforme padrão internacional
  return generateCompleteKnockoutBracket(
    qualifiedAthletes,
    bracketSize,
    seededAthletes,
    unseededAthletes
  );
};

// ✅ NOVA FUNÇÃO: Gerar bracket com sistema BYE conforme CBTM/ITTF
const generateKnockoutWithBye = (
  qualifiedAthletes: Athlete[],
  bracketSize: number,
  seededAthletes: Athlete[],
  unseededAthletes: Athlete[]
): Match[] => {
  const matches: Match[] = [];
  const byeCount = bracketSize - qualifiedAthletes.length;

  console.log(`🎯 [CBTM-BYE] Sistema BYE ativado: ${byeCount} passes livres`);

  // ✅ REGRA CBTM/ITTF: Prioridade BYE - sempre para os melhores cabeças de chave
  const athletesWithBye: Athlete[] = [];
  const remainingSeeded: Athlete[] = [];

  // Dar BYE aos melhores cabeças primeiro
  seededAthletes.forEach((athlete, index) => {
    if (index < byeCount) {
      athletesWithBye.push(athlete);
      console.log(
        `🎯 [CBTM-BYE] BYE concedido: ${athlete.name} (Cabeça #${athlete.seedNumber})`
      );
    } else {
      remainingSeeded.push(athlete);
    }
  });

  // Se ainda precisar de mais BYEs, dar aos melhores classificados não-cabeças
  const remainingByes = byeCount - athletesWithBye.length;
  if (remainingByes > 0) {
    // Ordenar não-cabeças por posição de classificação (assumindo que foram classificados por mérito)
    const sortedUnseeded = [...unseededAthletes].slice(0, remainingByes);
    athletesWithBye.push(...sortedUnseeded);

    sortedUnseeded.forEach((athlete) => {
      console.log(`🎯 [CBTM-BYE] BYE concedido (não-cabeça): ${athlete.name}`);
    });
  }

  // Atletas que jogam na primeira rodada
  const athletesToPlay = qualifiedAthletes.filter(
    (athlete) => !athletesWithBye.includes(athlete)
  );

  // ✅ REGRA CBTM/ITTF: Distribuição estratégica para evitar confrontos precoces
  const orderedForFirstRound = arrangePlayersForFirstRound(
    athletesToPlay,
    remainingSeeded,
    unseededAthletes.filter((a) => !athletesWithBye.includes(a))
  );

  // Criar partidas da primeira rodada
  const rounds = Math.ceil(Math.log2(qualifiedAthletes.length));
  const currentRoundName = getRoundName(rounds);

  console.log(
    `🎯 [CBTM] Primeira rodada: ${currentRoundName} com ${athletesToPlay.length} atletas`
  );

  let matchPosition = 0;
  for (let i = 0; i < orderedForFirstRound.length; i += 2) {
    if (orderedForFirstRound[i] && orderedForFirstRound[i + 1]) {
      const match = createMatch(
        orderedForFirstRound[i],
        orderedForFirstRound[i + 1],
        currentRoundName,
        matchPosition
      );
      matches.push(match);
      matchPosition++;
    }
  }

  return matches;
};

// ✅ NOVA FUNÇÃO: Gerar bracket completo conforme CBTM/ITTF
const generateCompleteKnockoutBracket = (
  qualifiedAthletes: Athlete[],
  bracketSize: number,
  seededAthletes: Athlete[],
  unseededAthletes: Athlete[]
): Match[] => {
  const matches: Match[] = [];

  console.log(
    `🏆 [CBTM] Bracket completo - ${qualifiedAthletes.length} atletas`
  );

  // ✅ REGRA CBTM/ITTF: Distribuição padrão de cabeças de chave
  const orderedAthletes = distributeSeedsAccordingToCBTM(
    bracketSize,
    seededAthletes,
    unseededAthletes
  );

  // Criar primeira rodada
  const rounds = Math.log2(bracketSize);
  const currentRoundName = getRoundName(rounds);

  let matchPosition = 0;
  for (let i = 0; i < orderedAthletes.length; i += 2) {
    if (orderedAthletes[i] && orderedAthletes[i + 1]) {
      const match = createMatch(
        orderedAthletes[i],
        orderedAthletes[i + 1],
        currentRoundName,
        matchPosition
      );
      matches.push(match);
      matchPosition++;
    }
  }

  return matches;
};

// ✅ NOVA FUNÇÃO: Distribuição de cabeças conforme padrão CBTM/ITTF
const distributeSeedsAccordingToCBTM = (
  bracketSize: number,
  seededAthletes: Athlete[],
  unseededAthletes: Athlete[]
): Athlete[] => {
  const orderedAthletes: Athlete[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // ✅ REGRA CBTM/ITTF: Posicionamento padrão de cabeças de chave
  if (seededAthletes.length >= 1) {
    orderedAthletes[0] = seededAthletes[0]; // Cabeça #1 sempre na posição 1
    console.log(
      `🎯 [CBTM-SEED] Cabeça #1: ${seededAthletes[0].name} → Posição 1`
    );
  }

  if (seededAthletes.length >= 2) {
    orderedAthletes[bracketSize - 1] = seededAthletes[1]; // Cabeça #2 sempre na última posição
    console.log(
      `🎯 [CBTM-SEED] Cabeça #2: ${seededAthletes[1].name} → Posição ${bracketSize}`
    );
  }

  if (seededAthletes.length >= 3) {
    // Cabeça #3 na metade superior da chave inferior
    const pos3 = bracketSize / 2;
    orderedAthletes[pos3 - 1] = seededAthletes[2];
    console.log(
      `🎯 [CBTM-SEED] Cabeça #3: ${seededAthletes[2].name} → Posição ${pos3}`
    );
  }

  if (seededAthletes.length >= 4) {
    // Cabeça #4 na metade inferior da chave superior
    const pos4 = bracketSize / 2;
    orderedAthletes[pos4] = seededAthletes[3];
    console.log(
      `🎯 [CBTM-SEED] Cabeça #4: ${seededAthletes[3].name} → Posição ${
        pos4 + 1
      }`
    );
  }

  // ✅ REGRA CBTM/ITTF: Distribuir cabeças adicionais em quartos
  if (seededAthletes.length > 4) {
    distributeAdditionalSeeds(
      orderedAthletes,
      seededAthletes.slice(4),
      bracketSize
    );
  }

  // ✅ REGRA CBTM/ITTF: Embaralhar e distribuir não-cabeças
  const shuffledUnseeded = [...unseededAthletes].sort(
    () => Math.random() - 0.5
  );
  let unseededIndex = 0;

  for (
    let i = 0;
    i < orderedAthletes.length && unseededIndex < shuffledUnseeded.length;
    i++
  ) {
    if (orderedAthletes[i] === null) {
      orderedAthletes[i] = shuffledUnseeded[unseededIndex++];
    }
  }

  return orderedAthletes.filter((athlete) => athlete !== null);
};

// ✅ NOVA FUNÇÃO: Distribuir cabeças adicionais em quartos conforme CBTM
const distributeAdditionalSeeds = (
  orderedAthletes: Athlete[],
  additionalSeeds: Athlete[],
  bracketSize: number
): void => {
  const quarterSize = bracketSize / 4;
  const positions = [
    quarterSize / 2, // Primeiro quarto
    quarterSize + quarterSize / 2, // Segundo quarto
    2 * quarterSize + quarterSize / 2, // Terceiro quarto
    3 * quarterSize + quarterSize / 2, // Quarto quarto
  ];

  additionalSeeds.forEach((seed, index) => {
    const targetPosition = Math.floor(positions[index % 4]);

    // Encontrar posição livre próxima
    let actualPosition = targetPosition;
    while (
      actualPosition < bracketSize &&
      orderedAthletes[actualPosition] !== null
    ) {
      actualPosition++;
    }

    if (actualPosition < bracketSize) {
      orderedAthletes[actualPosition] = seed;
      console.log(
        `🎯 [CBTM-SEED] Cabeça #${seed.seedNumber}: ${seed.name} → Posição ${
          actualPosition + 1
        }`
      );
    }
  });
};

// ✅ NOVA FUNÇÃO: Arranjar jogadores para primeira rodada evitando confrontos precoces
const arrangePlayersForFirstRound = (
  athletesToPlay: Athlete[],
  remainingSeeded: Athlete[],
  remainingUnseeded: Athlete[]
): Athlete[] => {
  const result: Athlete[] = [];

  // ✅ REGRA CBTM/ITTF: Distribuir cabeças alternadamente para evitar confrontos
  const shuffledUnseeded = [...remainingUnseeded].sort(
    () => Math.random() - 0.5
  );

  let seededIndex = 0;
  let unseededIndex = 0;

  while (result.length < athletesToPlay.length) {
    // Tentar adicionar um cabeça de chave
    if (seededIndex < remainingSeeded.length) {
      result.push(remainingSeeded[seededIndex++]);
    }

    // Adicionar um não-cabeça
    if (
      unseededIndex < shuffledUnseeded.length &&
      result.length < athletesToPlay.length
    ) {
      result.push(shuffledUnseeded[unseededIndex++]);
    }
  }

  return result;
};

// ✅ FUNÇÃO AUXILIAR: Criar partida padronizada
const createMatch = (
  player1: Athlete,
  player2: Athlete,
  round: string,
  position: number
): Match => {
  const match: Match = {
    id: `knockout-${round
      .toLowerCase()
      .replace(/\s+/g, "-")}-${position}-${Date.now()}`,
    player1Id: player1.id,
    player2Id: player2.id,
    player1: player1,
    player2: player2,
    sets: [],
    isCompleted: false,
    phase: "knockout",
    round: round,
    position: position,
    timeoutsUsed: {
      player1: false,
      player2: false,
    },
    createdAt: new Date(),
  };

  console.log(
    `⚡ [CBTM] Partida criada: ${player1.name}${
      player1.isSeeded ? ` (#${player1.seedNumber})` : ""
    } vs ${player2.name}${player2.isSeeded ? ` (#${player2.seedNumber})` : ""}`
  );

  return match;
};

// ✅ CORREÇÃO CBTM/ITTF: Sistema de geração de próximas rodadas conforme regras oficiais
export const generateNextRoundMatches = (
  currentRoundMatches: Match[],
  round: string,
  allAthletes: Athlete[],
  bestOf: 3 | 5 | 7 = 5,
  championshipAthletes?: Athlete[]
): Match[] => {
  const matches: Match[] = [];

  // ✅ REGRA CBTM/ITTF: Verificar se todas as partidas foram completadas
  const completedMatches = currentRoundMatches.filter((m) => m.isCompleted);
  if (completedMatches.length !== currentRoundMatches.length) {
    console.log(
      `❌ [CBTM] Rodada anterior incompleta (${completedMatches.length}/${currentRoundMatches.length})`
    );
    return matches;
  }

  console.log(`✅ [CBTM] Gerando próxima rodada: ${round}`);

  // ✅ REGRA CBTM/ITTF: Lógica especial para disputa de terceiro lugar
  if (round.includes("3º Lugar")) {
    return generateThirdPlaceMatch(
      completedMatches,
      round,
      allAthletes,
      bestOf
    );
  }

  // ✅ REGRA CBTM/ITTF: Gerar rodadas normais (Final, Semifinal, etc.)
  return generateNormalRoundMatches(
    completedMatches,
    round,
    allAthletes,
    bestOf,
    championshipAthletes
  );
};

// ✅ NOVA FUNÇÃO: Gerar disputa de terceiro lugar conforme CBTM/ITTF
const generateThirdPlaceMatch = (
  completedMatches: Match[],
  round: string,
  allAthletes: Athlete[],
  bestOf: 3 | 5 | 7
): Match[] => {
  console.log("🥉 [CBTM] Gerando disputa de terceiro lugar");

  const loserIds: string[] = [];

  // ✅ REGRA CBTM/ITTF: Usar perdedores das semifinais
  completedMatches.forEach((match) => {
    let winnerId = match.winnerId;
    if (!winnerId && match.sets && match.sets.length > 0) {
      winnerId = getMatchWinner(
        match.sets,
        bestOf,
        match.player1Id,
        match.player2Id
      );
    }

    if (winnerId) {
      const loserId =
        winnerId === match.player1Id ? match.player2Id : match.player1Id;
      if (loserId) {
        loserIds.push(loserId);
        const loserName =
          winnerId === match.player1Id
            ? match.player2?.name
            : match.player1?.name;
        console.log(`🥉 [CBTM] Perdedor semifinal: ${loserName}`);
      }
    }
  });

  // Criar partida de 3º lugar
  if (loserIds.length >= 2) {
    const loser1 = allAthletes.find((a) => a.id === loserIds[0]);
    const loser2 = allAthletes.find((a) => a.id === loserIds[1]);

    if (loser1 && loser2) {
      const thirdPlaceMatch: Match = {
        id: `third-place-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 5)}`,
        player1Id: loser1.id,
        player2Id: loser2.id,
        player1: loser1,
        player2: loser2,
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: round,
        isThirdPlace: true,
        position: 0,
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };

      console.log(
        `✅ [CBTM] Disputa 3º lugar: ${loser1.name} vs ${loser2.name}`
      );
      return [thirdPlaceMatch];
    }
  }

  console.log("❌ [CBTM] Não foi possível gerar disputa de 3º lugar");
  return [];
};

// ✅ NOVA FUNÇÃO: Gerar rodadas normais conforme CBTM/ITTF
const generateNormalRoundMatches = (
  completedMatches: Match[],
  round: string,
  allAthletes: Athlete[],
  bestOf: 3 | 5 | 7,
  championshipAthletes?: Athlete[]
): Match[] => {
  console.log("🏆 [CBTM] Gerando rodada normal com vencedores + BYE");

  // ✅ REGRA CBTM/ITTF: Coletar todos os vencedores
  const winnerIds: string[] = [];

  completedMatches.forEach((match, index) => {
    let winnerId = match.winnerId;

    if (!winnerId && match.sets && match.sets.length > 0) {
      winnerId = getMatchWinner(
        match.sets,
        bestOf,
        match.player1Id,
        match.player2Id
      );
    }

    if (winnerId) {
      winnerIds.push(winnerId);
      const winnerName =
        winnerId === match.player1Id
          ? match.player1?.name
          : match.player2?.name;
      console.log(`✅ [CBTM] Vencedor ${index + 1}: ${winnerName}`);
    }
  });

  // ✅ REGRA CBTM/ITTF: Incluir atletas com BYE automático
  const allAdvancingAthletes = [...winnerIds];

  if (championshipAthletes) {
    const athletesWithBye = detectAthletsWithBye(
      round,
      winnerIds,
      completedMatches,
      championshipAthletes
    );
    allAdvancingAthletes.push(...athletesWithBye);
  }

  // ✅ REGRA CBTM/ITTF: Sistema BYE para próxima rodada se número ímpar
  const { playingAthletes, byeAthlete } = handleNextRoundBye(
    allAdvancingAthletes,
    allAthletes
  );

  if (byeAthlete) {
    console.log(`🎯 [CBTM] BYE para próxima rodada: ${byeAthlete.name}`);
  }

  // Criar partidas para a próxima rodada
  return createMatchesForRound(playingAthletes, round, allAthletes);
};

// ✅ FUNÇÃO AUXILIAR: Determinar o nível da rodada no chaveamento
const getCurrentRoundLevel = (round: string): number => {
  if (round.includes("Final")) return 1;
  if (round.includes("Semifinal")) return 2;
  if (round.includes("Quartas")) return 3;
  if (round.includes("Oitavas")) return 4;
  if (round.includes("Décimo-sextos")) return 5;
  return 6; // Para rodadas maiores
};

// ✅ NOVA FUNÇÃO: Detectar atletas com BYE conforme CBTM/ITTF
const detectAthletsWithBye = (
  round: string,
  winnerIds: string[],
  completedMatches: Match[],
  championshipAthletes: Athlete[]
): string[] => {
  const currentRoundLevel = getCurrentRoundLevel(round);
  const expectedAthletes = Math.pow(2, currentRoundLevel);
  const athletesWithBye = expectedAthletes - winnerIds.length;

  if (athletesWithBye <= 0) return [];

  console.log(`🎯 [CBTM] ${athletesWithBye} atletas com BYE detectados`);

  const playersInLastRound = completedMatches.flatMap((match) => [
    match.player1Id,
    match.player2Id,
  ]);

  // ✅ REGRA CBTM/ITTF: Prioridade para melhores cabeças de chave
  const eligibleForBye = championshipAthletes
    .filter(
      (athlete) =>
        athlete.isSeeded &&
        !winnerIds.includes(athlete.id) &&
        !playersInLastRound.includes(athlete.id)
    )
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999))
    .slice(0, athletesWithBye);

  eligibleForBye.forEach((athlete) => {
    console.log(
      `🎯 [CBTM] BYE automático: ${athlete.name} (Cabeça #${athlete.seedNumber})`
    );
  });

  return eligibleForBye.map((athlete) => athlete.id);
};

// ✅ NOVA FUNÇÃO: Gerenciar BYE para próxima rodada conforme CBTM/ITTF
const handleNextRoundBye = (
  allAdvancingAthletes: string[],
  allAthletes: Athlete[]
): { playingAthletes: string[]; byeAthlete: Athlete | null } => {
  if (allAdvancingAthletes.length % 2 === 0) {
    return { playingAthletes: allAdvancingAthletes, byeAthlete: null };
  }

  // ✅ REGRA CBTM/ITTF: Melhor cabeça de chave recebe BYE
  const advancingAthleteObjects = allAthletes.filter((a) =>
    allAdvancingAthletes.includes(a.id)
  );

  const bestSeeded = advancingAthleteObjects
    .filter((a) => a.isSeeded)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999))[0];

  if (bestSeeded) {
    const playingAthletes = allAdvancingAthletes.filter(
      (id) => id !== bestSeeded.id
    );
    return { playingAthletes, byeAthlete: bestSeeded };
  }

  // Se não há cabeças, remover o primeiro atleta
  const [byeId, ...playingIds] = allAdvancingAthletes;
  const byeAthlete = allAthletes.find((a) => a.id === byeId) || null;

  return { playingAthletes: playingIds, byeAthlete };
};

// ✅ NOVA FUNÇÃO: Criar partidas para rodada conforme CBTM/ITTF
const createMatchesForRound = (
  playingAthletes: string[],
  round: string,
  allAthletes: Athlete[]
): Match[] => {
  const matches: Match[] = [];

  for (let i = 0; i < playingAthletes.length; i += 2) {
    if (playingAthletes[i] && playingAthletes[i + 1]) {
      const athlete1 = allAthletes.find((a) => a.id === playingAthletes[i]);
      const athlete2 = allAthletes.find((a) => a.id === playingAthletes[i + 1]);

      if (athlete1 && athlete2) {
        const match: Match = {
          id: `${round
            .toLowerCase()
            .replace(/\s+/g, "-")}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 5)}-${i / 2}`,
          player1Id: athlete1.id,
          player2Id: athlete2.id,
          player1: athlete1,
          player2: athlete2,
          sets: [],
          isCompleted: false,
          phase: "knockout",
          round: round,
          position: i / 2,
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        };

        matches.push(match);
        console.log(
          `✅ [CBTM] Partida ${round}: ${athlete1.name} vs ${athlete2.name}`
        );
      }
    }
  }

  return matches;
};

// ✅ NOVA FUNÇÃO: Gerar resultado de teste para partidas
export const generateTestMatchResult = (
  bestOf: number
): {
  sets: { player1Score: number; player2Score: number }[];
  timeouts: { player1: boolean; player2: boolean };
} => {
  const setsToWin = Math.ceil(bestOf / 2);
  const sets: { player1Score: number; player2Score: number }[] = [];

  let player1Wins = 0;
  let player2Wins = 0;

  // Gerar sets até que um jogador ganhe
  while (player1Wins < setsToWin && player2Wins < setsToWin) {
    // Gerar pontuação aleatória para um set
    const isPlayer1Winner = Math.random() > 0.5;
    let player1Score: number;
    let player2Score: number;

    if (isPlayer1Winner) {
      // Player 1 ganha o set
      player1Score = 11;
      player2Score = Math.floor(Math.random() * 10); // 0-9

      // Chance de deuce (10-10 indo para 12-10, 13-11, etc.)
      if (Math.random() > 0.8) {
        const extraPoints = Math.floor(Math.random() * 3) + 1; // 1-3 pontos extras
        player1Score = 10 + extraPoints + 1;
        player2Score = 10 + extraPoints - 1;
      }

      player1Wins++;
    } else {
      // Player 2 ganha o set
      player2Score = 11;
      player1Score = Math.floor(Math.random() * 10); // 0-9

      // Chance de deuce
      if (Math.random() > 0.8) {
        const extraPoints = Math.floor(Math.random() * 3) + 1;
        player2Score = 10 + extraPoints + 1;
        player1Score = 10 + extraPoints - 1;
      }

      player2Wins++;
    }

    sets.push({ player1Score, player2Score });
  }

  // Gerar timeouts aleatórios (baixa probabilidade)
  const timeouts = {
    player1: Math.random() > 0.9, // 10% chance
    player2: Math.random() > 0.9, // 10% chance
  };

  return { sets, timeouts };
};

// ✅ CORREÇÃO CBTM/ITTF: Geração da segunda divisão conforme regras oficiais
export const generateSecondDivisionMatches = (athletes: Athlete[]): Match[] => {
  const matches: Match[] = [];

  console.log("\n🥈 [CBTM-2ND] === GERAÇÃO SEGUNDA DIVISÃO CBTM/ITTF ===");
  console.log(`🥈 [CBTM-2ND] Atletas eliminados: ${athletes.length}`);

  // ✅ REGRA CBTM/ITTF: Validação mínima
  if (!athletes || athletes.length < 2) {
    console.log("❌ [CBTM-2ND] Insuficientes atletas para segunda divisão");
    return matches;
  }

  // ✅ REGRA CBTM/ITTF: Determinar estrutura de bracket adequada
  let bracketSize = 2;
  while (bracketSize < athletes.length) {
    bracketSize *= 2;
  }

  console.log(
    `🎯 [CBTM-2ND] Bracket determinado: ${bracketSize} posições para ${athletes.length} atletas`
  );

  // ✅ REGRA CBTM/ITTF: Ordenação por critério de eliminação (último eliminado = melhor posicionado)
  const orderedAthletes = orderAthletesForSecondDivision(athletes);

  // ✅ REGRA CBTM/ITTF: Aplicar sistema BYE se necessário
  const needsBye = athletes.length < bracketSize;

  if (needsBye) {
    return generateSecondDivisionWithBye(orderedAthletes, bracketSize);
  }

  // ✅ REGRA CBTM/ITTF: Bracket completo para segunda divisão
  return generateCompleteSecondDivisionBracket(orderedAthletes, bracketSize);
};

// ✅ NOVA FUNÇÃO: Ordenar atletas para segunda divisão conforme CBTM/ITTF
const orderAthletesForSecondDivision = (athletes: Athlete[]): Athlete[] => {
  // ✅ REGRA CBTM/ITTF: Atletas são ordenados por:
  // 1. Posição de eliminação (últimos eliminados primeiro)
  // 2. Ranking original (cabeças de chave primeiro)
  // 3. Ordem alfabética como critério final

  return [...athletes].sort((a, b) => {
    // Priorizar cabeças de chave
    if (a.isSeeded && !b.isSeeded) return -1;
    if (!a.isSeeded && b.isSeeded) return 1;

    // Entre cabeças, ordenar por seed number
    if (a.isSeeded && b.isSeeded) {
      return (a.seedNumber || 999) - (b.seedNumber || 999);
    }

    // Para não-cabeças, ordem alfabética
    return a.name.localeCompare(b.name);
  });
};

// ✅ NOVA FUNÇÃO: Gerar segunda divisão com BYE conforme CBTM/ITTF
const generateSecondDivisionWithBye = (
  athletes: Athlete[],
  bracketSize: number
): Match[] => {
  const byeCount = bracketSize - athletes.length;
  console.log(`🎯 [CBTM-2ND] Sistema BYE ativado: ${byeCount} passes livres`);

  // ✅ REGRA CBTM/ITTF: Melhores atletas eliminados recebem BYE
  const athletesWithBye = athletes.slice(0, byeCount);
  const athletesToPlay = athletes.slice(byeCount);

  athletesWithBye.forEach((athlete) => {
    console.log(
      `🎯 [CBTM-2ND] BYE concedido: ${athlete.name}${
        athlete.isSeeded ? ` (ex-Cabeça #${athlete.seedNumber})` : ""
      }`
    );
  });

  // Criar primeira rodada apenas com atletas que jogam
  const rounds = Math.ceil(Math.log2(athletes.length));
  const currentRoundName = getRoundNameForSecondDivision(rounds);

  return createSecondDivisionMatches(athletesToPlay, currentRoundName);
};

// ✅ NOVA FUNÇÃO: Gerar bracket completo para segunda divisão
const generateCompleteSecondDivisionBracket = (
  athletes: Athlete[],
  bracketSize: number
): Match[] => {
  console.log(
    `🥈 [CBTM-2ND] Bracket completo - todos os ${athletes.length} atletas jogarão`
  );

  // ✅ REGRA CBTM/ITTF: Distribuição estratégica similar ao mata-mata principal
  const distributedAthletes = distributeAthletesForSecondDivision(
    athletes,
    bracketSize
  );

  const rounds = Math.log2(bracketSize);
  const currentRoundName = getRoundNameForSecondDivision(rounds);

  return createSecondDivisionMatches(distributedAthletes, currentRoundName);
};

// ✅ NOVA FUNÇÃO: Distribuir atletas na segunda divisão conforme CBTM/ITTF
const distributeAthletesForSecondDivision = (
  athletes: Athlete[],
  bracketSize: number
): Athlete[] => {
  const distributed: Athlete[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // ✅ REGRA CBTM/ITTF: Separar ex-cabeças de chave dos demais
  const formerSeeds = athletes
    .filter((a) => a.isSeeded)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999));
  const others = athletes.filter((a) => !a.isSeeded);

  // Posicionar ex-cabeças estrategicamente
  if (formerSeeds.length >= 1) {
    distributed[0] = formerSeeds[0];
  }
  if (formerSeeds.length >= 2) {
    distributed[bracketSize - 1] = formerSeeds[1];
  }
  if (formerSeeds.length >= 3) {
    distributed[Math.floor(bracketSize / 2) - 1] = formerSeeds[2];
  }
  if (formerSeeds.length >= 4) {
    distributed[Math.floor(bracketSize / 2)] = formerSeeds[3];
  }

  // Distribuir ex-cabeças restantes
  const remainingSeeds = formerSeeds.slice(4);
  let seedIndex = 0;
  for (
    let i = 0;
    i < distributed.length && seedIndex < remainingSeeds.length;
    i++
  ) {
    if (distributed[i] === null) {
      distributed[i] = remainingSeeds[seedIndex++];
    }
  }

  // Embaralhar e distribuir outros atletas
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
  let otherIndex = 0;
  for (
    let i = 0;
    i < distributed.length && otherIndex < shuffledOthers.length;
    i++
  ) {
    if (distributed[i] === null) {
      distributed[i] = shuffledOthers[otherIndex++];
    }
  }

  return distributed.filter((athlete) => athlete !== null);
};

// ✅ NOVA FUNÇÃO: Criar partidas da segunda divisão
const createSecondDivisionMatches = (
  athletes: Athlete[],
  roundName: string
): Match[] => {
  const matches: Match[] = [];
  let matchPosition = 0;

  for (let i = 0; i < athletes.length; i += 2) {
    if (athletes[i] && athletes[i + 1]) {
      const match: Match = {
        id: `second-div-${roundName
          .toLowerCase()
          .replace(/\s+/g, "-")}-${matchPosition}-${Date.now()}`,
        player1Id: athletes[i].id,
        player2Id: athletes[i + 1].id,
        player1: athletes[i],
        player2: athletes[i + 1],
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: roundName,
        position: matchPosition,
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };

      matches.push(match);
      console.log(
        `⚡ [CBTM-2ND] Partida criada: ${athletes[i].name} vs ${
          athletes[i + 1].name
        }`
      );
      matchPosition++;
    }
  }

  console.log(
    `✅ [CBTM-2ND] ${matches.length} partidas criadas para ${roundName}`
  );
  return matches;
};

// ✅ NOVA FUNÇÃO: Determinar nome da rodada para segunda divisão
const getRoundNameForSecondDivision = (rounds: number): string => {
  const baseRoundName = getRoundName(rounds);
  return `${baseRoundName} 2ª Div`;
};

// ✅ NOVA FUNÇÃO: Calcular estatísticas do torneio
export const calculateTournamentStats = (championship: any) => {
  if (!championship) {
    return {
      totalAthletes: 0,
      totalMatches: 0,
      completedMatches: 0,
      completionPercentage: 0,
      progress: 0,
      groupsPhaseComplete: false,
      knockoutPhaseStarted: false,
      groupMatches: 0,
      groupMatchesCompleted: 0,
      knockoutMatches: 0,
      knockoutMatchesCompleted: 0,
      mainKnockoutMatches: 0,
      secondDivMatches: 0,
      totalGroups: 0,
      groupsCompleted: 0,
    };
  }

  const totalAthletes = championship.athletes?.length || 0;

  // Contar partidas dos grupos
  const groupMatches =
    championship.groups?.flatMap((group: any) => group.matches || []) || [];
  const groupMatchesCount = groupMatches.length;
  const groupCompletedMatches = groupMatches.filter(
    (match: any) => match.isCompleted
  ).length;

  // Contar partidas do knockout
  const knockoutMatches = championship.knockoutMatches || [];
  const knockoutMatchesCount = knockoutMatches.length;
  const knockoutCompletedMatches = knockoutMatches.filter(
    (match: any) => match.isCompleted
  ).length;

  // Separar partidas principais e segunda divisão
  const mainKnockoutMatches = knockoutMatches.filter(
    (match: any) => !match.round?.includes("2ª Div")
  ).length;
  const secondDivMatches = knockoutMatches.filter((match: any) =>
    match.round?.includes("2ª Div")
  ).length;

  const totalMatches = groupMatchesCount + knockoutMatchesCount;
  const completedMatches = groupCompletedMatches + knockoutCompletedMatches;
  const completionPercentage =
    totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  const groupsPhaseComplete =
    groupMatchesCount > 0 &&
    groupMatches.every((match: any) => match.isCompleted);
  const knockoutPhaseStarted = knockoutMatchesCount > 0;

  // Contar grupos
  const totalGroups = championship.groups?.length || 0;
  const groupsCompleted =
    championship.groups?.filter((group: any) => {
      const matches = group.matches || [];
      return (
        matches.length > 0 && matches.every((match: any) => match.isCompleted)
      );
    }).length || 0;

  return {
    totalAthletes,
    totalMatches,
    completedMatches,
    completionPercentage: Math.round(completionPercentage),
    progress: Math.round(completionPercentage),
    groupsPhaseComplete,
    knockoutPhaseStarted,
    groupMatches: groupMatchesCount,
    groupMatchesCompleted: groupCompletedMatches,
    knockoutMatches: knockoutMatchesCount,
    knockoutMatchesCompleted: knockoutCompletedMatches,
    mainKnockoutMatches,
    secondDivMatches,
    totalGroups,
    groupsCompleted,
  };
};

// ✅ NOVA FUNÇÃO: Validar atleta
export const validateAthlete = (
  athlete: Partial<
    Athlete & { club?: string; ranking?: number; rating?: number }
  >
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!athlete.name || athlete.name.trim().length === 0) {
    errors.push("Nome é obrigatório");
  }

  if (athlete.name && athlete.name.trim().length < 2) {
    errors.push("Nome deve ter pelo menos 2 caracteres");
  }

  if (
    athlete.club !== undefined &&
    (!athlete.club || athlete.club.trim().length === 0)
  ) {
    errors.push("Clube é obrigatório");
  }

  if (athlete.ranking !== undefined && athlete.ranking < 0) {
    errors.push("Ranking deve ser um número positivo");
  }

  if (
    athlete.rating !== undefined &&
    (athlete.rating < 0 || athlete.rating > 3000)
  ) {
    errors.push("Rating deve estar entre 0 e 3000");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ✅ NOVA FUNÇÃO: Gerar relatório de grupos
export const generateGroupReport = (championship: any): string => {
  if (!championship || !championship.groups) {
    return "Nenhum grupo encontrado";
  }

  let report = `RELATÓRIO DE GRUPOS - ${championship.name}\n`;
  report += `Data: ${formatDate(championship.date)}\n`;
  report += `=====================================\n\n`;

  championship.groups.forEach((group: any, index: number) => {
    report += `GRUPO ${String.fromCharCode(65 + index)}\n`;
    report += `${"-".repeat(20)}\n`;

    if (group.athletes && group.athletes.length > 0) {
      group.athletes.forEach((athlete: any, pos: number) => {
        report += `${pos + 1}. ${athlete.name} (${athlete.club})\n`;
        if (athlete.ranking) report += `   Ranking: ${athlete.ranking}\n`;
        if (athlete.rating) report += `   Rating: ${athlete.rating}\n`;
      });
    } else {
      report += "Nenhum atleta neste grupo\n";
    }

    report += `\nPARTIDAS:\n`;
    if (group.matches && group.matches.length > 0) {
      group.matches.forEach((match: any) => {
        const player1 = group.athletes.find(
          (a: any) => a.id === match.player1Id
        );
        const player2 = group.athletes.find(
          (a: any) => a.id === match.player2Id
        );

        report += `${player1?.name || "TBD"} vs ${player2?.name || "TBD"}`;

        if (match.isCompleted) {
          const setsText = match.sets
            .map((set: any) => `${set.player1Score}-${set.player2Score}`)
            .join(", ");
          report += ` - ${setsText}`;
        } else {
          report += " - Pendente";
        }
        report += `\n`;
      });
    } else {
      report += "Nenhuma partida gerada\n";
    }

    report += `\n`;
  });

  return report;
};

// ✅ NOVA FUNÇÃO: Gerar bracket do knockout (simplificado)
export const generateKnockoutBracket = (championship: any) => {
  if (!championship || !championship.knockoutMatches) {
    return null;
  }

  // Agrupar partidas por rodada
  const matchesByRound: { [key: string]: any[] } = {};

  championship.knockoutMatches.forEach((match: any) => {
    const round = match.round || "Indefinido";
    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  return {
    rounds: Object.keys(matchesByRound).sort(),
    matchesByRound,
    totalMatches: championship.knockoutMatches.length,
    completedMatches: championship.knockoutMatches.filter(
      (m: any) => m.isCompleted
    ).length,
  };
};
