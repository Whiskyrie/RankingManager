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
  getMatchWinner as getMatchWinnerFromTypes,
} from "../types";
import {
  generateMainKnockoutMatches,
  generateSecondDivisionMatches, // UTILIZADO AGORA
  generateNextRoundMatches,
  getMatchWinner,
} from "../utils";

interface ChampionshipStore {
  // Estado
  championships: Championship[];
  currentChampionship?: Championship;
  isLoading: boolean;
  error?: string;

  // Ações básicas
  setError: (error: string | undefined) => void;
  setLoading: (loading: boolean) => void;

  // Gerenciamento de campeonatos
  createChampionship: (
    config: TournamentConfig,
    athletes: Athlete[]
  ) => Promise<void>;
  loadChampionship: (id: string) => Promise<void>;
  updateChampionship: (championship: Championship) => Promise<void>;
  deleteChampionship: (id: string) => Promise<void>;

  // Gerenciamento de atletas
  addAthlete: (athlete: Omit<Athlete, "id">) => Promise<void>;
  updateAthlete: (athlete: Athlete) => Promise<void>;
  removeAthlete: (athleteId: string) => Promise<void>;

  // Sorteios e grupos
  generateGroups: () => Promise<void>;
  createManualGroups: (
    manualGroups: { name: string; athleteIds: string[] }[]
  ) => Promise<void>;
  generateKnockoutBracket: () => Promise<void>;
  generateSecondDivisionBracket: () => Promise<void>; // NOVA FUNÇÃO

  // Resultados
  updateMatchResult: (result: MatchResult) => Promise<void>;
  setWalkover: (matchId: string, winnerId: string) => Promise<void>;

  // Utilitários
  getGroupStandings: (groupId: string) => GroupStanding[];
  calculateGroupStandings: (group: Group) => GroupStanding[];
  getQualifiedAthletes: () => Athlete[];
  getEliminatedAthletes: () => Athlete[];
  checkAndGenerateNextKnockoutRound: (groups: Group[]) => Promise<void>;
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
      // Aplicar cabeças de chave para os primeiros atletas
      const seededAthletes = athletes.map((athlete, index) => ({
        ...athlete,
        id: athlete.id || uuidv4(),
        isSeeded: index < Math.min(4, Math.ceil(athletes.length / 4)), // Máximo 4 cabeças de chave
        seedNumber:
          index < Math.min(4, Math.ceil(athletes.length / 4))
            ? index + 1
            : undefined,
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
    set((state) => ({
      championships: state.championships.map((c) =>
        c.id === championship.id
          ? { ...championship, updatedAt: new Date() }
          : c
      ),
      currentChampionship:
        state.currentChampionship?.id === championship.id
          ? { ...championship, updatedAt: new Date() }
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

    // Separar cabeças de chave dos demais
    const seeded = athletes
      .filter((a) => a.isSeeded)
      .sort((a, b) => (a.seedNumber || 0) - (b.seedNumber || 0));
    const unseeded = athletes.filter((a) => !a.isSeeded);

    // Inicializar grupos
    const groups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
      id: uuidv4(),
      name: `Grupo ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
      athletes: [],
      matches: [],
      standings: [],
      qualificationSpots: state.currentChampionship!.qualificationSpotsPerGroup,
      isCompleted: false,
    }));

    // Distribuir cabeças de chave primeiro
    seeded.forEach((athlete, index) => {
      const groupIndex = index % numGroups;
      groups[groupIndex].athletes.push(athlete);
    });

    // Distribuir demais atletas
    unseeded.forEach((athlete, index) => {
      const groupIndex = index % numGroups;
      groups[groupIndex].athletes.push(athlete);
    });

    // Gerar partidas para cada grupo (todos contra todos)
    let totalMatches = 0;
    groups.forEach((group) => {
      const groupMatches: Match[] = [];
      const groupAthletes = group.athletes;

      // Gerar todas as combinações de partidas
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
            timeoutsUsed: {
              player1: false,
              player2: false,
            },
            createdAt: new Date(),
          };
          groupMatches.push(match);
          totalMatches++;
        }
      }

      group.matches = groupMatches;
      group.standings = get().calculateGroupStandings(group);
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

      // Gerar partidas (todos contra todos)
      const groupMatches: Match[] = [];
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
            timeoutsUsed: {
              player1: false,
              player2: false,
            },
            createdAt: new Date(),
          };
          groupMatches.push(match);
        }
      }

      group.matches = groupMatches;
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

  // FUNÇÃO PRINCIPAL CORRIGIDA - Agora usa generateSecondDivisionMatches corretamente
  generateKnockoutBracket: async () => {
    const state = get();
    if (!state.currentChampionship) return;

    const qualifiedAthletes = get().getQualifiedAthletes();
    const eliminatedAthletes = get().getEliminatedAthletes();
    const numQualified = qualifiedAthletes.length;

    console.log("Gerando mata-mata:", {
      qualified: numQualified,
      eliminated: eliminatedAthletes.length,
      hasRepechage: state.currentChampionship.hasRepechage,
    });

    // Verificar se já existe mata-mata gerado
    const existingKnockoutMatches = state.currentChampionship.groups
      .flatMap((g) => g.matches)
      .filter((m) => m.phase === "knockout");

    if (existingKnockoutMatches.length > 0) {
      console.log("Mata-mata já foi gerado");
      return;
    }

    // Determinar tamanho da chave principal (potência de 2)
    let mainBracketSize = 4;
    while (mainBracketSize < numQualified) {
      mainBracketSize *= 2;
    }

    // Gerar partidas do mata-mata principal
    const mainKnockoutMatches = generateMainKnockoutMatches(
      qualifiedAthletes,
      mainBracketSize
    );

    let allKnockoutMatches = [...mainKnockoutMatches];

    // IMPLEMENTAÇÃO CORRETA DA SEGUNDA DIVISÃO
    if (
      state.currentChampionship.hasRepechage &&
      eliminatedAthletes.length >= 2
    ) {
      console.log(
        "Gerando segunda divisão para",
        eliminatedAthletes.length,
        "atletas eliminados"
      );

      // AQUI ESTÁ A UTILIZAÇÃO DA FUNÇÃO generateSecondDivisionMatches
      const secondDivisionMatches =
        generateSecondDivisionMatches(eliminatedAthletes);

      console.log(
        "Partidas da segunda divisão geradas:",
        secondDivisionMatches.length
      );

      // Adicionar partidas da segunda divisão
      allKnockoutMatches = [...allKnockoutMatches, ...secondDivisionMatches];
    }

    // Gerar partida de 3º lugar se configurado
    if (state.currentChampionship.hasThirdPlace) {
      // A partida de 3º lugar será gerada automaticamente após as semifinais
      console.log("Partida de 3º lugar será gerada após as semifinais");
    }

    // Adicionar todas as partidas do mata-mata ao primeiro grupo (temporário)
    const updatedGroups = state.currentChampionship.groups.map((group, index) =>
      index === 0
        ? { ...group, matches: [...group.matches, ...allKnockoutMatches] }
        : group
    );

    const updatedChampionship = {
      ...state.currentChampionship,
      groups: updatedGroups,
      status: "knockout" as const,
      totalMatches:
        state.currentChampionship.totalMatches + allKnockoutMatches.length,
    };

    await get().updateChampionship(updatedChampionship);

    console.log("Mata-mata gerado com sucesso:", {
      mainMatches: mainKnockoutMatches.length,
      secondDivMatches: allKnockoutMatches.length - mainKnockoutMatches.length,
      totalKnockout: allKnockoutMatches.length,
    });
  },

  // NOVA FUNÇÃO ESPECÍFICA PARA SEGUNDA DIVISÃO
  generateSecondDivisionBracket: async () => {
    const state = get();
    if (!state.currentChampionship) return;

    const eliminatedAthletes = get().getEliminatedAthletes();

    if (eliminatedAthletes.length < 2) {
      console.log("Não há atletas suficientes para segunda divisão");
      return;
    }

    // Verificar se já existe segunda divisão gerada
    const existingSecondDiv = state.currentChampionship.groups
      .flatMap((g) => g.matches)
      .filter((m) => m.phase === "knockout" && m.round?.includes("2ª Div"));

    if (existingSecondDiv.length > 0) {
      console.log("Segunda divisão já foi gerada");
      return;
    }

    // UTILIZAR A FUNÇÃO generateSecondDivisionMatches
    const secondDivisionMatches =
      generateSecondDivisionMatches(eliminatedAthletes);

    if (secondDivisionMatches.length === 0) {
      console.log("Nenhuma partida de segunda divisão foi gerada");
      return;
    }

    // Adicionar partidas da segunda divisão
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

    console.log("Segunda divisão gerada:", {
      matches: secondDivisionMatches.length,
      athletes: eliminatedAthletes.length,
    });
  },

  updateMatchResult: async (result) => {
    const state = get();
    if (!state.currentChampionship) return;

    // Encontrar e atualizar a partida
    const updatedGroups = state.currentChampionship.groups.map((group) => ({
      ...group,
      matches: group.matches.map((match) => {
        if (match.id === result.matchId) {
          const updatedMatch = {
            ...match,
            sets: result.sets,
            isWalkover: result.isWalkover || false,
            walkoverWinner: result.walkoverWinner,
            timeoutsUsed: result.timeoutsUsed,
            isCompleted: true,
            completedAt: new Date(),
          };

          // Determinar vencedor se não for walkover
          if (!result.isWalkover) {
            const winner = getMatchWinner(
              result.sets,
              state.currentChampionship!.groupsBestOf,
              match.player1Id,
              match.player2Id
            );
            updatedMatch.winner = winner;
          } else {
            updatedMatch.winner = result.walkoverWinner;
          }

          return updatedMatch;
        }
        return match;
      }),
    }));

    // Recalcular classificações para grupos afetados
    updatedGroups.forEach((group) => {
      if (group.matches.some((m) => m.id === result.matchId)) {
        group.standings = get().calculateGroupStandings(group);
        group.isCompleted = group.matches.every((m) => m.isCompleted);
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

    // Verificar se pode gerar próximas rodadas automaticamente
    await get().checkAndGenerateNextKnockoutRound(updatedGroups);
  },

  setWalkover: async (matchId, winnerId) => {
    const result: MatchResult = {
      matchId,
      sets: [],
      isWalkover: true,
      walkoverWinner: winnerId,
      timeoutsUsed: {
        player1: false,
        player2: false,
      },
    };

    await get().updateMatchResult(result);
  },

  // FUNÇÃO ATUALIZADA PARA SUPORTAR SEGUNDA DIVISÃO
  checkAndGenerateNextKnockoutRound: async (groups) => {
    const state = get();
    if (!state.currentChampionship) return;

    // Encontrar todas as partidas de mata-mata
    const allKnockoutMatches = groups
      .flatMap((g) => g.matches)
      .filter((m) => m.phase === "knockout");

    if (allKnockoutMatches.length === 0) return;

    // Separar partidas principais das de segunda divisão
    const mainMatches = allKnockoutMatches.filter(
      (m) => !m.round?.includes("2ª Div")
    );
    const secondDivMatches = allKnockoutMatches.filter((m) =>
      m.round?.includes("2ª Div")
    );

    // Verificar rodadas principais
    const mainRounds = ["Oitavas", "Quartas", "Semifinal", "Final"];
    await checkRoundsProgression(mainMatches, mainRounds, state, get);

    // Verificar rodadas da segunda divisão
    const secondDivRounds = [
      "Oitavas 2ª Div",
      "Quartas 2ª Div",
      "Semifinal 2ª Div",
      "Final 2ª Div",
    ];
    await checkRoundsProgression(secondDivMatches, secondDivRounds, state, get);

    // Verificar se o campeonato foi finalizado
    const finalMatch = mainMatches.find((m) => m.round === "Final");
    const finalSecondDiv = secondDivMatches.find(
      (m) => m.round === "Final 2ª Div"
    );

    const mainCompleted = finalMatch?.isCompleted || mainMatches.length === 0;
    const secondDivCompleted =
      !state.currentChampionship.hasRepechage ||
      finalSecondDiv?.isCompleted ||
      secondDivMatches.length === 0;

    if (mainCompleted && secondDivCompleted) {
      const updatedChampionship = {
        ...state.currentChampionship,
        groups: groups,
        status: "completed" as const,
      };
      await get().updateChampionship(updatedChampionship);
      console.log("Campeonato finalizado - ambas as divisões completas");
    }
  },

  getGroupStandings: (groupId) => {
    const state = get();
    if (!state.currentChampionship) return [];

    const group = state.currentChampionship.groups.find(
      (g) => g.id === groupId
    );
    return group?.standings || [];
  },

  // FUNÇÃO CORRIGIDA - Cálculo correto dos saldos
  calculateGroupStandings: (group) => {
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

    // Calcular estatísticas baseadas nas partidas completadas
    group.matches
      .filter((m) => m.isCompleted)
      .forEach((match) => {
        const player1Standing = standings.find(
          (s) => s.athleteId === match.player1Id
        );
        const player2Standing = standings.find(
          (s) => s.athleteId === match.player2Id
        );

        if (!player1Standing || !player2Standing) return;

        // Incrementar número de partidas para ambos
        player1Standing.matches++;
        player2Standing.matches++;

        // Se foi walkover, apenas definir vencedor
        if (match.isWalkover) {
          if (match.walkoverWinner === match.player1Id) {
            player1Standing.wins++;
            player1Standing.points += 3;
            player2Standing.losses++;
          } else if (match.walkoverWinner === match.player2Id) {
            player2Standing.wins++;
            player2Standing.points += 3;
            player1Standing.losses++;
          }
          return;
        }

        // Calcular saldo de sets e pontos baseado nos sets válidos
        match.sets.forEach((set) => {
          if (isValidSet(set)) {
            // Somar pontos de cada set
            player1Standing.pointsWon += set.player1Score;
            player1Standing.pointsLost += set.player2Score;
            player2Standing.pointsWon += set.player2Score;
            player2Standing.pointsLost += set.player1Score;

            // Determinar vencedor do set
            if (set.player1Score > set.player2Score) {
              player1Standing.setsWon++;
              player2Standing.setsLost++;
            } else if (set.player2Score > set.player1Score) {
              player2Standing.setsWon++;
              player1Standing.setsLost++;
            }
          }
        });

        // Determinar vencedor da partida
        const state = get();
        const championship = state.currentChampionship;
        if (!championship) return;

        const winner = getMatchWinnerFromTypes(
          match.sets,
          championship.groupsBestOf,
          match.player1Id,
          match.player2Id
        );

        if (winner === match.player1Id) {
          player1Standing.wins++;
          player1Standing.points += 3; // 3 pontos por vitória
          player2Standing.losses++;
        } else if (winner === match.player2Id) {
          player2Standing.wins++;
          player2Standing.points += 3; // 3 pontos por vitória
          player1Standing.losses++;
        }
      });

    // Calcular diferenças (saldos)
    standings.forEach((standing) => {
      standing.setsDiff = standing.setsWon - standing.setsLost;
      standing.pointsDiff = standing.pointsWon - standing.pointsLost;
    });

    // Ordenar por critérios CBTM
    standings.sort((a, b) => {
      // 1. Pontos na classificação
      if (a.points !== b.points) return b.points - a.points;

      // 2. Saldo de sets
      if (a.setsDiff !== b.setsDiff) return b.setsDiff - a.setsDiff;

      // 3. Saldo de pontos
      if (a.pointsDiff !== b.pointsDiff) return b.pointsDiff - a.pointsDiff;

      // 4. Confronto direto (seria implementado verificando a partida entre eles)
      // Por simplicidade, usar ordem alfabética como desempate final
      return a.athlete.name.localeCompare(b.athlete.name);
    });

    // Definir posições e qualificação
    standings.forEach((standing, index) => {
      standing.position = index + 1;
      standing.qualified = index < group.qualificationSpots;
    });

    return standings;
  },

  getQualifiedAthletes: () => {
    const state = get();
    if (!state.currentChampionship) return [];

    return state.currentChampionship.groups
      .flatMap((group) =>
        group.standings.filter((s) => s.qualified).map((s) => s.athlete)
      )
      .sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabeticamente
  },

  getEliminatedAthletes: () => {
    const state = get();
    if (!state.currentChampionship) return [];

    return state.currentChampionship.groups
      .flatMap((group) =>
        group.standings.filter((s) => !s.qualified).map((s) => s.athlete)
      )
      .sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabeticamente
  },
}));

// Função auxiliar para verificar progressão de rodadas
async function checkRoundsProgression(
  matches: Match[],
  rounds: string[],
  state: any,
  get: any
) {
  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = rounds[i];
    const nextRound = rounds[i + 1];

    const currentRoundMatches = matches.filter((m) => m.round === currentRound);
    const nextRoundMatches = matches.filter((m) => m.round === nextRound);

    if (
      currentRoundMatches.length > 0 &&
      currentRoundMatches.every((m) => m.isCompleted) &&
      nextRoundMatches.length === 0
    ) {
      const newMatches = generateNextRoundMatches(
        currentRoundMatches,
        nextRound
      );

      if (newMatches.length > 0) {
        // Adicionar novas partidas ao primeiro grupo
        const updatedGroups = state.currentChampionship.groups.map(
          (group: Group, index: number) =>
            index === 0
              ? { ...group, matches: [...group.matches, ...newMatches] }
              : group
        );

        const updatedChampionship = {
          ...state.currentChampionship,
          groups: updatedGroups,
          totalMatches:
            state.currentChampionship.totalMatches + newMatches.length,
        };

        await get().updateChampionship(updatedChampionship);
        console.log(
          `Gerada próxima rodada: ${nextRound} (${newMatches.length} partidas)`
        );
      }
    }
  }
}
