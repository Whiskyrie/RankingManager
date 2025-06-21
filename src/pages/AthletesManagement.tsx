import React, { useState } from "react";
import { useChampionshipStore } from "../store/championship";
import { AthleteForm } from "../components/championship/AthleteForm";
import { ManualGroupsForm } from "../components/championship/ManualGroupsForm";
import { Athlete } from "../types";
import { validateAthlete } from "../utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Plus, Search, Edit, Trash2, Users, Trophy } from "lucide-react";

export const AthletesManagement: React.FC = () => {
  const {
    currentChampionship,
    addAthlete,
    updateAthlete,
    removeAthlete,
    generateGroups,
    createManualGroups,
    generateKnockoutBracket,
  } = useChampionshipStore();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkAddDialogOpen, setIsBulkAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isManualGroupsDialogOpen, setIsManualGroupsDialogOpen] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(
    new Set()
  );
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [formData, setFormData] = useState<Partial<Athlete>>({
    name: "",
  });
  const [bulkAthletes, setBulkAthletes] = useState<string>("");
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [manualGroups, setManualGroups] = useState<
    { name: string; athleteIds: string[] }[]
  >([]);

  if (!currentChampionship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum campeonato selecionado
            </h2>
            <p className="text-gray-500">
              Selecione um campeonato para gerenciar atletas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const athletes = currentChampionship.athletes;
  const canGenerateGroups = athletes.length >= 6; // Mínimo para formar grupos

  // Filtros simples
  const filteredAthletes = athletes.filter((athlete) => {
    const matchesSearch = athlete.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const seededAthletes = athletes.filter((a) => a.isSeeded).length;
  const unseededAthletes = athletes.length - seededAthletes;

  const handleSubmitAdd = async () => {
    const errors = validateAthlete(formData);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    await addAthlete(formData as Omit<Athlete, "id">);
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleBulkAdd = async () => {
    if (!bulkAthletes.trim()) return;

    const lines = bulkAthletes.split("\n").filter((line) => line.trim());
    const errors: string[] = [];

    for (const line of lines) {
      const name = line.trim();
      if (!name) continue;

      const athleteData = { name };
      const validationErrors = validateAthlete(athleteData);

      if (validationErrors.length === 0) {
        await addAthlete(athleteData);
      } else {
        errors.push(`Erro em ${name}: ${validationErrors.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      setFormErrors(errors);
    } else {
      setIsBulkAddDialogOpen(false);
      setBulkAthletes("");
      setFormErrors([]);
    }
  };

  const handleToggleSelectAthlete = (athleteId: string) => {
    const newSelected = new Set(selectedAthletes);
    if (newSelected.has(athleteId)) {
      newSelected.delete(athleteId);
    } else {
      newSelected.add(athleteId);
    }
    setSelectedAthletes(newSelected);
  };

  const handleSelectAllAthletes = () => {
    if (selectedAthletes.size === filteredAthletes.length) {
      setSelectedAthletes(new Set());
    } else {
      setSelectedAthletes(new Set(filteredAthletes.map((a) => a.id)));
    }
  };

  const handleBulkRemove = async () => {
    if (selectedAthletes.size === 0) return;

    if (
      confirm(
        `Tem certeza que deseja remover ${selectedAthletes.size} atleta(s) selecionado(s)?`
      )
    ) {
      for (const athleteId of selectedAthletes) {
        await removeAthlete(athleteId);
      }
      setSelectedAthletes(new Set());
    }
  };

  const handleClearAllAthletes = async () => {
    if (athletes.length === 0) return;

    if (
      confirm(
        `Tem certeza que deseja remover TODOS os ${athletes.length} atletas? Esta ação não pode ser desfeita.`
      )
    ) {
      for (const athlete of athletes) {
        await removeAthlete(athlete.id);
      }
      setSelectedAthletes(new Set());
    }
  };

  const handleSubmitEdit = async () => {
    if (!editingAthlete) return;

    const errors = validateAthlete(formData);
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    await updateAthlete({ ...editingAthlete, ...formData } as Athlete);
    setIsEditDialogOpen(false);
    setEditingAthlete(null);
    resetForm();
  };

  const handleEdit = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setFormData({
      name: athlete.name,
      isSeeded: athlete.isSeeded,
      seedNumber: athlete.seedNumber,
    });
    setFormErrors([]);
    setIsEditDialogOpen(true);
  };

  const handleRemove = async (athleteId: string) => {
    if (confirm("Tem certeza que deseja remover este atleta?")) {
      await removeAthlete(athleteId);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
    });
    setFormErrors([]);
  };

  const initializeManualGroups = () => {
    const numGroups = Math.ceil(
      athletes.length / currentChampionship.groupSize
    );
    const groups = Array.from({ length: numGroups }, (_, i) => ({
      name: `Grupo ${String.fromCharCode(65 + i)}`,
      athleteIds: [],
    }));
    setManualGroups(groups);
  };

  const handleAddAthleteToGroup = (athleteId: string, groupIndex: number) => {
    setManualGroups((prev) =>
      prev.map((group, index) => {
        if (index === groupIndex) {
          return { ...group, athleteIds: [...group.athleteIds, athleteId] };
        }
        return {
          ...group,
          athleteIds: group.athleteIds.filter((id) => id !== athleteId),
        };
      })
    );
  };

  const handleRemoveAthleteFromGroup = (
    athleteId: string,
    groupIndex: number
  ) => {
    setManualGroups((prev) =>
      prev.map((group, index) => {
        if (index === groupIndex) {
          return {
            ...group,
            athleteIds: group.athleteIds.filter((id) => id !== athleteId),
          };
        }
        return group;
      })
    );
  };

  const handleCreateManualGroups = async () => {
    // Verificar se todos os atletas foram distribuídos
    const allAssignedAthletes = manualGroups.flatMap((g) => g.athleteIds);
    const unassignedAthletes = athletes.filter(
      (a) => !allAssignedAthletes.includes(a.id)
    );

    if (unassignedAthletes.length > 0) {
      setFormErrors([
        `${unassignedAthletes.length} atleta(s) não foram distribuídos nos grupos`,
      ]);
      return;
    }

    // Verificar se grupos têm pelo menos 2 atletas
    const invalidGroups = manualGroups.filter((g) => g.athleteIds.length < 2);
    if (invalidGroups.length > 0) {
      setFormErrors(["Todos os grupos devem ter pelo menos 2 atletas"]);
      return;
    }

    if (
      confirm(
        "Tem certeza que deseja criar os grupos manualmente? Esta ação não pode ser desfeita."
      )
    ) {
      await createManualGroups(manualGroups);
      setIsManualGroupsDialogOpen(false);
      setManualGroups([]);
      setFormErrors([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gerenciar Atletas
            </h1>
          </div>

          <div className="flex gap-2">
            <Dialog
              open={isBulkAddDialogOpen}
              onOpenChange={setIsBulkAddDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Vários
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Adicionar Múltiplos Atletas</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {formErrors.length > 0 && (
                    <Alert>
                      <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                          {formErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <Label htmlFor="bulkAthletes">
                      Atletas (um nome por linha)
                    </Label>
                    <textarea
                      id="bulkAthletes"
                      value={bulkAthletes}
                      onChange={(e) => setBulkAthletes(e.target.value)}
                      placeholder="João Silva
Maria Santos
Carlos Oliveira
Ana Paula Costa
Pedro Henrique"
                      className="w-full h-52 p-3 border rounded-md resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsBulkAddDialogOpen(false);
                        setBulkAthletes("");
                        setFormErrors([]);
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleBulkAdd} className="flex-1">
                      Adicionar Atletas
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Atleta
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Atleta</DialogTitle>
                </DialogHeader>

                <AthleteForm
                  formData={formData}
                  setFormData={setFormData}
                  formErrors={formErrors}
                  onSubmit={handleSubmitAdd}
                  onCancel={() => setIsAddDialogOpen(false)}
                  submitLabel="Adicionar"
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {athletes.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Cabeças de Chave
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {seededAthletes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Demais</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {unseededAthletes}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Grupos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currentChampionship.groups.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Nome do atleta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Atletas */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Atletas ({filteredAthletes.length})</CardTitle>

              {selectedAthletes.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedAthletes.size} selecionado(s)
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkRemove}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Selecionados
                  </Button>
                  {athletes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllAthletes}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Todos
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedAthletes.size === filteredAthletes.length &&
                          filteredAthletes.length > 0
                        }
                        onChange={handleSelectAllAthletes}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left py-3 px-2">Nome</th>
                    <th className="text-center py-3 px-2">Cabeça de Chave</th>
                    <th className="text-center py-3 px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAthletes.map((athlete) => (
                    <tr key={athlete.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <input
                          type="checkbox"
                          checked={selectedAthletes.has(athlete.id)}
                          onChange={() => handleToggleSelectAthlete(athlete.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{athlete.name}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {athlete.isSeeded ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            #{athlete.seedNumber}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(athlete)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(athlete.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredAthletes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum atleta encontrado</p>
                  <p className="text-sm mt-2">
                    {athletes.length === 0
                      ? "Adicione atletas para começar a organizar seu campeonato"
                      : "Tente ajustar a busca"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        {athletes.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Ações do Campeonato
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">
                      Gerar Grupos Automaticamente
                    </h4>
                    <p className="text-sm text-gray-600">
                      {canGenerateGroups
                        ? `Pronto para gerar grupos com ${athletes.length} atletas`
                        : `Adicione pelo menos ${
                            6 - athletes.length
                          } atleta(s) para gerar grupos`}
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      if (
                        confirm(
                          "Tem certeza que deseja gerar os grupos automaticamente? Esta ação não pode ser desfeita."
                        )
                      ) {
                        await generateGroups();
                      }
                    }}
                    disabled={!canGenerateGroups}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Gerar Automaticamente
                  </Button>
                </div>

                {athletes.length >= 6 && (
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <h4 className="font-medium">Criar Grupos Manualmente</h4>
                      <p className="text-sm text-gray-600">
                        Distribua os atletas nos grupos manualmente para
                        controle total
                      </p>
                    </div>
                    <Dialog
                      open={isManualGroupsDialogOpen}
                      onOpenChange={setIsManualGroupsDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => {
                            initializeManualGroups();
                            setFormErrors([]);
                          }}
                          className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                        >
                          <Trophy className="h-4 w-4 mr-2" />
                          Criar Manualmente
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Criar Grupos Manualmente</DialogTitle>
                        </DialogHeader>

                        <ManualGroupsForm
                          athletes={athletes}
                          manualGroups={manualGroups}
                          setManualGroups={setManualGroups}
                          formErrors={formErrors}
                          onCreateGroups={handleCreateManualGroups}
                          onCancel={() => {
                            setIsManualGroupsDialogOpen(false);
                            setManualGroups([]);
                            setFormErrors([]);
                          }}
                          onAddToGroup={handleAddAthleteToGroup}
                          onRemoveFromGroup={handleRemoveAthleteFromGroup}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {athletes.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <strong>Configuração atual:</strong>
                      <br />• Tamanho do grupo: {
                        currentChampionship.groupSize
                      }{" "}
                      atletas
                      <br />• Classificados por grupo:{" "}
                      {currentChampionship.qualificationSpotsPerGroup}
                    </div>
                    <div>
                      <strong>Com {athletes.length} atletas:</strong>
                      <br />• Grupos estimados:{" "}
                      {Math.ceil(
                        athletes.length / currentChampionship.groupSize
                      )}
                      <br />• Classificados total:{" "}
                      {Math.ceil(
                        athletes.length / currentChampionship.groupSize
                      ) * currentChampionship.qualificationSpotsPerGroup}
                    </div>
                    <div>
                      <strong>Cabeças de chave:</strong>
                      <br />• Total: {athletes.filter((a) => a.isSeeded).length}
                      <br />• Sem cabeça:{" "}
                      {athletes.filter((a) => !a.isSeeded).length}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Edição */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Atleta</DialogTitle>
            </DialogHeader>

            <AthleteForm
              formData={formData}
              setFormData={setFormData}
              formErrors={formErrors}
              onSubmit={handleSubmitEdit}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingAthlete(null);
                resetForm();
              }}
              submitLabel="Salvar"
              showSeedingOptions={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
