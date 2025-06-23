import React, { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { GroupsManagement } from "./pages/GroupsManagement";
import { KnockoutBracket } from "./pages/KnockoutBracket";
import { AthletesManagement } from "./pages/AthletesManagement";
import { useChampionshipStore } from "./store/championship";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
  Settings,
  Trophy,
  Users,
  Calendar,
  Target,
  Award,
  Clock,
  CheckCircle,
} from "lucide-react";
import { calculateTournamentStats, formatDate, getStatusColor } from "./utils";
import "./App.css";

type PageType = "dashboard" | "groups" | "knockout" | "athletes" | "settings";

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard");
  const { currentChampionship } = useChampionshipStore();

  // Navegação baseada no estado do campeonato
  useEffect(() => {
    if (currentChampionship) {
      // Se um campeonato foi selecionado, navegar para a página apropriada
      if (currentChampionship.status === "groups") {
        setCurrentPage("groups");
      } else if (
        currentChampionship.status === "knockout" ||
        currentChampionship.status === "completed"
      ) {
        setCurrentPage("knockout");
      }
    }
  }, [currentChampionship]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "groups":
        return <GroupsManagement />;
      case "knockout":
        return <KnockoutBracket />;
      case "athletes":
        return <AthletesManagement />;
      case "settings":
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

// Página de configurações completa - CORRIGIDA
const SettingsPage: React.FC = () => {
  const { currentChampionship, updateChampionship, deleteChampionship } =
    useChampionshipStore();
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  if (!currentChampionship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="text-center">
              <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum campeonato selecionado
              </h3>
              <p className="text-gray-500">
                Selecione um campeonato para ver as configurações.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleResetChampionship = async () => {
    if (
      confirm(
        "Tem certeza que deseja reiniciar o campeonato? Todos os resultados serão perdidos."
      )
    ) {
      const resetChampionship = {
        ...currentChampionship,
        status: "created" as const,
        groups: currentChampionship.groups.map((group) => ({
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
    }
  };

  // ✅ NOVA FUNÇÃO: Confirmar e excluir campeonato
  const handleDeleteChampionship = async () => {
    if (!currentChampionship) return;

    try {
      await deleteChampionship(currentChampionship.id);
      console.log("✅ Campeonato excluído com sucesso");
      // A navegação será automática pelo useEffect no App.tsx
    } catch (error) {
      console.error("❌ Erro ao excluir campeonato:", error);
      alert("Erro ao excluir campeonato. Tente novamente.");
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

  const statusInfo = getStatusInfo(currentChampionship.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações do Campeonato
          </h1>
          <p className="text-gray-600">
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
                  <label className="text-sm font-medium text-gray-500">
                    Nome do Campeonato
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {currentChampionship.name}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge
                      className={getStatusColor(currentChampionship.status)}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {statusInfo.description}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Data do Campeonato
                  </label>
                  <p className="text-lg text-gray-900 mt-1 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(currentChampionship.date)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Total de Atletas
                  </label>
                  <p className="text-lg text-gray-900 mt-1 flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {currentChampionship.totalAthletes}
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
                  <label className="text-sm font-medium text-gray-500">
                    Tamanho do Grupo
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {currentChampionship.groupSize} atletas por grupo
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Classificados por Grupo
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {currentChampionship.qualificationSpotsPerGroup}{" "}
                    classificados
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Total de Grupos
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {currentChampionship.groups.length} grupos
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Grupos - Melhor de
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {currentChampionship.groupsBestOf} sets
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Mata-mata - Melhor de
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {currentChampionship.knockoutBestOf} sets
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Disputa de 3º Lugar
                  </label>
                  <p className="text-lg text-gray-900 mt-1 flex items-center gap-1">
                    {currentChampionship.hasThirdPlace ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    {currentChampionship.hasThirdPlace ? "Sim" : "Não"}
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
                  <label className="text-sm font-medium text-gray-500">
                    Total de Partidas
                  </label>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {currentChampionship.totalMatches}
                  </p>
                  {(() => {
                    const stats = calculateTournamentStats(currentChampionship);
                    return (
                      <div className="text-xs text-gray-500 mt-1">
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
                  <label className="text-sm font-medium text-gray-500">
                    Partidas Concluídas
                  </label>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {currentChampionship.completedMatches}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Partidas Pendentes
                  </label>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {currentChampionship.totalMatches -
                      currentChampionship.completedMatches}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Progresso
                  </label>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {currentChampionship.totalMatches > 0
                      ? Math.round(
                          (currentChampionship.completedMatches /
                            currentChampionship.totalMatches) *
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
                  <label className="text-sm font-medium text-gray-500">
                    Criado em
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {formatDate(currentChampionship.createdAt)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Última atualização
                  </label>
                  <p className="text-lg text-gray-900 mt-1">
                    {formatDate(currentChampionship.updatedAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações de Administração - ✅ ATUALIZADO */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Reiniciar Campeonato */}
                {currentChampionship.status !== "completed" && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      Reiniciar Campeonato
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
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

                {/* ✅ NOVO: Excluir Campeonato */}
                <div className="pt-4 border-t border-red-200">
                  <h4 className="text-sm font-medium text-red-900">
                    Excluir Campeonato Permanentemente
                  </h4>
                  <p className="text-sm text-red-600 mt-1">
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
                    <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800 font-medium mb-3">
                        ⚠️ Tem certeza absoluta que deseja excluir o campeonato
                        "{currentChampionship.name}"?
                      </p>
                      <p className="text-xs text-red-600 mb-4">
                        Esta ação não pode ser desfeita. Todos os atletas,
                        grupos, partidas e resultados serão perdidos.
                      </p>
                      <div className="flex gap-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteChampionship}
                          className="bg-red-700 hover:bg-red-800"
                        >
                          ✅ Sim, Excluir Definitivamente
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirmation(false)}
                          className="border-gray-300"
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

export default App;
