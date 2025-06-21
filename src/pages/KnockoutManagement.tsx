import React from "react";
import { useChampionshipStore } from "../store/championship";
import { KnockoutBracket } from "../components/championship/KnockoutBracket";
import { Card, CardContent } from "../components/ui/card";
import { Trophy } from "lucide-react";

export const KnockoutManagement: React.FC = () => {
  const { currentChampionship, generateKnockoutBracket } =
    useChampionshipStore();

  if (!currentChampionship) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum campeonato selecionado
            </h2>
            <p className="text-gray-500">
              Selecione um campeonato para gerenciar a chave mata-mata
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleGenerateBracket = async () => {
    if (
      confirm(
        "Tem certeza que deseja gerar a chave mata-mata? Esta ação não pode ser desfeita."
      )
    ) {
      await generateKnockoutBracket();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chave Mata-Mata
            </h1>
            <p className="text-gray-600 mt-1">{currentChampionship.name}</p>
          </div>
        </div>

        {/* Componente da chave */}
        <KnockoutBracket onGenerateBracket={handleGenerateBracket} />
      </div>
    </div>
  );
};
