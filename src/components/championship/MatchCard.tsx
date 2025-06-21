import React, { useState } from "react";
import { Match, Set, MatchResult } from "../../types";
import { formatMatchScore, formatSetScore, formatDateTime } from "../../utils";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Edit, Clock, Timer } from "lucide-react";

interface MatchCardProps {
  match: Match;
  onUpdateResult: (result: MatchResult) => void;
  onSetWalkover: (matchId: string, winnerId: string) => void;
  bestOf: 3 | 5 | 7;
  isEditable?: boolean;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onUpdateResult,
  onSetWalkover,
  bestOf,
  isEditable = true,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sets, setSets] = useState<Set[]>(
    match.sets.length > 0 ? [...match.sets] : []
  );
  const [timeoutsUsed, setTimeoutsUsed] = useState(match.timeoutsUsed);
  const [isWalkover, setIsWalkover] = useState(match.isWalkover || false);
  const [walkoverWinner, setWalkoverWinner] = useState(
    match.walkoverWinner || ""
  );

  console.log("MatchCard render:", {
    matchId: match.id,
    phase: match.phase,
    round: match.round,
    isCompleted: match.isCompleted,
    setsCount: match.sets.length,
    bestOf,
    isEditable,
  });

  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  const maxSets = bestOf;

  const addSet = () => {
    if (sets.length < maxSets) {
      setSets([...sets, { player1Score: 0, player2Score: 0 }]);
    }
  };

  const updateSet = (
    index: number,
    field: "player1Score" | "player2Score",
    value: number
  ) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: value };
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
  };

  const isValidSet = (set: Set): boolean => {
    const { player1Score, player2Score } = set;

    // Verificar se ambos os scores são números válidos
    if (isNaN(player1Score) || isNaN(player2Score)) return false;
    if (player1Score < 0 || player2Score < 0) return false;

    // Se ambos os scores são 0, considerar inválido
    if (player1Score === 0 && player2Score === 0) return false;

    // Mínimo de 11 pontos para vencer
    if (Math.max(player1Score, player2Score) < 11) return false;

    // Diferença mínima de 2 pontos
    if (Math.abs(player1Score - player2Score) < 2) return false;

    // Se empatado em 10-10, pode ir além de 11 mas precisa diferença de 2
    if (player1Score >= 10 && player2Score >= 10) {
      return Math.abs(player1Score - player2Score) >= 2;
    }

    // Um dos jogadores deve ter pelo menos 11 e diferença de pelo menos 2
    return (
      (player1Score >= 11 && player1Score - player2Score >= 2) ||
      (player2Score >= 11 && player2Score - player1Score >= 2)
    );
  };

  const getMatchWinner = (): string | undefined => {
    if (isWalkover) return walkoverWinner;

    let player1Sets = 0;
    let player2Sets = 0;

    // Filtrar apenas sets válidos antes de contar
    const validSets = sets.filter(isValidSet);

    validSets.forEach((set) => {
      if (set.player1Score > set.player2Score) player1Sets++;
      else if (set.player2Score > set.player1Score) player2Sets++;
    });

    if (player1Sets >= setsToWin) return match.player1Id;
    if (player2Sets >= setsToWin) return match.player2Id;
    return undefined;
  };

  const canSaveMatch = (): boolean => {
    if (isWalkover) return !!walkoverWinner;

    const winner = getMatchWinner();
    const validSets = sets.filter(isValidSet);

    // Precisa ter um vencedor e pelo menos um set válido
    return !!winner && validSets.length > 0;
  };

  const handleSave = () => {
    if (isWalkover && walkoverWinner) {
      onSetWalkover(match.id, walkoverWinner);
      setIsDialogOpen(false);
    } else if (canSaveMatch()) {
      console.log("Saving match result:", {
        matchId: match.id,
        sets,
        validSets: sets.filter(isValidSet),
        winner: getMatchWinner(),
        timeoutsUsed,
      });

      const result: MatchResult = {
        matchId: match.id,
        sets: sets.filter(isValidSet), // Enviar apenas sets válidos
        timeoutsUsed,
      };
      onUpdateResult(result);
      setIsDialogOpen(false);
    } else {
      console.log("Cannot save match - validation failed:", {
        canSave: canSaveMatch(),
        winner: getMatchWinner(),
        validSets: sets.filter(isValidSet),
        allSets: sets,
      });
    }
  };

  const resetForm = () => {
    setSets(match.sets.length > 0 ? [...match.sets] : []);
    setTimeoutsUsed(match.timeoutsUsed || { player1: false, player2: false });
    setIsWalkover(match.isWalkover || false);
    setWalkoverWinner(match.walkoverWinner || "");
  };

  const getStatusBadge = () => {
    if (match.isCompleted) {
      if (match.isWalkover) {
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            W.O.
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Finalizada
        </Badge>
      );
    }
    return <Badge variant="outline">Pendente</Badge>;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-sm font-medium text-gray-900">
                {match.player1?.name || "TBD"}
              </div>
              <div className="text-xs text-gray-500">vs</div>
              <div className="text-sm font-medium text-gray-900">
                {match.player2?.name || "TBD"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            {match.isCompleted && (
              <div className="text-lg font-bold text-gray-900">
                {formatMatchScore(match)}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {match.isCompleted ? (
          <div className="space-y-2">
            {match.isWalkover ? (
              <div className="text-center py-2">
                <div className="text-sm text-orange-600 font-medium">
                  Walkover -{" "}
                  {match.walkoverWinner === match.player1Id
                    ? match.player1?.name
                    : match.player2?.name}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {match.sets.map((set, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span>Set {index + 1}:</span>
                    <span className="font-mono">{formatSetScore(set)}</span>
                  </div>
                ))}
              </div>
            )}

            {(match.timeoutsUsed.player1 || match.timeoutsUsed.player2) && (
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                <Timer className="h-3 w-3" />
                <span>
                  Tempos pedidos:
                  {match.timeoutsUsed.player1 && ` ${match.player1?.name}`}
                  {match.timeoutsUsed.player1 &&
                    match.timeoutsUsed.player2 &&
                    ","}
                  {match.timeoutsUsed.player2 && ` ${match.player2?.name}`}
                </span>
              </div>
            )}

            {match.completedAt && (
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-1">
                <Clock className="h-3 w-3" />
                <span>{formatDateTime(match.completedAt)}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Partida não disputada</p>
          </div>
        )}

        {isEditable && (
          <div className="mt-4 pt-3 border-t">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {match.isCompleted ? "Editar Resultado" : "Lançar Resultado"}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {match.isCompleted ? "Editar" : "Lançar"} Resultado
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="font-medium">{match.player1?.name}</div>
                    <div className="text-xs text-gray-400">vs</div>
                    <div className="font-medium mt-1">
                      {match.player2?.name}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="walkover"
                      checked={isWalkover}
                      onCheckedChange={setIsWalkover}
                    />
                    <Label htmlFor="walkover">Walkover (W.O.)</Label>
                  </div>

                  {isWalkover ? (
                    <div className="space-y-2">
                      <Label>Vencedor por W.O.:</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={
                            walkoverWinner === match.player1Id
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="flex-1"
                          onClick={() => setWalkoverWinner(match.player1Id)}
                        >
                          {match.player1?.name}
                        </Button>
                        <Button
                          variant={
                            walkoverWinner === match.player2Id
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className="flex-1"
                          onClick={() => setWalkoverWinner(match.player2Id)}
                        >
                          {match.player2?.name}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label>Sets (melhor de {bestOf})</Label>
                          {sets.length < maxSets && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addSet}
                            >
                              + Set
                            </Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {sets.map((set, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Label className="w-12 text-xs">
                                Set {index + 1}:
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                max="99"
                                value={set.player1Score}
                                onChange={(e) =>
                                  updateSet(
                                    index,
                                    "player1Score",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 text-center"
                                placeholder="0"
                              />
                              <span className="text-gray-400">x</span>
                              <Input
                                type="number"
                                min="0"
                                max="99"
                                value={set.player2Score}
                                onChange={(e) =>
                                  updateSet(
                                    index,
                                    "player2Score",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 text-center"
                                placeholder="0"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSet(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                ×
                              </Button>
                              {!isValidSet(set) &&
                                (set.player1Score > 0 ||
                                  set.player2Score > 0) && (
                                  <span className="text-xs text-red-500">
                                    Inválido
                                  </span>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="mb-2 block">Pedidos de Tempo</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="timeout1"
                              checked={timeoutsUsed.player1}
                              onCheckedChange={(checked) =>
                                setTimeoutsUsed((prev) => ({
                                  ...prev,
                                  player1: checked,
                                }))
                              }
                            />
                            <Label htmlFor="timeout1" className="text-sm">
                              {match.player1?.name}
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="timeout2"
                              checked={timeoutsUsed.player2}
                              onCheckedChange={(checked) =>
                                setTimeoutsUsed((prev) => ({
                                  ...prev,
                                  player2: checked,
                                }))
                              }
                            />
                            <Label htmlFor="timeout2" className="text-sm">
                              {match.player2?.name}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!canSaveMatch()}
                      className="flex-1"
                    >
                      {canSaveMatch() ? "Salvar" : "Dados Inválidos"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
