import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useChampionshipStore } from "../../store/championship";
import {
  Trophy,
  Award,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Users,
  Target,
} from "lucide-react";

export const SecondDivisionMonitor: React.FC = () => {
  const [monitorData, setMonitorData] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const {
    currentChampionship,
    monitorAndFixSecondDivision,
    generateSecondDivisionReport,
  } = useChampionshipStore();

  const loadReport = useCallback(() => {
    const reportData = generateSecondDivisionReport();
    setReport(reportData);
  }, [generateSecondDivisionReport]);

  // Carregar dados iniciais
  useEffect(() => {
    if (currentChampionship?.hasRepechage) {
      loadReport();
    }
  }, [currentChampionship, loadReport]);

  const handleMonitorAndFix = async () => {
    setLoading(true);
    try {
      const result = await monitorAndFixSecondDivision();
      setMonitorData(result);
      loadReport(); // Recarregar relatório após possíveis correções
    } catch (error) {
      console.error("Erro ao monitorar segunda divisão:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentChampionship?.hasRepechage) {
    return (
      <Card className="border-orange-200">
        <CardContent className="p-6 text-center">
          <Award className="h-12 w-12 text-orange-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Segunda Divisão Desabilitada
          </h3>
          <p className="text-gray-500">
            A segunda divisão não está habilitada para este campeonato.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-700">
                  Monitor da Segunda Divisão
                </CardTitle>
                <p className="text-sm text-orange-600 mt-1">
                  Monitoramento e análise avançada da repescagem
                </p>
              </div>
            </div>
            <Button
              onClick={handleMonitorAndFix}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              {loading ? "Analisando..." : "Analisar & Corrigir"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Relatório geral */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overview */}
          <Card className="border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Visão Geral
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Progresso</span>
                  <span className="text-sm font-medium">
                    {Math.round(report.overview.progressPercentage)}%
                  </span>
                </div>
                <Progress
                  value={report.overview.progressPercentage}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {report.overview.completedMatches}
                  </div>
                  <div className="text-xs text-gray-500">Completas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {report.overview.totalMatches}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm">
                  {report.overview.activeAthletes} de{" "}
                  {report.overview.eliminatedCount} atletas
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Rodadas */}
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-700">Rodadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(report.rounds).map(
                  ([round, data]: [string, any]) => (
                    <div
                      key={round}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">{round}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {data.completed}/{data.total}
                        </span>
                        {data.completed === data.total ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Medalhistas */}
          <Card className="border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-700 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Pódium 2ª Divisão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="bg-yellow-100 text-yellow-800"
                  >
                    🥇 1º
                  </Badge>
                  <span className="text-sm">
                    {report.medalists.champion || "Pendente"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-800"
                  >
                    🥈 2º
                  </Badge>
                  <span className="text-sm">
                    {report.medalists.runnerUp || "Pendente"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant="secondary"
                    className="bg-orange-100 text-orange-800"
                  >
                    🥉 3º
                  </Badge>
                  <span className="text-sm">
                    {report.medalists.thirdPlace || "Pendente"}
                  </span>
                </div>
              </div>

              {report.structure.isComplete && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      Segunda Divisão Completa!
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados do monitoramento */}
      {monitorData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Análise de saúde */}
          <Card
            className={`border-2 ${
              monitorData.analysis.bracketHealth.isValid
                ? "border-green-200 bg-green-50/30"
                : "border-red-200 bg-red-50/30"
            }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {monitorData.analysis.bracketHealth.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
                Saúde do Bracket
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monitorData.analysis.bracketHealth.isValid ? (
                <div className="text-green-700">
                  <p className="font-medium">✅ Bracket está saudável</p>
                  <p className="text-sm mt-1">
                    Todos os sistemas funcionando corretamente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-700 mb-2">
                      Problemas Detectados:
                    </h4>
                    <ul className="space-y-1">
                      {monitorData.analysis.bracketHealth.issues.map(
                        (issue: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-red-600 flex items-start gap-2"
                          >
                            <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {issue}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">
                      Recomendações:
                    </h4>
                    <ul className="space-y-1">
                      {monitorData.analysis.bracketHealth.recommendations.map(
                        (rec: string, index: number) => (
                          <li
                            key={index}
                            className="text-sm text-blue-600 flex items-start gap-2"
                          >
                            <CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auto-correção */}
          {monitorData.autoFixResult && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  Auto-correção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        monitorData.autoFixResult.fixed
                          ? "default"
                          : "secondary"
                      }
                    >
                      {monitorData.autoFixResult.fixed
                        ? "Aplicada"
                        : "Não necessária"}
                    </Badge>
                    {monitorData.autoFixResult.fixed && (
                      <span className="text-sm text-green-600">
                        {monitorData.autoFixResult.newMatches.length} partidas
                        criadas
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {monitorData.autoFixResult.actions.map(
                      (action: string, index: number) => (
                        <div
                          key={index}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                          {action}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Performance dos atletas */}
      {monitorData?.analysis?.athletePerformance && (
        <Card className="border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-700">
              Performance dos Atletas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Atleta</th>
                    <th className="text-center p-2">Partidas</th>
                    <th className="text-center p-2">Vitórias</th>
                    <th className="text-center p-2">% Vitórias</th>
                    <th className="text-center p-2">Sets</th>
                    <th className="text-center p-2">Ex-Cabeça</th>
                  </tr>
                </thead>
                <tbody>
                  {monitorData.analysis.athletePerformance
                    .sort((a: any, b: any) => b.winRate - a.winRate)
                    .slice(0, 10) // Top 10
                    .map((athlete: any) => (
                      <tr
                        key={athlete.athleteId}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2 font-medium">
                          {athlete.athleteName}
                        </td>
                        <td className="text-center p-2">
                          {athlete.matchesPlayed}
                        </td>
                        <td className="text-center p-2">
                          {athlete.matchesWon}
                        </td>
                        <td className="text-center p-2">
                          <Badge
                            variant={
                              athlete.winRate >= 50 ? "default" : "secondary"
                            }
                          >
                            {athlete.winRate.toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="text-center p-2 text-xs">
                          {athlete.setsWon}-{athlete.setsLost}
                        </td>
                        <td className="text-center p-2">
                          {athlete.isFormerSeed ? (
                            <Badge variant="outline" className="text-xs">
                              Sim
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SecondDivisionMonitor;
