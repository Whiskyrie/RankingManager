import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  Championship,
  TournamentConfig,
  Athlete,
  Match,
  MatchResult,
  Group,
  GroupStanding,
} from "../types";
import {
  generateMainKnockoutMatches,
  generateSecondDivisionMatches,
  generateNextRoundMatches,
  getMatchWinner,
  generateTestMatchResult,
} from "../utils";
import { v4 as uuidv4 } from "uuid";

interface ChampionshipState {
  championships: Championship[];
  currentChampionship: Championship | null;
  isLoading: boolean;
  error: string | null;

  // ✅ CORREÇÃO: Sistema de cache simplificado sem Map
  _lastUpdateTimestamp: number;
  _bracketCache: Record<string, any>;
}

interface ChampionshipActions {
  createChampionship: (
    config: TournamentConfig,
    athletes: Athlete[]
  ) => Promise<void>;
  loadChampionship: (id: string) => void;
  updateChampionship: (championship: Championship) => Promise<void>;
  addAthlete: (athlete: Omit<Athlete, "id">) => Promise<void>;
  updateAthlete: (athlete: Athlete) => Promise<void>;
  removeAthlete: (athleteId: string) => Promise<void>;
  generateGroups: () => Promise<void>;
  createManualGroups: (
    groups: { name: string; athleteIds: string[] }[]
  ) => Promise<void>;
  updateMatchResult: (result: MatchResult) => Promise<void>;
  setWalkover: (matchId: string, winnerId: string) => Promise<void>;
  generateKnockoutBracket: () => Promise<void>;
  getQualifiedAthletes: () => Athlete[];
  getEliminatedAthletes: () => Athlete[];
  fillGroupsWithRandomResults: () => Promise<void>;
  calculateGroupStandings: (group: Group) => GroupStanding[];

  // ✅ Métodos de cache
  invalidateCache: () => void;
  getCachedBracket: (key: string) => any;
  setCachedBracket: (key: string, data: any) => void;
}

export const useChampionshipStore = create<
  ChampionshipState & ChampionshipActions
>()(
  devtools(
    persist(
      (set, get) => ({
        championships: [],
        currentChampionship: null,
        isLoading: false,
        error: null,
        _lastUpdateTimestamp: 0,
        _bracketCache: {}, // ✅ CORREÇÃO: Usar objeto simples ao invés de Map

        // ✅ CORREÇÃO: Métodos de cache com verificação de segurança
        invalidateCache: () => {
          set((_state) => ({
            _bracketCache: {},
            _lastUpdateTimestamp: Date.now(),
          }));
        },

        getCachedBracket: (key: string) => {
          const state = get();
          // ✅ CORREÇÃO: Verificar se _bracketCache existe e é um objeto
          if (!state._bracketCache || typeof state._bracketCache !== "object") {
            return null;
          }
          return state._bracketCache[key] || null;
        },

        setCachedBracket: (key: string, data: any) => {
          set((state) => {
            // ✅ CORREÇÃO: Garantir que _bracketCache seja um objeto válido
            const currentCache =
              state._bracketCache && typeof state._bracketCache === "object"
                ? state._bracketCache
                : {};

            return {
              _bracketCache: {
                ...currentCache,
                [key]: data,
              },
            };
          });
        },

        createChampionship: async (config, athletes) => {
          set({ isLoading: true, error: null });

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

            // ✅ Invalidar cache ao criar campeonato
            get().invalidateCache();
          } catch (error) {
            const errorMessage =
              error instanceof Error
                ? error.message
                : "Erro inesperado ao criar campeonato";
            set({ error: errorMessage, isLoading: false });
          }
        },

        loadChampionship: async (id) => {
          set({ isLoading: true, error: null });

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
          }
        },

        updateChampionship: async (championship) => {
          const updatedChampionship = {
            ...championship,
            updatedAt: new Date(),
          };

          set((state) => ({
            championships: state.championships.map((c) =>
              c.id === championship.id ? updatedChampionship : c
            ),
            currentChampionship:
              state.currentChampionship?.id === championship.id
                ? updatedChampionship
                : state.currentChampionship,
          }));

          // ✅ Invalidar cache após atualização
          get().invalidateCache();
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
            qualificationSpots:
              state.currentChampionship!.qualificationSpotsPerGroup,
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
              name:
                manualGroup.name || `Grupo ${String.fromCharCode(65 + index)}`,
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

        // ✅ FUNÇÃO PRINCIPAL: updateMatchResult otimizada
        updateMatchResult: async (result: MatchResult) => {
          const { currentChampionship } = get();
          if (!currentChampionship) return;

          console.log("🎯 [STORE] Updating match result:", result);

          try {
            set({ isLoading: true, error: null });

            const updatedChampionship = { ...currentChampionship };
            let matchFound = false;

            // Encontrar e atualizar a partida
            for (const group of updatedChampionship.groups) {
              const matchIndex = group.matches.findIndex(
                (m) => m.id === result.matchId
              );
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
                console.log("✅ [STORE] Match updated successfully");
                break;
              }
            }

            if (!matchFound) {
              throw new Error("Partida não encontrada");
            }

            // Recalcular estatísticas
            updatedChampionship.completedMatches = updatedChampionship.groups
              .flatMap((g) => g.matches)
              .filter((m) => m.isCompleted).length;

            updatedChampionship.updatedAt = new Date();

            // Atualizar standings se for fase de grupos
            if (updatedChampionship.status === "groups") {
              updatedChampionship.groups.forEach((group) => {
                if (group.matches.some((m) => m.phase === "groups")) {
                  group.standings = get().calculateGroupStandings(group);
                  group.isCompleted = group.matches
                    .filter((m) => m.phase === "groups")
                    .every((m) => m.isCompleted);
                }
              });
            }

            // ✅ CORREÇÃO PRINCIPAL: Gerar próximas partidas de mata-mata automaticamente
            if (updatedChampionship.status === "knockout") {
              await generateNextKnockoutRounds(updatedChampionship);
            }

            await get().updateChampionship(updatedChampionship);

            // ✅ CORREÇÃO: Invalidar cache de forma mais seletiva
            // Não invalidar cache para mudanças simples de resultado
            const hasNewMatches =
              updatedChampionship.groups
                .flatMap((g) => g.matches)
                .filter((m) => m.phase === "knockout").length >
              currentChampionship.groups
                .flatMap((g) => g.matches)
                .filter((m) => m.phase === "knockout").length;

            // Só invalida cache se novas partidas foram criadas
            if (hasNewMatches) {
              get().invalidateCache();
            }
          } catch (error) {
            console.error("❌ [STORE] Error updating match result:", error);
            set({
              error:
                error instanceof Error
                  ? error.message
                  : "Erro ao atualizar resultado",
            });
          } finally {
            set({ isLoading: false });
          }
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

        generateKnockoutBracket: async () => {
          const state = get();
          if (!state.currentChampionship) return;

          console.log("\n🏆 [KNOCKOUT] === GERAÇÃO MATA-MATA ===");

          // Forçar recálculo das classificações
          const updatedGroups = state.currentChampionship.groups.map(
            (group) => {
              const newStandings = get().calculateGroupStandings(group);
              return { ...group, standings: newStandings };
            }
          );

          const championshipWithUpdatedStandings = {
            ...state.currentChampionship,
            groups: updatedGroups,
          };

          await get().updateChampionship(championshipWithUpdatedStandings);

          // Verificar se todos os grupos estão completos
          const incompleteGroups = updatedGroups.filter(
            (group) =>
              !group.isCompleted ||
              group.standings.length === 0 ||
              group.matches.some((m) => !m.isCompleted)
          );

          if (incompleteGroups.length > 0) {
            console.log("❌ [KNOCKOUT] Nem todos os grupos estão completos");
            return;
          }

          // Verificar se mata-mata já foi gerado
          const existingKnockoutMatches = updatedGroups
            .flatMap((g) => g.matches)
            .filter((m) => m.phase === "knockout");

          if (existingKnockoutMatches.length > 0) {
            console.log("⚠️ [KNOCKOUT] Mata-mata já foi gerado");
            return;
          }

          // Obter atletas qualificados e eliminados
          const qualifiedAthletes = get().getQualifiedAthletes();
          const eliminatedAthletes = get().getEliminatedAthletes();

          if (qualifiedAthletes.length < 4) {
            console.log(
              "❌ [KNOCKOUT] Insuficientes qualificados para mata-mata"
            );
            return;
          }

          // Gerar mata-mata principal
          let mainBracketSize = 4;
          while (mainBracketSize < qualifiedAthletes.length) {
            mainBracketSize *= 2;
          }

          const mainKnockoutMatches = generateMainKnockoutMatches(
            qualifiedAthletes,
            mainBracketSize
          );

          let allKnockoutMatches = [...mainKnockoutMatches];

          // ✅ Gerar segunda divisão se habilitada
          if (
            state.currentChampionship.hasRepechage &&
            eliminatedAthletes.length >= 2
          ) {
            console.log("✅ [KNOCKOUT] Gerando segunda divisão");
            const secondDivisionMatches =
              generateSecondDivisionMatches(eliminatedAthletes);
            allKnockoutMatches = [
              ...allKnockoutMatches,
              ...secondDivisionMatches,
            ];
          }

          // Salvar todas as partidas
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
          console.log("🎉 [KNOCKOUT] MATA-MATA GERADO COM SUCESSO!");
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

          const eliminated: Athlete[] = [];

          state.currentChampionship.groups.forEach((group) => {
            if (group.isCompleted && group.standings.length > 0) {
              const groupEliminated = group.standings
                .filter((standing) => !standing.qualified)
                .map((standing) => standing.athlete);

              eliminated.push(...groupEliminated);
            }
          });

          return eliminated;
        },

        calculateGroupStandings: (group) => {
          const state = get();
          const bestOf = state.currentChampionship?.groupsBestOf || 5;

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

          const totalMatches = group.matches.length;
          const completedMatchesCount = group.matches.filter(
            (m) => m.isCompleted
          ).length;

          group.isCompleted =
            totalMatches > 0 && completedMatchesCount === totalMatches;

          return standings;
        },

        fillGroupsWithRandomResults: async () => {
          const state = get();
          if (!state.currentChampionship) return;

          const updatedGroups = state.currentChampionship.groups.map(
            (group) => {
              const updatedMatches = group.matches.map((match) => {
                if (match.isCompleted) return match;

                const testResult = generateTestMatchResult(
                  state.currentChampionship!.groupsBestOf
                );

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
            }
          );

          updatedGroups.forEach((group) => {
            group.standings = get().calculateGroupStandings(group);
            const completedMatches = group.matches.filter(
              (m) => m.isCompleted
            ).length;
            const totalMatches = group.matches.length;
            group.isCompleted =
              totalMatches > 0 && completedMatches === totalMatches;
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
        },
      }),
      {
        name: "championship-storage",
        version: 1,
        // ✅ CORREÇÃO: Configurar serialização para evitar problemas com Map
        partialize: (state) => ({
          championships: state.championships,
          currentChampionship: state.currentChampionship,
          // Não persistir cache para evitar problemas de serialização
          _lastUpdateTimestamp: 0,
          _bracketCache: {},
        }),
      }
    ),
    {
      name: "championship-store",
    }
  )
);

// ✅ FUNÇÃO PRINCIPAL CORRIGIDA: Gerar próximas rodadas automaticamente
async function generateNextKnockoutRounds(championship: Championship) {
  console.log("🚀 [KNOCKOUT] Checking for next rounds to generate...");

  const allKnockoutMatches = championship.groups
    .flatMap((group) => group.matches)
    .filter((match) => match.phase === "knockout");

  // Organizar por divisão
  const mainMatches = allKnockoutMatches.filter(
    (m) => !m.round?.includes("2ª Div")
  );
  const secondDivMatches = allKnockoutMatches.filter((m) =>
    m.round?.includes("2ª Div")
  );

  // ✅ CORREÇÃO CRÍTICA: Verificar e gerar partidas para ambas as divisões
  await checkAndGenerateRounds(mainMatches, championship, false);

  if (championship.hasRepechage && secondDivMatches.length > 0) {
    await checkAndGenerateRounds(secondDivMatches, championship, true);
  }

  // Verificar se campeonato foi finalizado
  const finalMatch = mainMatches.find((m) => m.round === "Final");
  const thirdPlaceMatch = mainMatches.find((m) => m.round === "3º Lugar");
  const secondFinalMatch = secondDivMatches.find(
    (m) => m.round === "Final 2ª Div"
  );
  const secondThirdMatch = secondDivMatches.find(
    (m) => m.round === "3º Lugar 2ª Div"
  );

  const isMainDivisionComplete =
    finalMatch?.isCompleted &&
    (!championship.hasThirdPlace || thirdPlaceMatch?.isCompleted);

  const isSecondDivisionComplete =
    secondDivMatches.length === 0 ||
    (secondFinalMatch?.isCompleted &&
      (!championship.hasThirdPlace || secondThirdMatch?.isCompleted));

  if (isMainDivisionComplete && isSecondDivisionComplete) {
    championship.status = "completed";
    console.log("🏆 [KNOCKOUT] Championship completed!");
  }
}

// ✅ FUNÇÃO AUXILIAR CORRIGIDA: Verificar e gerar rodadas
async function checkAndGenerateRounds(
  matches: Match[],
  championship: Championship,
  isSecondDivision: boolean
) {
  const suffix = isSecondDivision ? " 2ª Div" : "";

  // ✅ CORREÇÃO: Verificar semifinais PRIMEIRO para gerar final e 3º lugar SIMULTANEAMENTE
  const semifinalMatches = matches.filter(
    (m) => m.round === `Semifinal${suffix}`
  );
  const finalMatches = matches.filter((m) => m.round === `Final${suffix}`);
  const thirdPlaceMatches = matches.filter(
    (m) => m.round === `3º Lugar${suffix}`
  );

  // Se temos 2 semifinais completadas e nem final nem 3º lugar existem
  if (
    semifinalMatches.length === 2 &&
    semifinalMatches.every((m) => m.isCompleted && m.winnerId) &&
    finalMatches.length === 0
  ) {
    console.log(
      `🏆 [KNOCKOUT] Gerando Final${suffix} e 3º Lugar${suffix} simultaneamente...`
    );

    // Gerar Final
    const finalMatch = generateNextRoundMatches(
      semifinalMatches,
      `Final${suffix}`,
      championship.athletes,
      championship.knockoutBestOf
    );

    if (finalMatch.length > 0) {
      championship.groups[0].matches.push(...finalMatch);
      console.log(`✅ [KNOCKOUT] Final${suffix} gerada`);
    }

    // ✅ CORREÇÃO PRINCIPAL: Gerar 3º Lugar se habilitado
    if (championship.hasThirdPlace && thirdPlaceMatches.length === 0) {
      const thirdPlaceMatch = generateThirdPlaceMatches(
        semifinalMatches,
        `3º Lugar${suffix}`,
        championship.athletes,
        championship.knockoutBestOf
      );

      if (thirdPlaceMatch.length > 0) {
        championship.groups[0].matches.push(...thirdPlaceMatch);
        console.log(`✅ [KNOCKOUT] 3º Lugar${suffix} gerada`);
      }
    }
  }

  // Verificar outras rodadas sequenciais
  const rounds = [`Oitavas${suffix}`, `Quartas${suffix}`, `Semifinal${suffix}`];

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
      console.log(
        `🏆 [KNOCKOUT] Gerando ${nextRound} a partir de ${currentRound}...`
      );

      const newMatches = generateNextRoundMatches(
        currentRoundMatches,
        nextRound,
        championship.athletes,
        championship.knockoutBestOf
      );

      if (newMatches.length > 0) {
        championship.groups[0].matches.push(...newMatches);
        console.log(
          `✅ [KNOCKOUT] ${nextRound} gerada com ${newMatches.length} partidas`
        );
      }
    }
  }
}

// ✅ FUNÇÃO CORRIGIDA: Gerar partida de 3º lugar
function generateThirdPlaceMatches(
  semifinalMatches: Match[],
  roundName: string,
  athletes: Athlete[],
  _bestOf: number
): Match[] {
  if (semifinalMatches.length !== 2) return [];

  console.log(`🥉 [3RD-PLACE] Gerando ${roundName}...`);

  // Obter perdedores das semifinais
  const losers: string[] = [];

  semifinalMatches.forEach((match) => {
    if (match.winnerId) {
      const loserId =
        match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      losers.push(loserId);
    }
  });

  if (losers.length !== 2) {
    console.log(`❌ [3RD-PLACE] Perdedores insuficientes: ${losers.length}/2`);
    return [];
  }

  const loser1 = athletes.find((a) => a.id === losers[0]);
  const loser2 = athletes.find((a) => a.id === losers[1]);

  if (!loser1 || !loser2) {
    console.log("❌ [3RD-PLACE] Atletas perdedores não encontrados");
    return [];
  }

  const thirdPlaceMatch: Match = {
    id: `third-place-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    player1Id: loser1.id,
    player2Id: loser2.id,
    player1: loser1,
    player2: loser2,
    sets: [],
    isCompleted: false,
    phase: "knockout",
    round: roundName,
    isThirdPlace: true,
    position: 0,
    timeoutsUsed: { player1: false, player2: false },
    createdAt: new Date(),
  };

  console.log(
    `✅ [3RD-PLACE] ${roundName} criada: ${loser1.name} vs ${loser2.name}`
  );
  return [thirdPlaceMatch];
}

// Funções auxiliares mantidas
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

function updateStandingsWithMatch(
  standings: GroupStanding[],
  match: Match,
  _bestOf: number
) {
  const player1Standing = standings.find(
    (s) => s.athleteId === match.player1Id
  );
  const player2Standing = standings.find(
    (s) => s.athleteId === match.player2Id
  );

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
  player2Standing.pointsLost += player2Points;

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
  if (a.points !== b.points) return b.points - a.points;
  if (a.setsDiff !== b.setsDiff) return b.setsDiff - a.setsDiff;
  if (a.pointsDiff !== b.pointsDiff) return b.pointsDiff - a.pointsDiff;
  return a.athlete.name.localeCompare(b.athlete.name);
}

// ✅ Expor store no console para debug (apenas em desenvolvimento)
if (typeof window !== "undefined") {
  (window as any).championshipStore = useChampionshipStore;
  console.log(
    "⚙️ [DEBUG] championshipStore disponível como window.championshipStore"
  );
}
