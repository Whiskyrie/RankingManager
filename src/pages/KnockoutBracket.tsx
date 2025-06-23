import React, { useState } from "react";
import { useChampionshipStore } from "../store/championship";
import { BracketVisualization } from "../components/championship/BracketVisualization";
import { MatchCard } from "../components/championship/MatchCard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Trophy,
  Medal,
  Award,
  Download,
  Users,
  Target,
  BarChart3,
  Crown,
  ArrowLeft,
} from "lucide-react";
import { generateKnockoutBracket } from "../utils";
import { Match } from "../types";

export const KnockoutBracket: React.FC = () => {
  const { currentChampionship, updateMatchResult, setWalkover } =
    useChampionshipStore();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  if (!currentChampionship) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum campeonato selecionado
            </h2>
            <p className="text-gray-500">
              Selecione um campeonato para visualizar a chave eliminatória
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentChampionship.status === "groups") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md shadow-xl">
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 text-blue-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Fase de Grupos em Andamento
            </h2>
            <p className="text-gray-500 mb-6">
              A chave eliminatória será gerada após o término da fase de grupos
            </p>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Grupos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Obter partidas de mata-mata
  const allKnockoutMatches = currentChampionship.groups
    .flatMap((group) => group.matches)
    .filter((match) => match.phase === "knockout");

  // Também verificar no knockoutBracket se disponível
  const bracketMatches =
    currentChampionship.knockoutBracket
      ?.map((node) => node.match)
      .filter((m): m is Match => !!m && m.phase === "knockout") || [];

  // Combinar e deduplificar partidas
  const knockoutMatches = [
    ...allKnockoutMatches,
    ...bracketMatches.filter(
      (bm) => !allKnockoutMatches.some((am) => am.id === bm.id)
    ),
  ];

  // Separar por divisão
  const mainMatches = knockoutMatches.filter(
    (m) => !m.round?.includes("2ª Div")
  );
  const secondDivisionMatches = knockoutMatches.filter((m) =>
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

  // Função para obter nome do atleta
  const getAthleteName = (athleteId: string | null) => {
    if (!athleteId) return null;
    return (
      currentChampionship.athletes.find((a) => a.id === athleteId)?.name ||
      "Atleta"
    );
  };

  const handleDownloadBracket = () => {
    generateKnockoutBracket(currentChampionship);
  };

  // Calcular progresso geral
  const totalMatches = knockoutMatches.length;
  const completedMatches = knockoutMatches.filter((m) => m.isCompleted).length;
  const progressPercentage =
    totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header aprimorado */}
      <div className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Chave Eliminatória
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <span>{currentChampionship.name}</span>
                  <span className="text-gray-400">•</span>
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
                <div className="text-sm text-gray-600">Progresso Geral</div>
                <div className="text-lg font-semibold text-gray-900">
                  {completedMatches}/{totalMatches} partidas
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <Badge
                className={`px-3 py-1 ${
                  currentChampionship.status === "completed"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : "bg-orange-100 text-orange-800 border-orange-200"
                }`}
              >
                {currentChampionship.status === "completed"
                  ? "Finalizado"
                  : "Em Andamento"}
              </Badge>

              <Button
                variant="outline"
                onClick={handleDownloadBracket}
                className="flex items-center gap-2 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Baixar Chave
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pódium melhorado - se o campeonato estiver finalizado */}
        {currentChampionship.status === "completed" &&
          (champion || champion2Div) && (
            <Card className="mb-8 bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-yellow-200 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-3 text-2xl">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  Pódium Final
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </CardTitle>
              </CardHeader>

              <CardContent className="pb-8">
                {/* PRIMEIRA DIVISÃO */}
                {champion && (
                  <div className="mb-10">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-blue-600 flex items-center justify-center gap-2">
                        <Trophy className="h-6 w-6" />
                        Primeira Divisão
                        <Trophy className="h-6 w-6" />
                      </h3>
                    </div>
                    <div className="flex justify-center items-end gap-8 podium-container">
                      {/* 2º Lugar */}
                      {runnerUp && (
                        <div className="text-center podium-position">
                          <div className="w-24 h-20 podium-second rounded-xl flex flex-col items-center justify-center mb-3 shadow-lg">
                            <Medal className="h-8 w-8 text-white mb-1" />
                            <span className="text-xs text-white font-bold">
                              2º
                            </span>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-md border-2 border-gray-200">
                            <div className="font-bold text-gray-700 text-base">
                              Vice-Campeão
                            </div>
                            <div className="text-sm text-gray-600 font-medium mt-1">
                              {getAthleteName(runnerUp)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 1º Lugar */}
                      <div className="text-center podium-position">
                        <div className="w-32 h-28 podium-first rounded-xl flex flex-col items-center justify-center mb-3 shadow-xl">
                          <Crown className="h-10 w-10 text-white mb-1" />
                          <span className="text-sm text-white font-bold">
                            1º
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-lg border-4 border-yellow-300">
                          <div className="font-bold text-yellow-700 text-xl flex items-center justify-center gap-1">
                            🏆 CAMPEÃO
                          </div>
                          <div className="text-lg font-bold text-gray-800 mt-1">
                            {getAthleteName(champion)}
                          </div>
                        </div>
                      </div>

                      {/* 3º Lugar */}
                      {thirdPlace && (
                        <div className="text-center podium-position">
                          <div className="w-24 h-20 podium-third rounded-xl flex flex-col items-center justify-center mb-3 shadow-lg">
                            <Award className="h-8 w-8 text-white mb-1" />
                            <span className="text-xs text-white font-bold">
                              3º
                            </span>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-md border-2 border-amber-200">
                            <div className="font-bold text-amber-700 text-base">
                              3º Lugar
                            </div>
                            <div className="text-sm text-gray-600 font-medium mt-1">
                              {getAthleteName(thirdPlace)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SEGUNDA DIVISÃO */}
                {champion2Div && (
                  <div className="border-t border-gray-200 pt-8">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-orange-600 flex items-center justify-center gap-2">
                        <Award className="h-6 w-6" />
                        Segunda Divisão
                        <Award className="h-6 w-6" />
                      </h3>
                    </div>
                    <div className="flex justify-center items-end gap-8 podium-container">
                      {/* 2º Lugar 2ª Div */}
                      {runnerUp2Div && (
                        <div className="text-center podium-position">
                          <div className="w-20 h-16 podium-second rounded-lg flex flex-col items-center justify-center mb-3 shadow-lg">
                            <Medal className="h-6 w-6 text-white mb-1" />
                            <span className="text-xs text-white font-bold">
                              2º
                            </span>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-md border-2 border-gray-200">
                            <div className="font-semibold text-gray-700 text-sm">
                              Vice 2ª Div
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {getAthleteName(runnerUp2Div)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 1º Lugar 2ª Div */}
                      <div className="text-center podium-position">
                        <div className="w-24 h-20 bg-gradient-to-b from-orange-300 to-orange-500 rounded-lg flex flex-col items-center justify-center mb-3 shadow-xl">
                          <Trophy className="h-8 w-8 text-white mb-1" />
                          <span className="text-xs text-white font-bold">
                            1º
                          </span>
                        </div>
                        <div className="bg-white rounded-lg p-4 shadow-lg border-3 border-orange-300">
                          <div className="font-bold text-orange-700 text-base">
                            Campeão 2ª Div
                          </div>
                          <div className="text-sm font-bold text-gray-700 mt-1">
                            {getAthleteName(champion2Div)}
                          </div>
                        </div>
                      </div>

                      {/* 3º Lugar 2ª Div */}
                      {thirdPlace2Div && (
                        <div className="text-center podium-position">
                          <div className="w-20 h-16 podium-third rounded-lg flex flex-col items-center justify-center mb-3 shadow-lg">
                            <Award className="h-6 w-6 text-white mb-1" />
                            <span className="text-xs text-white font-bold">
                              3º
                            </span>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-md border-2 border-amber-200">
                            <div className="font-semibold text-amber-700 text-sm">
                              3º Lugar 2ª Div
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {getAthleteName(thirdPlace2Div)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Estatísticas aprimoradas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow border-blue-200 stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Primeira Divisão
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mainMatches.filter((m) => m.isCompleted).length}/
                    {mainMatches.length}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          mainMatches.length > 0
                            ? (mainMatches.filter((m) => m.isCompleted).length /
                                mainMatches.length) *
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

          <Card className="hover:shadow-lg transition-shadow border-orange-200 stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Segunda Divisão
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {secondDivisionMatches.filter((m) => m.isCompleted).length}/
                    {secondDivisionMatches.length}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-orange-600 h-1.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          secondDivisionMatches.length > 0
                            ? (secondDivisionMatches.filter(
                                (m) => m.isCompleted
                              ).length /
                                secondDivisionMatches.length) *
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

          <Card className="hover:shadow-lg transition-shadow border-green-200 stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Total Mata-mata
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completedMatches}/{totalMatches}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-yellow-200 stats-card">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentChampionship.status === "completed"
                      ? "Finalizado"
                      : "Em andamento"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(progressPercentage)}% concluído
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualização da Chave Melhorada */}
        <BracketVisualization
          onMatchClick={(match) => setSelectedMatch(match)}
        />

        {/* Modal aprimorado para detalhes da partida */}
        {selectedMatch && (
          <Dialog
            open={!!selectedMatch}
            onOpenChange={() => setSelectedMatch(null)}
          >
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

                  {/* Badges indicativos */}
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedMatch.round}</Badge>
                    {(selectedMatch.round === "3º Lugar" ||
                      selectedMatch.round === "3º Lugar 2ª Div") && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Disputa de 3º Lugar
                      </Badge>
                    )}
                    {selectedMatch.isCompleted && (
                      <Badge className="bg-green-100 text-green-800">
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
