import React from "react";
import { useChampionshipStore } from "../../store/championship";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Trophy, Crown, Users, Award } from "lucide-react";
import { Match } from "../../types";

interface BracketVisualizationProps {
  onMatchClick?: (match: Match) => void;
}

export const BracketVisualization: React.FC<BracketVisualizationProps> = ({
  onMatchClick,
}) => {
  const { currentChampionship } = useChampionshipStore();

  if (!currentChampionship) return null;

  // Obter partidas do mata-mata
  const knockoutMatches = currentChampionship.groups
    .flatMap((group) => group.matches)
    .filter((match) => match.phase === "knockout");

  console.log("🔍 Debug - Knockout matches:", knockoutMatches);

  // Separar partidas principais das de segunda divisão
  const mainMatches = knockoutMatches.filter(
    (m) => !m.round?.includes("2ª Div")
  );
  const secondDivisionMatches = knockoutMatches.filter((m) =>
    m.round?.includes("2ª Div")
  );

  console.log("🔍 Debug - Main matches:", mainMatches);
  console.log("🔍 Debug - Second division matches:", secondDivisionMatches);

  const BracketMatch: React.FC<{
    match: Match;
    isSecondDivision?: boolean;
  }> = ({ match, isSecondDivision = false }) => {
    const getPlayerName = (playerId: string | undefined) => {
      if (!playerId) return "TBD";
      const athlete = currentChampionship.athletes.find(
        (a) => a.id === playerId
      );
      return athlete?.name || "TBD";
    };

    const isWinner = (playerId: string | undefined) => {
      return match.isCompleted && match.winner === playerId;
    };

    const getMatchScore = () => {
      if (!match.isCompleted || !match.sets || match.sets.length === 0) {
        return null;
      }

      let player1Sets = 0;
      let player2Sets = 0;

      match.sets.forEach((set) => {
        if (set.player1Score > set.player2Score) player1Sets++;
        else if (set.player2Score > set.player1Score) player2Sets++;
      });

      return `${player1Sets}-${player2Sets}`;
    };

    return (
      <Card
        className={`w-64 mb-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
          isSecondDivision
            ? "border-orange-300 hover:border-orange-500"
            : "border-blue-300 hover:border-blue-500"
        } ${match.isCompleted ? "bg-green-50" : "bg-white"}`}
        onClick={() => onMatchClick?.(match)}
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          margin: "8px",
        }}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Player 1 */}
            <div
              className={`flex items-center justify-between p-2 rounded-md transition-colors duration-200 ${
                isWinner(match.player1Id)
                  ? "bg-green-100 border border-green-300"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <span
                className={`text-sm truncate flex-1 ${
                  isWinner(match.player1Id) ? "font-bold text-green-800" : ""
                }`}
                title={getPlayerName(match.player1Id)}
              >
                {getPlayerName(match.player1Id)}
              </span>
              <div className="flex items-center gap-1 ml-2">
                {getMatchScore() && (
                  <span className="text-xs font-mono text-gray-600 bg-white px-1 rounded">
                    {getMatchScore()?.split("-")[0]}
                  </span>
                )}
                {isWinner(match.player1Id) && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="text-center">
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                vs
              </span>
            </div>

            {/* Player 2 */}
            <div
              className={`flex items-center justify-between p-2 rounded-md transition-colors duration-200 ${
                isWinner(match.player2Id)
                  ? "bg-green-100 border border-green-300"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <span
                className={`text-sm truncate flex-1 ${
                  isWinner(match.player2Id) ? "font-bold text-green-800" : ""
                }`}
                title={getPlayerName(match.player2Id)}
              >
                {getPlayerName(match.player2Id)}
              </span>
              <div className="flex items-center gap-1 ml-2">
                {getMatchScore() && (
                  <span className="text-xs font-mono text-gray-600 bg-white px-1 rounded">
                    {getMatchScore()?.split("-")[1]}
                  </span>
                )}
                {isWinner(match.player2Id) && (
                  <Crown className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </div>

            {/* Status e Info */}
            <div className="flex justify-between items-center mt-2">
              <div>
                {match.isCompleted ? (
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {match.isWalkover ? "W.O." : "Finalizada"}
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-xs text-blue-600 border-blue-200"
                  >
                    Pendente
                  </Badge>
                )}
              </div>

              {onMatchClick && (
                <div className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Clique para detalhes
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const BracketRound: React.FC<{
    roundName: string;
    matches: Match[];
    isSecondDivision?: boolean;
  }> = ({ roundName, matches, isSecondDivision = false }) => {
    if (matches.length === 0) return null;

    const getRoundIcon = () => {
      if (roundName.includes("Final")) return <Trophy className="h-4 w-4" />;
      if (roundName.includes("Semifinal"))
        return <Trophy className="h-4 w-4" />;
      return <Users className="h-4 w-4" />;
    };

    const getRoundStats = () => {
      const completed = matches.filter((m) => m.isCompleted).length;
      const total = matches.length;
      return {
        completed,
        total,
        percentage: total > 0 ? (completed / total) * 100 : 0,
      };
    };

    const stats = getRoundStats();

    return (
      <div className="flex flex-col items-center min-h-full mx-4">
        <div
          className={`sticky top-0 z-10 mb-4 p-3 rounded-lg shadow-sm border-2 ${
            isSecondDivision
              ? "bg-orange-100 text-orange-800 border-orange-200"
              : "bg-blue-100 text-blue-800 border-blue-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {getRoundIcon()}
            <span className="font-semibold text-sm">{roundName}</span>
          </div>

          {/* Progress indicator */}
          <div className="text-xs text-center">
            <div className="flex items-center gap-1 mb-1">
              <span>
                {stats.completed}/{stats.total}
              </span>
              <span className="text-gray-500">partidas</span>
            </div>
            <div
              className={`w-20 h-1 rounded-full ${
                isSecondDivision ? "bg-orange-200" : "bg-blue-200"
              }`}
            >
              <div
                className={`h-1 rounded-full transition-all ${
                  isSecondDivision ? "bg-orange-500" : "bg-blue-500"
                }`}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-around flex-1 space-y-6 w-full">
          {matches.map((match) => (
            <div key={match.id} className="relative">
              <BracketMatch match={match} isSecondDivision={isSecondDivision} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const BracketConnector: React.FC = () => (
    <div className="flex items-center justify-center mx-2">
      <div className="flex flex-col items-center">
        <div className="w-8 h-px bg-gray-300"></div>
        <div className="w-px h-6 bg-gray-300"></div>
        <div className="w-8 h-px bg-gray-300"></div>
      </div>
    </div>
  );

  // ✅ CORRIGIR: Incluir todas as rodadas incluindo Final
  const mainRounds = ["Oitavas", "Quartas", "Semifinal", "Final"];
  const organizedMainRounds = mainRounds
    .map((roundName) => ({
      name: roundName,
      matches: mainMatches.filter((m) => m.round === roundName),
    }))
    .filter((round) => round.matches.length > 0);

  // ✅ ADICIONAR TERCEIRO LUGAR PARA AMBAS AS DIVISÕES
  const thirdPlaceMatch = mainMatches.find((m) => m.round === "3º Lugar");
  const thirdPlaceSecondDiv = secondDivisionMatches.find(
    (m) => m.round === "3º Lugar 2ª Div"
  );

  // ✅ CORRIGIR: Incluir todas as rodadas da segunda divisão incluindo Final
  const secondDivRounds = [
    "Oitavas 2ª Div",
    "Quartas 2ª Div",
    "Semifinal 2ª Div",
    "Final 2ª Div",
  ];
  const organizedSecondDivRounds = secondDivRounds
    .map((roundName) => ({
      name: roundName,
      matches: secondDivisionMatches.filter((m) => m.round === roundName),
    }))
    .filter((round) => round.matches.length > 0);

  console.log("🔍 Debug - Organized main rounds:", organizedMainRounds);
  console.log(
    "🔍 Debug - Organized second div rounds:",
    organizedSecondDivRounds
  );

  return (
    <div className="space-y-8">
      {/* Divisão Principal */}
      {organizedMainRounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Trophy className="h-5 w-5" />
              Primeira Divisão ({mainMatches.length} partidas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-4 pt-4">
              <div
                className="flex items-stretch min-h-96 px-4"
                style={{ minWidth: "max-content" }}
              >
                {organizedMainRounds.map((round, index) => (
                  <React.Fragment key={round.name}>
                    <BracketRound
                      roundName={round.name}
                      matches={round.matches}
                    />
                    {index < organizedMainRounds.length - 1 && (
                      <BracketConnector />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* ✅ SEÇÃO PARA TERCEIRO LUGAR PRIMEIRA DIVISÃO */}
            {thirdPlaceMatch && (
              <div className="mt-8 border-t pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-amber-600 mb-4 flex items-center justify-center gap-2">
                    <Award className="h-5 w-5" />
                    Disputa de 3º Lugar - Primeira Divisão
                  </h3>
                  <div className="flex justify-center">
                    <BracketMatch
                      match={thirdPlaceMatch}
                      isSecondDivision={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Segunda Divisão */}
      {organizedSecondDivRounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Users className="h-5 w-5" />
              Segunda Divisão ({secondDivisionMatches.length} partidas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto pb-4 pt-4">
              <div
                className="flex items-stretch min-h-96 px-4"
                style={{ minWidth: "max-content" }}
              >
                {organizedSecondDivRounds.map((round, index) => (
                  <React.Fragment key={round.name}>
                    <BracketRound
                      roundName={round.name}
                      matches={round.matches}
                      isSecondDivision={true}
                    />
                    {index < organizedSecondDivRounds.length - 1 && (
                      <BracketConnector />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* ✅ SEÇÃO PARA TERCEIRO LUGAR SEGUNDA DIVISÃO */}
            {thirdPlaceSecondDiv && (
              <div className="mt-8 border-t pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-orange-600 mb-4 flex items-center justify-center gap-2">
                    <Award className="h-5 w-5" />
                    Disputa de 3º Lugar - Segunda Divisão
                  </h3>
                  <div className="flex justify-center">
                    <BracketMatch
                      match={thirdPlaceSecondDiv}
                      isSecondDivision={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há chaves */}
      {organizedMainRounds.length === 0 &&
        organizedSecondDivRounds.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chave não gerada
              </h3>
              <p className="text-gray-500">
                A chave eliminatória ainda não foi gerada. Complete a fase de
                grupos primeiro.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
};
