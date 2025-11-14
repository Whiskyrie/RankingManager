import React, { useState } from "react";
import { useChampionshipStore } from "../store/championship";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Settings,
  Trophy,
  Users,
  Calendar,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { calculateTournamentStats, formatDate, getStatusColor } from "../utils";
import { useChampionshipData } from "../hooks/performance";
import { useLogger } from "../lib/logger";
import { useErrorHandler } from "../lib/error-handler";

export const ChampionshipSettings: React.FC = () => {
  const { championship } = useChampionshipData();
  const { updateChampionship, deleteChampionship } = useChampionshipStore();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const logger = useLogger("settings");
  const { handle: handleError } = useErrorHandler();

  if (!championship) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Nenhum Campeonato</h2>
            <p className="text-secondary">
              Selecione ou crie um campeonato para ver as configurações.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResetChampionship = async () => {
    if (
      !confirm(
        "Tem certeza que deseja reiniciar o campeonato? Todos os resultados serão perdidos."
      )
    )
      return;

    try {
      logger.info("Resetting championship", {
        championshipId: championship.id,
      });

      const resetChampionship = {
        ...championship,
        status: "created" as const,
        groups: championship.groups.map((group) => ({
          ...group,
          matches: [],
          standings: [],
          isCompleted: false,
        })),
        knockoutBracket: [],
        completedMatches: 0,
        updatedAt: new Date(),
      };

      await updateChampionship(resetChampionship);
      logger.info("Championship reset successfully");
    } catch (error) {
      handleError(error as Error);
    }
  };

  const handleDeleteChampionship = async () => {
    if (!championship) return;

    setIsDeleting(true);
    try {
      logger.warn("Deleting championship", { championshipId: championship.id });
      await deleteChampionship(championship.id);
      logger.info("Championship deleted successfully");
    } catch (error) {
      handleError(error as Error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const confirmDeleteChampionship = () => {
    setShowDeleteConfirmation(true);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "created":
        return {
          label: "Criado",
          icon: Trophy,
          description: "Campeonato criado, aguardando início",
        };
      case "groups":
        return {
          label: "Fase de Grupos",
          icon: Users,
          description: "Fase de grupos em andamento",
        };
      case "knockout":
        return {
          label: "Mata-mata",
          icon: Target,
          description: "Fase eliminatória em andamento",
        };
      case "completed":
        return {
          label: "Finalizado",
          icon: Award,
          description: "Campeonato concluído",
        };
      default:
        return {
          label: "Desconhecido",
          icon: Trophy,
          description: "Status não identificado",
        };
    }
  };

  const statusInfo = getStatusInfo(championship.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações do Campeonato
          </h1>
          <p className="text-secondary">
            Visualize e gerencie as configurações do campeonato atual.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-secondary">
                    Nome do Campeonato
                  </label>
                  <p className="text-lg text-primary mt-1">
                    {championship.name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Status
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge className={getStatusColor(championship.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-secondary mt-1">
                    {statusInfo.description}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Data do Campeonato
                  </label>
                  <p className="text-lg text-primary mt-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(championship.date)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Total de Atletas
                  </label>
                  <p className="text-lg text-primary mt-1 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {championship.totalAthletes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Formato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Configurações de Formato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-secondary">
                    Tamanho do Grupo
                  </label>
                  <p className="text-lg text-primary mt-1">
                    {championship.groupSize} atletas por grupo
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Classificados por Grupo
                  </label>
                  <p className="text-lg text-primary mt-1">
                    {championship.qualificationSpotsPerGroup} classificados
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Total de Grupos
                  </label>
                  <p className="text-lg text-primary mt-1">
                    {championship.groups.length} grupos
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Grupos - Melhor de
                  </label>
                  <p className="text-lg text-primary mt-1">
                    {championship.groupsBestOf} sets
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Mata-mata - Melhor de
                  </label>
                  <p className="text-lg text-primary mt-1">
                    {championship.knockoutBestOf} sets
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Disputa de 3º Lugar
                  </label>
                  <p className="text-lg text-primary mt-1 flex items-center gap-1">
                    {championship.hasThirdPlace ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                    )}
                    {championship.hasThirdPlace ? "Sim" : "Não"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Estatísticas do Campeonato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm font-medium text-secondary">
                    Total de Partidas
                  </label>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {championship.totalMatches}
                  </p>
                  {(() => {
                    const stats = calculateTournamentStats(championship);
                    return (
                      <div className="text-xs text-secondary mt-1">
                        Grupos: {stats.groupMatches} | Mata-mata:{" "}
                        {stats.knockoutMatches}
                        {stats.secondDivMatches > 0 && (
                          <span>
                            {" "}
                            (Principal: {stats.mainKnockoutMatches} + 2ª Div:{" "}
                            {stats.secondDivMatches})
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Partidas Concluídas
                  </label>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {championship.completedMatches}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Partidas Pendentes
                  </label>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {championship.totalMatches - championship.completedMatches}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Progresso
                  </label>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {championship.totalMatches > 0
                      ? Math.round(
                          (championship.completedMatches /
                            championship.totalMatches) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações de Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-secondary">
                    Criado em
                  </label>
                  <p className="text-lg text-primary mt-1">
                    {formatDate(championship.createdAt)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-secondary">
                    Última atualização
                  </label>
                  <p className="text-lg text-primary mt-1">
                    {formatDate(championship.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações de Administração */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Reiniciar Campeonato */}
                {championship.status !== "completed" && (
                  <div>
                    <h4 className="text-sm font-medium text-primary">
                      Reiniciar Campeonato
                    </h4>
                    <p className="text-sm text-secondary mt-1">
                      Remove todos os resultados e volta o campeonato para o
                      estado inicial.
                    </p>
                    <Button
                      variant="destructive"
                      className="mt-2"
                      onClick={handleResetChampionship}
                    >
                      Reiniciar Campeonato
                    </Button>
                  </div>
                )}

                {/* Excluir Campeonato */}
                <div className="pt-4 border-t border-red-200 dark:border-red-800">
                  <h4 className="text-sm font-medium text-red-900 dark:text-red-400">
                    Excluir Campeonato Permanentemente
                  </h4>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Esta ação é <strong>irreversível</strong>. O campeonato e
                    todos os seus dados serão perdidos para sempre.
                  </p>

                  {!showDeleteConfirmation ? (
                    <Button
                      variant="destructive"
                      className="mt-3 bg-red-600 hover:bg-red-700"
                      onClick={confirmDeleteChampionship}
                    >
                      🗑️ Excluir Campeonato
                    </Button>
                  ) : (
                    <div className="mt-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-medium mb-3">
                            ⚠️ Tem certeza absoluta que deseja excluir o
                            campeonato "{championship.name}"?
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400 mb-4">
                            Esta ação não pode ser desfeita. Todos os atletas,
                            grupos, partidas e resultados serão perdidos.
                          </p>
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-3 mt-4">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteChampionship}
                          disabled={isDeleting}
                          className="bg-red-700 hover:bg-red-800"
                        >
                          {isDeleting
                            ? "Excluindo..."
                            : "✅ Sim, Excluir Definitivamente"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirmation(false)}
                          disabled={isDeleting}
                        >
                          ❌ Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
