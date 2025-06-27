import React, { useState } from "react";
import { useChampionshipStore } from "../../store/championship";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Users, Plus, X, Check } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";
import { Athlete } from "../../types";

interface ManualGroupsFormProps {
  athletes: Athlete[];
  manualGroups: { name: string; athleteIds: string[] }[];
  setManualGroups: React.Dispatch<
    React.SetStateAction<{ name: string; athleteIds: string[] }[]>
  >;
  formErrors: string[];
  onCreateGroups: () => void;
  onCancel: () => void;
  onAddToGroup: (athleteId: string, groupIndex: number) => void;
  onRemoveFromGroup: (athleteId: string, groupIndex: number) => void;
  onDistributeRemaining?: () => void;
}

export const ManualGroupsForm: React.FC<ManualGroupsFormProps> = ({
  athletes,
  manualGroups,
  setManualGroups,
  formErrors,
  onCreateGroups,
  onCancel,
  onAddToGroup,
  onRemoveFromGroup,
  onDistributeRemaining,
}) => {
  const { currentChampionship } = useChampionshipStore();
  const [isCreating, setIsCreating] = useState(false);

  if (!currentChampionship) return null;

  const availableAthletes = athletes.filter(
    (athlete) =>
      !manualGroups.some((group) => group.athleteIds.includes(athlete.id))
  );

  const addGroup = () => {
    const newGroupLetter = String.fromCharCode(65 + manualGroups.length); // A, B, C, etc.
    setManualGroups([
      ...manualGroups,
      { name: `Grupo ${newGroupLetter}`, athleteIds: [] },
    ]);
  };

  const removeGroup = (index: number) => {
    if (manualGroups.length > 1) {
      setManualGroups(manualGroups.filter((_, i) => i !== index));
    }
  };

  const updateGroupName = (index: number, name: string) => {
    setManualGroups(
      manualGroups.map((group, i) => (i === index ? { ...group, name } : group))
    );
  };

  const addAthleteToGroup = (groupIndex: number, athleteId: string) => {
    onAddToGroup(athleteId, groupIndex);
  };

  const removeAthleteFromGroup = (groupIndex: number, athleteId: string) => {
    onRemoveFromGroup(athleteId, groupIndex);
  };

  const canCreate =
    manualGroups.every((group) => group.athleteIds.length >= 2) &&
    availableAthletes.length === 0;

  const canDistributeRemaining =
    availableAthletes.length > 0 &&
    availableAthletes.length < 3 &&
    manualGroups.some((group) => group.athleteIds.length >= 3) &&
    onDistributeRemaining;

  const handleCreateGroups = async () => {
    if (!canCreate) return;

    setIsCreating(true);
    try {
      await onCreateGroups();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Criação Manual de Grupos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Distribua os {athletes.length} atletas em grupos de pelo menos 2
              pessoas. Atletas restantes podem ser sorteados automaticamente.
            </p>
            <Button onClick={addGroup} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Grupo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {manualGroups.map((group, groupIndex) => (
              <Card key={groupIndex} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={group.name}
                      onChange={(e) =>
                        updateGroupName(groupIndex, e.target.value)
                      }
                      className="font-medium"
                    />
                    {manualGroups.length > 1 && (
                      <Button
                        onClick={() => removeGroup(groupIndex)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.athleteIds.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500">
                        Atletas no grupo ({group.athleteIds.length})
                      </Label>
                      <div className="space-y-1">
                        {group.athleteIds.map((athleteId) => {
                          const athlete = athletes.find(
                            (a) => a.id === athleteId
                          );
                          return (
                            <div
                              key={athleteId}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded"
                            >
                              <span className="text-sm">{athlete?.name}</span>
                              <Button
                                onClick={() =>
                                  removeAthleteFromGroup(groupIndex, athleteId)
                                }
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {availableAthletes.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-500">
                        Adicionar atleta
                      </Label>
                      <Select
                        onValueChange={(athleteId) =>
                          addAthleteToGroup(groupIndex, athleteId)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar atleta..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAthletes.map((athlete) => (
                            <SelectItem key={athlete.id} value={athlete.id}>
                              {athlete.name}
                              {athlete.isSeeded && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  #{athlete.seedNumber}
                                </Badge>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Mínimo: 2 atletas | Atual: {group.athleteIds.length}
                    {group.athleteIds.length >= 2 && (
                      <Check className="inline h-3 w-3 ml-1 text-green-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {availableAthletes.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    Atletas não distribuídos ({availableAthletes.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableAthletes.map((athlete) => (
                    <Badge
                      key={athlete.id}
                      variant="outline"
                      className="text-yellow-700"
                    >
                      {athlete.name}
                      {athlete.isSeeded && ` (#${athlete.seedNumber})`}
                    </Badge>
                  ))}
                </div>

                {canDistributeRemaining && (
                  <div className="flex items-center gap-2 mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Sortear atletas restantes
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Como restam menos de 3 atletas, eles podem ser
                        distribuídos aleatoriamente nos grupos existentes
                      </p>
                    </div>
                    <Button
                      onClick={onDistributeRemaining}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      🎲 Sortear
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {canCreate ? (
                <span className="text-green-600 font-medium">
                  ✓ Todos os atletas foram distribuídos nos grupos
                </span>
              ) : (
                <span>
                  Distribua todos os atletas em grupos de pelo menos 2 pessoas
                  ou use o sorteio automático
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateGroups}
                disabled={!canCreate || isCreating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreating ? "Criando..." : "Criar Grupos"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
