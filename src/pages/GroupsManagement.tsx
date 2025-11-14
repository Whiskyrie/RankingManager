import React, { useState, useMemo } from "react";
import { useChampionshipStore } from "../store/championship";
import { GroupStandingsTable } from "../components/championship/GroupStandingsTable";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import {
  Users,
  Trophy,
  BarChart3,
  ChevronRight,
  Download,
  ArrowRight,
  Target,
} from "lucide-react";
import { generateGroupReport, calculateTournamentStats } from "../utils";

export const GroupsManagement: React.FC = () => {
  const {
    currentChampionship,
    updateMatchResult,
    setWalkover,
    generateKnockoutBracket,
    getQualifiedAthletes,
    fillGroupsWithRandomResults,
  } = useChampionshipStore();

  const [selectedGroup, setSelectedGroup] = useState<string>("");

  // Memoização para filtrar grupos baseado na seleção
  const filteredGroups = useMemo(() => {
    if (!currentChampionship || selectedGroup === "") {
      return currentChampionship?.groups || [];
    }
    return currentChampionship.groups.filter(
      (group) => group.id === selectedGroup
    );
  }, [currentChampionship, selectedGroup]);

  if (!currentChampionship) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhum campeonato selecionado
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Selecione um campeonato para gerenciar os grupos
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = calculateTournamentStats(currentChampionship);
  const qualifiedAthletes = getQualifiedAthletes();
  const allGroupsCompleted = currentChampionship.groups.every(
    (g) => g.isCompleted
  );

  const handleAdvanceToKnockout = async () => {
    if (allGroupsCompleted && qualifiedAthletes.length > 0) {
      await generateKnockoutBracket();
    }
  };

  const handleDownloadGroupReport = (groupId: string) => {
    const group = currentChampionship.groups.find((g) => g.id === groupId);
    if (group) {
      const report = generateGroupReport(currentChampionship);
      console.log(report); // Para desenvolvimento, pode ser substituído por download
    }
  };

  const handleFillGroupsWithResults = async () => {
    if (
      confirm(
        "Tem certeza que deseja preencher automaticamente todos os grupos com resultados aleatórios? Esta ação irá completar todas as partidas pendentes."
      )
    ) {
      await fillGroupsWithRandomResults();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Fase de Grupos - {currentChampionship.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {new Date(currentChampionship.date).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                className={
                  allGroupsCompleted
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }
              >
                {allGroupsCompleted ? "Fase Concluída" : "Em Andamento"}
              </Badge>

              {/* Botão para preencher grupos automaticamente */}
              {!allGroupsCompleted && currentChampionship.groups.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleFillGroupsWithResults}
                  className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                >
                  🎲 Preencher Automaticamente
                </Button>
              )}

              {allGroupsCompleted &&
                currentChampionship.status === "groups" && (
                  <Button
                    onClick={handleAdvanceToKnockout}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Avançar para Mata-mata
                  </Button>
                )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas da Fase */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Grupos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {currentChampionship.groups.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Partidas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.completedMatches}/{stats.totalMatches}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Grupos: {stats.groupMatchesCompleted}/{stats.groupMatches}
                    {stats.knockoutMatches > 0 && (
                      <span>
                        {" "}
                        | Mata-mata: {stats.knockoutMatchesCompleted}/
                        {stats.knockoutMatches}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Concluídos
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {stats.groupsCompleted}/{stats.totalGroups}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Classificados
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {qualifiedAthletes.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progresso Geral */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Progresso da Fase de Grupos
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {stats.progress.toFixed(1)}%
              </span>
            </div>
            <Progress value={stats.progress} className="h-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {stats.completedMatches} de {stats.totalMatches} partidas
              disputadas
            </p>
          </CardContent>
        </Card>

        {/* Tabs para Classificação e Resultados */}
        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standings">Classificação</TabsTrigger>
            <TabsTrigger value="matches">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="standings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {currentChampionship.groups.map((group) => (
                <div key={group.id}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadGroupReport(group.id)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Relatório
                    </Button>
                  </div>
                  <GroupStandingsTable group={group} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            {/* Seletor de Grupo */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Selecionar Grupo</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedGroup === "" ? "default" : "outline"}
                    onClick={() => setSelectedGroup("")}
                  >
                    Todos os Grupos
                  </Button>
                  {currentChampionship.groups.map((group) => (
                    <Button
                      key={group.id}
                      variant={
                        selectedGroup === group.id ? "default" : "outline"
                      }
                      onClick={() => setSelectedGroup(group.id)}
                    >
                      {group.name}
                      {group.isCompleted && (
                        <Trophy className="h-4 w-4 ml-2 text-yellow-500" />
                      )}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Partidas - CORRIGIDA */}
            <div className="space-y-6">
              {filteredGroups.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum grupo encontrado</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredGroups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{group.name}</span>
                        <Badge
                          variant={group.isCompleted ? "secondary" : "outline"}
                          className={
                            group.isCompleted
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }
                        >
                          {group.matches.filter((m) => m.isCompleted).length}/
                          {group.matches.length} partidas
                        </Badge>
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      {group.matches.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <p>Nenhuma partida neste grupo</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.matches.map((match) => (
                            <MatchCard
                              key={match.id}
                              match={match}
                              onUpdateResult={updateMatchResult}
                              onSetWalkover={setWalkover}
                              bestOf={currentChampionship.groupsBestOf}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Classificados para Mata-mata */}
        {qualifiedAthletes.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Classificados para a Fase Eliminatória
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {qualifiedAthletes.map((athlete, index) => (
                  <Card key={athlete.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-blue-800 dark:text-blue-400">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">{athlete.name}</div>
                      </div>
                      {athlete.isSeeded && (
                        <Badge variant="outline" className="ml-auto">
                          #{athlete.seedNumber}
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {allGroupsCompleted &&
                currentChampionship.status === "groups" && (
                  <div className="mt-6 text-center">
                    <Button
                      onClick={handleAdvanceToKnockout}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ChevronRight className="h-5 w-5 mr-2" />
                      Gerar Chave Eliminatória
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
