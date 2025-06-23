import React from "react";
import { Championship } from "../../types";
import {
  formatDate,
  getStatusColor,
  calculateTournamentStats,
} from "../../utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, Users, BarChart3, Play, Eye } from "lucide-react";

interface ChampionshipCardProps {
  championship: Championship;
  onSelect: (championship: Championship) => void;
  onView: (championship: Championship) => void;
}

export const ChampionshipCard: React.FC<ChampionshipCardProps> = ({
  championship,
  onSelect,
  onView,
}) => {
  const stats = calculateTournamentStats(championship);

  const getStatusText = (status: string) => {
    switch (status) {
      case "created":
        return "Criado";
      case "groups":
        return "Fase de Grupos";
      case "knockout":
        return "Mata-mata";
      case "completed":
        return "Finalizado";
      default:
        return status;
    }
  };

  // ✅ CORREÇÃO: Tratamento defensivo para data
  const displayDate = React.useMemo(() => {
    try {
      return formatDate(championship.date);
    } catch (error) {
      console.error(
        "ChampionshipCard: Erro ao formatar data:",
        error,
        championship.date
      );
      return "Data não disponível";
    }
  }, [championship.date]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg font-bold text-gray-800 mb-2">
              {championship.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">{displayDate}</span>
            </div>
          </div>
          <Badge className={getStatusColor(championship.status)}>
            {getStatusText(championship.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-sm font-medium">
                {championship.totalAthletes}
              </div>
              <div className="text-xs text-gray-500">Atletas</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-sm font-medium">{stats.progress}%</div>
              <div className="text-xs text-gray-500">Progresso</div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>
              Partidas: {stats.completedMatches}/{stats.totalMatches}
            </span>
            <span>{stats.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>

        {championship.status === "groups" && (
          <div className="mb-4 text-xs text-gray-600">
            Grupos concluídos: {stats.groupsCompleted}/{stats.totalGroups}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(championship)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-1" />
            Visualizar
          </Button>

          <Button
            size="sm"
            onClick={() => onSelect(championship)}
            className="flex-1"
            disabled={championship.status === "completed"}
          >
            <Play className="h-4 w-4 mr-1" />
            {championship.status === "completed" ? "Finalizado" : "Gerenciar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
