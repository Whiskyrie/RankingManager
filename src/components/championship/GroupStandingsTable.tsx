import React from "react";
import { Group, GroupStanding } from "../../types";
import { getOrdinalPosition } from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface GroupStandingsTableProps {
  group: Group;
  showQualificationStatus?: boolean;
}

export const GroupStandingsTable: React.FC<GroupStandingsTableProps> = ({
  group,
  showQualificationStatus = true,
}) => {
  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (position === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return null;
  };

  const getQualificationBadge = (standing: GroupStanding) => {
    if (!showQualificationStatus) return null;

    return standing.qualified ? (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Classificado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">
        Eliminado
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <span>{group.name}</span>
          {group.isCompleted && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Concluído
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-1 font-medium text-gray-700 dark:text-gray-300">
                  Pos
                </th>
                <th className="text-left py-2 px-2 font-medium text-gray-700 dark:text-gray-300">
                  Atleta
                </th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 dark:text-gray-300">
                  J
                </th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 dark:text-gray-300">
                  V
                </th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 dark:text-gray-300">
                  D
                </th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 dark:text-gray-300">
                  Pts
                </th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                  Sets
                </th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">
                  Pontos
                </th>
                {showQualificationStatus && (
                  <th className="text-center py-2 px-1 font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {group.standings.map((standing, _index) => (
                <tr
                  key={standing.athleteId}
                  className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    standing.qualified ? "bg-green-50 dark:bg-green-900/20" : ""
                  }`}
                >
                  <td className="py-3 px-1">
                    <div className="flex items-center gap-2">
                      {getPositionIcon(standing.position)}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {getOrdinalPosition(standing.position)}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {standing.athlete.name}
                      </div>
                      {standing.athlete.isSeeded && (
                        <Badge variant="outline" className="text-xs mt-1">
                          Cabeça {standing.athlete.seedNumber}
                        </Badge>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-1 text-center text-sm text-gray-900 dark:text-gray-100">
                    {standing.matches}
                  </td>

                  <td className="py-3 px-1 text-center text-sm font-medium text-green-600 dark:text-green-400">
                    {standing.wins}
                  </td>

                  <td className="py-3 px-1 text-center text-sm font-medium text-red-600 dark:text-red-400">
                    {standing.losses}
                  </td>

                  <td className="py-3 px-1 text-center text-sm font-bold text-gray-900 dark:text-gray-100">
                    {standing.points}
                  </td>

                  <td className="py-3 px-1 text-center text-sm hidden sm:table-cell">
                    <div>
                      <span className="text-green-600 dark:text-green-400">{standing.setsWon}</span>
                      <span className="text-gray-400 dark:text-gray-500 mx-1">-</span>
                      <span className="text-red-600 dark:text-red-400">{standing.setsLost}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ({standing.setsDiff >= 0 ? "+" : ""}
                      {standing.setsDiff})
                    </div>
                  </td>

                  <td className="py-3 px-1 text-center text-sm hidden md:table-cell">
                    <div>
                      <span className="text-green-600 dark:text-green-400">
                        {standing.pointsWon}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 mx-1">-</span>
                      <span className="text-red-600 dark:text-red-400">
                        {standing.pointsLost}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ({standing.pointsDiff >= 0 ? "+" : ""}
                      {standing.pointsDiff})
                    </div>
                  </td>

                  {showQualificationStatus && (
                    <td className="py-3 px-1 text-center">
                      {getQualificationBadge(standing)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {group.standings.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Nenhuma partida disputada ainda</p>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          <p>
            <strong>Critérios de classificação:</strong>
          </p>
          <p>
            1º Pontos | 2º Saldo de sets | 3º Saldo de pontos | 4º Confronto
            direto
          </p>
          <p>
            <strong>J:</strong> Jogos | <strong>V:</strong> Vitórias |{" "}
            <strong>D:</strong> Derrotas | <strong>Pts:</strong> Pontos
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
