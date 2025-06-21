import React, { useState, useMemo } from "react";
import { Match, Set, MatchResult, isValidSet } from "../../types";
import {
  formatMatchScore,
  formatSetScore,
  formatDateTime,
  getMatchWinner,
} from "../../utils"; // UTILIZANDO getMatchWinner dos utils
import { Card, CardContent, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
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
import {
  Edit,
  Clock, // AGORA UTILIZADO
  Timer,
  AlertCircle,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
} from "lucide-react";

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
  const [timeoutsUsed, setTimeoutsUsed] = useState(
    match.timeoutsUsed || {
      player1: false,
      player2: false,
    }
  );
  const [isWalkover, setIsWalkover] = useState(match.isWalkover || false);
  const [walkoverWinner, setWalkoverWinner] = useState(
    match.walkoverWinner || ""
  );

  // UTILIZAÇÃO DA VARIÁVEL setsToWin - AGORA USADA EXPLICITAMENTE
  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  const maxSets = bestOf;

  // Cálculos avançados para exibição (usando setsToWin)
  const matchStats = useMemo(() => {
    if (isWalkover) {
      return {
        player1Sets: walkoverWinner === match.player1Id ? setsToWin : 0,
        player2Sets: walkoverWinner === match.player2Id ? setsToWin : 0,
        isFinished: true,
        winner: walkoverWinner,
        progress: 100,
        nextSetNumber: 1,
        canFinish: true,
      };
    }

    const validSets = sets.filter(isValidSet);
    let player1Sets = 0;
    let player2Sets = 0;

    validSets.forEach((set) => {
      if (set.player1Score > set.player2Score) player1Sets++;
      else if (set.player2Score > set.player1Score) player2Sets++;
    });

    const isFinished = player1Sets >= setsToWin || player2Sets >= setsToWin;

    // UTILIZANDO getMatchWinner dos utils para determinar vencedor
    const winner = getMatchWinner(
      sets.map((set) => ({
        ...set,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
      })),
      bestOf,
      match.player1Id,
      match.player2Id
    );

    // Calcular progresso baseado em sets ganhos vs necessários
    const totalSetsPlayed = player1Sets + player2Sets;
    const minSetsForMatch = setsToWin; // Mínimo para ganhar
    const progress = isFinished
      ? 100
      : Math.min((totalSetsPlayed / minSetsForMatch) * 60, 95);

    return {
      player1Sets,
      player2Sets,
      isFinished,
      winner,
      progress,
      nextSetNumber: validSets.length + 1,
      canFinish: !!winner && validSets.length > 0,
      totalValidSets: validSets.length,
      setsNeeded: setsToWin, // UTILIZANDO A VARIÁVEL
    };
  }, [
    sets,
    isWalkover,
    walkoverWinner,
    setsToWin,
    match.player1Id,
    match.player2Id,
    bestOf,
  ]);

  // Função para adicionar set automaticamente se necessário
  const addSet = () => {
    if (sets.length < maxSets && !matchStats.isFinished) {
      setSets([...sets, { player1Score: 0, player2Score: 0 }]);
    }
  };

  const updateSet = (
    index: number,
    field: "player1Score" | "player2Score",
    value: number
  ) => {
    const newSets = [...sets];
    newSets[index] = {
      ...newSets[index],
      [field]: Math.max(0, Math.min(99, value)),
    };
    setSets(newSets);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  // UTILIZANDO getMatchWinner dos utils para validação de salvamento
  const canSaveMatch = (): boolean => {
    if (isWalkover) return !!walkoverWinner;

    // Usar a função dos utils para determinar se a partida pode ser salva
    const winner = getMatchWinner(
      sets.map((set) => ({
        ...set,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
      })),
      bestOf,
      match.player1Id,
      match.player2Id
    );

    const validSets = sets.filter(isValidSet);
    return !!winner && validSets.length > 0;
  };

  const handleSave = () => {
    if (isWalkover && walkoverWinner) {
      onSetWalkover(match.id, walkoverWinner);
      setIsDialogOpen(false);
    } else if (canSaveMatch()) {
      // UTILIZANDO getMatchWinner dos utils para logging e validação
      const winner = getMatchWinner(
        sets.map((set) => ({
          ...set,
          player1Id: match.player1Id,
          player2Id: match.player2Id,
        })),
        bestOf,
        match.player1Id,
        match.player2Id
      );

      console.log("Saving match result:", {
        matchId: match.id,
        sets,
        validSets: sets.filter(isValidSet),
        winner,
        timeoutsUsed,
      });

      const result: MatchResult = {
        matchId: match.id,
        sets: sets.filter(isValidSet),
        timeoutsUsed,
      };
      onUpdateResult(result);
      setIsDialogOpen(false);
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
            <XCircle className="h-3 w-3 mr-1" />
            W.O.
          </Badge>
        );
      }
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Finalizada
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-blue-600">
        <PlayCircle className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  const getSetValidationMessage = (set: Set): string | null => {
    if (set.player1Score === 0 && set.player2Score === 0) {
      return null;
    }

    if (!isValidSet(set)) {
      const { player1Score, player2Score } = set;
      const maxScore = Math.max(player1Score, player2Score);
      const scoreDiff = Math.abs(player1Score - player2Score);

      if (maxScore < 11) {
        return "Mínimo 11 pontos para vencer";
      }
      if (scoreDiff < 2) {
        return "Diferença mínima de 2 pontos";
      }
      if (player1Score >= 10 && player2Score >= 10 && scoreDiff !== 2) {
        return "Em empate 10-10+, diferença deve ser exatamente 2";
      }
      return "Set inválido";
    }
    return null;
  };

  // UTILIZANDO getMatchWinner para análise de impacto de cada set
  const getSetImpactAnalysis = (setIndex: number): string | null => {
    if (setIndex >= sets.length) return null;

    // Simular partida sem este set para ver o impacto
    const setsWithoutCurrent = sets.filter((_, i) => i !== setIndex);
    const currentWinner = getMatchWinner(
      sets.map((set) => ({
        ...set,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
      })),
      bestOf,
      match.player1Id,
      match.player2Id
    );

    const winnerWithoutSet = getMatchWinner(
      setsWithoutCurrent.map((set) => ({
        ...set,
        player1Id: match.player1Id,
        player2Id: match.player2Id,
      })),
      bestOf,
      match.player1Id,
      match.player2Id
    );

    // Se remover este set muda o vencedor, é um set decisivo
    if (currentWinner && !winnerWithoutSet) {
      return "Set decisivo para definir o vencedor";
    } else if (currentWinner !== winnerWithoutSet) {
      return "Set que alterou o resultado final";
    }

    return null;
  };

  // UTILIZANDO Clock para mostrar tempos e durações
  const getMatchDuration = () => {
    if (!match.createdAt) return null;

    const startTime = new Date(match.createdAt);
    const endTime = match.completedAt
      ? new Date(match.completedAt)
      : new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));

    return durationMinutes;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
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

            {/* Informações da partida com Clock */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {match.phase === "groups" && match.groupId && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Fase de Grupos
                </span>
              )}
              {match.phase === "knockout" && match.round && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {match.round}
                </span>
              )}

              {/* UTILIZANDO Clock para mostrar tempo */}
              {match.createdAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(match.createdAt)}
                </span>
              )}

              {/* Duração da partida */}
              {getMatchDuration() !== null && getMatchDuration()! > 0 && (
                <span className="flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  {getMatchDuration()}min
                </span>
              )}
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

        {/* Progress bar usando setsToWin */}
        {(match.isCompleted || sets.length > 0) && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">
                Progresso da partida (Melhor de {bestOf})
              </span>
              <span className="text-xs text-gray-500">
                {matchStats.player1Sets}-{matchStats.player2Sets} sets
              </span>
            </div>
            <Progress value={matchStats.progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Sets para vencer: {setsToWin}</span>
              <span>{Math.round(matchStats.progress)}%</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {match.isCompleted ? (
          <div className="space-y-3">
            {match.isWalkover ? (
              <div className="text-center py-4 bg-orange-50 rounded-lg border border-orange-200">
                <XCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-orange-800 font-medium">
                  Walkover - Vencedor:{" "}
                  {match.walkoverWinner === match.player1Id
                    ? match.player1?.name
                    : match.player2?.name}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Resultado dos sets:
                </div>
                {match.sets.map((set, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm bg-gray-50 px-3 py-2 rounded-md border"
                  >
                    <span className="font-medium">Set {index + 1}:</span>
                    <span className="font-mono text-lg">
                      {formatSetScore(set)}
                    </span>
                  </div>
                ))}

                {/* Estatísticas finais */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-blue-700">Total de Sets:</span>
                    <span className="font-bold text-blue-900">
                      {matchStats.player1Sets}-{matchStats.player2Sets}
                    </span>
                  </div>
                  {matchStats.winner && (
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-blue-700">Vencedor:</span>
                      <span className="font-bold text-green-700">
                        {matchStats.winner === match.player1Id
                          ? match.player1?.name
                          : match.player2?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeouts e tempo de partida */}
            <div className="space-y-2 pt-2 border-t">
              {(match.timeoutsUsed?.player1 || match.timeoutsUsed?.player2) && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Timer className="h-3 w-3" />
                  <span>Timeouts utilizados:</span>
                  <div className="flex gap-2">
                    {match.timeoutsUsed?.player1 && (
                      <Badge variant="outline" className="text-xs py-0">
                        {match.player1?.name}
                      </Badge>
                    )}
                    {match.timeoutsUsed?.player2 && (
                      <Badge variant="outline" className="text-xs py-0">
                        {match.player2?.name}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* UTILIZANDO Clock para tempo de conclusão */}
              {match.completedAt && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  <span>
                    Finalizada em: {formatDateTime(match.completedAt)}
                  </span>
                  {getMatchDuration() && (
                    <span className="text-gray-400">
                      (Duração: {getMatchDuration()}min)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <PauseCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">Partida aguardando resultado</p>
            {match.createdAt && (
              <p className="text-xs text-gray-400 mt-1">
                Criada em {formatDateTime(match.createdAt)}
              </p>
            )}
          </div>
        )}

        {/* Botão de edição melhorado */}
        {isEditable && match.player1 && match.player2 && (
          <div className="mt-4 pt-3 border-t">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant={match.isCompleted ? "outline" : "default"}
                  size="sm"
                  className="w-full"
                  onClick={resetForm}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {match.isCompleted ? "Editar Resultado" : "Lançar Resultado"}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    {match.player1.name} vs {match.player2.name}
                    <Badge variant="outline" className="ml-2">
                      Melhor de {bestOf}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Status atual da partida */}
                  {!isWalkover && sets.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-blue-900">
                          Status da Partida
                        </h4>
                        <Badge
                          variant={
                            matchStats.isFinished ? "default" : "secondary"
                          }
                        >
                          {matchStats.isFinished
                            ? "Finalizada"
                            : "Em andamento"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-blue-700 font-medium">
                            {match.player1.name}
                          </div>
                          <div className="text-2xl font-bold text-blue-900">
                            {matchStats.player1Sets}
                          </div>
                          <div className="text-xs text-blue-600">
                            sets ganhos
                          </div>
                        </div>

                        <div className="text-center border-x border-blue-200 px-4">
                          <div className="text-blue-700 font-medium">
                            Para vencer
                          </div>
                          <div className="text-2xl font-bold text-blue-900">
                            {setsToWin}
                          </div>
                          <div className="text-xs text-blue-600">
                            sets necessários
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-blue-700 font-medium">
                            {match.player2.name}
                          </div>
                          <div className="text-2xl font-bold text-blue-900">
                            {matchStats.player2Sets}
                          </div>
                          <div className="text-xs text-blue-600">
                            sets ganhos
                          </div>
                        </div>
                      </div>

                      <Progress value={matchStats.progress} className="mt-3" />

                      {/* UTILIZANDO getMatchWinner para validação em tempo real */}
                      <div className="mt-3 text-center">
                        {(() => {
                          const winner = getMatchWinner(
                            sets.map((set) => ({
                              ...set,
                              player1Id: match.player1Id,
                              player2Id: match.player2Id,
                            })),
                            bestOf,
                            match.player1Id,
                            match.player2Id
                          );

                          const validSets = sets.filter(isValidSet);

                          if (winner) {
                            return (
                              <div className="text-sm text-green-700 font-medium">
                                🏆{" "}
                                {winner === match.player1Id
                                  ? match.player1.name
                                  : match.player2.name}{" "}
                                venceu!
                              </div>
                            );
                          } else if (validSets.length > 0) {
                            const setsRemaining =
                              setsToWin -
                              Math.max(
                                matchStats.player1Sets,
                                matchStats.player2Sets
                              );
                            return (
                              <div className="text-sm text-blue-700">
                                Faltam {setsRemaining} set(s) para definir o
                                vencedor
                              </div>
                            );
                          } else {
                            return (
                              <div className="text-sm text-gray-600">
                                ⏳ Aguardando resultados dos sets
                              </div>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Toggle Walkover */}
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Switch
                      id="walkover"
                      checked={isWalkover}
                      onCheckedChange={setIsWalkover}
                    />
                    <Label htmlFor="walkover" className="font-medium">
                      Partida por Walkover (W.O.)
                    </Label>
                  </div>

                  {isWalkover ? (
                    /* Configuração de Walkover */
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          Vencedor por Walkover:
                        </Label>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <Button
                            type="button"
                            variant={
                              walkoverWinner === match.player1Id
                                ? "default"
                                : "outline"
                            }
                            onClick={() => setWalkoverWinner(match.player1Id)}
                            className="h-12"
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            {match.player1.name}
                          </Button>
                          <Button
                            type="button"
                            variant={
                              walkoverWinner === match.player2Id
                                ? "default"
                                : "outline"
                            }
                            onClick={() => setWalkoverWinner(match.player2Id)}
                            className="h-12"
                          >
                            <Trophy className="h-4 w-4 mr-2" />
                            {match.player2.name}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Configuração de Sets Melhorada */
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <Label className="text-base font-medium">
                            Sets da Partida (Melhor de {bestOf})
                          </Label>
                          <p className="text-sm text-gray-500 mt-1">
                            Primeiro a ganhar {setsToWin} sets vence a partida
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addSet}
                          disabled={
                            sets.length >= maxSets || matchStats.isFinished
                          }
                        >
                          + Adicionar Set {sets.length + 1}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {sets.map((set, index) => {
                          const validationMessage =
                            getSetValidationMessage(set);
                          const isSetValid = !validationMessage;
                          const impactAnalysis = getSetImpactAnalysis(index); // UTILIZANDO análise de impacto

                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                                <Label className="w-16 font-medium text-gray-700">
                                  Set {index + 1}:
                                </Label>

                                {/* Player 1 Score */}
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-500 block mb-1">
                                    {match.player1.name}
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
                                    className={`text-center text-lg font-bold ${
                                      !isSetValid && set.player1Score > 0
                                        ? "border-red-300"
                                        : ""
                                    }`}
                                  />
                                </div>

                                <div className="text-gray-400 text-xl font-bold">
                                  ×
                                </div>

                                {/* Player 2 Score */}
                                <div className="flex-1">
                                  <Label className="text-xs text-gray-500 block mb-1">
                                    {match.player2.name}
                                  </Label>
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
                                    className={`text-center text-lg font-bold ${
                                      !isSetValid && set.player2Score > 0
                                        ? "border-red-300"
                                        : ""
                                    }`}
                                  />
                                </div>

                                {/* Indicador de vencedor do set */}
                                {isSetValid &&
                                  (set.player1Score > 0 ||
                                    set.player2Score > 0) && (
                                    <div className="w-8 flex justify-center">
                                      {set.player1Score > set.player2Score ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : set.player2Score >
                                        set.player1Score ? (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <div className="w-5" />
                                      )}
                                    </div>
                                  )}

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSet(index)}
                                  disabled={sets.length <= 1}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Mensagem de validação */}
                              {validationMessage && (
                                <div className="flex items-center gap-2 text-xs text-red-600 ml-20">
                                  <AlertCircle className="h-3 w-3" />
                                  {validationMessage}
                                </div>
                              )}

                              {/* Análise de impacto usando getMatchWinner */}
                              {impactAnalysis && isSetValid && (
                                <div className="flex items-center gap-2 text-xs text-blue-600 ml-20">
                                  <Trophy className="h-3 w-3" />
                                  {impactAnalysis}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Timeouts */}
                      <Separator />

                      <div>
                        <Label className="text-base font-medium">
                          Timeouts Utilizados:
                        </Label>
                        <p className="text-sm text-gray-500 mb-3">
                          Cada jogador tem direito a 1 timeout por partida
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <Switch
                              id="timeout-p1"
                              checked={timeoutsUsed.player1}
                              onCheckedChange={(checked) =>
                                setTimeoutsUsed((prev) => ({
                                  ...prev,
                                  player1: checked,
                                }))
                              }
                            />
                            <Label
                              htmlFor="timeout-p1"
                              className="flex items-center gap-2"
                            >
                              <Timer className="h-4 w-4" />
                              {match.player1.name}
                            </Label>
                          </div>

                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <Switch
                              id="timeout-p2"
                              checked={timeoutsUsed.player2}
                              onCheckedChange={(checked) =>
                                setTimeoutsUsed((prev) => ({
                                  ...prev,
                                  player2: checked,
                                }))
                              }
                            />
                            <Label
                              htmlFor="timeout-p2"
                              className="flex items-center gap-2"
                            >
                              <Timer className="h-4 w-4" />
                              {match.player2.name}
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>

                    <div className="flex gap-2">
                      {!isWalkover && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setSets([{ player1Score: 0, player2Score: 0 }])
                          }
                        >
                          Limpar
                        </Button>
                      )}

                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={!canSaveMatch()}
                        className="min-w-[120px]"
                      >
                        {(() => {
                          // UTILIZANDO getMatchWinner para texto dinâmico do botão
                          const winner = getMatchWinner(
                            sets.map((set) => ({
                              ...set,
                              player1Id: match.player1Id,
                              player2Id: match.player2Id,
                            })),
                            bestOf,
                            match.player1Id,
                            match.player2Id
                          );

                          if (winner) {
                            return (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Salvar Resultado Final
                              </>
                            );
                          } else {
                            return "Salvar Resultado";
                          }
                        })()}
                      </Button>
                    </div>
                  </div>

                  {/* Resumo da estratégia usando getMatchWinner */}
                  {!isWalkover && sets.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border-t">
                      <div className="text-xs text-gray-600">
                        💡 <strong>Resumo da partida:</strong>
                        {(() => {
                          const winner = getMatchWinner(
                            sets.map((set) => ({
                              ...set,
                              player1Id: match.player1Id,
                              player2Id: match.player2Id,
                            })),
                            bestOf,
                            match.player1Id,
                            match.player2Id
                          );

                          const validSets = sets.filter(isValidSet);

                          if (winner) {
                            const winnerName =
                              winner === match.player1Id
                                ? match.player1.name
                                : match.player2.name;
                            return ` ${winnerName} venceu em ${validSets.length} sets (melhor de ${bestOf}).`;
                          } else if (validSets.length > 0) {
                            const setsRemaining =
                              setsToWin -
                              Math.max(
                                matchStats.player1Sets,
                                matchStats.player2Sets
                              );
                            const leader =
                              matchStats.player1Sets > matchStats.player2Sets
                                ? match.player1.name
                                : matchStats.player2Sets >
                                  matchStats.player1Sets
                                ? match.player2.name
                                : "Empate";

                            if (leader === "Empate") {
                              return ` Partida empatada (${matchStats.player1Sets}-${matchStats.player2Sets}). Próximo set é decisivo.`;
                            } else {
                              return ` ${leader} está liderando ${Math.max(
                                matchStats.player1Sets,
                                matchStats.player2Sets
                              )}-${Math.min(
                                matchStats.player1Sets,
                                matchStats.player2Sets
                              )}. Faltam ${setsRemaining} set(s) para vencer.`;
                            }
                          } else {
                            return " Insira os resultados dos sets para começar a análise.";
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
