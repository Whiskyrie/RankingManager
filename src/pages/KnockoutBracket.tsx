import React, { useState, useMemo, useCallback } from "react";
import { useChampionshipStore } from "../store/championship";
import { BracketVisualization } from "../components/championship/BracketVisualization";
import { MatchCard } from "../components/championship/MatchCard";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Trophy, Download, Target, BarChart3, Crown } from "lucide-react";
import { Match } from "../types";

export const KnockoutBracket: React.FC = () => {
  const { currentChampionship, updateMatchResult, setWalkover } =
    useChampionshipStore();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // ✅ Memoizar dados complexos para evitar recálculos desnecessários
  const bracketData = useMemo(() => {
    if (!currentChampionship) return null;

    const allKnockoutMatches = currentChampionship.groups
      .flatMap((group) => group.matches)
      .filter((match) => match.phase === "knockout");

    const mainMatches = allKnockoutMatches.filter(
      (m) => !m.round?.includes("2ª Div")
    );
    const secondDivisionMatches = allKnockoutMatches.filter((m) =>
      m.round?.includes("2ª Div")
    );

    // Identificar campeões e medalhistas
    const finalMatch = mainMatches.find((m) => m.round === "Final");
    const champion = finalMatch?.isCompleted ? finalMatch.winnerId : null;
    const runnerUp =
      finalMatch?.isCompleted && finalMatch.winnerId
        ? finalMatch.player1Id === finalMatch.winnerId
          ? finalMatch.player2Id
          : finalMatch.player1Id
        : null;

    const thirdPlaceMatch = mainMatches.find((m) => m.round === "3º Lugar");
    const thirdPlace = thirdPlaceMatch?.isCompleted
      ? thirdPlaceMatch.winnerId
      : null;

    // ✅ Segunda divisão
    const finalMatch2Div = secondDivisionMatches.find(
      (m) => m.round === "Final 2ª Div"
    );
    const champion2Div = finalMatch2Div?.isCompleted
      ? finalMatch2Div.winnerId
      : null;

    const runnerUp2Div =
      finalMatch2Div?.isCompleted && finalMatch2Div.winnerId
        ? finalMatch2Div.player1Id === finalMatch2Div.winnerId
          ? finalMatch2Div.player2Id
          : finalMatch2Div.player1Id
        : null;

    const thirdPlace2Match = secondDivisionMatches.find(
      (m) => m.round === "3º Lugar 2ª Div"
    );
    const thirdPlace2Div = thirdPlace2Match?.isCompleted
      ? thirdPlace2Match.winnerId
      : null;

    const totalMatches = allKnockoutMatches.length;
    const completedMatches = allKnockoutMatches.filter(
      (m) => m.isCompleted
    ).length;
    const progressPercentage =
      totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    console.log("📊 [BRACKET-DATA] Estatísticas do mata-mata:", {
      totalKnockoutMatches: totalMatches,
      mainMatches: mainMatches.length,
      secondDivMatches: secondDivisionMatches.length,
      completedMatches,
      progressPercentage,
    });

    return {
      allKnockoutMatches,
      mainMatches,
      secondDivisionMatches,
      champions: {
        champion,
        runnerUp,
        thirdPlace,
        champion2Div,
        runnerUp2Div,
        thirdPlace2Div,
      },
      progress: {
        totalMatches,
        completedMatches,
        progressPercentage,
      },
    };
  }, [currentChampionship]);

  // ✅ Callback memoizado para download
  const handleDownloadBracket = useCallback(() => {
    if (currentChampionship) {
      console.log("Download do bracket solicitado");
      // TODO: Implementar download
    }
  }, [currentChampionship]);

  // ✅ Callback memoizado para seleção de partida
  const handleMatchClick = useCallback((match: Match) => {
    setSelectedMatch(match);
  }, []);

  // ✅ Callback memoizado para fechar modal
  const handleCloseModal = useCallback(() => {
    setSelectedMatch(null);
  }, []);

  // ✅ Função memoizada para obter nome do atleta
  const getAthleteName = useCallback(
    (athleteId: string | null) => {
      if (!athleteId || !currentChampionship) return null;
      return (
        currentChampionship.athletes.find((a) => a.id === athleteId)?.name ||
        "Atleta"
      );
    },
    [currentChampionship]
  );

  if (!currentChampionship || !bracketData) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <Card className="max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum campeonato selecionado
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Selecione um campeonato para visualizar a chave eliminatória
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Componente de Pódium Minimalista - Memoizado
  const MinimalPodium = React.memo<{
    title: string;
    champion: string | null;
    runnerUp: string | null;
    thirdPlace: string | null;
    isDivision2?: boolean;
  }>(({ title, champion, runnerUp, thirdPlace, isDivision2 = false }) => {
    if (!champion) return null;

    return (
      <Card className="overflow-hidden shadow-lg">
        <CardContent className="p-6">
          <h3
            className={`text-xl font-bold text-center mb-6 ${
              isDivision2
                ? "text-orange-700 dark:text-orange-400"
                : "text-blue-700 dark:text-blue-400"
            }`}
          >
            {title}
          </h3>

          <div className="flex justify-center items-end gap-6">
            {/* 2º Lugar */}
            {runnerUp && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {getAthleteName(runnerUp)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Vice-Campeão
                </div>
              </div>
            )}

            {/* 1º Lugar */}
            <div className="text-center" style={{ marginBottom: "1rem" }}>
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {getAthleteName(champion)}
              </div>
              <div className="font-semibold text-yellow-600 dark:text-yellow-400">
                {isDivision2 ? "Campeão 2ª Divisão" : "Campeão"}
              </div>
            </div>

            {/* 3º Lugar */}
            {thirdPlace && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-600 dark:to-amber-700 rounded-full flex items-center justify-center mb-3 mx-auto shadow-lg">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {getAthleteName(thirdPlace)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  3º Lugar
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  });

  const { champions, progress } = bracketData;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header melhorado */}
      <div className="bg-surface-elevated shadow-lg border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-700 dark:to-gray-600 rounded-lg">
                <Trophy className="h-6 w-6 text-gray-800 dark:text-gray-200" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Chave Eliminatória
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                  <span>{currentChampionship.name}</span>
                  <span className="text-gray-400 dark:text-gray-500">•</span>
                  <span>
                    {new Date(currentChampionship.date).toLocaleDateString(
                      "pt-BR"
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Progresso geral */}
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Progresso Geral
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {progress.completedMatches}/{progress.totalMatches} partidas
                </div>
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                  <div
                    className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-gray-400 dark:via-gray-500 dark:to-gray-300 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress.progressPercentage}%` }}
                  />
                </div>
              </div>

              <Badge
                className={`px-3 py-1 border transition-colors ${
                  currentChampionship.status === "completed"
                    ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700/60"
                    : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700/60"
                }`}
              >
                {currentChampionship.status === "completed"
                  ? "Finalizado"
                  : "Em Andamento"}
              </Badge>

              <Button
                variant="outline"
                onClick={handleDownloadBracket}
                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/10"
              >
                <Download className="h-4 w-4" />
                Baixar Chave
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ✅ Pódium Minimalista */}
        {currentChampionship.status === "completed" && champions.champion && (
          <div className="mb-8 space-y-6">
            {/* Primeira Divisão */}
            <MinimalPodium
              title="Pódium - Primeira Divisão"
              champion={champions.champion}
              runnerUp={champions.runnerUp}
              thirdPlace={champions.thirdPlace}
            />

            {/* Segunda Divisão */}
            {champions.champion2Div && (
              <MinimalPodium
                title="Pódium - Segunda Divisão"
                champion={champions.champion2Div}
                runnerUp={champions.runnerUp2Div}
                thirdPlace={champions.thirdPlace2Div}
                isDivision2={true}
              />
            )}
          </div>
        )}

        {/* Estatísticas melhoradas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow border border-default">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                    <Target className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Primeira Divisão
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {
                      bracketData.mainMatches.filter((m) => m.isCompleted)
                        .length
                    }
                    /{bracketData.mainMatches.length}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-emerald-500 dark:bg-emerald-400 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          bracketData.mainMatches.length > 0
                            ? (bracketData.mainMatches.filter(
                                (m) => m.isCompleted
                              ).length /
                                bracketData.mainMatches.length) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green-200 dark:border-green-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-gray-700 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Mata-mata
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {progress.completedMatches}/{progress.totalMatches}
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-green-600 dark:bg-green-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress.progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-yellow-200 dark:border-yellow-700">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-gray-700 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {currentChampionship.status === "completed"
                      ? "Finalizado"
                      : "Em andamento"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round(progress.progressPercentage)}% concluído
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 rounded-2xl border border-default bg-surface-elevated p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
            <Trophy className="h-4 w-4" />
            Visualização da Chave
          </div>
          <div className="bracket-container">
            <BracketVisualization onMatchClick={handleMatchClick} />
          </div>
        </div>

        {/* Modal para detalhes da partida */}
        {selectedMatch && (
          <Dialog open={!!selectedMatch} onOpenChange={handleCloseModal}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {selectedMatch.player1?.name || "TBD"}
                    </span>
                    <span className="text-gray-400">vs</span>
                    <span className="text-lg">
                      {selectedMatch.player2?.name || "TBD"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedMatch.round}</Badge>
                    {(selectedMatch.round === "3º Lugar" ||
                      selectedMatch.round === "3º Lugar 2ª Div") && (
                      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800/60">
                        Disputa de 3º Lugar
                      </Badge>
                    )}
                    {selectedMatch.isCompleted && (
                      <Badge className="bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800/60">
                        Finalizada
                      </Badge>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="p-6">
                <MatchCard
                  match={selectedMatch}
                  onUpdateResult={updateMatchResult}
                  onSetWalkover={setWalkover}
                  bestOf={currentChampionship.knockoutBestOf}
                  isEditable={currentChampionship.status !== "completed"}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};
