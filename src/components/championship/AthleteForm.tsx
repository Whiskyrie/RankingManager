import React from "react";
import { Athlete } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";

interface AthleteFormProps {
  formData: Partial<Athlete>;
  setFormData: (data: Partial<Athlete>) => void;
  formErrors: string[];
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  showSeedingOptions?: boolean;
}

export const AthleteForm: React.FC<AthleteFormProps> = ({
  formData,
  setFormData,
  formErrors,
  onSubmit,
  onCancel,
  submitLabel,
  showSeedingOptions = false,
}) => {
  return (
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
        <Label htmlFor="name">Nome Completo</Label>
        <Input
          id="name"
          value={formData.name || ""}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Nome do atleta"
        />
      </div>

      {showSeedingOptions && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isSeeded"
              checked={formData.isSeeded || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isSeeded: e.target.checked,
                  seedNumber: e.target.checked
                    ? formData.seedNumber
                    : undefined,
                })
              }
              className="rounded"
            />
            <Label htmlFor="isSeeded">É cabeça de chave</Label>
          </div>

          {formData.isSeeded && (
            <div>
              <Label htmlFor="seedNumber">Número da cabeça de chave</Label>
              <Input
                id="seedNumber"
                type="number"
                min="1"
                max="32"
                value={formData.seedNumber || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seedNumber: parseInt(e.target.value) || undefined,
                  })
                }
                placeholder="1, 2, 3..."
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={onSubmit} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};
