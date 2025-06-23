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
} from "lucide-react";
import { generateKnockoutBracket } from "../utils";
import { Match } from "../types";

export const KnockoutBracket: React.FC = () => {
  const { currentChampionship, updateMatchResult, setWalkover } =
    useChampionshipStore();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  if (!currentChampionship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum campeonato selecionado
            </h2>
            <p className="text-gray-500">
              Selecione um campeonato para visualizar a chave
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentChampionship.status === "groups") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 text-blue-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Fase de Grupos em Andamento
            </h2>
            <p className="text-gray-500 mb-4">
              A chave eliminatória será gerada após o término da fase de grupos
            </p>
            <Button variant="outline">Voltar para Grupos</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ CORREÇÃO: Acessar partidas de mata-mata corretamente
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

  console.log("🔍 [KNOCKOUT-PAGE] Debug knockout matches:", {
    fromGroups: allKnockoutMatches.length,
    fromBracket: bracketMatches.length,
    total: knockoutMatches.length,
  });

  // ✅ SEPARAR POR DIVISÃO PARA ESTATÍSTICAS
  const mainMatches = knockoutMatches.filter(
    (m) => !m.round?.includes("2ª Div")
  );
  const secondDivisionMatches = knockoutMatches.filter((m) =>
    m.round?.includes("2ª Div")
  );

  // ✅ CAMPEÕES E MEDALHISTAS
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

  const thirdPlace2Match = secondDivisionMatches.find(
    (m) => m.round === "3º Lugar 2ª Div"
  );
  const thirdPlace2 = thirdPlace2Match?.isCompleted
    ? thirdPlace2Match.winnerId
    : null;

  const handleDownloadBracket = () => {
    generateKnockoutBracket(currentChampionship);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Chave Eliminatória - {currentChampionship.name}
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date(currentChampionship.date).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                className={
                  currentChampionship.status === "completed"
                    ? "bg-green-100 text-green-800"
                    : "bg-orange-100 text-orange-800"
                }
              >
                {currentChampionship.status === "completed"
                  ? "Finalizado"
                  : "Em Andamento"}
              </Badge>

              <Button variant="outline" onClick={handleDownloadBracket}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Chave
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pódium - se o campeonato estiver finalizado */}
        {currentChampionship.status === "completed" &&
          (champion || runnerUp || thirdPlace || thirdPlace2) && (
            <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="text-center flex items-center justify-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Pódium Final
                </CardTitle>
              </CardHeader>

              <CardContent>
                {/* PÓDIUM PRIMEIRA DIVISÃO */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4 text-center">
                    Primeira Divisão
                  </h3>
                  <div className="flex justify-center items-end gap-8">
                    {/* 2º Lugar - CORREÇÃO: usar runnerUp */}
                    {runnerUp && (
                      <div className="text-center">
                        <div className="w-20 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                          <Medal className="h-8 w-8 text-gray-500" />
                        </div>
                        <div className="font-semibold text-gray-700">
                          Vice-Campeão
                        </div>
                        <div className="text-sm text-gray-600">
                          {
                            currentChampionship.athletes.find(
                              (a) => a.id === runnerUp
                            )?.name
                          }
                        </div>
                      </div>
                    )}

                    {/* 1º Lugar */}
                    {champion && (
                      <div className="text-center">
                        <div className="w-24 h-20 bg-yellow-200 rounded-lg flex items-center justify-center mb-2">
                          <Trophy className="h-10 w-10 text-yellow-600" />
                        </div>
                        <div className="font-bold text-yellow-700 text-lg">
                          CAMPEÃO
                        </div>
                        <div className="text-sm text-gray-700">
                          {
                            currentChampionship.athletes.find(
                              (a) => a.id === champion
                            )?.name
                          }
                        </div>
                      </div>
                    )}

                    {/* 3º Lugar */}
                    {thirdPlace && (
                      <div className="text-center">
                        <div className="w-20 h-16 bg-amber-200 rounded-lg flex items-center justify-center mb-2">
                          <Award className="h-8 w-8 text-amber-600" />
                        </div>
                        <div className="font-semibold text-amber-700">
                          3º Lugar
                        </div>
                        <div className="text-sm text-gray-600">
                          {
                            currentChampionship.athletes.find(
                              (a) => a.id === thirdPlace
                            )?.name
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PÓDIUM SEGUNDA DIVISÃO - CORREÇÃO: usar thirdPlace2 */}
                {thirdPlace2 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-orange-600 mb-4 text-center">
                      Segunda Divisão
                    </h3>
                    <div className="flex justify-center">
                      <div className="text-center">
                        <div className="w-20 h-16 bg-orange-200 rounded-lg flex items-center justify-center mb-2">
                          <Award className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="font-semibold text-orange-700">
                          3º Lugar - 2ª Divisão
                        </div>
                        <div className="text-sm text-gray-600">
                          {
                            currentChampionship.athletes.find(
                              (a) => a.id === thirdPlace2
                            )?.name
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        {/* Estatísticas Atualizadas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Primeira Divisão
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {mainMatches.filter((m) => m.isCompleted).length}/
                    {mainMatches.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Segunda Divisão
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {secondDivisionMatches.filter((m) => m.isCompleted).length}/
                    {secondDivisionMatches.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Mata-mata
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {knockoutMatches.filter((m) => m.isCompleted).length}/
                    {knockoutMatches.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentChampionship.status === "completed"
                      ? "Finalizado"
                      : "Em andamento"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualização da Chave com Abas */}
        <BracketVisualization
          onMatchClick={(match) => setSelectedMatch(match)}
        />

        {/* Modal para detalhes da partida */}
        {selectedMatch && (
          <Dialog
            open={!!selectedMatch}
            onOpenChange={() => setSelectedMatch(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedMatch.player1?.name} vs {selectedMatch.player2?.name}
                  {/* CORREÇÃO: Indicar se é partida de 3º lugar */}
                  {(selectedMatch.round === "3º Lugar" ||
                    selectedMatch.round === "3º Lugar 2ª Div") && (
                    <Badge
                      variant="outline"
                      className="ml-2 bg-yellow-100 text-yellow-800"
                    >
                      Disputa de 3º Lugar
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="p-4">
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
