import React, { useState, useMemo, useCallback } from "react";
import {
  validateData,
  AthleteSchema,
  CreateAthleteSchema,
  UpdateAthleteSchema,
} from "../../schemas/validation";
import { useAthletes, useSearch } from "../../hooks/performance";
import { useLogger } from "../../lib/logger";
import { useErrorHandler } from "../../lib/error-handler";
import { AthleteForm } from "../championship/AthleteForm";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Athlete } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Users, Plus, Edit, Trash2, Search, Trophy } from "lucide-react";

interface OptimizedAthletesListProps {
  showActions?: boolean;
  maxHeight?: string;
}

export const OptimizedAthletesList: React.FC<OptimizedAthletesListProps> = ({
  showActions = true,
  maxHeight = "400px",
}) => {
  const { athletes, stats, addAthlete, updateAthlete, removeAthlete } =
    useAthletes();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [formData, setFormData] = useState<Partial<Athlete>>({ name: "" });
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const logger = useLogger("athletes");
  const { handleAsync } = useErrorHandler();

  // Função de busca otimizada
  const searchFunction = useCallback((athlete: Athlete, query: string) => {
    return (
      athlete.name.toLowerCase().includes(query) ||
      (athlete.isSeeded && athlete.seedNumber?.toString().includes(query))
    );
  }, []);

  const { query, setQuery, filteredItems } = useSearch(
    athletes,
    searchFunction,
    300
  );

  // Handlers otimizados com useCallback
  const handleAddAthlete = useCallback(async () => {
    await handleAsync(async () => {
      const athleteData = {
        name: formData.name || "",
        isSeeded: formData.isSeeded || false,
        seedNumber: formData.seedNumber,
        isVirtual: formData.isVirtual || false,
      };
      const validAthlete = validateData(CreateAthleteSchema, athleteData);
      await addAthlete(validAthlete as Omit<Athlete, "id">);
      setIsAddDialogOpen(false);
      setFormData({ name: "" });
      setFormErrors([]);
      logger.info("Athlete added via optimized list", {
        name: validAthlete.name,
      });
    });
  }, [formData, addAthlete, handleAsync, logger]);

  const handleEditAthlete = useCallback(async () => {
    if (!editingAthlete) return;

    await handleAsync(async () => {
      const athleteData = {
        id: editingAthlete.id,
        name: formData.name || editingAthlete.name,
        isSeeded:
          formData.isSeeded !== undefined
            ? formData.isSeeded
            : editingAthlete.isSeeded,
        seedNumber:
          formData.seedNumber !== undefined
            ? formData.seedNumber
            : editingAthlete.seedNumber,
        isVirtual:
          formData.isVirtual !== undefined
            ? formData.isVirtual
            : editingAthlete.isVirtual,
      };
      const validAthlete = validateData(AthleteSchema, athleteData);
      await updateAthlete(validAthlete as Athlete);
      setIsEditDialogOpen(false);
      setEditingAthlete(null);
      setFormData({ name: "" });
      setFormErrors([]);
      logger.info("Athlete updated via optimized list", {
        name: validAthlete.name,
      });
    });
  }, [editingAthlete, formData, updateAthlete, handleAsync, logger]);

  const handleRemoveAthlete = useCallback(
    async (athleteId: string) => {
      if (!confirm("Tem certeza que deseja remover este atleta?")) return;

      await handleAsync(async () => {
        await removeAthlete(athleteId);
        logger.info("Athlete removed via optimized list", { athleteId });
      });
    },
    [removeAthlete, handleAsync, logger]
  );

  const handleEdit = useCallback((athlete: Athlete) => {
    setEditingAthlete(athlete);
    setFormData({
      name: athlete.name,
      isSeeded: athlete.isSeeded,
      seedNumber: athlete.seedNumber,
    });
    setFormErrors([]);
    setIsEditDialogOpen(true);
  }, []);

  // Estatísticas memoizadas
  const statisticsDisplay = useMemo(
    () => (
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-700">Total</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.seeded}
          </div>
          <div className="text-sm text-yellow-700">Cabeças</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">
            {stats.unseeded}
          </div>
          <div className="text-sm text-gray-700">Demais</div>
        </div>
      </div>
    ),
    [stats]
  );

  // Lista otimizada de atletas
  const athletesList = useMemo(
    () => (
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight }}>
        {filteredItems.map((athlete) => (
          <div
            key={athlete.id}
            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div>
                <div className="font-medium">{athlete.name}</div>
                {athlete.isSeeded && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    Cabeça #{athlete.seedNumber}
                  </Badge>
                )}
              </div>
            </div>

            {showActions && (
              <div className="flex gap-2">
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
                  onClick={() => handleRemoveAthlete(athlete.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {query ? "Nenhum atleta encontrado" : "Nenhum atleta cadastrado"}
          </div>
        )}
      </div>
    ),
    [
      filteredItems,
      showActions,
      handleEdit,
      handleRemoveAthlete,
      maxHeight,
      query,
    ]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Atletas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Estatísticas */}
        {statisticsDisplay}

        {/* Busca e Ações */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar atletas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {showActions && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Atleta</DialogTitle>
                </DialogHeader>
                <AthleteForm
                  formData={formData}
                  setFormData={setFormData}
                  formErrors={formErrors}
                  onSubmit={handleAddAthlete}
                  onCancel={() => setIsAddDialogOpen(false)}
                  submitLabel="Adicionar"
                  showSeedingOptions={true}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Lista de Atletas */}
        {athletesList}

        {/* Dialog de Edição */}
        {showActions && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Atleta</DialogTitle>
              </DialogHeader>
              <AthleteForm
                formData={formData}
                setFormData={setFormData}
                formErrors={formErrors}
                onSubmit={handleEditAthlete}
                onCancel={() => setIsEditDialogOpen(false)}
                submitLabel="Salvar"
                showSeedingOptions={true}
              />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
