import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, AlertTriangle, Info, Trophy } from "lucide-react";
import { Athlete, Match } from "../../types";

interface SecondDivisionStatusProps {
  eliminatedAthletes: Athlete[];
  secondDivMatches: Match[];
}

export const SecondDivisionStatus: React.FC<SecondDivisionStatusProps> = ({
  eliminatedAthletes,
  secondDivMatches,
}) => {
  // Analisar estrutura da segunda divisão
  const formerSeeds = eliminatedAthletes.filter((a) => a.isSeeded);
  const byeMatches = secondDivMatches.filter(
    (m) => m.player1?.isVirtual || m.player2?.isVirtual
  );
  const autoCompletedByes = byeMatches.filter((m) => m.isCompleted);
  const completedMatches = secondDivMatches.filter((m) => m.isCompleted);

  // Calcular estatísticas
  const totalMatches = secondDivMatches.length;
  const progressPercentage =
    totalMatches > 0 ? (completedMatches.length / totalMatches) * 100 : 0;

  return (
    <Card className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
          <Trophy className="h-5 w-5" />
          Status da Segunda Divisão - Correções Aplicadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações sobre as correções aplicadas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Correções CBTM/ITTF Aplicadas
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-500"
              >
                ✓ BYE Estratégico
              </Badge>
              <span className="text-gray-600 dark:text-gray-300">
                {byeMatches.length} partidas com BYE
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-500"
              >
                ✓ Auto-Completadas
              </Badge>
              <span className="text-gray-600 dark:text-gray-300">
                {autoCompletedByes.length}/{byeMatches.length} BYEs processadas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500"
              >
                ✓ Ex-Cabeças
              </Badge>
              <span className="text-gray-600 dark:text-gray-300">
                {formerSeeds.length} ex-cabeças priorizados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-500"
              >
                ✓ Distribuição
              </Badge>
              <span className="text-gray-600 dark:text-gray-300">Igual à primeira divisão</span>
            </div>
          </div>
        </div>

        {/* Progresso da segunda divisão */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Progresso Atual
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Partidas Completadas
              </span>
              <Badge
                variant={progressPercentage === 100 ? "default" : "secondary"}
              >
                {completedMatches.length}/{totalMatches}
              </Badge>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-400 to-yellow-500 dark:from-orange-500 dark:to-yellow-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>0%</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {progressPercentage.toFixed(1)}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Lista de ex-cabeças de chave */}
        {formerSeeds.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Ex-Cabeças de Chave na Segunda Divisão
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {formerSeeds.map((athlete) => (
                <div
                  key={athlete.id}
                  className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border dark:border-yellow-800"
                >
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">
                    {athlete.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-yellow-700 dark:text-yellow-300 border-yellow-600 dark:border-yellow-500"
                  >
                    Ex-Cabeça #{athlete.seedNumber}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Alertas e informações */}
        {totalMatches === 0 && eliminatedAthletes.length >= 2 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                Segunda divisão aguardando geração
              </span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              {eliminatedAthletes.length} atletas eliminados aguardam o início
              da segunda divisão.
            </p>
          </div>
        )}

        {eliminatedAthletes.length < 2 && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Info className="h-4 w-4" />
              <span className="font-medium">
                Segunda divisão não disponível
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Mínimo de 2 atletas eliminados necessário para segunda divisão.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
