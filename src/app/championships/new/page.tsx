"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewChampionship() {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [groupSets, setGroupSets] = useState("3");
  const [knockoutSets, setKnockoutSets] = useState("5");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const championshipData = {
        name,
        date,
        description,
        groupSets: parseInt(groupSets),
        knockoutSets: parseInt(knockoutSets),
      };
      console.log(championshipData);
      router.push("/championships");
    } catch (error) {
      console.error("Erro ao criar campeonato:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Criar Novo Campeonato</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Nome do Campeonato
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Data do Campeonato
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Descrição (opcional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="groupSets"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Sets na Fase de Grupos
          </label>
          <select
            id="groupSets"
            value={groupSets}
            onChange={(e) => setGroupSets(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1">Melhor de 1</option>
            <option value="3">Melhor de 3</option>
            <option value="5">Melhor de 5</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="knockoutSets"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Sets no Mata-Mata
          </label>
          <select
            id="knockoutSets"
            value={knockoutSets}
            onChange={(e) => setKnockoutSets(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1">Melhor de 1</option>
            <option value="3">Melhor de 3</option>
            <option value="5">Melhor de 5</option>
            <option value="7">Melhor de 7</option>
          </select>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Criando..." : "Criar Campeonato"}
          </button>
        </div>
      </form>
    </div>
  );
}
