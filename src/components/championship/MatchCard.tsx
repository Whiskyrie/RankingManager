import React, { useState, useMemo } from "react";
import { Match, SetResult, MatchResult, isValidSet } from "../../types";
import {
  formatMatchScore,
  formatSetScore,
  formatDateTime,
  getMatchWinner,
} from "../../utils";
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
  Clock,
  Timer,
  AlertCircle,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  PlayCircle,
  PauseCircle,
  Medal,
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
  // APLICANDO A LÓGICA DE DETECÇÃO DE 3º LUGAR
  const isThirdPlace = match.isThirdPlace === true;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sets, setSets] = useState<SetResult[]>(
    match.sets.length > 0 ? [...match.sets] : []
  );
  const [timeoutsUsed, setTimeoutsUsed] = useState(match.timeoutsUsed);
  const [isWalkover, setIsWalkover] = useState(match.isWalkover || false);
  const [walkoverWinner, setWalkoverWinner] = useState<string>(
    match.walkoverWinnerId || ""
  );

  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  const maxSets = bestOf;

  const matchStats = useMemo(() => {
    if (isWalkover) {
      return {
        player1Sets: walkoverWinner === match.player1Id ? setsToWin : 0,
        player2Sets: walkoverWinner === match.player2Id ? setsToWin : 0,
        isFinished: true,
        winner: walkoverWinner,
        progress: 100,
      };
    }

    const validSets = sets.filter(isValidSet);
    let player1Sets = 0;
    let player2Sets = 0;
    validSets.forEach((s) => {
      if (s.player1Score > s.player2Score) player1Sets++;
      else if (s.player2Score > s.player1Score) player2Sets++;
    });
    const isFinished = player1Sets >= setsToWin || player2Sets >= setsToWin;
    const winner = getMatchWinner(
      sets,
      bestOf,
      match.player1Id,
      match.player2Id
    );
    const totalSetsPlayed = player1Sets + player2Sets;
    const progress = isFinished
      ? 100
      : Math.min((totalSetsPlayed / setsToWin) * 60, 95);

    return {
      player1Sets,
      player2Sets,
      isFinished,
      winner,
      progress,
      totalValidSets: validSets.length,
      setsNeeded: setsToWin,
    };
  }, [
    sets,
    isWalkover,
    walkoverWinner,
    bestOf,
    match.player1Id,
    match.player2Id,
    setsToWin,
  ]);

  const addSet = () => {
    if (sets.length < maxSets && !matchStats.isFinished) {
      setSets([...sets, { player1Score: 0, player2Score: 0 }]);
    }
  };

  const updateSet = (
    index: number,
    field: keyof Omit<SetResult, "winnerId">,
    value: number
  ) => {
    const updated = [...sets];
    updated[index] = {
      ...updated[index],
      [field]: Math.max(0, Math.min(99, value)),
    };
    setSets(updated);
  };

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index));
    }
  };

  const canSaveMatch = (): boolean => {
    if (isWalkover) return !!walkoverWinner;
    return (
      !!getMatchWinner(sets, bestOf, match.player1Id, match.player2Id) &&
      sets.some(isValidSet)
    );
  };

  const handleSave = () => {
    if (isWalkover && walkoverWinner) {
      onSetWalkover(match.id, walkoverWinner);
    } else if (canSaveMatch()) {
      const validSets = sets.filter(isValidSet);
      const winner = getMatchWinner(
        validSets,
        bestOf,
        match.player1Id,
        match.player2Id
      ) as string;

      console.log("Saving match result:", {
        matchId: match.id,
        sets: validSets,
        winner,
        timeoutsUsed,
        isThirdPlace,
      });

      onUpdateResult({ matchId: match.id, sets: validSets, timeoutsUsed });
    }
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setSets([...match.sets]);
    setTimeoutsUsed(match.timeoutsUsed);
    setIsWalkover(match.isWalkover || false);
    setWalkoverWinner(match.walkoverWinnerId || "");
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

  const getThirdPlaceBadge = () => {
    if (!isThirdPlace) return null;

    return (
      <Badge
        variant="outline"
        className="bg-yellow-100 text-yellow-800 border-yellow-300"
      >
        <Medal className="h-3 w-3 mr-1" />
        Disputa 3º Lugar
      </Badge>
    );
  };

  const getSetValidationMessage = (set: SetResult): string | null => {
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

  const getSetImpactAnalysis = (setIndex: number): string | null => {
    if (setIndex >= sets.length) return null;

    const setsWithoutCurrent = sets.filter((_, i) => i !== setIndex);
    const currentWinner = getMatchWinner(
      sets,
      bestOf,
      match.player1Id,
      match.player2Id
    );
    const winnerWithoutSet = getMatchWinner(
      setsWithoutCurrent,
      bestOf,
      match.player1Id,
      match.player2Id
    );

    if (currentWinner && !winnerWithoutSet) {
      return "Set decisivo para definir o vencedor";
    } else if (currentWinner !== winnerWithoutSet) {
      return "Set que alterou o resultado final";
    }

    return null;
  };

  const getMatchDuration = (): number | null => {
    const start = match.createdAt;
    if (!start) return null;
    const end = match.completedAt || new Date();
    return Math.floor((end.getTime() - start.getTime()) / 60000);
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
        isThirdPlace
          ? "border-l-yellow-500 bg-yellow-50/30"
          : "border-l-transparent hover:border-l-blue-500"
      }`}
    >
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

            <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
              {getThirdPlaceBadge()}

              {match.phase === "groups" && match.groupId && (
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Fase de Grupos
                </span>
              )}
              {match.phase === "knockout" && match.round && !isThirdPlace && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {match.round}
                </span>
              )}

              {match.createdAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDateTime(match.createdAt)}
                </span>
              )}

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

        {(match.isCompleted || sets.length > 0) && (
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">
                Progresso da partida (Melhor de {bestOf})
                {isThirdPlace && (
                  <span className="text-yellow-600 font-medium ml-1">
                    - Disputa 3º Lugar
                  </span>
                )}
              </span>
              <span className="text-xs text-gray-500">
                {matchStats.player1Sets}-{matchStats.player2Sets} sets
              </span>
            </div>
            <Progress
              value={matchStats.progress}
              className={`h-2 ${isThirdPlace ? "bg-yellow-100" : ""}`}
            />
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
              <div
                className={`text-center py-4 rounded-lg border ${
                  isThirdPlace
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-orange-50 border-orange-200"
                }`}
              >
                <XCircle
                  className={`h-8 w-8 mx-auto mb-2 ${
                    isThirdPlace ? "text-yellow-600" : "text-orange-600"
                  }`}
                />
                <p
                  className={`text-sm font-medium ${
                    isThirdPlace ? "text-yellow-800" : "text-orange-800"
                  }`}
                >
                  {isThirdPlace && "Disputa 3º Lugar - "}
                  Walkover - Vencedor:{" "}
                  {match.walkoverWinnerId === match.player1Id
                    ? match.player1?.name
                    : match.player2?.name}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  {isThirdPlace ? (
                    <>
                      <Medal className="h-3 w-3 text-yellow-600" />
                      Resultado da Disputa de 3º Lugar:
                    </>
                  ) : (
                    <>
                      <Trophy className="h-3 w-3" />
                      Resultado dos sets:
                    </>
                  )}
                </div>
                {match.sets.map((set, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center text-sm px-3 py-2 rounded-md border ${
                      isThirdPlace
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">Set {index + 1}:</span>
                    <span className="font-mono text-lg">
                      {formatSetScore(set)}
                    </span>
                  </div>
                ))}

                <div
                  className={`p-3 rounded-lg border mt-3 ${
                    isThirdPlace
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-blue-50 border-blue-200"
                  }`}
                >
                  <div className="flex justify-between items-center text-sm">
                    <span
                      className={
                        isThirdPlace ? "text-yellow-700" : "text-blue-700"
                      }
                    >
                      Total de Sets:
                    </span>
                    <span
                      className={`font-bold ${
                        isThirdPlace ? "text-yellow-900" : "text-blue-900"
                      }`}
                    >
                      {matchStats.player1Sets}-{matchStats.player2Sets}
                    </span>
                  </div>
                  {matchStats.winner && (
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span
                        className={
                          isThirdPlace ? "text-yellow-700" : "text-blue-700"
                        }
                      >
                        {isThirdPlace ? "3º Colocado:" : "Vencedor:"}
                      </span>
                      <span
                        className={`font-bold ${
                          isThirdPlace ? "text-yellow-700" : "text-green-700"
                        }`}
                      >
                        {matchStats.winner === match.player1Id
                          ? match.player1?.name
                          : match.player2?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
            <p className="text-sm">
              {isThirdPlace
                ? "Disputa de 3º lugar aguardando resultado"
                : "Partida aguardando resultado"}
            </p>
            {match.createdAt && (
              <p className="text-xs text-gray-400 mt-1">
                Criada em {formatDateTime(match.createdAt)}
              </p>
            )}
          </div>
        )}

        {isEditable && match.player1 && match.player2 && (
          <div className="mt-4 pt-3 border-t">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant={match.isCompleted ? "outline" : "default"}
                  size="sm"
                  className={`w-full ${
                    isThirdPlace ? "border-yellow-300 hover:bg-yellow-50" : ""
                  }`}
                  onClick={resetForm}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {match.isCompleted
                    ? isThirdPlace
                      ? "Editar Resultado (3º Lugar)"
                      : "Editar Resultado"
                    : isThirdPlace
                    ? "Lançar Resultado (3º Lugar)"
                    : "Lançar Resultado"}
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {isThirdPlace ? (
                      <Medal className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <Trophy className="h-5 w-5" />
                    )}
                    {match.player1.name} vs {match.player2.name}
                    <Badge variant="outline" className="ml-2">
                      Melhor de {bestOf}
                    </Badge>
                    {isThirdPlace && (
                      <Badge
                        variant="outline"
                        className="bg-yellow-100 text-yellow-800 border-yellow-300"
                      >
                        Disputa 3º Lugar
                      </Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {!isWalkover && sets.length > 0 && (
                    <div
                      className={`p-4 rounded-lg border ${
                        isThirdPlace
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4
                          className={`font-medium ${
                            isThirdPlace ? "text-yellow-900" : "text-blue-900"
                          }`}
                        >
                          {isThirdPlace
                            ? "Status da Disputa de 3º Lugar"
                            : "Status da Partida"}
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
                          <div
                            className={`font-medium ${
                              isThirdPlace ? "text-yellow-700" : "text-blue-700"
                            }`}
                          >
                            {match.player1.name}
                          </div>
                          <div
                            className={`text-2xl font-bold ${
                              isThirdPlace ? "text-yellow-900" : "text-blue-900"
                            }`}
                          >
                            {matchStats.player1Sets}
                          </div>
                          <div
                            className={`text-xs ${
                              isThirdPlace ? "text-yellow-600" : "text-blue-600"
                            }`}
                          >
                            sets ganhos
                          </div>
                        </div>

                        <div
                          className={`text-center border-x px-4 ${
                            isThirdPlace
                              ? "border-yellow-200"
                              : "border-blue-200"
                          }`}
                        >
                          <div
                            className={`font-medium ${
                              isThirdPlace ? "text-yellow-700" : "text-blue-700"
                            }`}
                          >
                            Para vencer
                          </div>
                          <div
                            className={`text-2xl font-bold ${
                              isThirdPlace ? "text-yellow-900" : "text-blue-900"
                            }`}
                          >
                            {setsToWin}
                          </div>
                          <div
                            className={`text-xs ${
                              isThirdPlace ? "text-yellow-600" : "text-blue-600"
                            }`}
                          >
                            sets necessários
                          </div>
                        </div>

                        <div className="text-center">
                          <div
                            className={`font-medium ${
                              isThirdPlace ? "text-yellow-700" : "text-blue-700"
                            }`}
                          >
                            {match.player2.name}
                          </div>
                          <div
                            className={`text-2xl font-bold ${
                              isThirdPlace ? "text-yellow-900" : "text-blue-900"
                            }`}
                          >
                            {matchStats.player2Sets}
                          </div>
                          <div
                            className={`text-xs ${
                              isThirdPlace ? "text-yellow-600" : "text-blue-600"
                            }`}
                          >
                            sets ganhos
                          </div>
                        </div>
                      </div>

                      <Progress value={matchStats.progress} className="mt-3" />

                      <div className="mt-3 text-center">
                        {(() => {
                          const winner = getMatchWinner(
                            sets,
                            bestOf,
                            match.player1Id,
                            match.player2Id
                          );
                          const validSets = sets.filter(isValidSet);

                          if (winner) {
                            return (
                              <div
                                className={`text-sm font-medium ${
                                  isThirdPlace
                                    ? "text-yellow-700"
                                    : "text-green-700"
                                }`}
                              >
                                {isThirdPlace ? "🥉" : "🏆"}{" "}
                                {winner === match.player1Id
                                  ? match.player1.name
                                  : match.player2.name}{" "}
                                {isThirdPlace
                                  ? "conquistou o 3º lugar!"
                                  : "venceu!"}
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
                              <div
                                className={`text-sm ${
                                  isThirdPlace
                                    ? "text-yellow-700"
                                    : "text-blue-700"
                                }`}
                              >
                                Faltam {setsRemaining} set(s) para definir{" "}
                                {isThirdPlace ? "o 3º colocado" : "o vencedor"}
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

                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Switch
                      id="walkover"
                      checked={isWalkover}
                      onCheckedChange={setIsWalkover}
                    />
                    <Label htmlFor="walkover" className="font-medium">
                      {isThirdPlace
                        ? "Disputa por Walkover (W.O.)"
                        : "Partida por Walkover (W.O.)"}
                    </Label>
                  </div>

                  {isWalkover ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">
                          {isThirdPlace
                            ? "3º Colocado por Walkover:"
                            : "Vencedor por Walkover:"}
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
                            {isThirdPlace ? (
                              <Medal className="h-4 w-4 mr-2" />
                            ) : (
                              <Trophy className="h-4 w-4 mr-2" />
                            )}
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
                            {isThirdPlace ? (
                              <Medal className="h-4 w-4 mr-2" />
                            ) : (
                              <Trophy className="h-4 w-4 mr-2" />
                            )}
                            {match.player2.name}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <Label className="text-base font-medium">
                            Sets da {isThirdPlace ? "Disputa" : "Partida"}{" "}
                            (Melhor de {bestOf})
                          </Label>
                          <p className="text-sm text-gray-500 mt-1">
                            Primeiro a ganhar {setsToWin} sets{" "}
                            {isThirdPlace
                              ? "conquista o 3º lugar"
                              : "vence a partida"}
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
                          const impactAnalysis = getSetImpactAnalysis(index);

                          return (
                            <div key={index} className="space-y-2">
                              <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                                <Label className="w-16 font-medium text-gray-700">
                                  Set {index + 1}:
                                </Label>

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

                              {validationMessage && (
                                <div className="flex items-center gap-2 text-xs text-red-600 ml-20">
                                  <AlertCircle className="h-3 w-3" />
                                  {validationMessage}
                                </div>
                              )}

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
                              checked={timeoutsUsed?.player1 || false}
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
                              checked={timeoutsUsed?.player2 || false}
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
                          const winner = getMatchWinner(
                            sets,
                            bestOf,
                            match.player1Id,
                            match.player2Id
                          );

                          if (winner) {
                            return (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {isThirdPlace
                                  ? "Salvar 3º Lugar"
                                  : "Salvar Resultado Final"}
                              </>
                            );
                          } else {
                            return "Salvar Resultado";
                          }
                        })()}
                      </Button>
                    </div>
                  </div>

                  {!isWalkover && sets.length > 0 && (
                    <div
                      className={`mt-4 p-3 rounded-lg border-t ${
                        isThirdPlace ? "bg-yellow-50" : "bg-gray-50"
                      }`}
                    >
                      <div className="text-xs text-gray-600">
                        💡{" "}
                        <strong>
                          Resumo {isThirdPlace ? "da disputa" : "da partida"}:
                        </strong>
                        {(() => {
                          const winner = getMatchWinner(
                            sets,
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
                            return ` ${winnerName} ${
                              isThirdPlace ? "conquistou o 3º lugar" : "venceu"
                            } em ${
                              validSets.length
                            } sets (melhor de ${bestOf}).`;
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
                              return ` ${
                                isThirdPlace ? "Disputa" : "Partida"
                              } empatada (${matchStats.player1Sets}-${
                                matchStats.player2Sets
                              }). Próximo set é decisivo.`;
                            } else {
                              return ` ${leader} está liderando ${Math.max(
                                matchStats.player1Sets,
                                matchStats.player2Sets
                              )}-${Math.min(
                                matchStats.player1Sets,
                                matchStats.player2Sets
                              )}. Faltam ${setsRemaining} set(s) para ${
                                isThirdPlace
                                  ? "conquistar o 3º lugar"
                                  : "vencer"
                              }.`;
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
