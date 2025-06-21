import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { v4 as uuidv4 } from "uuid";
import { Championship, Group, Match, Athlete } from "../types";

// Formatação de datas
export const formatDate = (
  date: Date | string,
  pattern: string = "dd/MM/yyyy"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, pattern, { locale: ptBR });
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, "dd/MM/yyyy HH:mm");
};

// Formatação de categorias
export const formatCategory = (category: string): string => {
  return category.replace("_", " ");
};

// Utilitários para classificação
export const getOrdinalPosition = (position: number): string => {
  if (position === 1) return "1º";
  if (position === 2) return "2º";
  if (position === 3) return "3º";
  return `${position}º`;
};

// Cálculo de idade
export const calculateAge = (
  birthYear: number,
  referenceYear: number = new Date().getFullYear()
): number => {
  return referenceYear - birthYear;
};

// Validação de idade para categoria
export const isEligibleForCategory = (
  birthYear: number,
  category: string
): boolean => {
  const currentYear = new Date().getFullYear();
  const age = calculateAge(birthYear, currentYear);

  if (category.includes("Sub-9")) return age <= 9;
  if (category.includes("Sub-11")) return age <= 11;
  if (category.includes("Sub-13")) return age <= 13;
  if (category.includes("Sub-15")) return age <= 15;
  if (category.includes("Sub-17")) return age <= 17;
  if (category.includes("Sub-21")) return age <= 21;
  if (category.includes("Veteranos 40+")) return age >= 40 && age < 50;
  if (category.includes("Veteranos 50+")) return age >= 50 && age < 60;
  if (category.includes("Veteranos 60+")) return age >= 60;
  if (category.includes("Absoluto")) return age >= 13; // Mínimo para absoluto

  return true;
};

// Formatação de scores
export const formatMatchScore = (match: Match): string => {
  if (!match.isCompleted) return "A disputar";
  if (match.isWalkover) return "W.O.";

  const sets = match.sets;
  let player1Sets = 0;
  let player2Sets = 0;

  sets.forEach((set) => {
    if (set.player1Score > set.player2Score) player1Sets++;
    else if (set.player2Score > set.player1Score) player2Sets++;
  });

  return `${player1Sets}-${player2Sets}`;
};

export const formatSetScore = (set: {
  player1Score: number;
  player2Score: number;
}): string => {
  return `${set.player1Score}-${set.player2Score}`;
};

// Cores para status
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "created":
      return "bg-gray-100 text-gray-800";
    case "groups":
      return "bg-blue-100 text-blue-800";
    case "knockout":
      return "bg-orange-100 text-orange-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Geração de súmulas em PDF
export const generateMatchSheet = (
  match: Match,
  championship: Championship
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Cabeçalho
  doc.setFontSize(16);
  doc.text("CONFEDERAÇÃO BRASILEIRA DE TÊNIS DE MESA", pageWidth / 2, 20, {
    align: "center",
  });
  doc.setFontSize(14);
  doc.text("SÚMULA OFICIAL", pageWidth / 2, 30, { align: "center" });

  // Informações do campeonato
  doc.setFontSize(12);
  doc.text(`Campeonato: ${championship.name}`, 20, 50);
  doc.text(`Data: ${formatDate(new Date())}`, 20, 70);

  // Informações da partida
  doc.text(`Partida: ${match.player1?.name} vs ${match.player2?.name}`, 20, 90);
  doc.text(
    `Fase: ${match.phase === "groups" ? "Grupos" : "Mata-mata"}`,
    20,
    100
  );
  if (match.groupId) {
    const group = championship.groups.find((g) => g.id === match.groupId);
    doc.text(`Grupo: ${group?.name}`, 20, 110);
  }

  // Tabela de sets
  const startY = 130;
  const cellHeight = 10;
  const colWidths = [30, 40, 40, 40];

  // Cabeçalho da tabela
  doc.rect(20, startY, colWidths[0], cellHeight);
  doc.rect(20 + colWidths[0], startY, colWidths[1], cellHeight);
  doc.rect(20 + colWidths[0] + colWidths[1], startY, colWidths[2], cellHeight);
  doc.rect(
    20 + colWidths[0] + colWidths[1] + colWidths[2],
    startY,
    colWidths[3],
    cellHeight
  );

  doc.text("Set", 25, startY + 7);
  doc.text(
    match.player1?.name.substring(0, 15) || "Jogador 1",
    25 + colWidths[0],
    startY + 7
  );
  doc.text(
    match.player2?.name.substring(0, 15) || "Jogador 2",
    25 + colWidths[0] + colWidths[1],
    startY + 7
  );
  doc.text(
    "Vencedor",
    25 + colWidths[0] + colWidths[1] + colWidths[2],
    startY + 7
  );

  // Linhas para sets
  for (let i = 0; i < (championship.groupsBestOf === 5 ? 5 : 7); i++) {
    const y = startY + (i + 1) * cellHeight;
    doc.rect(20, y, colWidths[0], cellHeight);
    doc.rect(20 + colWidths[0], y, colWidths[1], cellHeight);
    doc.rect(20 + colWidths[0] + colWidths[1], y, colWidths[2], cellHeight);
    doc.rect(
      20 + colWidths[0] + colWidths[1] + colWidths[2],
      y,
      colWidths[3],
      cellHeight
    );

    doc.text(`${i + 1}º`, 25, y + 7);

    if (match.sets[i]) {
      doc.text(match.sets[i].player1Score.toString(), 35 + colWidths[0], y + 7);
      doc.text(
        match.sets[i].player2Score.toString(),
        35 + colWidths[0] + colWidths[1],
        y + 7
      );
    }
  }

  // Resultado final
  const resultY =
    startY + (championship.groupsBestOf === 5 ? 6 : 8) * cellHeight + 20;
  doc.text("Resultado Final:", 20, resultY);
  doc.text("Vencedor:", 20, resultY + 15);

  // Assinaturas
  const signY = resultY + 40;
  doc.text("_____________________", 20, signY);
  doc.text("Árbitro", 30, signY + 10);

  doc.text("_____________________", 120, signY);
  doc.text("Jogador 1", 130, signY + 10);

  doc.text("_____________________", 20, signY + 30);
  doc.text("Mesário", 30, signY + 40);

  doc.text("_____________________", 120, signY + 30);
  doc.text("Jogador 2", 130, signY + 40);

  // Observações
  doc.text("Observações:", 20, signY + 60);
  doc.line(20, signY + 70, pageWidth - 20, signY + 70);
  doc.line(20, signY + 80, pageWidth - 20, signY + 80);
  doc.line(20, signY + 90, pageWidth - 20, signY + 90);

  // Salvar PDF
  doc.save(`sumula_${match.player1?.name}_vs_${match.player2?.name}.pdf`);
};

// Geração de relatório de classificação do grupo
export const generateGroupReport = (
  group: Group,
  championship: Championship
): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Cabeçalho
  doc.setFontSize(16);
  doc.text("CONFEDERAÇÃO BRASILEIRA DE TÊNIS DE MESA", pageWidth / 2, 20, {
    align: "center",
  });
  doc.setFontSize(14);
  doc.text(`CLASSIFICAÇÃO - ${group.name}`, pageWidth / 2, 30, {
    align: "center",
  });

  // Informações do campeonato
  doc.setFontSize(12);
  doc.text(`Campeonato: ${championship.name}`, 20, 50);

  doc.text(`Data: ${formatDate(new Date())}`, 20, 70);

  // Tabela de classificação
  const startY = 90;
  const cellHeight = 8;
  const colWidths = [15, 60, 20, 20, 20, 25, 25];

  // Cabeçalho da tabela
  const headers = ["Pos", "Atleta", "J", "V", "D", "Dif Sets", "Dif Pts"];
  let x = 20;
  headers.forEach((header, index) => {
    doc.rect(x, startY, colWidths[index], cellHeight);
    doc.text(header, x + 2, startY + 6);
    x += colWidths[index];
  });

  // Dados dos atletas
  group.standings.forEach((standing, index) => {
    const y = startY + (index + 1) * cellHeight;
    x = 20;

    const data = [
      getOrdinalPosition(standing.position),
      standing.athlete.name.substring(0, 25),
      standing.matches.toString(),
      standing.wins.toString(),
      standing.losses.toString(),
      standing.setsDiff >= 0
        ? `+${standing.setsDiff}`
        : standing.setsDiff.toString(),
      standing.pointsDiff >= 0
        ? `+${standing.pointsDiff}`
        : standing.pointsDiff.toString(),
    ];

    data.forEach((value, colIndex) => {
      doc.rect(x, y, colWidths[colIndex], cellHeight);
      doc.text(value, x + 2, y + 6);
      x += colWidths[colIndex];
    });
  });

  // Qualificados
  const qualifiedY = startY + (group.standings.length + 2) * cellHeight;
  doc.text("Qualificados para a próxima fase:", 20, qualifiedY);

  group.standings
    .filter((s) => s.qualified)
    .forEach((standing, index) => {
      doc.text(
        `${index + 1}. ${standing.athlete.name}`,
        20,
        qualifiedY + 10 + index * 8
      );
    });

  // Salvar PDF
  doc.save(`classificacao_${group.name.toLowerCase()}.pdf`);
};

// Geração de chave de eliminação
export const generateKnockoutBracket = (championship: Championship): void => {
  const doc = new jsPDF("landscape");

  // Cabeçalho
  doc.setFontSize(16);
  doc.text("CHAVE DE ELIMINAÇÃO", doc.internal.pageSize.width / 2, 20, {
    align: "center",
  });
  doc.setFontSize(14);
  doc.text(championship.name, doc.internal.pageSize.width / 2, 30, {
    align: "center",
  });

  // TODO: Implementar desenho da chave
  // Por ora, apenas uma implementação básica
  doc.setFontSize(12);
  doc.text("Chave em desenvolvimento...", 50, 60);

  doc.save(`chave_${championship.name.toLowerCase().replace(/\s+/g, "_")}.pdf`);
};

// Geração de chaves mata-mata
export const generateMainKnockoutMatches = (
  qualifiedAthletes: Athlete[],
  bracketSize: number
): Match[] => {
  const matches: Match[] = [];

  // Separar cabeças de chave dos demais classificados
  const seeded = qualifiedAthletes
    .filter((a) => a.isSeeded)
    .sort((a, b) => (a.seedNumber || 0) - (b.seedNumber || 0));

  const unseeded = qualifiedAthletes.filter((a) => !a.isSeeded);

  // Criar lista de atletas ordenados para a chave
  const orderedAthletes: (Athlete | null)[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // Posicionar cabeças de chave (distribuição padrão)
  if (seeded.length > 0) orderedAthletes[0] = seeded[0]; // 1º cabeça
  if (seeded.length > 1) orderedAthletes[bracketSize - 1] = seeded[1]; // 2º cabeça
  if (seeded.length > 2)
    orderedAthletes[Math.floor(bracketSize / 2) - 1] = seeded[2]; // 3º cabeça
  if (seeded.length > 3)
    orderedAthletes[Math.floor(bracketSize / 2)] = seeded[3]; // 4º cabeça

  // Preencher com demais atletas
  let unseededIndex = 0;
  for (
    let i = 0;
    i < orderedAthletes.length && unseededIndex < unseeded.length;
    i++
  ) {
    if (orderedAthletes[i] === null) {
      orderedAthletes[i] = unseeded[unseededIndex++];
    }
  }

  // Gerar partidas da primeira rodada
  const rounds = Math.log2(bracketSize);
  const roundNames = ["Oitavas", "Quartas", "Semifinal", "Final"];
  const currentRoundName = rounds <= 3 ? roundNames[4 - rounds] : "Oitavas";

  for (let i = 0; i < orderedAthletes.length; i += 2) {
    const player1 = orderedAthletes[i];
    const player2 = orderedAthletes[i + 1];

    if (player1 && player2) {
      matches.push({
        id: uuidv4(),
        player1Id: player1.id,
        player2Id: player2.id,
        player1,
        player2,
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: currentRoundName,
        position: Math.floor(i / 2),
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      });
    }
  }

  return matches;
};

export const generateSecondDivisionMatches = (
  eliminatedAthletes: Athlete[]
): Match[] => {
  const matches: Match[] = [];

  if (eliminatedAthletes.length < 2) return matches;

  // Determinar tamanho da chave da segunda divisão (potência de 2)
  let bracketSize = 4;
  while (bracketSize < eliminatedAthletes.length) {
    bracketSize *= 2;
  }

  // Embaralhar eliminados para distribuição aleatória
  const shuffledAthletes = [...eliminatedAthletes].sort(
    () => Math.random() - 0.5
  );
  const orderedAthletes: (Athlete | null)[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // Preencher com atletas eliminados
  for (let i = 0; i < Math.min(shuffledAthletes.length, bracketSize); i++) {
    orderedAthletes[i] = shuffledAthletes[i];
  }

  // Gerar partidas da primeira rodada da segunda divisão
  const rounds = Math.log2(bracketSize);
  const roundNames = [
    "Oitavas 2ª Div",
    "Quartas 2ª Div",
    "Semifinal 2ª Div",
    "Final 2ª Div",
  ];
  const currentRoundName =
    rounds <= 3 ? roundNames[4 - rounds] : "Oitavas 2ª Div";

  for (let i = 0; i < orderedAthletes.length; i += 2) {
    const player1 = orderedAthletes[i];
    const player2 = orderedAthletes[i + 1];

    if (player1 && player2) {
      matches.push({
        id: uuidv4(),
        player1Id: player1.id,
        player2Id: player2.id,
        player1,
        player2,
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: currentRoundName,
        position: Math.floor(i / 2),
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      });
    }
  }

  return matches;
};

export const generateNextRoundMatches = (
  currentRoundMatches: Match[],
  nextRoundName: string,
  championship: Championship
): Match[] => {
  const completedMatches = currentRoundMatches.filter(
    (m) => m.isCompleted && m.winner
  );

  if (completedMatches.length < 2) return [];

  const matches: Match[] = [];

  for (let i = 0; i < completedMatches.length; i += 2) {
    const match1 = completedMatches[i];
    const match2 = completedMatches[i + 1];

    if (match1 && match2) {
      const player1 = championship.athletes.find((a) => a.id === match1.winner);
      const player2 = championship.athletes.find((a) => a.id === match2.winner);

      if (player1 && player2) {
        matches.push({
          id: uuidv4(),
          player1Id: player1.id,
          player2Id: player2.id,
          player1,
          player2,
          sets: [],
          isCompleted: false,
          phase: "knockout",
          round: nextRoundName,
          position: Math.floor(i / 2),
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        });
      }
    }
  }

  return matches;
};

// Debug helper para mata-mata
export const debugKnockoutMatch = (
  match: Match,
  championship: Championship
): void => {
  console.log("=== DEBUG MATA-MATA ===");
  console.log("Match ID:", match.id);
  console.log("Phase:", match.phase);
  console.log("Round:", match.round);
  console.log("Player 1:", match.player1?.name, "(ID:", match.player1Id, ")");
  console.log("Player 2:", match.player2?.name, "(ID:", match.player2Id, ")");
  console.log("Is Completed:", match.isCompleted);
  console.log("Winner:", match.winner);
  console.log("Sets:", match.sets.length);
  console.log("Best Of (Knockout):", championship.knockoutBestOf);
  console.log("Best Of (Groups):", championship.groupsBestOf);

  if (match.sets.length > 0) {
    console.log("Sets Details:");
    match.sets.forEach((set, index) => {
      console.log(
        `  Set ${index + 1}: ${set.player1Score} - ${set.player2Score}`
      );
    });

    const bestOf =
      match.phase === "knockout"
        ? championship.knockoutBestOf
        : championship.groupsBestOf;
    const setsWithIds = match.sets.map((set) => ({
      ...set,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
    }));
    const calculatedWinner = getMatchWinner(setsWithIds, bestOf);
    console.log("Calculated Winner:", calculatedWinner);
  }
  console.log("=====================");
};

// Utilitários para manipulação de strings
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9 -]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-"); // Remove hífens duplicados
};

// Função para determinar o vencedor de uma partida baseado nos sets
export const getMatchWinner = (
  sets: Array<{
    player1Score: number;
    player2Score: number;
    player1Id?: string;
    player2Id?: string;
  }>,
  bestOf: number,
  player1Id?: string,
  player2Id?: string
): string | undefined => {
  if (sets.length === 0) return undefined;

  const setsToWin = Math.ceil(bestOf / 2);
  let player1Sets = 0;
  let player2Sets = 0;

  // Validar cada set antes de contar
  const validSets = sets.filter((set) => {
    const { player1Score, player2Score } = set;

    // Verificar se ambos os scores são números válidos e não negativos
    if (
      isNaN(player1Score) ||
      isNaN(player2Score) ||
      player1Score < 0 ||
      player2Score < 0
    ) {
      return false;
    }

    // Se ambos os scores são 0, considerar inválido
    if (player1Score === 0 && player2Score === 0) return false;

    // Verificar se o set é válido (mínimo 11 pontos para vencer e diferença de 2)
    if (Math.max(player1Score, player2Score) < 11) return false;
    if (Math.abs(player1Score - player2Score) < 2) return false;

    // Se empatado em 10-10 ou mais, precisa ter diferença de 2
    if (player1Score >= 10 && player2Score >= 10) {
      return Math.abs(player1Score - player2Score) >= 2;
    }

    // Um dos jogadores deve ter 11+ e o outro deve ter pelo menos 2 pontos a menos
    return (
      (player1Score >= 11 && player1Score - player2Score >= 2) ||
      (player2Score >= 11 && player2Score - player1Score >= 2)
    );
  });

  // Contar sets válidos
  validSets.forEach((set) => {
    if (set.player1Score > set.player2Score) {
      player1Sets++;
    } else if (set.player2Score > set.player1Score) {
      player2Sets++;
    }
  });

  // Verificar se algum jogador atingiu o número necessário de sets
  if (player1Sets >= setsToWin) {
    return player1Id || sets[0]?.player1Id;
  } else if (player2Sets >= setsToWin) {
    return player2Id || sets[0]?.player2Id;
  }

  return undefined;
};

// Função para determinar o vencedor de um set (versão já existente removida)
// Esta função foi movida para cima para evitar duplicação

// Validação de dados
export const validateAthlete = (athlete: Partial<Athlete>): string[] => {
  const errors: string[] = [];

  if (!athlete.name?.trim()) {
    errors.push("Nome é obrigatório");
  }

  return errors;
};

// Utilitários para localStorage
export const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao salvar no localStorage:", error);
  }
};

export const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Erro ao carregar do localStorage:", error);
    return defaultValue;
  }
};

// Utilitários para exportação de dados
export const exportToJSON = (data: any, filename: string): void => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

// Utilitários para cálculos estatísticos
export const calculateTournamentStats = (championship: Championship) => {
  const totalMatches = championship.totalMatches;
  const completedMatches = championship.completedMatches;
  const progress =
    totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  const groupsCompleted = championship.groups.filter(
    (g) => g.isCompleted
  ).length;
  const totalGroups = championship.groups.length;

  return {
    totalMatches,
    completedMatches,
    pendingMatches: totalMatches - completedMatches,
    progress: Math.round(progress),
    groupsCompleted,
    totalGroups,
    groupsProgress:
      totalGroups > 0 ? Math.round((groupsCompleted / totalGroups) * 100) : 0,
  };
};
