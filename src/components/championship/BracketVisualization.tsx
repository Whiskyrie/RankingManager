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

  // Organizar partidas por rodada em estrutura hierárquica
  const organizeBracketData = (matches: Match[], divisionSuffix = "") => {
    const rounds = {
      oitavas: matches.filter((m) => m.round === `Oitavas${divisionSuffix}`),
      quartas: matches.filter((m) => m.round === `Quartas${divisionSuffix}`),
      semifinal: matches.filter(
        (m) => m.round === `Semifinal${divisionSuffix}`
      ),
      final: matches.filter((m) => m.round === `Final${divisionSuffix}`),
      terceiro: matches.filter((m) => m.round === `3º Lugar${divisionSuffix}`),
    };

    return rounds;
  };

  const mainBracket = organizeBracketData(mainMatches);
  const secondBracket = organizeBracketData(secondDivMatches, " 2ª Div");

  // Componente de partida otimizado para bracket
  const BracketMatch: React.FC<{
    match: Match;
    position?: "top" | "bottom" | "center";
    showConnector?: boolean;
    roundIndex?: number;
  }> = ({
    match,
    position = "center",
    showConnector = true,
    roundIndex = 0,
  }) => {
    const isThirdPlace =
      match.isThirdPlace || match.round?.includes("3º Lugar");
    const isCompleted = match.isCompleted;
    const winner = isCompleted ? match.winnerId : null;

    return (
      <div
        className={`relative bracket-match ${
          showConnector ? "bracket-connector" : ""
        }`}
      >
        <Card
          className={`w-52 bracket-match-card ${
            isThirdPlace
              ? "match-third-place border-yellow-400"
              : isCompleted
              ? "match-completed border-green-400"
              : "match-pending border-orange-400"
          }`}
          onClick={() => onMatchClick?.(match)}
        >
          <CardContent className="p-3">
            {/* Header da partida */}
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant="outline"
                className={`text-xs ${
                  isThirdPlace ? "bg-yellow-100 text-yellow-800" : ""
                }`}
              >
                {match.round?.replace(" 2ª Div", "")}
              </Badge>
              {isThirdPlace && <Medal className="h-3 w-3 text-yellow-600" />}
            </div>

            {/* Player 1 */}
            <div
              className={`flex items-center justify-between p-2 rounded mb-1 ${
                winner === match.player1Id
                  ? "player-winner bg-green-100 border border-green-300"
                  : winner && winner !== match.player1Id
                  ? "player-loser bg-gray-100"
                  : !match.player1?.name
                  ? "player-tbd bg-gray-50"
                  : "bg-white border"
              }`}
            >
              <span className="text-sm font-medium truncate flex-1 player-name">
                {match.player1?.name || "TBD"}
              </span>
              {winner === match.player1Id && (
                <Crown className="h-4 w-4 text-yellow-600 ml-1" />
              )}
            </div>

            {/* Player 2 */}
            <div
              className={`flex items-center justify-between p-2 rounded ${
                winner === match.player2Id
                  ? "player-winner bg-green-100 border border-green-300"
                  : winner && winner !== match.player2Id
                  ? "player-loser bg-gray-100"
                  : !match.player2?.name
                  ? "player-tbd bg-gray-50"
                  : "bg-white border"
              }`}
            >
              <span className="text-sm font-medium truncate flex-1 player-name">
                {match.player2?.name || "TBD"}
              </span>
              {winner === match.player2Id && (
                <Crown className="h-4 w-4 text-yellow-600 ml-1" />
              )}
            </div>

            {/* Status e resultado */}
            <div className="mt-2 space-y-1">
              <div className="text-center">
                {isCompleted ? (
                  <Badge
                    className={`status-badge ${
                      match.isWalkover
                        ? "badge-walkover"
                        : isThirdPlace
                        ? "badge-walkover"
                        : "badge-completed"
                    }`}
                  >
                    {match.isWalkover ? "W.O." : "Finalizada"}
                  </Badge>
                ) : (
                  <Badge className="status-badge badge-pending">Pendente</Badge>
                )}
              </div>

              {/* Placar dos sets */}
              {isCompleted && !match.isWalkover && match.sets.length > 0 && (
                <div className="text-center text-xs text-gray-600 font-medium">
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
              )}
            </div>
          </CardContent>
        </Card>

        {/* Conector visual melhorado */}
        {showConnector && !isThirdPlace && (
          <div className="absolute top-1/2 -right-12 transform -translate-y-1/2">
            {/* Linha horizontal */}
            <div className="w-12 h-0.5 bg-gray-400"></div>
            {/* Conectores verticais para formar bracket */}
            {roundIndex < 2 && (
              <>
                <div className="absolute right-0 -top-8 w-0.5 h-8 bg-gray-400"></div>
                <div className="absolute right-0 bottom-0 w-0.5 h-8 bg-gray-400"></div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Componente de coluna de rodada
  const RoundColumn: React.FC<{
    title: string;
    matches: Match[];
    showConnectors?: boolean;
    isLastRound?: boolean;
    roundIndex?: number;
  }> = ({
    title,
    matches,
    showConnectors = true,
    isLastRound = false,
    roundIndex = 0,
  }) => {
    if (matches.length === 0) return null;

    // Calcular espaçamento vertical baseado na rodada
    const getVerticalSpacing = (roundIdx: number) => {
      const baseSpacing = 8; // gap base entre partidas
      return baseSpacing * Math.pow(2, roundIdx);
    };

    const spacing = getVerticalSpacing(roundIndex);

    return (
      <div className="flex flex-col items-center min-w-[220px]">
        <h3
          className={`text-lg font-bold mb-6 text-center round-title ${
            title.includes("2ª Div")
              ? "second-division text-orange-600"
              : "text-blue-600"
          }`}
        >
          {title}
        </h3>
        <div className="flex flex-col" style={{ gap: `${spacing}px` }}>
          {matches.map((match, _index) => (
            <BracketMatch
              key={match.id}
              match={match}
              showConnector={showConnectors && !isLastRound}
              roundIndex={roundIndex}
            />
          ))}
        </div>
      </div>
    );
  };

  // Componente principal do bracket
  const BracketDisplay: React.FC<{
    bracket: ReturnType<typeof organizeBracketData>;
    isSecondDivision?: boolean;
  }> = ({ bracket, isSecondDivision = false }) => {
    const hasMatches = Object.values(bracket).some(
      (matches) => matches.length > 0
    );

    if (!hasMatches) {
      return (
        <div className="text-center py-12">
          <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isSecondDivision ? "Segunda Divisão" : "Primeira Divisão"} não
            disponível
          </h3>
          <p className="text-gray-500">
            {isSecondDivision
              ? "A segunda divisão será gerada após a conclusão da fase de grupos"
              : "Complete a fase de grupos para gerar o mata-mata"}
          </p>
        </div>
      );
    }

    return (
      <div className="w-full overflow-x-auto pb-6 bracket-scroll">
        <div className="flex items-start justify-start gap-16 min-w-max px-4">
          {/* Oitavas */}
          {bracket.oitavas.length > 0 && (
            <RoundColumn
              title="Oitavas"
              matches={bracket.oitavas}
              showConnectors={true}
              roundIndex={0}
            />
          )}

          {/* Quartas */}
          {bracket.quartas.length > 0 && (
            <RoundColumn
              title="Quartas"
              matches={bracket.quartas}
              showConnectors={true}
              roundIndex={1}
            />
          )}

          {/* Semifinal */}
          {bracket.semifinal.length > 0 && (
            <RoundColumn
              title="Semifinal"
              matches={bracket.semifinal}
              showConnectors={true}
              roundIndex={2}
            />
          )}

          {/* Final e 3º Lugar - Layout lado a lado */}
          <div className="flex flex-col items-center space-y-8 min-w-[240px]">
            {/* Final */}
            {bracket.final.length > 0 && (
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold mb-6 text-center text-yellow-600 round-title">
                  Final
                </h3>
                {bracket.final.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    showConnector={false}
                    roundIndex={3}
                  />
                ))}
              </div>
            )}

            {/* 3º Lugar - Próximo à final */}
            {bracket.terceiro.length > 0 && (
              <div className="flex flex-col items-center">
                <h3 className="text-lg font-bold mb-6 text-center text-amber-600 round-title">
                  3º Lugar
                </h3>
                {bracket.terceiro.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    showConnector={false}
                    roundIndex={3}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const EmptySecondDivision = () => (
    <div className="text-center py-12">
      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Segunda Divisão Desabilitada
      </h3>
      <p className="text-gray-500">
        Este campeonato não possui repescagem configurada
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="primeira" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Primeira Divisão
            {mainMatches.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {mainMatches.filter((m) => m.isCompleted).length}/
                {mainMatches.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="segunda" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Segunda Divisão
            {secondDivMatches.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {secondDivMatches.filter((m) => m.isCompleted).length}/
                {secondDivMatches.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Primeira Divisão */}
        <TabsContent value="primeira" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Trophy className="h-5 w-5" />
                Chave Principal - Primeira Divisão
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BracketDisplay bracket={mainBracket} isSecondDivision={false} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segunda Divisão */}
        <TabsContent value="segunda" className="mt-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Award className="h-5 w-5" />
                Chave de Repescagem - Segunda Divisão
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {secondDivMatches.length > 0 ? (
                <BracketDisplay
                  bracket={secondBracket}
                  isSecondDivision={true}
                />
              ) : currentChampionship.hasRepechage ? (
                <div className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Segunda Divisão não disponível
                  </h3>
                  <p className="text-gray-500">
                    A segunda divisão será gerada após a conclusão da fase de
                    grupos
                  </p>
                </div>
              ) : (
                <EmptySecondDivision />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resumo estatístico melhorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mainMatches.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Primeira Divisão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total de partidas:</span>
                <Badge variant="secondary" className="font-semibold">
                  {mainMatches.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Concluídas:</span>
                <Badge className="bg-green-100 text-green-800">
                  {mainMatches.filter((m) => m.isCompleted).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Pendentes:</span>
                <Badge className="bg-orange-100 text-orange-800">
                  {mainMatches.filter((m) => !m.isCompleted).length}
                </Badge>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>
                    {Math.round(
                      (mainMatches.filter((m) => m.isCompleted).length /
                        mainMatches.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-fill bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{
                      width: `${
                        (mainMatches.filter((m) => m.isCompleted).length /
                          mainMatches.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {secondDivMatches.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-700 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Segunda Divisão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Total de partidas:</span>
                <Badge variant="secondary" className="font-semibold">
                  {secondDivMatches.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Concluídas:</span>
                <Badge className="bg-green-100 text-green-800">
                  {secondDivMatches.filter((m) => m.isCompleted).length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Pendentes:</span>
                <Badge className="bg-orange-100 text-orange-800">
                  {secondDivMatches.filter((m) => !m.isCompleted).length}
                </Badge>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progresso</span>
                  <span>
                    {Math.round(
                      (secondDivMatches.filter((m) => m.isCompleted).length /
                        secondDivMatches.length) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="progress-bar h-2">
                  <div
                    className="progress-fill bg-gradient-to-r from-orange-500 to-orange-600"
                    style={{
                      width: `${
                        (secondDivMatches.filter((m) => m.isCompleted).length /
                          secondDivMatches.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
