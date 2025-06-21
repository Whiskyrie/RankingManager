import React from "react";
import { useChampionshipStore } from "../../store/championship";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Trophy, Crown } from "lucide-react";
import { Match } from "../../types";

interface AdvancedBracketProps {
  onMatchClick?: (match: Match) => void;
}

export const AdvancedBracket: React.FC<AdvancedBracketProps> = ({
  onMatchClick,
}) => {
  const { currentChampionship } = useChampionshipStore();

  if (!currentChampionship) return null;

  // Obter partidas do mata-mata principal
  const knockoutMatches = currentChampionship.groups
    .flatMap((group) => group.matches)
    .filter(
      (match) => match.phase === "knockout" && !match.round?.includes("2ª Div")
    );

  // Organizar por rodadas
  const rounds = {
    oitavas: knockoutMatches.filter((m) => m.round === "Oitavas"),
    quartas: knockoutMatches.filter((m) => m.round === "Quartas"),
    semifinal: knockoutMatches.filter((m) => m.round === "Semifinal"),
    final: knockoutMatches.filter((m) => m.round === "Final"),
  };

  const BracketMatch: React.FC<{ match: Match; roundKey: string }> = ({
    match,
    roundKey,
  }) => {
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

    const getMatchHeight = () => {
      switch (roundKey) {
        case "oitavas":
          return "h-20";
        case "quartas":
          return "h-24";
        case "semifinal":
          return "h-32";
        case "final":
          return "h-40";
        default:
          return "h-20";
      }
    };

    return (
      <Card
        className={`w-48 ${getMatchHeight()} cursor-pointer transition-all hover:shadow-lg border-2 border-blue-200 hover:border-blue-400`}
        onClick={() => onMatchClick?.(match)}
      >
        <CardContent className="p-2 h-full flex flex-col justify-center">
          <div className="space-y-1">
            {/* Player 1 */}
            <div
              className={`flex items-center justify-between p-1.5 rounded text-xs ${
                isWinner(match.player1Id)
                  ? "bg-green-100 border border-green-300 font-bold"
                  : "bg-gray-50"
              }`}
            >
              <span className="truncate flex-1">
                {getPlayerName(match.player1Id)}
              </span>
              {isWinner(match.player1Id) && (
                <Crown className="h-3 w-3 text-yellow-500 ml-1" />
              )}
            </div>

            {/* Player 2 */}
            <div
              className={`flex items-center justify-between p-1.5 rounded text-xs ${
                isWinner(match.player2Id)
                  ? "bg-green-100 border border-green-300 font-bold"
                  : "bg-gray-50"
              }`}
            >
              <span className="truncate flex-1">
                {getPlayerName(match.player2Id)}
              </span>
              {isWinner(match.player2Id) && (
                <Crown className="h-3 w-3 text-yellow-500 ml-1" />
              )}
            </div>

            {/* Status */}
            <div className="text-center">
              {match.isCompleted ? (
                <Badge variant="outline" className="text-xs h-4 bg-green-50">
                  {match.isWalkover ? "W.O." : "✓"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs h-4">
                  Pendente
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const BracketConnector: React.FC<{
    fromRound: string;
    toRound: string;
  }> = ({ fromRound, toRound }) => {
    const getConnectorStyle = () => {
      switch (`${fromRound}-${toRound}`) {
        case "oitavas-quartas":
          return "w-8 h-24";
        case "quartas-semifinal":
          return "w-8 h-32";
        case "semifinal-final":
          return "w-8 h-40";
        default:
          return "w-8 h-24";
      }
    };

    return (
      <div
        className={`flex items-center justify-center ${getConnectorStyle()}`}
      >
        <svg
          className="w-full h-full"
          viewBox="0 0 32 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 24 L16 24 L16 48 L32 48"
            stroke="#94a3b8"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M0 72 L16 72 L16 48 L32 48"
            stroke="#94a3b8"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    );
  };

  if (Object.values(rounds).every((round) => round.length === 0)) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chave não gerada
          </h3>
          <p className="text-gray-500">
            A chave eliminatória ainda não foi gerada. Complete a fase de grupos
            primeiro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
      <div className="overflow-x-auto">
        <div
          className="flex items-center justify-center"
          style={{ minWidth: "1200px" }}
        >
          {/* Oitavas de Final */}
          {rounds.oitavas.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                Oitavas
              </div>
              <div className="space-y-8">
                {rounds.oitavas.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    roundKey="oitavas"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conector Oitavas -> Quartas */}
          {rounds.oitavas.length > 0 && rounds.quartas.length > 0 && (
            <div
              className="flex flex-col justify-around mx-4"
              style={{ height: `${rounds.oitavas.length * 112}px` }}
            >
              {Array.from({ length: Math.ceil(rounds.oitavas.length / 2) }).map(
                (_, index) => (
                  <BracketConnector
                    key={index}
                    fromRound="oitavas"
                    toRound="quartas"
                  />
                )
              )}
            </div>
          )}

          {/* Quartas de Final */}
          {rounds.quartas.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="mb-4 px-3 py-1 bg-orange-100 text-orange-800 rounded-full font-semibold text-sm">
                Quartas
              </div>
              <div className="space-y-16">
                {rounds.quartas.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    roundKey="quartas"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conector Quartas -> Semifinal */}
          {rounds.quartas.length > 0 && rounds.semifinal.length > 0 && (
            <div
              className="flex flex-col justify-around mx-4"
              style={{ height: `${rounds.quartas.length * 160}px` }}
            >
              {Array.from({ length: Math.ceil(rounds.quartas.length / 2) }).map(
                (_, index) => (
                  <BracketConnector
                    key={index}
                    fromRound="quartas"
                    toRound="semifinal"
                  />
                )
              )}
            </div>
          )}

          {/* Semifinal */}
          {rounds.semifinal.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="mb-4 px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-semibold text-sm">
                Semifinal
              </div>
              <div className="space-y-32">
                {rounds.semifinal.map((match) => (
                  <BracketMatch
                    key={match.id}
                    match={match}
                    roundKey="semifinal"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Conector Semifinal -> Final */}
          {rounds.semifinal.length > 0 && rounds.final.length > 0 && (
            <div
              className="flex justify-center items-center mx-4"
              style={{ height: `${rounds.semifinal.length * 256}px` }}
            >
              <BracketConnector fromRound="semifinal" toRound="final" />
            </div>
          )}

          {/* Final */}
          {rounds.final.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="mb-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full font-semibold text-sm flex items-center gap-1">
                <Trophy className="h-4 w-4" />
                Final
              </div>
              <div>
                {rounds.final.map((match) => (
                  <BracketMatch key={match.id} match={match} roundKey="final" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
