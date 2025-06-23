import React from "react";
import { useChampionshipStore } from "../../store/championship";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Trophy, Users, Crown } from "lucide-react";
import { Match } from "../../types";

interface KnockoutBracketProps {
  onGenerateBracket?: () => void;
}

export const KnockoutBracket: React.FC<KnockoutBracketProps> = ({
  onGenerateBracket,
}) => {
  const { currentChampionship, getQualifiedAthletes, getEliminatedAthletes } =
    useChampionshipStore();

  if (!currentChampionship) return null;

  const qualifiedAthletes = getQualifiedAthletes();
  const eliminatedAthletes = getEliminatedAthletes();

  // Obter partidas do mata-mata
  const knockoutMatches = currentChampionship.groups
    .flatMap((group) => group.matches)
    .filter((match) => match.phase === "knockout");

  // Organizar partidas por rodada
  const mainKnockoutRounds = [
    "Oitavas",
    "Quartas",
    "Semifinal",
    "Final",
    "3º Lugar",
  ];
  const secondDivRounds = [
    "Oitavas 2ª Div",
    "Quartas 2ª Div",
    "Semifinal 2ª Div",
    "Final 2ª Div",
    "3º Lugar 2ª Div",
  ];

  const getMatchesForRound = (roundName: string): Match[] => {
    return knockoutMatches.filter((match) => match.round === roundName);
  };

  const canGenerateBracket =
    currentChampionship.status === "groups" &&
    currentChampionship.groups.every((group) => group.isCompleted) &&
    qualifiedAthletes.length >= 4;

  const MatchCard: React.FC<{ match: Match }> = ({ match }) => (
    <Card className="w-64 mb-4">
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {match.player1?.name || "TBD"}
            </span>
            {match.isCompleted && match.winnerId === match.player1Id && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          <div className="text-xs text-gray-500 text-center">vs</div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {match.player2?.name || "TBD"}
            </span>
            {match.isCompleted && match.winnerId === match.player2Id && (
              <Crown className="h-4 w-4 text-yellow-500" />
            )}
          </div>
          {match.isCompleted && (
            <div className="text-center mt-2">
              <Badge variant="outline" className="text-xs">
                {match.isWalkover ? "W.O." : "Finalizada"}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const RoundDisplay: React.FC<{
    roundName: string;
    matches: Match[];
    isSecondDivision?: boolean;
  }> = ({ roundName, matches, isSecondDivision = false }) => {
    if (matches.length === 0) return null;

    return (
      <div className="flex flex-col items-center">
        <h3
          className={`text-lg font-bold mb-4 ${
            isSecondDivision ? "text-orange-600" : "text-blue-600"
          }`}
        >
          {roundName}
        </h3>
        <div className="space-y-4">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Status e Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Chave Mata-Mata
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!canGenerateBracket ? (
            <div className="text-center py-8">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chave não disponível
              </h3>
              <p className="text-gray-500 mb-4">
                {currentChampionship.status !== "groups"
                  ? "Complete a fase de grupos primeiro"
                  : !currentChampionship.groups.every((g) => g.isCompleted)
                  ? "Finalize todas as partidas da fase de grupos"
                  : "Não há atletas classificados suficientes"}
              </p>
            </div>
          ) : knockoutMatches.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-16 w-16 text-blue-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pronto para gerar a chave!
              </h3>
              <p className="text-gray-500 mb-4">
                {qualifiedAthletes.length} atletas classificados e{" "}
                {eliminatedAthletes.length} eliminados
              </p>
              <Button
                onClick={onGenerateBracket}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Gerar Chave Mata-Mata
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Divisão Principal */}
              <div>
                <h2 className="text-xl font-bold text-blue-600 mb-4 text-center">
                  Divisão Principal
                </h2>
                <div className="flex justify-center gap-8 overflow-x-auto">
                  {mainKnockoutRounds.map((roundName) => (
                    <RoundDisplay
                      key={roundName}
                      roundName={roundName}
                      matches={getMatchesForRound(roundName)}
                    />
                  ))}
                </div>
              </div>

              {/* Segunda Divisão */}
              {eliminatedAthletes.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold text-orange-600 mb-4 text-center">
                    Segunda Divisão
                  </h2>
                  <div className="flex justify-center gap-8 overflow-x-auto">
                    {secondDivRounds.map((roundName) => (
                      <RoundDisplay
                        key={roundName}
                        roundName={roundName}
                        matches={getMatchesForRound(roundName)}
                        isSecondDivision={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Qualificados e Eliminados */}
      {(qualifiedAthletes.length > 0 || eliminatedAthletes.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Qualificados */}
          {qualifiedAthletes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Trophy className="h-5 w-5" />
                  Classificados ({qualifiedAthletes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {qualifiedAthletes.map((athlete, index) => (
                    <div
                      key={athlete.id}
                      className="flex items-center justify-between p-2 bg-green-50 rounded"
                    >
                      <span className="font-medium">{athlete.name}</span>
                      <Badge variant="outline" className="text-green-600">
                        {index + 1}º classificado
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Eliminados */}
          {eliminatedAthletes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Users className="h-5 w-5" />
                  Segunda Divisão ({eliminatedAthletes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {eliminatedAthletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className="flex items-center justify-between p-2 bg-orange-50 rounded"
                    >
                      <span className="font-medium">{athlete.name}</span>
                      <Badge variant="outline" className="text-orange-600">
                        2ª Divisão
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
