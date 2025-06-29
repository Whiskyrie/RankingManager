import React, { useState, useMemo } from "react";
import { Match, SetResult, MatchResult, isValidSet } from "../../types";
import { formatMatchScore, formatSetScore, getMatchWinner } from "../../utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Edit,
  Timer,
  AlertCircle,
  Trophy,
  CheckCircle,
  XCircle,
  PlayCircle,
  Medal,
  Zap,
  BarChart3,
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
  const [activeTab, setActiveTab] = useState<"detailed" | "quick">("detailed");
  const [quickResult, setQuickResult] = useState({
    player1Sets: 0,
    player2Sets: 0,
  });

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
    };
  }, [
    sets,
    bestOf,
    match.player1Id,
    match.player2Id,
    setsToWin,
    isWalkover,
    walkoverWinner,
  ]);

  const getSetValidationMessage = (set: SetResult): string => {
    if (set.player1Score < 0 || set.player2Score < 0) {
      return "Pontuação não pode ser negativa";
    }
    if (set.player1Score === set.player2Score) {
      return "Set não pode terminar empatado";
    }
    const diff = Math.abs(set.player1Score - set.player2Score);
    const maxScore = Math.max(set.player1Score, set.player2Score);
    const minScore = Math.min(set.player1Score, set.player2Score);

    if (maxScore < 11) {
      return "Vencedor do set deve ter pelo menos 11 pontos";
    }
    if (maxScore >= 11 && minScore >= 10 && diff < 2) {
      return "Diferença mínima de 2 pontos após 10-10";
    }
    if (maxScore >= 11 && minScore < 10 && diff < 2) {
      return "Diferença mínima de 2 pontos para sets até 10";
    }
    return "";
  };

  const getSetImpactAnalysis = (setIndex: number): string => {
    if (!isValidSet(sets[setIndex])) return "";

    const currentPlayer1Sets = sets
      .slice(0, setIndex + 1)
      .filter((s) => s.player1Score > s.player2Score).length;
    const currentPlayer2Sets = sets
      .slice(0, setIndex + 1)
      .filter((s) => s.player2Score > s.player1Score).length;

    if (currentPlayer1Sets >= setsToWin) {
      return `${match.player1?.name} ${
        isThirdPlace ? "conquista o 3º lugar" : "vence a partida"
      }!`;
    }
    if (currentPlayer2Sets >= setsToWin) {
      return `${match.player2?.name} ${
        isThirdPlace ? "conquista o 3º lugar" : "vence a partida"
      }!`;
    }

    const p1SetsToWin = setsToWin - currentPlayer1Sets;
    const p2SetsToWin = setsToWin - currentPlayer2Sets;

    if (p1SetsToWin === 1 && p2SetsToWin === 1) {
      return "Set decisivo! Próximo set decide a partida.";
    }
    if (p1SetsToWin === 1) {
      return `${match.player1?.name} precisa de apenas 1 set para ${
        isThirdPlace ? "o 3º lugar" : "vencer"
      }`;
    }
    if (p2SetsToWin === 1) {
      return `${match.player2?.name} precisa de apenas 1 set para ${
        isThirdPlace ? "o 3º lugar" : "vencer"
      }`;
    }

    return "";
  };

  const addSet = () => {
    if (sets.length < maxSets) {
      setSets([...sets, { player1Score: 0, player2Score: 0 }]);
    }
  };

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index));
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

  // ✅ NOVA FUNCIONALIDADE: Entrada rápida de resultados apenas por sets
  const handleQuickSave = () => {
    if (quickResult.player1Sets === 0 && quickResult.player2Sets === 0) {
      alert("Por favor, insira o resultado dos sets");
      return;
    }

    if (quickResult.player1Sets < 0 || quickResult.player2Sets < 0) {
      alert("Valores de sets não podem ser negativos");
      return;
    }

    if (quickResult.player1Sets + quickResult.player2Sets > bestOf) {
      alert(`Total de sets não pode exceder ${bestOf} (melhor de ${bestOf})`);
      return;
    }

    // Verificar se há um vencedor válido
    const maxSetsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
    const winner =
      quickResult.player1Sets >= maxSetsToWin
        ? match.player1Id
        : quickResult.player2Sets >= maxSetsToWin
        ? match.player2Id
        : null;

    if (!winner) {
      alert(
        `Para vencer, um jogador deve ganhar pelo menos ${maxSetsToWin} sets`
      );
      return;
    }

    // Gerar sets fictícios para representar o resultado
    const generatedSets: SetResult[] = [];

    // Adicionar sets ganhos pelo player1
    for (let i = 0; i < quickResult.player1Sets; i++) {
      generatedSets.push({
        player1Score: 11,
        player2Score: 9,
      });
    }

    // Adicionar sets ganhos pelo player2
    for (let i = 0; i < quickResult.player2Sets; i++) {
      generatedSets.push({
        player1Score: 9,
        player2Score: 11,
      });
    }

    console.log("Saving quick match result:", {
      matchId: match.id,
      sets: generatedSets,
      winner,
      quickResult,
      isThirdPlace,
    });

    onUpdateResult({
      matchId: match.id,
      sets: generatedSets,
      timeoutsUsed,
    });
    setIsDialogOpen(false);
  };

  const isQuickResultValid = () => {
    const maxSetsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
    return (
      (quickResult.player1Sets >= maxSetsToWin &&
        quickResult.player2Sets < maxSetsToWin) ||
      (quickResult.player2Sets >= maxSetsToWin &&
        quickResult.player1Sets < maxSetsToWin)
    );
  };

  const resetForm = () => {
    setSets([...match.sets]);
    setTimeoutsUsed(match.timeoutsUsed);
    setIsWalkover(match.isWalkover || false);
    setWalkoverWinner(match.walkoverWinnerId || "");
    setQuickResult({ player1Sets: 0, player2Sets: 0 });
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
      <Badge variant="outline" className="bg-blue-100 text-blue-800">
        <PlayCircle className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-md ${
        isThirdPlace
          ? "border-yellow-300 bg-yellow-50/30"
          : match.isCompleted
          ? "border-green-300 bg-green-50/30"
          : "border-blue-300 bg-blue-50/30"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isThirdPlace ? (
              <Medal className="h-4 w-4 text-yellow-600" />
            ) : (
              <Trophy className="h-4 w-4 text-blue-600" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {match.round}
              {isThirdPlace && " - Disputa de 3º Lugar"}
            </span>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Players */}
        <div className="space-y-2">
          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${
              match.isCompleted && match.winnerId === match.player1Id
                ? "bg-green-100 border-green-300"
                : "bg-white border-gray-200"
            }`}
          >
            <span className="font-medium">{match.player1?.name || "TBD"}</span>
            {match.isCompleted && match.winnerId === match.player1Id && (
              <Trophy className="h-4 w-4 text-green-600" />
            )}
          </div>

          <div
            className={`flex items-center justify-between p-3 rounded-lg border ${
              match.isCompleted && match.winnerId === match.player2Id
                ? "bg-green-100 border-green-300"
                : "bg-white border-gray-200"
            }`}
          >
            <span className="font-medium">{match.player2?.name || "TBD"}</span>
            {match.isCompleted && match.winnerId === match.player2Id && (
              <Trophy className="h-4 w-4 text-green-600" />
            )}
          </div>
        </div>

        {/* Match Score */}
        {match.isCompleted && (
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold">{formatMatchScore(match)}</div>
            {match.sets && match.sets.length > 0 && (
              <div className="text-sm text-gray-600 mt-1">
                Sets: {match.sets.map(formatSetScore).join(", ")}
              </div>
            )}
          </div>
        )}

        {/* Progress */}
        {!match.isCompleted && match.sets && match.sets.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{Math.round(matchStats.progress)}%</span>
            </div>
            <Progress value={matchStats.progress} className="h-2" />
          </div>
        )}

        {/* Edit Button */}
        {isEditable && (
          <div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(true);
                  }}
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

                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "detailed" | "quick")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="detailed"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Detalhado
                    </TabsTrigger>
                    <TabsTrigger
                      value="quick"
                      className="flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Resultado Rápido
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="detailed" className="space-y-6">
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
                                isThirdPlace
                                  ? "text-yellow-700"
                                  : "text-blue-700"
                              }`}
                            >
                              {match.player1.name}
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                isThirdPlace
                                  ? "text-yellow-900"
                                  : "text-blue-900"
                              }`}
                            >
                              {matchStats.player1Sets}
                            </div>
                            <div
                              className={`text-xs ${
                                isThirdPlace
                                  ? "text-yellow-600"
                                  : "text-blue-600"
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
                                isThirdPlace
                                  ? "text-yellow-700"
                                  : "text-blue-700"
                              }`}
                            >
                              Para vencer
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                isThirdPlace
                                  ? "text-yellow-900"
                                  : "text-blue-900"
                              }`}
                            >
                              {setsToWin}
                            </div>
                            <div
                              className={`text-xs ${
                                isThirdPlace
                                  ? "text-yellow-600"
                                  : "text-blue-600"
                              }`}
                            >
                              sets necessários
                            </div>
                          </div>

                          <div className="text-center">
                            <div
                              className={`font-medium ${
                                isThirdPlace
                                  ? "text-yellow-700"
                                  : "text-blue-700"
                              }`}
                            >
                              {match.player2.name}
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                isThirdPlace
                                  ? "text-yellow-900"
                                  : "text-blue-900"
                              }`}
                            >
                              {matchStats.player2Sets}
                            </div>
                            <div
                              className={`text-xs ${
                                isThirdPlace
                                  ? "text-yellow-600"
                                  : "text-blue-600"
                              }`}
                            >
                              sets ganhos
                            </div>
                          </div>
                        </div>

                        <Progress
                          value={matchStats.progress}
                          className="mt-3"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <Switch
                          id="walkover"
                          checked={isWalkover}
                          onCheckedChange={setIsWalkover}
                        />
                        <Label
                          htmlFor="walkover"
                          className="text-base font-medium"
                        >
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
                                onClick={() =>
                                  setWalkoverWinner(match.player1Id)
                                }
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
                                onClick={() =>
                                  setWalkoverWinner(match.player2Id)
                                }
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
                              const impactAnalysis =
                                getSetImpactAnalysis(index);

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
                                          {set.player1Score >
                                          set.player2Score ? (
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
                    </div>
                  </TabsContent>

                  <TabsContent value="quick" className="space-y-6">
                    <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-blue-900">
                          Entrada Rápida de Resultado
                        </h4>
                      </div>
                      <p className="text-sm text-blue-700 mb-4">
                        Insira apenas o placar final dos sets (ex: 3 a 1 para
                        melhor de 5, ou 2 a 1 para melhor de 3)
                      </p>

                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-blue-700 block mb-2">
                            {match.player1.name}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max={setsToWin}
                            value={quickResult.player1Sets}
                            onChange={(e) =>
                              setQuickResult((prev) => ({
                                ...prev,
                                player1Sets: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="text-center text-2xl font-bold h-16"
                            placeholder="0"
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Sets ganhos
                          </p>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-700 mb-2">
                            ×
                          </div>
                          <div className="text-sm text-blue-600">
                            Melhor de {bestOf}
                          </div>
                          <div className="text-xs text-blue-500 mt-1">
                            {setsToWin} sets para vencer
                          </div>
                        </div>

                        <div className="text-center">
                          <Label className="text-sm font-medium text-blue-700 block mb-2">
                            {match.player2.name}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            max={setsToWin}
                            value={quickResult.player2Sets}
                            onChange={(e) =>
                              setQuickResult((prev) => ({
                                ...prev,
                                player2Sets: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="text-center text-2xl font-bold h-16"
                            placeholder="0"
                          />
                          <p className="text-xs text-blue-600 mt-1">
                            Sets ganhos
                          </p>
                        </div>
                      </div>

                      {/* Validação em tempo real */}
                      {(quickResult.player1Sets > 0 ||
                        quickResult.player2Sets > 0) && (
                        <div className="mt-4 p-3 rounded-lg bg-white border">
                          {isQuickResultValid() ? (
                            <div className="flex items-center gap-2 text-green-700">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">
                                Resultado válido!{" "}
                                {quickResult.player1Sets >= setsToWin
                                  ? match.player1.name
                                  : match.player2.name}{" "}
                                vence por{" "}
                                {Math.max(
                                  quickResult.player1Sets,
                                  quickResult.player2Sets
                                )}{" "}
                                sets a{" "}
                                {Math.min(
                                  quickResult.player1Sets,
                                  quickResult.player2Sets
                                )}
                                .
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-red-700">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">
                                {quickResult.player1Sets +
                                  quickResult.player2Sets >
                                bestOf
                                  ? `Total de sets não pode exceder ${bestOf}`
                                  : `Para vencer, um jogador deve ganhar pelo menos ${setsToWin} sets`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>

                    <div className="flex gap-2">
                      {activeTab === "detailed" && !isWalkover && (
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

                      {activeTab === "quick" && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            setQuickResult({ player1Sets: 0, player2Sets: 0 })
                          }
                        >
                          Limpar
                        </Button>
                      )}

                      {activeTab === "detailed" ? (
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
                              return (
                                <>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Salvar Progresso
                                </>
                              );
                            }
                          })()}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          onClick={handleQuickSave}
                          disabled={!isQuickResultValid()}
                          className="min-w-[120px]"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          {isThirdPlace
                            ? "Salvar 3º Lugar"
                            : "Salvar Resultado"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Tabs>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
