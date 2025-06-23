import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import {
  Championship,
  TournamentConfig,
  Athlete,
  Group,
  Match,
  GroupStanding,
  MatchResult,
  isValidSet,
  getMatchWinner, // CORREÇÃO: Importar a função correta do types
} from "../types";
import {
  generateMainKnockoutMatches,
  generateSecondDivisionMatches,
  generateNextRoundMatches,
} from "../utils";

interface ChampionshipStore {
  championships: Championship[];
  currentChampionship?: Championship;
  isLoading: boolean;
  error?: string;

  setError: (error: string | undefined) => void;
  setLoading: (loading: boolean) => void;

  createChampionship: (
    config: TournamentConfig,
    athletes: Athlete[]
  ) => Promise<void>;
  loadChampionship: (id: string) => Promise<void>;
  updateChampionship: (championship: Championship) => Promise<void>;
  deleteChampionship: (id: string) => Promise<void>;

  addAthlete: (athlete: Omit<Athlete, "id">) => Promise<void>;
  updateAthlete: (athlete: Athlete) => Promise<void>;
  removeAthlete: (athleteId: string) => Promise<void>;

  generateGroups: () => Promise<void>;
  createManualGroups: (
    manualGroups: { name: string; athleteIds: string[] }[]
  ) => Promise<void>;
  generateKnockoutBracket: () => Promise<void>;
  generateSecondDivisionBracket: () => Promise<void>;
  generateSecondDivisionMatches: (eliminatedAthletes: Athlete[]) => Match[];

  updateMatchResult: (result: MatchResult) => Promise<void>;
  setWalkover: (matchId: string, winnerId: string) => Promise<void>;

  getGroupStandings: (groupId: string) => GroupStanding[];
  calculateGroupStandings: (group: Group) => GroupStanding[];
  getQualifiedAthletes: () => Athlete[];
  getEliminatedAthletes: () => Athlete[];
  checkAndGenerateNextKnockoutRound: (groups: Group[]) => Promise<void>;

  fillGroupsWithRandomResults: () => Promise<void>;
  createTestChampionship: () => Promise<void>;
}

// CORREÇÃO: Função updateStandingsWithMatch corrigida
function updateStandingsWithMatch(
  standings: GroupStanding[],
  match: Match,
  bestOf: 3 | 5 | 7 = 5 // Parâmetro bestOf adicionado
) {
  const player1Standing = standings.find(
    (s) => s.athleteId === match.player1Id
  );
  const player2Standing = standings.find(
    (s) => s.athleteId === match.player2Id
  );

  if (!player1Standing || !player2Standing) {
    console.warn("Standing não encontrado para algum jogador:", {
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      availableStandings: standings.map((s) => ({
        id: s.athleteId,
        name: s.athlete.name,
      })),
    });
    return;
  }

  // Incrementar jogos para ambos os jogadores
  player1Standing.matches++;
  player2Standing.matches++;

  console.log(
    `Processando partida: ${match.player1?.name} vs ${match.player2?.name}`
  );

  // Tratamento especial para walkover
  if (match.isWalkover) {
    console.log("Processando walkover - vencedor:", match.walkoverWinnerId);
    if (match.walkoverWinnerId === match.player1Id) {
      player1Standing.wins++;
      player1Standing.points += 3;
      player2Standing.losses++;
      console.log(`${match.player1?.name} venceu por W.O.`);
    } else if (match.walkoverWinnerId === match.player2Id) {
      player2Standing.wins++;
      player2Standing.points += 3;
      player1Standing.losses++;
      console.log(`${match.player2?.name} venceu por W.O.`);
    }
    return;
  }

  // Contabilizar pontos e sets de cada set individual
  match.sets.forEach((set, index) => {
    if (isValidSet(set)) {
      console.log(`Set ${index + 1}: ${set.player1Score}-${set.player2Score}`);

      player1Standing.pointsWon += set.player1Score;
      player1Standing.pointsLost += set.player2Score;
      player2Standing.pointsWon += set.player2Score;
      player2Standing.pointsLost += set.player1Score;

      if (set.player1Score > set.player2Score) {
        player1Standing.setsWon++;
        player2Standing.setsLost++;
      } else if (set.player2Score > set.player1Score) {
        player2Standing.setsWon++;
        player1Standing.setsLost++;
      }
    } else {
      console.warn(`Set ${index + 1} inválido:`, set);
    }
  });

  // CORREÇÃO PRINCIPAL: Usar a função correta com o bestOf apropriado
  const winner = getMatchWinner(
    match.sets,
    bestOf, // Usar o bestOf correto ao invés de valor hardcoded
    match.player1Id,
    match.player2Id
  );

  console.log("Vencedor determinado pela função getMatchWinner:", winner);
  console.log("Best of configurado:", bestOf);
  console.log("Sets válidos:", match.sets.filter(isValidSet).length);

  // Atualizar vitórias/derrotas baseado no vencedor da partida
  if (winner === match.player1Id) {
    player1Standing.wins++;
    player1Standing.points += 3;
    player2Standing.losses++;
    console.log(`✅ ${match.player1?.name} venceu a partida`);
  } else if (winner === match.player2Id) {
    player2Standing.wins++;
    player2Standing.points += 3;
    player1Standing.losses++;
    console.log(`✅ ${match.player2?.name} venceu a partida`);
  } else {
    console.warn("⚠️ Nenhum vencedor determinado para a partida", {
      sets: match.sets,
      bestOf,
      validSets: match.sets.filter(isValidSet),
    });
  }

  console.log("Standing atual:", {
    player1: {
      name: player1Standing.athlete.name,
      matches: player1Standing.matches,
      wins: player1Standing.wins,
      losses: player1Standing.losses,
      points: player1Standing.points,
    },
    player2: {
      name: player2Standing.athlete.name,
      matches: player2Standing.matches,
      wins: player2Standing.wins,
      losses: player2Standing.losses,
      points: player2Standing.points,
    },
  });
}

// ✅ FUNÇÃO CORRIGIDA PARA GERAR PARTIDAS COM SINALIZAÇÃO DE 3º LUGAR
function generateThirdPlaceMatches(
  semifinalMatches: Match[],
  roundName: string,
  athletes: Athlete[],
  _bestOf: 3 | 5 | 7
): Match[] {
  console.log(`🥉 [GENERATE-3RD] Gerando ${roundName}`);

  if (semifinalMatches.length !== 2) {
    console.log(
      `❌ [GENERATE-3RD] Número incorreto de semifinais: ${semifinalMatches.length}`
    );
    return [];
  }

  // Encontrar os perdedores das semifinais
  const losers: Athlete[] = [];

  semifinalMatches.forEach((match, index) => {
    if (!match.winnerId) {
      console.log(
        `⚠️ [GENERATE-3RD] Semifinal ${index + 1} sem vencedor definido`
      );
      return;
    }

    const loserId =
      match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
    const loser = athletes.find((a) => a.id === loserId);

    if (loser) {
      losers.push(loser);
      console.log(`  Perdedor semifinal ${index + 1}: ${loser.name}`);
    }
  });

  if (losers.length !== 2) {
    console.log(
      `❌ [GENERATE-3RD] Número incorreto de perdedores: ${losers.length}`
    );
    return [];
  }

  // ✅ CORREÇÃO PRINCIPAL: Criar partida com isThirdPlace: true
  const thirdPlaceMatch: Match = {
    id: `third-place-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    player1Id: losers[0].id,
    player2Id: losers[1].id,
    player1: losers[0],
    player2: losers[1],
    sets: [],
    isCompleted: false,
    phase: "knockout",
    round: roundName,
    isThirdPlace: true, // ✅ PROPRIEDADE CRÍTICA ADICIONADA
    position: 0,
    timeoutsUsed: {
      player1: false,
      player2: false,
    },
    createdAt: new Date(),
  };

  console.log(`✅ [GENERATE-3RD] Partida de 3º lugar criada:`, {
    id: thirdPlaceMatch.id,
    round: thirdPlaceMatch.round,
    isThirdPlace: thirdPlaceMatch.isThirdPlace,
    players: `${losers[0].name} vs ${losers[1].name}`,
  });

  return [thirdPlaceMatch];
}

// ✅ SOLUÇÃO ROBUSTA E SIMPLIFICADA PARA GERAÇÃO DE FINAL E TERCEIRO LUGAR

// Função principal para verificar e gerar próximas rodadas
async function checkRoundsProgression(
  matches: Match[],
  rounds: string[],
  state: any,
  get: any
) {
  console.log("🔄 [ROBUST-V2] Verificando progressão das rodadas:", rounds);

  // ✅ ETAPA 1: GERAR FINAL E TERCEIRO LUGAR SIMULTANEAMENTE (quando ambos estão prontos)
  await handleSimultaneousFinalsGeneration(matches, rounds, state, get);

  // ✅ ETAPA 2: GERAR OUTRAS RODADAS SEQUENCIAIS
  await handleSequentialRounds(matches, rounds, state, get);

  console.log("🔄 [ROBUST-V2] Verificação de progressão concluída");
}

// ✅ NOVA FUNÇÃO PARA GERAÇÃO SIMULTÂNEA
async function handleSimultaneousFinalsGeneration(
  matches: Match[],
  rounds: string[],
  state: any,
  get: any
) {
  console.log("🏆🥉 [SIMULTANEOUS] Verificando geração simultânea...");

  const finalRound = rounds.find((r) => r === "Final" || r === "Final 2ª Div");
  const thirdPlaceRound = rounds.find((r) => r.includes("3º Lugar"));

  if (!finalRound) return;

  const semifinalRound = finalRound.includes("2ª Div")
    ? "Semifinal 2ª Div"
    : "Semifinal";

  const semifinalMatches = matches.filter((m) => m.round === semifinalRound);
  const finalMatches = matches.filter((m) => m.round === finalRound);
  const thirdPlaceMatches = thirdPlaceRound
    ? matches.filter((m) => m.round === thirdPlaceRound)
    : [];

  console.log("🏆🥉 [SIMULTANEOUS] Status atual:", {
    semifinais: semifinalMatches.length,
    semifinaisCompletas: semifinalMatches.filter((m) => m.isCompleted).length,
    finalExiste: finalMatches.length > 0,
    terceiroLugarExiste: thirdPlaceMatches.length > 0,
    terceiroLugarHabilitado: state.currentChampionship.hasThirdPlace,
  });

  // ✅ CONDIÇÕES PARA GERAÇÃO SIMULTÂNEA:
  // 1. Exatamente 2 semifinais
  // 2. Ambas semifinais completadas
  // 3. Final e/ou terceiro lugar ainda não existem
  if (
    semifinalMatches.length === 2 &&
    semifinalMatches.every((m) => m.isCompleted && m.winnerId)
  ) {
    const newMatches: Match[] = [];

    // ✅ GERAR FINAL SE NÃO EXISTE
    if (finalMatches.length === 0) {
      console.log("🏆 [SIMULTANEOUS] Gerando Final...");

      const winnerIds = semifinalMatches.map((m) => m.winnerId!);
      const winner1 = state.currentChampionship.athletes.find(
        (a) => a.id === winnerIds[0]
      );
      const winner2 = state.currentChampionship.athletes.find(
        (a) => a.id === winnerIds[1]
      );

      if (winner1 && winner2) {
        const finalMatch: Match = {
          id: `final-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          player1Id: winner1.id,
          player2Id: winner2.id,
          player1: winner1,
          player2: winner2,
          sets: [],
          isCompleted: false,
          phase: "knockout",
          round: finalRound,
          position: 0,
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        };
        newMatches.push(finalMatch);
        console.log(
          `✅ [SIMULTANEOUS] Final criada: ${winner1.name} vs ${winner2.name}`
        );
      }
    }

    // ✅ GERAR TERCEIRO LUGAR SE NÃO EXISTE E ESTÁ HABILITADO
    if (
      state.currentChampionship.hasThirdPlace &&
      thirdPlaceRound &&
      thirdPlaceMatches.length === 0
    ) {
      console.log("🥉 [SIMULTANEOUS] Gerando Terceiro Lugar...");

      const loserIds = semifinalMatches.map((m) =>
        m.winnerId === m.player1Id ? m.player2Id : m.player1Id
      );
      const loser1 = state.currentChampionship.athletes.find(
        (a) => a.id === loserIds[0]
      );
      const loser2 = state.currentChampionship.athletes.find(
        (a) => a.id === loserIds[1]
      );

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
          round: thirdPlaceRound,
          isThirdPlace: true,
          position: 0,
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        };
        newMatches.push(thirdPlaceMatch);
        console.log(
          `✅ [SIMULTANEOUS] Terceiro lugar criado: ${loser1.name} vs ${loser2.name}`
        );
      }
    }

    // ✅ SALVAR TODAS AS NOVAS PARTIDAS DE UMA VEZ
    if (newMatches.length > 0) {
      await saveNewMatches(newMatches, state, get);
      console.log(
        `🎉 [SIMULTANEOUS] ${newMatches.length} partida(s) criada(s) simultaneamente!`
      );
    }
  }
}

// ✅ FUNÇÃO MELHORADA PARA OUTRAS RODADAS SEQUENCIAIS
async function handleSequentialRounds(
  matches: Match[],
  rounds: string[],
  state: any,
  get: any
) {
  console.log("🔄 [SEQ-V2] Verificando rodadas sequenciais");

  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = rounds[i];
    const nextRound = rounds[i + 1];

    // ✅ PULAR Final e Terceiro Lugar (já tratados simultaneamente)
    if (nextRound === "Final" || nextRound.includes("3º Lugar")) {
      continue;
    }

    const currentRoundMatches = matches.filter((m) => m.round === currentRound);
    const nextRoundMatches = matches.filter((m) => m.round === nextRound);

    if (
      currentRoundMatches.length > 0 &&
      currentRoundMatches.every((m) => m.isCompleted) &&
      nextRoundMatches.length === 0
    ) {
      console.log(
        `✅ [SEQ-V2] Gerando ${nextRound} a partir de ${currentRound}`
      );

      const newMatches = generateNextRoundMatches(
        currentRoundMatches,
        nextRound,
        state.currentChampionship.athletes
      );

      if (newMatches.length > 0) {
        await saveNewMatches(newMatches, state, get);
        console.log(`✅ [SEQ-V2] ${nextRound} gerada com sucesso!`);
      }
    }
  }
}

// Função específica para gerar Final
async function generateFinalMatch(mainMatches: Match[], state: any, get: any) {
  console.log("\n🏆 [FINAL] Verificando geração da Final...");

  const semifinalMatches = mainMatches.filter((m) => m.round === "Semifinal");
  const finalMatches = mainMatches.filter((m) => m.round === "Final");

  console.log(`🏆 [FINAL] Semifinais encontradas: ${semifinalMatches.length}`);
  console.log(`🏆 [FINAL] Finais existentes: ${finalMatches.length}`);

  // Log detalhado das semifinais
  semifinalMatches.forEach((match, index) => {
    console.log(
      `  Semifinal ${index + 1}: ${match.player1?.name} vs ${
        match.player2?.name
      } - Completa: ${match.isCompleted} - Vencedor: ${match.winnerId}`
    );
  });

  // Condições para gerar Final:
  // 1. Exatamente 2 semifinais
  // 2. Ambas semifinais completadas
  // 3. Nenhuma final existe
  if (
    semifinalMatches.length === 2 &&
    semifinalMatches.every((m) => m.isCompleted) &&
    finalMatches.length === 0
  ) {
    console.log("✅ [FINAL] Condições atendidas - Gerando Final");

    // ✅ GARANTIR QUE OS VENCEDORES ESTEJAM CORRETOS
    const winnerIds: string[] = [];

    semifinalMatches.forEach((match, index) => {
      let winnerId = match.winnerId;

      // Se não há winner definido, calcular usando getMatchWinner
      if (!winnerId && match.sets && match.sets.length > 0) {
        winnerId = getMatchWinner(
          match.sets,
          state.currentChampionship.knockoutBestOf,
          match.player1Id,
          match.player2Id
        );
        console.log(
          `  Recalculando vencedor da semifinal ${index + 1}: ${winnerId}`
        );
      }

      if (winnerId) {
        winnerIds.push(winnerId);
        const winnerName =
          winnerId === match.player1Id
            ? match.player1?.name
            : match.player2?.name;
        console.log(
          `  Vencedor semifinal ${index + 1}: ${winnerName} (ID: ${winnerId})`
        );
      }
    });

    if (winnerIds.length === 2) {
      const winner1 = state.currentChampionship.athletes.find(
        (a) => a.id === winnerIds[0]
      );
      const winner2 = state.currentChampionship.athletes.find(
        (a) => a.id === winnerIds[1]
      );

      if (winner1 && winner2) {
        const finalMatchId = `final-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 5)}`;

        const finalMatch: Match = {
          id: finalMatchId,
          player1Id: winner1.id,
          player2Id: winner2.id,
          player1: winner1,
          player2: winner2,
          sets: [],
          isCompleted: false,
          phase: "knockout",
          round: "Final",
          position: 0,
          timeoutsUsed: {
            player1: false,
            player2: false,
          },
          createdAt: new Date(),
        };

        await saveNewMatches([finalMatch], state, get);
        console.log(`🏆 [FINAL] Final gerada com sucesso!`);
        console.log(
          `  Final: ${winner1.name} vs ${winner2.name} (ID: ${finalMatchId})`
        );
      } else {
        console.log(
          "❌ [FINAL] Erro ao buscar atletas vencedores das semifinais"
        );
      }
    } else {
      console.log(`❌ [FINAL] Vencedores insuficientes: ${winnerIds.length}/2`);
    }
  } else {
    console.log("⏳ [FINAL] Condições não atendidas:");
    console.log(`  - Semifinais: ${semifinalMatches.length}/2`);
    console.log(
      `  - Completadas: ${
        semifinalMatches.filter((m) => m.isCompleted).length
      }/2`
    );
    console.log(`  - Final existente: ${finalMatches.length}/0`);
  }
}

// ✅ FUNÇÃO PARA GERAR DISPUTA DE 3º LUGAR - CORRIGIDA
async function generateThirdPlaceMatch(
  matches: Match[],
  state: any,
  get: any,
  roundName: string
) {
  console.log(`\n🥉 [3RD] Verificando geração de ${roundName}...`);

  const semifinalRound = roundName.includes("2ª Div")
    ? "Semifinal 2ª Div"
    : "Semifinal";
  const semifinalMatches = matches.filter((m) => m.round === semifinalRound);
  const thirdPlaceMatches = matches.filter((m) => m.round === roundName);

  if (
    semifinalMatches.length === 2 &&
    semifinalMatches.every((m) => m.isCompleted && m.winnerId) &&
    thirdPlaceMatches.length === 0
  ) {
    console.log(`✅ [3RD] Gerando ${roundName}`);

    // ✅ USAR FUNÇÃO CORRIGIDA
    const thirdPlaceMatch = generateThirdPlaceMatches(
      semifinalMatches,
      roundName,
      state.currentChampionship.athletes,
      state.currentChampionship.knockoutBestOf
    );

    if (thirdPlaceMatch.length > 0) {
      await saveNewMatches(thirdPlaceMatch, state, get);
      console.log(`🥉 [3RD] ${roundName} gerada com sucesso!`);
    }
  }
}

// Função para gerar próximas rodadas da segunda divisão - CORRIGIDA
async function generateNextSecondDivRounds(
  secondDivMatches: Match[],
  state: any,
  get: any
) {
  console.log("\n🥈 [2ND-DIV] Verificando rodadas da segunda divisão...");

  const rounds = [
    "Oitavas 2ª Div",
    "Quartas 2ª Div",
    "Semifinal 2ª Div",
    "Final 2ª Div",
  ];

  // Verificar rodadas sequenciais
  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = rounds[i];
    const nextRound = rounds[i + 1];

    const currentMatches = secondDivMatches.filter(
      (m) => m.round === currentRound
    );
    const nextMatches = secondDivMatches.filter((m) => m.round === nextRound);

    if (
      currentMatches.length > 0 &&
      currentMatches.every((m) => m.isCompleted) &&
      nextMatches.length === 0
    ) {
      const newMatches = generateNextRoundMatches(
        currentMatches,
        nextRound,
        state.currentChampionship.athletes,
        state.currentChampionship.knockoutBestOf
      );

      if (newMatches.length > 0) {
        await saveNewMatches(newMatches, state, get);
        console.log(`✅ [2ND-DIV] ${nextRound} gerada`);
      }
    }
  }

  // ✅ VERIFICAR DISPUTA DE 3º LUGAR DA SEGUNDA DIVISÃO - CORRIGIDA
  if (state.currentChampionship.hasThirdPlace) {
    await generateThirdPlaceMatch(
      secondDivMatches,
      state,
      get,
      "3º Lugar 2ª Div"
    );
  }
}

// Função auxiliar para salvar novas partidas
async function saveNewMatches(newMatches: Match[], state: any, get: any) {
  const updatedGroups = state.currentChampionship.groups.map((group, index) =>
    index === 0
      ? { ...group, matches: [...group.matches, ...newMatches] }
      : group
  );

  const updatedChampionship = {
    ...state.currentChampionship,
    groups: updatedGroups,
    totalMatches: state.currentChampionship.totalMatches + newMatches.length,
  };

  await get().updateChampionship(updatedChampionship);
}

export const useChampionshipStore = create<ChampionshipStore>((set, get) => ({
  championships: [],
  currentChampionship: undefined,
  isLoading: false,
  error: undefined,

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  createChampionship: async (config, athletes) => {
    set({ isLoading: true, error: undefined });

    try {
      const maxSeeds = Math.min(4, Math.ceil(athletes.length / 4));
      const seededAthletes = athletes.map((athlete, index) => ({
        ...athlete,
        id: athlete.id || uuidv4(),
        isSeeded: index < maxSeeds,
        seedNumber: index < maxSeeds ? index + 1 : undefined,
      }));

      const championship: Championship = {
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
        athletes: seededAthletes,
        totalAthletes: seededAthletes.length,
        groups: [],
        knockoutBracket: [],
        totalMatches: 0,
        completedMatches: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      set((state) => ({
        championships: [...state.championships, championship],
        currentChampionship: championship,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao criar campeonato";
      set({ error: errorMessage, isLoading: false });
      console.error("Erro na criação do campeonato:", error);
    }
  },

  loadChampionship: async (id) => {
    set({ isLoading: true, error: undefined });

    try {
      const state = get();
      const championship = state.championships.find((c) => c.id === id);

      if (!championship) {
        throw new Error("Campeonato não encontrado");
      }

      set({ currentChampionship: championship, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao carregar campeonato";
      set({ error: errorMessage, isLoading: false });
      console.error("Erro ao carregar campeonato:", error);
    }
  },

  updateChampionship: async (championship) => {
    const updatedChampionship = { ...championship, updatedAt: new Date() };

    set((state) => ({
      championships: state.championships.map((c) =>
        c.id === championship.id ? updatedChampionship : c
      ),
      currentChampionship:
        state.currentChampionship?.id === championship.id
          ? updatedChampionship
          : state.currentChampionship,
    }));
  },

  deleteChampionship: async (id) => {
    set((state) => ({
      championships: state.championships.filter((c) => c.id !== id),
      currentChampionship:
        state.currentChampionship?.id === id
          ? undefined
          : state.currentChampionship,
    }));
  },

  addAthlete: async (athleteData) => {
    const state = get();
    if (!state.currentChampionship) return;

    const athlete: Athlete = {
      ...athleteData,
      id: uuidv4(),
    };

    const updatedChampionship = {
      ...state.currentChampionship,
      athletes: [...state.currentChampionship.athletes, athlete],
      totalAthletes: state.currentChampionship.totalAthletes + 1,
    };

    await get().updateChampionship(updatedChampionship);
  },

  updateAthlete: async (athlete) => {
    const state = get();
    if (!state.currentChampionship) return;

    const updatedChampionship = {
      ...state.currentChampionship,
      athletes: state.currentChampionship.athletes.map((a) =>
        a.id === athlete.id ? athlete : a
      ),
    };

    await get().updateChampionship(updatedChampionship);
  },

  removeAthlete: async (athleteId) => {
    const state = get();
    if (!state.currentChampionship) return;

    const updatedChampionship = {
      ...state.currentChampionship,
      athletes: state.currentChampionship.athletes.filter(
        (a) => a.id !== athleteId
      ),
      totalAthletes: state.currentChampionship.totalAthletes - 1,
    };

    await get().updateChampionship(updatedChampionship);
  },

  generateGroups: async () => {
    const state = get();
    if (!state.currentChampionship) return;

    const { athletes, groupSize } = state.currentChampionship;
    const numGroups = Math.ceil(athletes.length / groupSize);

    const seeded = athletes
      .filter((a) => a.isSeeded)
      .sort((a, b) => (a.seedNumber || 0) - (b.seedNumber || 0));
    const unseeded = athletes.filter((a) => !a.isSeeded);

    const groups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
      id: uuidv4(),
      name: `Grupo ${String.fromCharCode(65 + i)}`,
      athletes: [],
      matches: [],
      standings: [],
      qualificationSpots: state.currentChampionship!.qualificationSpotsPerGroup,
      isCompleted: false,
    }));

    seeded.forEach((athlete, index) => {
      const groupIndex = index % numGroups;
      groups[groupIndex].athletes.push(athlete);
    });

    unseeded.forEach((athlete, index) => {
      const groupIndex = index % numGroups;
      groups[groupIndex].athletes.push(athlete);
    });

    let totalMatches = 0;
    groups.forEach((group) => {
      const groupMatches = generateGroupMatches(group);
      group.matches = groupMatches;
      group.standings = get().calculateGroupStandings(group);
      totalMatches += groupMatches.length;
    });

    const updatedChampionship = {
      ...state.currentChampionship,
      groups,
      totalMatches,
      status: "groups" as const,
    };

    await get().updateChampionship(updatedChampionship);
  },

  createManualGroups: async (manualGroups) => {
    const state = get();
    if (!state.currentChampionship) return;

    const groups: Group[] = manualGroups.map((manualGroup, index) => {
      const groupAthletes = manualGroup.athleteIds
        .map((id) =>
          state.currentChampionship!.athletes.find((a) => a.id === id)
        )
        .filter((athlete): athlete is Athlete => athlete !== undefined);

      const group: Group = {
        id: uuidv4(),
        name: manualGroup.name || `Grupo ${String.fromCharCode(65 + index)}`,
        athletes: groupAthletes,
        matches: [],
        standings: [],
        qualificationSpots:
          state.currentChampionship!.qualificationSpotsPerGroup,
        isCompleted: false,
      };

      group.matches = generateGroupMatches(group);
      group.standings = get().calculateGroupStandings(group);
      return group;
    });

    const totalMatches = groups.reduce(
      (total, group) => total + group.matches.length,
      0
    );

    const updatedChampionship = {
      ...state.currentChampionship,
      groups,
      totalMatches,
      status: "groups" as const,
    };

    await get().updateChampionship(updatedChampionship);
  },

  generateKnockoutBracket: async () => {
    const state = get();
    if (!state.currentChampionship) return;

    console.log("\n🏆 [KNOCKOUT-V2] === GERAÇÃO MATA-MATA ===");

    // 1. Forçar recálculo das classificações
    console.log("🔄 [KNOCKOUT-V2] Recalculando standings...");
    const updatedGroups = state.currentChampionship.groups.map((group) => {
      const newStandings = get().calculateGroupStandings(group);
      return { ...group, standings: newStandings };
    });

    const championshipWithUpdatedStandings = {
      ...state.currentChampionship,
      groups: updatedGroups,
    };

    await get().updateChampionship(championshipWithUpdatedStandings);

    // 2. Verificar se TODOS os grupos estão completos (para mata-mata principal)
    const incompleteGroups = updatedGroups.filter(
      (group) =>
        !group.isCompleted ||
        group.standings.length === 0 ||
        group.matches.some((m) => !m.isCompleted)
    );

    console.log(`📊 [KNOCKOUT-V2] Status dos grupos:`, {
      total: updatedGroups.length,
      incompletos: incompleteGroups.length,
      nomes: incompleteGroups.map((g) => g.name),
    });

    if (incompleteGroups.length > 0) {
      console.log(
        "❌ [KNOCKOUT-V2] Nem todos os grupos estão completos - abortando"
      );
      return;
    }

    // 3. Verificar se mata-mata já foi gerado
    const existingKnockoutMatches = updatedGroups
      .flatMap((g) => g.matches)
      .filter((m) => m.phase === "knockout");

    if (existingKnockoutMatches.length > 0) {
      console.log("⚠️ [KNOCKOUT-V2] Mata-mata já foi gerado");
      return;
    }

    // 4. Obter atletas qualificados e eliminados
    const qualifiedAthletes = get().getQualifiedAthletes();
    const eliminatedAthletes = get().getEliminatedAthletes();

    console.log(`📊 [KNOCKOUT-V2] Atletas:`, {
      qualificados: qualifiedAthletes.length,
      eliminados: eliminatedAthletes.length,
      hasRepechage: state.currentChampionship.hasRepechage,
    });

    if (qualifiedAthletes.length < 4) {
      console.log("❌ [KNOCKOUT-V2] Insuficientes qualificados para mata-mata");
      return;
    }

    // 5. Gerar mata-mata principal
    let mainBracketSize = 4;
    while (mainBracketSize < qualifiedAthletes.length) {
      mainBracketSize *= 2;
    }

    console.log(
      `🎯 [KNOCKOUT-V2] Gerando mata-mata principal (${mainBracketSize} vagas)`
    );
    const mainKnockoutMatches = generateMainKnockoutMatches(
      qualifiedAthletes,
      mainBracketSize
    );

    let allKnockoutMatches = [...mainKnockoutMatches];
    console.log(
      `✅ [KNOCKOUT-V2] Mata-mata principal: ${mainKnockoutMatches.length} partidas`
    );

    // 6. GERAÇÃO DA SEGUNDA DIVISÃO - USAR UTIL
    if (
      state.currentChampionship.hasRepechage &&
      eliminatedAthletes.length >= 2
    ) {
      console.log(
        "✅ [SEGUNDA-DIV-V2] Condições atendidas - gerando segunda divisão"
      );

      // usar implementação robusta do utilitário
      const secondDivisionMatches =
        generateSecondDivisionMatches(eliminatedAthletes);

      console.log(
        `🎯 [SEGUNDA-DIV-V2] Partidas geradas: ${secondDivisionMatches.length}`
      );

      if (secondDivisionMatches.length > 0) {
        allKnockoutMatches = [...allKnockoutMatches, ...secondDivisionMatches];

        secondDivisionMatches.forEach((match, index) => {
          console.log(
            `  ${index + 1}. ${match.player1?.name} vs ${
              match.player2?.name
            } (${match.round})`
          );
        });
      } else {
        console.log("❌ [SEGUNDA-DIV-V2] Nenhuma partida foi gerada");
      }
    }

    // 7. Salvar todas as partidas
    const finalUpdatedGroups = updatedGroups.map((group, index) =>
      index === 0
        ? { ...group, matches: [...group.matches, ...allKnockoutMatches] }
        : group
    );

    const knockoutBracket = allKnockoutMatches.map((match, index) => ({
      id: `node-${match.id}`,
      round: match.round || "Unknown",
      position: match.position || index,
      match: match,
    }));

    const updatedChampionship = {
      ...championshipWithUpdatedStandings,
      groups: finalUpdatedGroups,
      knockoutBracket: knockoutBracket,
      status: "knockout" as const,
      totalMatches:
        championshipWithUpdatedStandings.totalMatches +
        allKnockoutMatches.length,
    };

    await get().updateChampionship(updatedChampionship);

    console.log(`🎉 [KNOCKOUT-V2] MATA-MATA GERADO COM SUCESSO!`);
    console.log(`📊 [KNOCKOUT-V2] Resumo:`, {
      totalPartidas: allKnockoutMatches.length,
      principal: mainKnockoutMatches.length,
      segundaDivisao: allKnockoutMatches.length - mainKnockoutMatches.length,
    });
    console.log("🏆 [KNOCKOUT-V2] === FIM GERAÇÃO ===\n");
  },

  generateSecondDivisionBracket: async () => {
    const state = get();
    if (!state.currentChampionship) return;

    console.log(
      "\n🥈 [SEGUNDA-DIV-MANUAL] Geração manual da segunda divisão..."
    );

    const eliminatedAthletes = get().getEliminatedAthletes();

    console.log(
      `📊 [SEGUNDA-DIV-MANUAL] Atletas eliminados: ${eliminatedAthletes.length}`
    );
    eliminatedAthletes.forEach((athlete, index) => {
      console.log(`  ${index + 1}. ${athlete.name}`);
    });

    if (eliminatedAthletes.length < 2) {
      console.log(
        "❌ [SEGUNDA-DIV-MANUAL] Não há atletas suficientes para segunda divisão"
      );
      return;
    }

    // Verificar se segunda divisão já foi gerada
    const existingSecondDiv = state.currentChampionship.groups
      .flatMap((g) => g.matches)
      .filter((m) => m.phase === "knockout" && m.round?.includes("2ª Div"));

    console.log(
      `📊 [SEGUNDA-DIV-MANUAL] Partidas existentes da 2ª Div: ${existingSecondDiv.length}`
    );

    if (existingSecondDiv.length > 0) {
      console.log("⚠️ [SEGUNDA-DIV-MANUAL] Segunda divisão já foi gerada");
      return;
    }

    console.log(
      "🎯 [SEGUNDA-DIV-MANUAL] Gerando partidas da segunda divisão..."
    );
    const secondDivisionMatches =
      generateSecondDivisionMatches(eliminatedAthletes);

    console.log(
      `✅ [SEGUNDA-DIV-MANUAL] Partidas geradas: ${secondDivisionMatches.length}`
    );
    secondDivisionMatches.forEach((match, index) => {
      console.log(
        `  ${index + 1}. ${match.player1?.name} vs ${match.player2?.name} (${
          match.round
        })`
      );
    });

    if (secondDivisionMatches.length === 0) {
      console.log(
        "❌ [SEGUNDA-DIV-MANUAL] Nenhuma partida de segunda divisão foi gerada"
      );
      return;
    }

    // Salvar partidas
    const updatedGroups = state.currentChampionship.groups.map((group, index) =>
      index === 0
        ? { ...group, matches: [...group.matches, ...secondDivisionMatches] }
        : group
    );

    const updatedChampionship = {
      ...state.currentChampionship,
      groups: updatedGroups,
      totalMatches:
        state.currentChampionship.totalMatches + secondDivisionMatches.length,
    };

    await get().updateChampionship(updatedChampionship);
    console.log("🎉 [SEGUNDA-DIV-MANUAL] Segunda divisão gerada com sucesso!");
  },
  generateSecondDivisionMatches: (eliminatedAthletes: Athlete[]) => {
    console.log("\n🥈 [GEN-2ND-V2] === GERAÇÃO PARTIDAS 2ª DIVISÃO ===");

    if (!eliminatedAthletes || eliminatedAthletes.length < 2) {
      console.log(
        "❌ [GEN-2ND-V2] Insuficientes atletas:",
        eliminatedAthletes?.length || 0
      );
      return [];
    }

    const matches: Match[] = [];

    console.log(
      `🥈 [GEN-2ND-V2] Atletas recebidos: ${eliminatedAthletes.length}`
    );
    eliminatedAthletes.forEach((athlete, index) => {
      console.log(`  ${index + 1}. ${athlete.name} (ID: ${athlete.id})`);
    });

    // ✅ LÓGICA BASEADA NA SUA SUGESTÃO: Emparelhar em sequência
    const pairs: { player1: Athlete; player2: Athlete }[] = [];

    for (let i = 0; i < eliminatedAthletes.length; i += 2) {
      if (eliminatedAthletes[i + 1]) {
        pairs.push({
          player1: eliminatedAthletes[i],
          player2: eliminatedAthletes[i + 1],
        });
      }
    }

    console.log(`🎯 [GEN-2ND-V2] Pares formados: ${pairs.length}`);

    // ✅ Determinar rodada inicial baseada no número de pares
    let roundName = "Final 2ª Div";
    if (pairs.length >= 4) roundName = "Oitavas 2ª Div";
    else if (pairs.length >= 2) roundName = "Quartas 2ª Div";
    else if (pairs.length === 1) roundName = "Final 2ª Div";

    console.log(`🏆 [GEN-2ND-V2] Rodada inicial: ${roundName}`);

    // ✅ Criar partidas
    pairs.forEach((pair, index) => {
      const matchId = `second-div-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}-${index}`;

      const match: Match = {
        id: matchId,
        player1Id: pair.player1.id,
        player2Id: pair.player2.id,
        player1: pair.player1,
        player2: pair.player2,
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: roundName,
        position: index,
        timeoutsUsed: {
          player1: false,
          player2: false,
        },
        createdAt: new Date(),
      };

      matches.push(match);

      console.log(`✅ [GEN-2ND-V2] Partida ${index + 1} criada:`);
      console.log(`    ${pair.player1.name} vs ${pair.player2.name}`);
      console.log(`    ID: ${matchId}`);
      console.log(`    Rodada: ${roundName}`);
    });

    console.log(`🎉 [GEN-2ND-V2] Total de partidas criadas: ${matches.length}`);
    console.log("🥈 [GEN-2ND-V2] === FIM GERAÇÃO ===\n");

    return matches;
  },

  // CORREÇÃO: Função updateMatchResult também precisa usar a função correta
  updateMatchResult: async (result) => {
    const state = get();
    if (!state.currentChampionship) return;

    console.log(
      "\n🏓 [UPDATE-RESULT] Atualizando resultado da partida:",
      result.matchId
    );

    const updatedGroups = state.currentChampionship.groups.map((group) => ({
      ...group,
      matches: group.matches.map((match) => {
        if (match.id === result.matchId) {
          // ✅ USAR A FUNÇÃO AUXILIAR CORRIGIDA
          const updatedMatch = updateMatchWithResult(
            match,
            result,
            state.currentChampionship!
          );

          console.log("🏓 [UPDATE-RESULT] Partida atualizada:", {
            id: updatedMatch.id,
            round: updatedMatch.round,
            phase: updatedMatch.phase,
            winner: updatedMatch.winnerId,
            completed: updatedMatch.isCompleted,
            sets: updatedMatch.sets.length,
            isThirdPlace: updatedMatch.isThirdPlace,
          });

          return updatedMatch;
        }
        return match;
      }),
    }));

    // Recalcular standings para o grupo afetado
    updatedGroups.forEach((group) => {
      const affectedMatch = group.matches.find((m) => m.id === result.matchId);
      if (affectedMatch && affectedMatch.phase === "groups") {
        console.log(
          `🔄 [UPDATE-RESULT] Recalculando standings para ${group.name}`
        );
        group.standings = get().calculateGroupStandings(group);
        console.log(
          `✅ [UPDATE-RESULT] Standings atualizadas para ${group.name}`
        );
      }
    });

    const completedMatches = updatedGroups.reduce(
      (total, group) =>
        total + group.matches.filter((m) => m.isCompleted).length,
      0
    );

    const updatedChampionship = {
      ...state.currentChampionship,
      groups: updatedGroups,
      completedMatches,
    };

    await get().updateChampionship(updatedChampionship);

    // ✅ VERIFICAR E GERAR PRÓXIMA RODADA (incluindo Final)
    console.log("🔄 [UPDATE-RESULT] Verificando próximas rodadas...");
    await get().checkAndGenerateNextKnockoutRound(updatedGroups);
  },

  setWalkover: async (matchId, winnerId) => {
    const result: MatchResult = {
      matchId,
      sets: [],
      isWalkover: true,
      walkoverWinnerId: winnerId,
      timeoutsUsed: { player1: false, player2: false },
    };

    await get().updateMatchResult(result);
  },

  getGroupStandings: (groupId) => {
    const state = get();
    if (!state.currentChampionship) return [];

    const group = state.currentChampionship.groups.find(
      (g) => g.id === groupId
    );
    return group?.standings || [];
  },

  // CORREÇÃO: Função calculateGroupStandings corrigida
  calculateGroupStandings: (group) => {
    const state = get();
    const bestOf = state.currentChampionship?.groupsBestOf || 5;

    console.log(
      `\n🏓 Calculando standings para ${group.name} (Melhor de ${bestOf})`
    );
    console.log(
      `Atletas no grupo: ${group.athletes.map((a) => a.name).join(", ")}`
    );

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
    console.log(
      `Partidas concluídas: ${completedMatches.length}/${group.matches.length}`
    );

    completedMatches.forEach((match, index) => {
      console.log(`\nProcessando partida ${index + 1}:`);
      console.log(`${match.player1?.name} vs ${match.player2?.name}`);
      console.log(
        `Completa: ${match.isCompleted}, Walkover: ${match.isWalkover}`
      );
      console.log(`Sets:`, match.sets);

      // CORREÇÃO: Passar o bestOf correto para a função
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

    const totalMatches = group.matches.length;
    const completedMatchesCount = group.matches.filter(
      (m) => m.isCompleted
    ).length;

    console.log(`\n📊 Resultado final das standings:`);
    standings.forEach((s, i) => {
      console.log(
        `${i + 1}º ${s.athlete.name}: ${s.matches}J ${s.wins}V ${s.losses}D ${
          s.points
        }Pts`
      );
    });

    console.log(
      `Grupo ${group.name}: ${completedMatchesCount}/${totalMatches} partidas concluídas`
    );
    group.isCompleted =
      totalMatches > 0 && completedMatchesCount === totalMatches;

    return standings;
  },

  getQualifiedAthletes: () => {
    const state = get();
    if (!state.currentChampionship) return [];

    return state.currentChampionship.groups
      .flatMap((group) =>
        group.standings.filter((s) => s.qualified).map((s) => s.athlete)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  getEliminatedAthletes: () => {
    const state = get();
    if (!state.currentChampionship) return [];

    console.log("\n🔍 [ELIMINATED-V2] === BUSCA ATLETAS ELIMINADOS ===");

    const eliminated: Athlete[] = [];

    // ✅ NOVA LÓGICA: Analisar grupos individualmente, não exigir que TODOS estejam completos
    state.currentChampionship.groups.forEach((group, _groupIndex) => {
      console.log(`\n📋 [ELIMINATED-V2] Analisando ${group.name}:`);
      console.log(`  Completo: ${group.isCompleted}`);
      console.log(`  Atletas: ${group.athletes.length}`);
      console.log(`  Standings: ${group.standings.length}`);

      // Se o grupo está completo, podemos identificar eliminados
      if (group.isCompleted && group.standings.length > 0) {
        const sortedStandings = [...group.standings].sort((a, b) => {
          // Ordenar por posição (já calculada no standing)
          return a.position - b.position;
        });

        console.log(`  📊 [ELIMINATED-V2] Rankings em ${group.name}:`);
        sortedStandings.forEach((standing, idx) => {
          console.log(
            `    ${idx + 1}º ${standing.athlete.name} - ${
              standing.qualified ? "✅ Qualificado" : "❌ Eliminado"
            }`
          );
        });

        // Pegar atletas não qualificados (eliminados)
        const groupEliminated = sortedStandings
          .filter((standing) => !standing.qualified)
          .map((standing) => standing.athlete);

        eliminated.push(...groupEliminated);

        console.log(
          `  📤 [ELIMINATED-V2] ${groupEliminated.length} eliminados em ${group.name}`
        );
      } else {
        console.log(
          `  ⏳ [ELIMINATED-V2] ${group.name} ainda não está completo - pulando`
        );
      }
    });

    console.log(`\n✅ [ELIMINATED-V2] TOTAL ELIMINADOS: ${eliminated.length}`);
    eliminated.forEach((athlete, index) => {
      console.log(`  ${index + 1}. ${athlete.name} (ID: ${athlete.id})`);
    });

    console.log("🔍 [ELIMINATED-V2] === FIM BUSCA ===\n");
    return eliminated;
  },

  // ✅ VERIFICAR E GERAR PRÓXIMA RODADA - CORRIGIDO
  checkAndGenerateNextKnockoutRound: async (groups) => {
    const state = get();
    if (!state.currentChampionship) return;

    console.log(
      "\n🔄 [KNOCKOUT-V2] Iniciando verificação de próximas rodadas..."
    );

    const allKnockoutMatches = groups
      .flatMap((g) => g.matches)
      .filter((m) => m.phase === "knockout");

    if (allKnockoutMatches.length === 0) {
      console.log("❌ [KNOCKOUT-V2] Nenhuma partida de mata-mata encontrada");
      return;
    }

    const mainMatches = allKnockoutMatches.filter(
      (m) => !m.round?.includes("2ª Div")
    );
    const secondDivMatches = allKnockoutMatches.filter((m) =>
      m.round?.includes("2ª Div")
    );

    console.log(`🏆 [KNOCKOUT-V2] Partidas principais: ${mainMatches.length}`);
    console.log(
      `🥈 [KNOCKOUT-V2] Partidas 2ª divisão: ${secondDivMatches.length}`
    );

    // ✅ GERAÇÃO MELHORADA PARA PRIMEIRA DIVISÃO
    await checkRoundsProgression(
      mainMatches,
      ["Oitavas", "Quartas", "Semifinal", "Final", "3º Lugar"],
      state,
      get
    );

    // ✅ GERAÇÃO MELHORADA PARA SEGUNDA DIVISÃO
    if (state.currentChampionship.hasRepechage && secondDivMatches.length > 0) {
      await checkRoundsProgression(
        secondDivMatches,
        [
          "Oitavas 2ª Div",
          "Quartas 2ª Div",
          "Semifinal 2ª Div",
          "Final 2ª Div",
          "3º Lugar 2ª Div",
        ],
        state,
        get
      );
    }

    // ✅ VERIFICAR SE CAMPEONATO ESTÁ COMPLETO
    const updatedState = get();
    if (updatedState.currentChampionship) {
      const updatedKnockoutMatches = updatedState.currentChampionship.groups
        .flatMap((g) => g.matches)
        .filter((m) => m.phase === "knockout");

      const finalMatch = updatedKnockoutMatches.find(
        (m) => m.round === "Final"
      );
      const finalSecondDiv = updatedKnockoutMatches.find(
        (m) => m.round === "Final 2ª Div"
      );
      const thirdPlaceMatch = updatedKnockoutMatches.find(
        (m) => m.round === "3º Lugar"
      );
      const thirdPlaceSecondDiv = updatedKnockoutMatches.find(
        (m) => m.round === "3º Lugar 2ª Div"
      );

      const mainCompleted = finalMatch?.isCompleted || false;
      const thirdPlaceCompleted =
        !state.currentChampionship.hasThirdPlace ||
        (thirdPlaceMatch?.isCompleted ?? false);

      const repechageCompleted =
        !state.currentChampionship.hasRepechage ||
        (finalSecondDiv?.isCompleted ?? false) ||
        secondDivMatches.length === 0;

      const thirdPlaceSecondCompleted =
        !state.currentChampionship.hasRepechage ||
        !state.currentChampionship.hasThirdPlace ||
        (thirdPlaceSecondDiv?.isCompleted ?? false) ||
        secondDivMatches.length === 0;

      console.log("🔍 [KNOCKOUT-V2] Status de conclusão:", {
        mainCompleted,
        thirdPlaceCompleted,
        repechageCompleted,
        thirdPlaceSecondCompleted,
      });

      if (
        mainCompleted &&
        thirdPlaceCompleted &&
        repechageCompleted &&
        thirdPlaceSecondCompleted
      ) {
        const completedChampionship = {
          ...updatedState.currentChampionship,
          status: "completed" as const,
        };
        await get().updateChampionship(completedChampionship);
        console.log("🎉 [KNOCKOUT-V2] Campeonato finalizado!");
      }
    }
  },

  fillGroupsWithRandomResults: async () => {
    const state = get();
    if (!state.currentChampionship) return;

    console.log("Preenchendo grupos com resultados aleatórios...");

    const { generateTestMatchResult } = await import("../utils");

    const updatedGroups = state.currentChampionship.groups.map((group) => {
      const updatedMatches = group.matches.map((match) => {
        if (match.isCompleted) return match;

        const testResult = generateTestMatchResult(
          state.currentChampionship!.groupsBestOf
        );

        // Ensure sets have all required properties for Set type
        const validSets = testResult.sets.map((set) => ({
          player1Score: set.player1Score,
          player2Score: set.player2Score,
        }));

        return {
          ...match,
          sets: validSets,
          isCompleted: true,
          completedAt: new Date(),
          timeoutsUsed: {
            player1: testResult.timeouts.player1,
            player2: testResult.timeouts.player2,
          },
          winnerId: getMatchWinner(
            validSets,
            state.currentChampionship!.groupsBestOf,
            match.player1Id,
            match.player2Id
          ),
        };
      });

      return { ...group, matches: updatedMatches };
    });

    updatedGroups.forEach((group) => {
      group.standings = get().calculateGroupStandings(group);
      const completedMatches = group.matches.filter(
        (m) => m.isCompleted
      ).length;
      const totalMatches = group.matches.length;
      group.isCompleted = totalMatches > 0 && completedMatches === totalMatches;
    });

    const completedMatches = updatedGroups.reduce(
      (total, group) =>
        total + group.matches.filter((m) => m.isCompleted).length,
      0
    );

    const updatedChampionship = {
      ...state.currentChampionship,
      groups: updatedGroups,
      completedMatches,
    };

    await get().updateChampionship(updatedChampionship);
    console.log("Grupos preenchidos com sucesso!");
  },

  createTestChampionship: async () => {
    set({ isLoading: true, error: undefined });

    try {
      const testAthletes = [
        "João Silva",
        "Maria Santos",
        "Pedro Oliveira",
        "Ana Costa",
        "Carlos Ferreira",
        "Lucia Rodrigues",
        "Bruno Almeida",
        "Fernanda Lima",
        "Rafael Santos",
        "Julia Pereira",
        "Diego Souza",
        "Camila Barbosa",
        "Lucas Martins",
        "Beatriz Castro",
        "Marcos Ribeiro",
        "Amanda Rocha",
      ];

      const config: TournamentConfig = {
        name: "🎯 Teste Completo - TM Club",
        date: new Date(),
        groupSize: 4,
        qualificationSpotsPerGroup: 2,
        groupsBestOf: 5,
        knockoutBestOf: 5,
        hasThirdPlace: true,
        hasRepechage: true,
      };

      const athletes: Athlete[] = testAthletes.map((name, index) => ({
        id: `test-${index}`,
        name,
        isSeeded: index < 4,
        seedNumber: index < 4 ? index + 1 : undefined,
      }));

      await get().createChampionship(config, athletes);
      await get().generateGroups();

      console.log("✅ Campeonato de teste criado com sucesso!");
      console.log(
        `📊 ${athletes.length} atletas, ${Math.ceil(
          athletes.length / 4
        )} grupos`
      );

      set({ isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao criar campeonato de teste";
      set({ error: errorMessage, isLoading: false });
      console.error("Erro na criação do campeonato de teste:", error);
    }
  },
}));

// Funções auxiliares
function generateGroupMatches(group: Group): Match[] {
  const groupMatches: Match[] = [];
  const groupAthletes = group.athletes;

  for (let i = 0; i < groupAthletes.length; i++) {
    for (let j = i + 1; j < groupAthletes.length; j++) {
      const match: Match = {
        id: uuidv4(),
        player1Id: groupAthletes[i].id,
        player2Id: groupAthletes[j].id,
        player1: groupAthletes[i],
        player2: groupAthletes[j],
        sets: [],
        isCompleted: false,
        phase: "groups",
        groupId: group.id,
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };
      groupMatches.push(match);
    }
  }

  return groupMatches;
}

// Função auxiliar para atualizar partida com resultado - CORRIGIDA
function updateMatchWithResult(
  match: Match,
  result: MatchResult,
  championship: Championship
): Match {
  const updatedMatch = {
    ...match,
    sets: result.sets,
    isWalkover: result.isWalkover || false,
    walkoverWinnerId: result.walkoverWinnerId, // ✅ CORREÇÃO: usar walkoverWinnerId
    timeoutsUsed: result.timeoutsUsed,
    isCompleted: true,
    completedAt: new Date(),
  };

  if (!result.isWalkover) {
    // ✅ CORREÇÃO: Usar bestOf correto baseado na fase da partida
    const bestOf =
      match.phase === "knockout"
        ? championship.knockoutBestOf
        : championship.groupsBestOf;

    console.log(
      `📊 [UPDATE-MATCH] Calculando vencedor - Fase: ${match.phase}, BestOf: ${bestOf}, Sets: ${result.sets.length}`
    );

    const winner = getMatchWinner(
      result.sets,
      bestOf,
      match.player1Id,
      match.player2Id
    );

    // ✅ GARANTIR que o winnerId é sempre definido
    updatedMatch.winnerId = winner;

    console.log("✅ [UPDATE-MATCH] Vencedor determinado:", {
      winner,
      phase: match.phase,
      bestOf,
      round: match.round,
      sets: result.sets,
      player1: match.player1?.name,
      player2: match.player2?.name,
      winnerName:
        winner === match.player1Id ? match.player1?.name : match.player2?.name,
      isThirdPlace: match.isThirdPlace,
    });

    // ✅ VERIFICAÇÃO ADICIONAL: se não há vencedor, algo está errado
    if (!winner) {
      console.error(
        "❌ [UPDATE-MATCH] ERRO CRÍTICO: Nenhum vencedor determinado para partida completada!",
        {
          matchId: match.id,
          sets: result.sets,
          bestOf,
          validSets: result.sets.filter(isValidSet),
          player1: match.player1?.name,
          player2: match.player2?.name,
        }
      );
    }
  } else {
    // Para walkover, o vencedor é o walkoverWinnerId
    updatedMatch.winnerId = result.walkoverWinnerId;
    console.log(
      "✅ [UPDATE-MATCH] Walkover - Vencedor:",
      result.walkoverWinnerId
    );
  }

  return updatedMatch;
}

// Função de comparação de standings (mantida igual)
function compareStandings(a: GroupStanding, b: GroupStanding): number {
  if (a.points !== b.points) return b.points - a.points;
  if (a.setsDiff !== b.setsDiff) return b.setsDiff - a.setsDiff;
  if (a.pointsDiff !== b.pointsDiff) return b.pointsDiff - a.pointsDiff;
  return a.athlete.name.localeCompare(b.athlete.name);
}

if (typeof window !== "undefined") {
  // expõe a store no console do navegador
  (window as any).championshipStore = useChampionshipStore;
  console.log(
    "⚙️ [DEBUG] championshipStore disponível como window.championshipStore"
  );
}
