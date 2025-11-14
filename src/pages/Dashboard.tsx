import React, { useState } from "react";
import { useChampionshipStore } from "../store/championship";
import { ChampionshipCard } from "../components/championship/ChampionshipCard";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Plus,
  Trophy,
  Users,
  BarChart3,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { TournamentConfig, Championship, Athlete } from "../types";

export const Dashboard: React.FC = () => {
  const {
    championships,
    createChampionship,
    loadChampionship,
    isLoading,
    error,
  } = useChampionshipStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [config, setConfig] = useState<TournamentConfig>({
    name: "",
    date: new Date(),
    groupSize: 4,
    qualificationSpotsPerGroup: 2,
    groupsBestOf: 3,
    knockoutBestOf: 5,
    hasThirdPlace: true,
    hasRepechage: true,
  });

  // Estatísticas gerais
  const totalChampionships = championships.length;
  const activeChampionships = championships.filter(
    (c) => c.status !== "completed"
  ).length;
  const completedChampionships = championships.filter(
    (c) => c.status === "completed"
  ).length;
  const totalAthletes = championships.reduce(
    (sum, c) => sum + c.totalAthletes,
    0
  );

  // Filtros
  const filteredChampionships = championships.filter((championship) => {
    const matchesSearch = championship.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || championship.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateChampionship = async () => {
    if (!config.name.trim()) return;

    // Iniciar com array vazio de atletas - serão adicionados manualmente
    const athletes: Athlete[] = [];

    await createChampionship(config, athletes);
    setIsCreateDialogOpen(false);

    // Reset form
    setConfig({
      name: "",
      date: new Date(),
      groupSize: 4,
      qualificationSpotsPerGroup: 2,
      groupsBestOf: 3,
      knockoutBestOf: 5,
      hasThirdPlace: true,
      hasRepechage: true,
    });
  };

  const handleSelectChampionship = (championship: Championship) => {
    loadChampionship(championship.id);
    // Navigate to championship management (seria implementado com React Router)
    console.log(
      "Navegando para gerenciamento do campeonato:",
      championship.name
    );
  };

  const handleViewChampionship = (championship: Championship) => {
    loadChampionship(championship.id);
    // Navigate to championship view (seria implementado com React Router)
    console.log("Visualizando campeonato:", championship.name);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-surface-elevated shadow-sm border-b border-default">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-primary">Ranking</h1>
              <p className="text-secondary mt-1">
                Gerenciamento completo de campeonatos de tênis de mesa
              </p>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Novo Campeonato
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Criar Novo Campeonato</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Campeonato</Label>
                    <Input
                      id="name"
                      value={config.name}
                      onChange={(e) =>
                        setConfig({ ...config, name: e.target.value })
                      }
                      placeholder="Ex: Campeonato do Clube 2025"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Data do Evento</Label>
                    <Input
                      id="date"
                      type="date"
                      value={
                        config.date instanceof Date
                          ? config.date.toISOString().split("T")[0]
                          : new Date(config.date).toISOString().split("T")[0]
                      }
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          date: new Date(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="groupSize">Tamanho do Grupo</Label>
                      <Select
                        value={config.groupSize.toString()}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            groupSize: parseInt(value) as 3 | 4 | 5,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 atletas</SelectItem>
                          <SelectItem value="4">4 atletas</SelectItem>
                          <SelectItem value="5">5 atletas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="qualification">Classificados/Grupo</Label>
                      <Select
                        value={config.qualificationSpotsPerGroup.toString()}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            qualificationSpotsPerGroup: parseInt(value),
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 atleta</SelectItem>
                          <SelectItem value="2">2 atletas</SelectItem>
                          <SelectItem value="3">3 atletas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="groupsBestOf">
                        Sets na Fase de Grupos
                      </Label>
                      <Select
                        value={config.groupsBestOf.toString()}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            groupsBestOf: parseInt(value) as 3 | 5,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">Melhor de 3</SelectItem>
                          <SelectItem value="5">Melhor de 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="knockoutBestOf">Sets no Mata-Mata</Label>
                      <Select
                        value={config.knockoutBestOf.toString()}
                        onValueChange={(value) =>
                          setConfig({
                            ...config,
                            knockoutBestOf: parseInt(value) as 3 | 5 | 7,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">Melhor de 3</SelectItem>
                          <SelectItem value="5">Melhor de 5</SelectItem>
                          <SelectItem value="7">Melhor de 7</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateChampionship}
                      disabled={!config.name.trim() || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? "Criando..." : "Criar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Total</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalChampionships}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Ativos</p>
                  <p className="text-2xl font-bold text-primary">
                    {activeChampionships}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">
                    Concluídos
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {completedChampionships}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-secondary">Atletas</p>
                  <p className="text-2xl font-bold text-primary">
                    {totalAthletes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar campeonatos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="created">Criado</SelectItem>
                    <SelectItem value="groups">Fase de Grupos</SelectItem>
                    <SelectItem value="knockout">Mata-mata</SelectItem>
                    <SelectItem value="completed">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Campeonatos */}
        {error && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-red-600 text-center">
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredChampionships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChampionships.map((championship) => (
              <ChampionshipCard
                key={championship.id}
                championship={championship}
                onSelect={handleSelectChampionship}
                onView={handleViewChampionship}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Trophy className="h-16 w-16 text-tertiary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-primary mb-2">
                  {championships.length === 0
                    ? "Nenhum campeonato criado"
                    : "Nenhum campeonato encontrado"}
                </h3>
                <p className="text-secondary mb-6">
                  {championships.length === 0
                    ? "Comece criando seu primeiro campeonato de tênis de mesa"
                    : "Tente ajustar os filtros de busca"}
                </p>
                {championships.length === 0 && (
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Campeonato
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
