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
} from "../types";
import {
  generateMainKnockoutMatches,
  generateSecondDivisionMatches,
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
    } catch {
      set({ error: "Erro ao criar campeonato", isLoading: false });
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
    } catch {
      set({ error: "Erro ao carregar campeonato", isLoading: false });
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

    // Distribuir cabeças de chave (serpentina)
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
    groups.forEach((group) => {
      const matches: Match[] = [];
      for (let i = 0; i < group.athletes.length; i++) {
        for (let j = i + 1; j < group.athletes.length; j++) {
          matches.push({
            id: uuidv4(),
            player1Id: group.athletes[i].id,
            player2Id: group.athletes[j].id,
            player1: group.athletes[i],
            player2: group.athletes[j],
            sets: [],
            isCompleted: false,
            phase: "groups",
            groupId: group.id,
            timeoutsUsed: { player1: false, player2: false },
            createdAt: new Date(),
          });
        }
      }
      group.matches = matches;
      group.standings = get().calculateGroupStandings(group);
    });

    const totalMatches = groups.reduce(
      (sum, group) => sum + group.matches.length,
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

  createManualGroups: async (manualGroups) => {
    const state = get();
    if (!state.currentChampionship) return;

    // Criar grupos manualmente
    const groups: Group[] = manualGroups.map((groupData) => {
      const athletes = groupData.athleteIds.map((athleteId) => {
        const athlete = state.currentChampionship?.athletes.find(
          (a) => a.id === athleteId
        );
        return athlete ? { ...athlete } : null;
      });

      return {
        id: uuidv4(),
        name: groupData.name,
        athletes: athletes.filter((a) => a !== null) as Athlete[],
        matches: [],
        standings: [],
        qualificationSpots:
          state.currentChampionship!.qualificationSpotsPerGroup,
        isCompleted: false,
      };
    });

    // Gerar partidas para cada grupo (todos contra todos)
    groups.forEach((group) => {
      const matches: Match[] = [];
      for (let i = 0; i < group.athletes.length; i++) {
        for (let j = i + 1; j < group.athletes.length; j++) {
          matches.push({
            id: uuidv4(),
            player1Id: group.athletes[i].id,
            player2Id: group.athletes[j].id,
            player1: group.athletes[i],
            player2: group.athletes[j],
            sets: [],
            isCompleted: false,
            phase: "groups",
            groupId: group.id,
            timeoutsUsed: { player1: false, player2: false },
            createdAt: new Date(),
          });
        }
      }
      group.matches = matches;
      group.standings = get().calculateGroupStandings(group);
    });

    const totalMatches = groups.reduce(
      (sum, group) => sum + group.matches.length,
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

    const qualifiedAthletes = get().getQualifiedAthletes();
    const eliminatedAthletes = get().getEliminatedAthletes();
    const numQualified = qualifiedAthletes.length;

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

    // Gerar partidas da segunda divisão (eliminados)
    const secondDivisionMatches =
      generateSecondDivisionMatches(eliminatedAthletes);

    // Combinar todas as partidas
    const allKnockoutMatches = [
      ...mainKnockoutMatches,
      ...secondDivisionMatches,
    ];

    // Adicionar todas as partidas do mata-mata ao primeiro grupo
    const updatedGroups = state.currentChampionship.groups.map((group, index) =>
      index === 0
        ? {
            ...group,
            matches: [...group.matches, ...allKnockoutMatches],
          }
        : group
    );

    const updatedChampionship = {
      ...state.currentChampionship,
      groups: updatedGroups,
      totalMatches:
        state.currentChampionship.totalMatches + allKnockoutMatches.length,
      status: "knockout" as const,
    };

    await get().updateChampionship(updatedChampionship);
  },

  setWalkover: async (matchId, winnerId) => {
    const state = get();
    if (!state.currentChampionship) return;

    // Atualizar partida com walkover
    const updatedGroups = state.currentChampionship.groups.map((group) => ({
      ...group,
      matches: group.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              isWalkover: true,
              walkoverWinner: winnerId,
              winner: winnerId,
              isCompleted: true,
              sets: [],
              completedAt: new Date(),
            }
          : match
      ),
    }));

    // Recalcular classificações dos grupos afetados (apenas para fase de grupos)
    updatedGroups.forEach((group) => {
      const affectedMatch = group.matches.find((m) => m.id === matchId);
      if (affectedMatch && affectedMatch.phase === "groups") {
        group.standings = get().calculateGroupStandings(group);
        group.isCompleted = group.matches.every((m) => m.isCompleted);
      }
    });

    // Se foi uma partida de mata-mata, verificar se é necessário gerar próxima rodada
    const updatedMatch = updatedGroups
      .flatMap((g) => g.matches)
      .find((m) => m.id === matchId);
    if (
      updatedMatch &&
      updatedMatch.phase === "knockout" &&
      updatedMatch.isCompleted
    ) {
      await get().checkAndGenerateNextKnockoutRound(updatedGroups);
    }

    const completedMatches = updatedGroups.reduce(
      (sum, group) => sum + group.matches.filter((m) => m.isCompleted).length,
      0
    );

    const updatedChampionship = {
      ...state.currentChampionship,
      groups: updatedGroups,
      completedMatches,
    };

    await get().updateChampionship(updatedChampionship);
  },
  updateMatchResult: async (result: MatchResult) => {
    const state = get();
    if (!state.currentChampionship) return;

    const { matchId, sets, timeoutsUsed } = result;

    // Encontrar a partida para obter os IDs dos jogadores
    const match = state.currentChampionship.groups
      .flatMap((g) => g.matches)
      .find((m) => m.id === matchId);

    if (!match) {
      console.error("Match not found:", matchId);
      return;
    }

    console.log("Updating match result:", {
      matchId,
      phase: match.phase,
      round: match.round,
      setsCount: sets.length,
      player1: match.player1?.name,
      player2: match.player2?.name,
    });

    // Criar os sets com os IDs dos jogadores
    const setsWithIds = sets.map((set) => ({
      ...set,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
    }));

    // Usar o bestOf correto baseado na fase da partida
    const bestOf =
      match.phase === "knockout"
        ? state.currentChampionship.knockoutBestOf
        : state.currentChampionship.groupsBestOf;

    // Passar os IDs dos jogadores para a função getMatchWinner
    const winner = getMatchWinner(
      setsWithIds,
      bestOf,
      match.player1Id,
      match.player2Id
    );

    console.log("Match result calculation:", {
      bestOf,
      winner,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      validSetsCount: setsWithIds.filter((set) => {
        const max = Math.max(set.player1Score, set.player2Score);
        const diff = Math.abs(set.player1Score - set.player2Score);
        return max >= 11 && diff >= 2;
      }).length,
    });

    // Atualizar partida nos grupos
    const updatedGroups = state.currentChampionship.groups.map((group) => ({
      ...group,
      matches: group.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              sets: setsWithIds,
              winner,
              isCompleted: !!winner,
              timeoutsUsed,
            }
          : m
      ),
    }));

    // Recalcular standings para cada grupo
    const updatedGroupsWithStandings = updatedGroups.map((group) => ({
      ...group,
      standings: get().calculateGroupStandings(group),
    }));

    // Atualizar o championship com os grupos atualizados
    const updatedChampionship = {
      ...state.currentChampionship,
      groups: updatedGroupsWithStandings,
      completedMatches: updatedGroupsWithStandings.reduce(
        (sum, group) => sum + group.matches.filter((m) => m.isCompleted).length,
        0
      ),
    };

    await get().updateChampionship(updatedChampionship);
  },

  checkAndGenerateNextKnockoutRound: async (groups: Group[]) => {
    const state = get();
    if (!state.currentChampionship) return;

    const allKnockoutMatches = groups
      .flatMap((g) => g.matches)
      .filter((m) => m.phase === "knockout");

    // Verificar rodadas principais
    const mainRounds = ["Oitavas", "Quartas", "Semifinal", "Final"];
    const currentMainRounds = mainRounds.filter((roundName) =>
      allKnockoutMatches.some((m) => m.round === roundName)
    );

    for (let i = 0; i < currentMainRounds.length - 1; i++) {
      const currentRound = currentMainRounds[i];
      const nextRound = currentMainRounds[i + 1];

      const currentRoundMatches = allKnockoutMatches.filter(
        (m) => m.round === currentRound
      );
      const nextRoundMatches = allKnockoutMatches.filter(
        (m) => m.round === nextRound
      );

      // Se todas as partidas da rodada atual estão completas e a próxima rodada não existe
      if (
        currentRoundMatches.length > 0 &&
        currentRoundMatches.every((m) => m.isCompleted) &&
        nextRoundMatches.length === 0
      ) {
        const newMatches = generateNextRoundMatches(
          currentRoundMatches,
          nextRound,
          state.currentChampionship
        );

        // Adicionar novas partidas ao primeiro grupo
        if (newMatches.length > 0 && groups.length > 0) {
          groups[0].matches.push(...newMatches);

          // Atualizar o championship no estado
          const updatedChampionship = {
            ...state.currentChampionship,
            groups: groups,
            totalMatches:
              state.currentChampionship.totalMatches + newMatches.length,
          };
          await get().updateChampionship(updatedChampionship);
        }
      }
    }

    // Verificar rodadas da segunda divisão
    const secondDivRounds = [
      "Oitavas 2ª Div",
      "Quartas 2ª Div",
      "Semifinal 2ª Div",
      "Final 2ª Div",
    ];
    const currentSecondDivRounds = secondDivRounds.filter((roundName) =>
      allKnockoutMatches.some((m) => m.round === roundName)
    );

    for (let i = 0; i < currentSecondDivRounds.length - 1; i++) {
      const currentRound = currentSecondDivRounds[i];
      const nextRound = currentSecondDivRounds[i + 1];

      const currentRoundMatches = allKnockoutMatches.filter(
        (m) => m.round === currentRound
      );
      const nextRoundMatches = allKnockoutMatches.filter(
        (m) => m.round === nextRound
      );

      if (
        currentRoundMatches.length > 0 &&
        currentRoundMatches.every((m) => m.isCompleted) &&
        nextRoundMatches.length === 0
      ) {
        const newMatches = generateNextRoundMatches(
          currentRoundMatches,
          nextRound,
          state.currentChampionship
        );

        if (newMatches.length > 0 && groups.length > 0) {
          groups[0].matches.push(...newMatches);

          // Atualizar o championship no estado
          const updatedChampionship = {
            ...state.currentChampionship,
            groups: groups,
            totalMatches:
              state.currentChampionship.totalMatches + newMatches.length,
          };
          await get().updateChampionship(updatedChampionship);
        }
      }
    }

    // Verificar se o campeonato foi finalizado
    const finalMatch = allKnockoutMatches.find((m) => m.round === "Final");
    if (finalMatch && finalMatch.isCompleted) {
      const updatedChampionship = {
        ...state.currentChampionship,
        groups: groups,
        status: "completed" as const,
      };
      await get().updateChampionship(updatedChampionship);
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
        )!;
        const player2Standing = standings.find(
          (s) => s.athleteId === match.player2Id
        )!;

        player1Standing.matches++;
        player2Standing.matches++;

        if (match.isWalkover) {
          if (match.walkoverWinner === match.player1Id) {
            player1Standing.wins++;
            player1Standing.points += 3;
            player2Standing.losses++;
          } else {
            player2Standing.wins++;
            player2Standing.points += 3;
            player1Standing.losses++;
          }
        } else {
          // Contar sets e pontos
          match.sets.forEach((set) => {
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
          });

          // Determinar vencedor da partida
          if (match.winner === match.player1Id) {
            player1Standing.wins++;
            player1Standing.points += 3;
            player2Standing.losses++;
          } else if (match.winner === match.player2Id) {
            player2Standing.wins++;
            player2Standing.points += 3;
            player1Standing.losses++;
          }
        }
      });

    // Calcular diferenças
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
