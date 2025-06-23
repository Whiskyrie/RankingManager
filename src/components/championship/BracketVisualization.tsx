import React, { useState, memo, useCallback, useMemo, useEffect } from "react";
import { useChampionshipStore } from "../../store/championship";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Trophy, Crown, Medal, Target, Award } from "lucide-react";
import { Match } from "../../types";

interface BracketVisualizationProps {
  onMatchClick?: (match: Match) => void;
}

// ✅ Componente de partida memoizado para máxima performance
const BracketMatch = memo<{
  match: Match;
  position?: "top" | "bottom" | "center";
  showConnector?: boolean;
  roundIndex?: number;
  onClick?: (match: Match) => void;
}>(({ match, showConnector = true, roundIndex = 0, onClick }) => {
  const isThirdPlace = match.isThirdPlace || match.round?.includes("3º Lugar");
  const isCompleted = match.isCompleted;
  const winner = isCompleted ? match.winnerId : null;

  const handleClick = useCallback(() => {
    onClick?.(match);
  }, [match, onClick]);

  // ✅ Memoizar estilos para evitar recálculo
  const cardStyles = useMemo(() => {
    if (isThirdPlace) return "border-yellow-400 bg-yellow-50";
    if (isCompleted) return "border-green-400 bg-green-50";
    return "border-orange-400 bg-orange-50";
  }, [isThirdPlace, isCompleted]);

  const getPlayerStyles = useCallback(
    (playerId: string) => {
      if (winner === playerId) {
        return "bg-green-100 border-green-300 font-semibold";
      }
      if (winner && winner !== playerId) {
        return "bg-gray-100 text-gray-600";
      }
      if (!match.player1?.name || !match.player2?.name) {
        return "bg-gray-50 text-gray-400";
      }
      return "bg-white border";
    },
    [winner, match.player1?.name, match.player2?.name]
  );

  const getSetScore = useMemo(() => {
    if (!isCompleted || !match.sets || match.sets.length === 0) return null;

    const player1Sets = match.sets.filter(
      (s) => s.player1Score > s.player2Score
    ).length;
    const player2Sets = match.sets.filter(
      (s) => s.player2Score > s.player1Score
    ).length;

    return `${player1Sets}-${player2Sets}`;
  }, [isCompleted, match.sets]);

  return (
    <div className="relative">
      <Card
        className={`w-52 cursor-pointer transition-all duration-200 hover:shadow-md ${cardStyles}`}
        onClick={handleClick}
      >
        <CardContent className="p-3">
          {/* Header da partida */}
          <div className="flex items-center justify-between mb-2">
            <Badge
              variant="outline"
              className={`text-xs ${
                isThirdPlace ? "bg-yellow-100 text-yellow-800" : ""
              }`}
            >
              {match.round?.replace(" 2ª Div", "")}
            </Badge>
            {isThirdPlace && <Medal className="h-3 w-3 text-yellow-600" />}
          </div>

          {/* Player 1 */}
          <div
            className={`flex items-center justify-between p-2 rounded mb-1 ${getPlayerStyles(
              match.player1Id
            )}`}
          >
            <span className="text-sm truncate flex-1">
              {match.player1?.name || "TBD"}
            </span>
            {winner === match.player1Id && (
              <Crown className="h-4 w-4 text-yellow-600 ml-1 flex-shrink-0" />
            )}
          </div>

          {/* Player 2 */}
          <div
            className={`flex items-center justify-between p-2 rounded ${getPlayerStyles(
              match.player2Id
            )}`}
          >
            <span className="text-sm truncate flex-1">
              {match.player2?.name || "TBD"}
            </span>
            {winner === match.player2Id && (
              <Crown className="h-4 w-4 text-yellow-600 ml-1 flex-shrink-0" />
            )}
          </div>

          {/* Status e placar */}
          <div className="mt-2 space-y-1">
            <div className="text-center">
              {isCompleted ? (
                <Badge
                  className={
                    match.isWalkover
                      ? "bg-orange-100 text-orange-800"
                      : "bg-green-100 text-green-800"
                  }
                >
                  {match.isWalkover ? "W.O." : "Finalizada"}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-blue-600">
                  Pendente
                </Badge>
              )}
            </div>

            {/* Placar dos sets */}
            {getSetScore && (
              <div className="text-center text-xs text-gray-600 font-medium">
                Sets: {getSetScore}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conector visual simplificado */}
      {showConnector && !isThirdPlace && (
        <div className="absolute top-1/2 -right-12 transform -translate-y-1/2">
          <div className="w-12 h-0.5 bg-gray-400"></div>
          {roundIndex < 2 && (
            <>
              <div className="absolute right-0 -top-8 w-0.5 h-8 bg-gray-400"></div>
              <div className="absolute right-0 bottom-0 w-0.5 h-8 bg-gray-400"></div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

// ✅ Componente de coluna de rodada memoizado
const RoundColumn = memo<{
  title: string;
  matches: Match[];
  showConnectors?: boolean;
  isLastRound?: boolean;
  roundIndex?: number;
  onMatchClick?: (match: Match) => void;
}>(
  ({
    title,
    matches,
    showConnectors = true,
    isLastRound = false,
    roundIndex = 0,
    onMatchClick,
  }) => {
    const getVerticalSpacing = useCallback((roundIdx: number) => {
      const baseSpacing = 8;
      return baseSpacing * Math.pow(2, roundIdx);
    }, []);

    const spacing = useMemo(
      () => getVerticalSpacing(roundIndex),
      [roundIndex, getVerticalSpacing]
    );

    if (matches.length === 0) return null;

    return (
      <div className="flex flex-col items-center min-w-[220px]">
        <h3
          className={`text-lg font-bold mb-6 text-center ${
            title.includes("2ª Div") ? "text-orange-600" : "text-blue-600"
          }`}
        >
          {title}
        </h3>
        <div className="flex flex-col" style={{ gap: `${spacing}px` }}>
          {matches.map((match) => (
            <BracketMatch
              key={match.id}
              match={match}
              showConnector={showConnectors && !isLastRound}
              roundIndex={roundIndex}
              onClick={onMatchClick}
            />
          ))}
        </div>
      </div>
    );
  }
);

// ✅ Componente de display do bracket memoizado
const BracketDisplay = memo<{
  bracket: any;
  isSecondDivision?: boolean;
  onMatchClick?: (match: Match) => void;
}>(({ bracket, isSecondDivision = false, onMatchClick }) => {
  const hasMatches = useMemo(
    () =>
      Object.values(bracket).some(
        (matches: any) => Array.isArray(matches) && matches.length > 0
      ),
    [bracket]
  );

  if (!hasMatches) {
    return (
      <div className="text-center py-12">
        <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isSecondDivision ? "Segunda Divisão" : "Primeira Divisão"} não
          disponível
        </h3>
        <p className="text-gray-500">
          {isSecondDivision
            ? "A segunda divisão será gerada após a conclusão da fase de grupos"
            : "Complete a fase de grupos para gerar o mata-mata"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto pb-6">
      <div className="flex items-start justify-start gap-16 min-w-max px-4">
        {/* Oitavas */}
        {bracket.oitavas?.length > 0 && (
          <RoundColumn
            title="Oitavas"
            matches={bracket.oitavas}
            showConnectors={true}
            roundIndex={0}
            onMatchClick={onMatchClick}
          />
        )}

        {/* Quartas */}
        {bracket.quartas?.length > 0 && (
          <RoundColumn
            title="Quartas"
            matches={bracket.quartas}
            showConnectors={true}
            roundIndex={1}
            onMatchClick={onMatchClick}
          />
        )}

        {/* Semifinal */}
        {bracket.semifinal?.length > 0 && (
          <RoundColumn
            title="Semifinal"
            matches={bracket.semifinal}
            showConnectors={true}
            roundIndex={2}
            onMatchClick={onMatchClick}
          />
        )}

        {/* Final e 3º Lugar */}
        <div className="flex flex-col items-center space-y-8 min-w-[240px]">
          {bracket.final?.length > 0 && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-bold mb-6 text-center text-yellow-600">
                Final
              </h3>
              {bracket.final.map((match: Match) => (
                <BracketMatch
                  key={match.id}
                  match={match}
                  showConnector={false}
                  roundIndex={3}
                  onClick={onMatchClick}
                />
              ))}
            </div>
          )}

          {bracket.terceiro?.length > 0 && (
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-bold mb-6 text-center text-amber-600">
                3º Lugar
              </h3>
              {bracket.terceiro.map((match: Match) => (
                <BracketMatch
                  key={match.id}
                  match={match}
                  showConnector={false}
                  roundIndex={3}
                  onClick={onMatchClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const BracketVisualization: React.FC<BracketVisualizationProps> = memo(
  ({ onMatchClick }) => {
    // ✅ CORREÇÃO: Desestruturação mais segura com fallbacks
    const store = useChampionshipStore();
    const { currentChampionship } = store;
    const getCachedBracket = store.getCachedBracket || (() => null);
    const setCachedBracket = store.setCachedBracket || (() => {});

    // ✅ CORREÇÃO: Estado persistente para a aba ativa
    const [activeTab, setActiveTab] = useState(() => {
      // Recuperar a aba ativa do localStorage se existir
      if (typeof window !== "undefined" && currentChampionship) {
        const savedTab = localStorage.getItem(
          `bracket-tab-${currentChampionship.id}`
        );
        return savedTab || "primeira";
      }
      return "primeira";
    });

    // ✅ Persistir mudanças de aba no localStorage
    const handleTabChange = useCallback(
      (value: string) => {
        setActiveTab(value);
        if (typeof window !== "undefined" && currentChampionship) {
          localStorage.setItem(`bracket-tab-${currentChampionship.id}`, value);
        }
      },
      [currentChampionship]
    );

    // ✅ CORREÇÃO: Limpar cache da aba quando mudar de campeonato
    useEffect(() => {
      if (currentChampionship) {
        const savedTab = localStorage.getItem(
          `bracket-tab-${currentChampionship.id}`
        );
        if (savedTab && savedTab !== activeTab) {
          setActiveTab(savedTab);
        }
      }
    }, [currentChampionship?.id]);

    // ✅ CORREÇÃO: Função auxiliar para gerar timestamp seguro
    const getSafeTimestamp = useCallback((date: any): string => {
      try {
        if (!date) return "no-date";

        // Se já é um número (timestamp)
        if (typeof date === "number") return date.toString();

        // Se é um objeto Date válido
        if (date instanceof Date && !isNaN(date.getTime())) {
          return date.getTime().toString();
        }

        // Se é uma string, tentar converter
        if (typeof date === "string") {
          const parsed = new Date(date);
          if (!isNaN(parsed.getTime())) {
            return parsed.getTime().toString();
          }
        }

        // Fallback: usar timestamp atual como identificador único
        return Date.now().toString();
      } catch (error) {
        console.warn("Erro ao processar timestamp:", error);
        return Date.now().toString();
      }
    }, []);

    // ✅ Dados do bracket memoizados com cache - CORREÇÃO APLICADA
    const bracketData = useMemo(() => {
      if (!currentChampionship) return null;

      // ✅ CORREÇÃO: Usar função auxiliar para timestamp seguro
      const timestamp = getSafeTimestamp(currentChampionship.updatedAt);
      const cacheKey = `bracket-${currentChampionship.id}-${timestamp}`;

      // ✅ CORREÇÃO: Verificação mais robusta do cache
      let cached = null;
      try {
        cached = getCachedBracket(cacheKey);
      } catch (error) {
        console.warn("Erro ao acessar cache do bracket:", error);
        cached = null;
      }

      if (cached) {
        console.log("🚀 [BRACKET] Cache hit para:", cacheKey);
        return cached;
      }

      console.log("🔄 [BRACKET] Recalculando dados para:", cacheKey);

      const allKnockoutMatches = currentChampionship.groups
        .flatMap((group) => group.matches)
        .filter((match) => match.phase === "knockout");

      const mainMatches = allKnockoutMatches.filter(
        (m) => !m.round?.includes("2ª Div")
      );
      const secondDivMatches = allKnockoutMatches.filter((m) =>
        m.round?.includes("2ª Div")
      );

      const organizeBracketData = (matches: Match[], divisionSuffix = "") => {
        return {
          oitavas: matches.filter(
            (m) => m.round === `Oitavas${divisionSuffix}`
          ),
          quartas: matches.filter(
            (m) => m.round === `Quartas${divisionSuffix}`
          ),
          semifinal: matches.filter(
            (m) => m.round === `Semifinal${divisionSuffix}`
          ),
          final: matches.filter((m) => m.round === `Final${divisionSuffix}`),
          terceiro: matches.filter(
            (m) => m.round === `3º Lugar${divisionSuffix}`
          ),
        };
      };

      const data = {
        mainBracket: organizeBracketData(mainMatches),
        secondBracket: organizeBracketData(secondDivMatches, " 2ª Div"),
        mainMatches,
        secondDivMatches,
      };

      // ✅ CORREÇÃO: Tentar salvar no cache com tratamento de erro
      try {
        setCachedBracket(cacheKey, data);
        console.log("💾 [BRACKET] Dados salvos no cache:", cacheKey);
      } catch (error) {
        console.warn("Erro ao salvar cache do bracket:", error);
      }

      return data;
    }, [
      currentChampionship,
      getCachedBracket,
      setCachedBracket,
      getSafeTimestamp,
    ]);

    // ✅ Callback memoizado para clique em partida
    const handleMatchClick = useCallback(
      (match: Match) => {
        onMatchClick?.(match);
      },
      [onMatchClick]
    );

    if (!currentChampionship || !bracketData) return null;

    const { mainBracket, secondBracket, mainMatches, secondDivMatches } =
      bracketData;

    return (
      <div className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="primeira" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Primeira Divisão
              {mainMatches.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {mainMatches.filter((m) => m.isCompleted).length}/
                  {mainMatches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="segunda" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Segunda Divisão
              {secondDivMatches.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {secondDivMatches.filter((m) => m.isCompleted).length}/
                  {secondDivMatches.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Primeira Divisão */}
          <TabsContent value="primeira" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Trophy className="h-5 w-5" />
                  Chave Principal - Primeira Divisão
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <BracketDisplay
                  bracket={mainBracket}
                  isSecondDivision={false}
                  onMatchClick={handleMatchClick}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segunda Divisão */}
          <TabsContent value="segunda" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <Award className="h-5 w-5" />
                  Chave de Repescagem - Segunda Divisão
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <BracketDisplay
                  bracket={secondBracket}
                  isSecondDivision={true}
                  onMatchClick={handleMatchClick}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resumo estatístico otimizado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mainMatches.length > 0 && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Primeira Divisão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total de partidas:</span>
                  <Badge variant="secondary" className="font-semibold">
                    {mainMatches.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Concluídas:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {mainMatches.filter((m) => m.isCompleted).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Pendentes:</span>
                  <Badge className="bg-orange-100 text-orange-800">
                    {mainMatches.filter((m) => !m.isCompleted).length}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>
                      {Math.round(
                        (mainMatches.filter((m) => m.isCompleted).length /
                          mainMatches.length) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (mainMatches.filter((m) => m.isCompleted).length /
                            mainMatches.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {secondDivMatches.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-700 flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Segunda Divisão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total de partidas:</span>
                  <Badge variant="secondary" className="font-semibold">
                    {secondDivMatches.length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Concluídas:</span>
                  <Badge className="bg-green-100 text-green-800">
                    {secondDivMatches.filter((m) => m.isCompleted).length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Pendentes:</span>
                  <Badge className="bg-orange-100 text-orange-800">
                    {secondDivMatches.filter((m) => !m.isCompleted).length}
                  </Badge>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>
                      {Math.round(
                        (secondDivMatches.filter((m) => m.isCompleted).length /
                          secondDivMatches.length) *
                          100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (secondDivMatches.filter((m) => m.isCompleted)
                            .length /
                            secondDivMatches.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }
);
