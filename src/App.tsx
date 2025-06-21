import React, { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { GroupsManagement } from "./pages/GroupsManagement";
import { KnockoutBracket } from "./pages/KnockoutBracket";
import { AthletesManagement } from "./pages/AthletesManagement";
import { useChampionshipStore } from "./store/championship";
import { Card, CardContent } from "./components/ui/card";
import { Settings, Trophy } from "lucide-react";
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

// Página de configurações simples
const SettingsPage: React.FC = () => {
  const { currentChampionship } = useChampionshipStore();

  if (!currentChampionship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum campeonato selecionado
            </h2>
            <p className="text-gray-500">
              Selecione um campeonato para acessar as configurações
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Configurações do Campeonato
          </h1>
          <p className="text-gray-600 mt-1">{currentChampionship.name}</p>
        </div>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Informações do Campeonato
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                    {currentChampionship.name}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Evento
                  </label>
                  <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                    {new Date(currentChampionship.date).toLocaleDateString(
                      "pt-BR"
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamanho dos Grupos
                  </label>
                  <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                    {currentChampionship.groupSize} atletas por grupo
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Classificados por Grupo
                  </label>
                  <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                    {currentChampionship.qualificationSpotsPerGroup} atletas
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Formato das Partidas
                  </label>
                  <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                    Grupos: Melhor de {currentChampionship.groupsBestOf} sets |
                    Mata-mata: Melhor de {currentChampionship.knockoutBestOf}{" "}
                    sets
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="text-sm text-gray-900 p-2 bg-gray-50 rounded">
                    {currentChampionship.status === "created" && "Criado"}
                    {currentChampionship.status === "groups" &&
                      "Fase de Grupos"}
                    {currentChampionship.status === "knockout" && "Mata-mata"}
                    {currentChampionship.status === "completed" && "Finalizado"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Estatísticas</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {currentChampionship.totalAthletes}
                  </div>
                  <div className="text-sm text-gray-500">Total de Atletas</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {currentChampionship.groups.length}
                  </div>
                  <div className="text-sm text-gray-500">Grupos</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentChampionship.totalMatches}
                  </div>
                  <div className="text-sm text-gray-500">Total de Partidas</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {currentChampionship.completedMatches}
                  </div>
                  <div className="text-sm text-gray-500">
                    Partidas Concluídas
                  </div>
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
