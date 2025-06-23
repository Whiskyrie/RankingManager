import React, { useState } from "react";
import { useChampionshipStore } from "../../store/championship";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Trophy, Users, Crown, Medal, Target, Award } from "lucide-react";
import { Match } from "../../types";

interface BracketVisualizationProps {
  onMatchClick?: (match: Match) => void;
}

export const BracketVisualization: React.FC<BracketVisualizationProps> = ({
  onMatchClick,
}) => {
  const { currentChampionship } = useChampionshipStore();
  const [activeTab, setActiveTab] = useState("primeira");

  if (!currentChampionship) return null;

  // Obter todas as partidas de mata-mata
  const allKnockoutMatches = currentChampionship.groups
    .flatMap((group) => group.matches)
    .filter((match) => match.phase === "knockout");

  // Separar partidas por divisão
  const mainMatches = allKnockoutMatches.filter(
    (m) => !m.round?.includes("2ª Div")
  );
  const secondDivMatches = allKnockoutMatches.filter((m) =>
    m.round?.includes("2ª Div")
  );

  console.log("🔍 [BRACKET] Debug matches:", {
    total: allKnockoutMatches.length,
    main: mainMatches.length,
    secondDiv: secondDivMatches.length,
  });

  // Organizar partidas por rodada
  const getMatchesForRound = (matches: Match[], roundName: string): Match[] => {
    return matches.filter((match) => match.round === roundName);
  };

  // Rodadas da primeira divisão
  const mainRoundNames = [
    "Oitavas",
    "Quartas",
    "Semifinal",
    "Final",
    "3º Lugar",
  ];
  const mainRounds = mainRoundNames
    .map((name) => ({
      name,
      matches: getMatchesForRound(mainMatches, name),
    }))
    .filter((r) => r.matches.length > 0);

  // Rodadas da segunda divisão
  const secondRoundNames = [
    "Oitavas 2ª Div",
    "Quartas 2ª Div",
    "Semifinal 2ª Div",
    "Final 2ª Div",
    "3º Lugar 2ª Div",
  ];
  const secondRounds = secondRoundNames
    .map((name) => ({
      name,
      matches: getMatchesForRound(secondDivMatches, name),
    }))
    .filter((r) => r.matches.length > 0);

  const MatchCard: React.FC<{ match: Match }> = ({ match }) => {
    const isThirdPlace =
      match.isThirdPlace || match.round?.includes("3º Lugar");

    return (
      <Card
        className={`w-64 mb-4 cursor-pointer hover:shadow-lg transition-shadow ${
          isThirdPlace ? "border-yellow-300 bg-yellow-50" : ""
        }`}
        onClick={() => onMatchClick?.(match)}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Cabeçalho da partida */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                {match.round}
              </Badge>
              {isThirdPlace && <Medal className="h-4 w-4 text-yellow-600" />}
            </div>

            {/* Player 1 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">
                {match.player1?.name || "TBD"}
              </span>
              {match.isCompleted && match.winnerId === match.player1Id && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>

            {/* Versus */}
            <div className="text-xs text-gray-500 text-center">vs</div>

            {/* Player 2 */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium truncate">
                {match.player2?.name || "TBD"}
              </span>
              {match.isCompleted && match.winnerId === match.player2Id && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>

            {/* Status da partida */}
            <div className="text-center mt-2">
              {match.isCompleted ? (
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isThirdPlace
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {match.isWalkover ? "W.O." : "Finalizada"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-blue-600">
                  Pendente
                </Badge>
              )}
            </div>

            {/* Sets resultado se finalizada */}
            {match.isCompleted &&
              !match.isWalkover &&
              match.sets.length > 0 && (
                <div className="text-center">
                  <div className="text-xs text-gray-600">
                    Sets:{" "}
                    {
                      match.sets.filter((s) => s.player1Score > s.player2Score)
                        .length
                    }
                    -
                    {
                      match.sets.filter((s) => s.player2Score > s.player1Score)
                        .length
                    }
                  </div>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const RoundDisplay: React.FC<{
    round: { name: string; matches: Match[] };
    isSecondDivision?: boolean;
  }> = ({ round, isSecondDivision = false }) => {
    if (round.matches.length === 0) return null;

    return (
      <div className="flex flex-col items-center min-w-[280px]">
        <h3
          className={`text-lg font-bold mb-4 ${
            isSecondDivision ? "text-orange-600" : "text-blue-600"
          }`}
        >
          {round.name}
        </h3>
        <div className="space-y-4">
          {round.matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    );
  };

  const EmptyState: React.FC<{ division: string }> = ({ division }) => (
    <div className="text-center py-12">
      <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {division} não disponível
      </h3>
      <p className="text-gray-500">
        {division === "Primeira Divisão"
          ? "Complete a fase de grupos para gerar o mata-mata"
          : "A segunda divisão será gerada após a conclusão da fase de grupos"}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="primeira" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Primeira Divisão
            {mainMatches.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {mainMatches.filter((m) => m.isCompleted).length}/
                {mainMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="segunda" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Segunda Divisão
            {secondDivMatches.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {secondDivMatches.filter((m) => m.isCompleted).length}/
                {secondDivMatches.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Primeira Divisão */}
        <TabsContent value="primeira" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-600" />
                Chave Principal - Primeira Divisão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mainRounds.length > 0 ? (
                <div className="flex justify-start gap-8 overflow-x-auto pb-4">
                  {mainRounds.map((round) => (
                    <RoundDisplay
                      key={round.name}
                      round={round}
                      isSecondDivision={false}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState division="Primeira Divisão" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segunda Divisão */}
        <TabsContent value="segunda" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-600" />
                Chave de Repescagem - Segunda Divisão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {secondRounds.length > 0 ? (
                <div className="flex justify-start gap-8 overflow-x-auto pb-4">
                  {secondRounds.map((round) => (
                    <RoundDisplay
                      key={round.name}
                      round={round}
                      isSecondDivision={true}
                    />
                  ))}
                </div>
              ) : currentChampionship.hasRepechage ? (
                <EmptyState division="Segunda Divisão" />
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Segunda Divisão Desabilitada
                  </h3>
                  <p className="text-gray-500">
                    Este campeonato não possui repescagem configurada
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resumo das divisões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Estatísticas Primeira Divisão */}
        {mainMatches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">Primeira Divisão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total de partidas:</span>
                  <span className="font-semibold">{mainMatches.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Concluídas:</span>
                  <span className="font-semibold text-green-600">
                    {mainMatches.filter((m) => m.isCompleted).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pendentes:</span>
                  <span className="font-semibold text-orange-600">
                    {mainMatches.filter((m) => !m.isCompleted).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas Segunda Divisão */}
        {secondDivMatches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Segunda Divisão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total de partidas:</span>
                  <span className="font-semibold">
                    {secondDivMatches.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Concluídas:</span>
                  <span className="font-semibold text-green-600">
                    {secondDivMatches.filter((m) => m.isCompleted).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pendentes:</span>
                  <span className="font-semibold text-orange-600">
                    {secondDivMatches.filter((m) => !m.isCompleted).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
