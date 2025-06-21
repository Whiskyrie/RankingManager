import { jsPDF } from "jspdf";
import { Championship, Athlete, Group, Match, Set } from "../types";

// Utilitários de formatação
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

export const getOrdinalPosition = (position: number): string => {
  return `${position}º`;
};

export const formatMatchScore = (match: Match): string => {
  if (!match.sets || match.sets.length === 0) {
    return "0-0";
  }

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

// Função para validar sets (consistente com types/index.ts)
export const isValidSet = (set: Set): boolean => {
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

  // Se empatado em 10-10 ou mais, deve ter diferença de exatamente 2
  if (player1Score >= 10 && player2Score >= 10) {
    return Math.abs(player1Score - player2Score) === 2;
  }

  // Um dos jogadores deve ter pelo menos 11 e diferença de pelo menos 2
  return (
    (player1Score >= 11 && player1Score - player2Score >= 2) ||
    (player2Score >= 11 && player2Score - player1Score >= 2)
  );
};

// Função principal para determinar vencedor da partida - TIPAGEM CORRIGIDA
export const getMatchWinner = (
  sets: Array<{
    player1Score: number;
    player2Score: number;
    player1Id?: string;
    player2Id?: string;
  }>,
  bestOf: 3 | 5 | 7, // CORRIGIDO: tipagem específica ao invés de number genérico
  player1Id?: string,
  player2Id?: string
): string | undefined => {
  if (sets.length === 0) return undefined;

  // CORRIGIDO: agora com tipagem específica não há erro de comparação
  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
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

    // Verificar se o set é válido usando função de validação
    return isValidSet({ player1Score, player2Score });
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

// Função auxiliar para nomes de rodadas
const getRoundName = (rounds: number): string => {
  const roundNames: Record<number, string> = {
    1: "Final",
    2: "Semifinal",
    3: "Quartas",
    4: "Oitavas",
    5: "Décimo-sextos",
    6: "Trinta-e-dois-avos",
  };

  return roundNames[rounds] || `Rodada ${rounds}`;
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
  const currentRoundName = getRoundName(rounds);

  // Criar partidas em pares
  for (let i = 0; i < orderedAthletes.length; i += 2) {
    if (orderedAthletes[i] && orderedAthletes[i + 1]) {
      const match: Match = {
        id: `knockout-${i / 2}`,
        player1Id: orderedAthletes[i]!.id,
        player2Id: orderedAthletes[i + 1]!.id,
        player1: orderedAthletes[i]!,
        player2: orderedAthletes[i + 1]!,
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: currentRoundName,
        position: i / 2,
        timeoutsUsed: {
          player1: false,
          player2: false,
        },
        createdAt: new Date(),
      };
      matches.push(match);
    }
  }

  return matches;
};

// Geração de partidas da segunda divisão (repescagem) - REMOVIDO eliminatedAthletes não usado
export const generateSecondDivisionMatches = (
  athletes: Athlete[] // CORRIGIDO: renomeado para evitar erro de variável não usada
): Match[] => {
  const matches: Match[] = [];

  if (athletes.length < 2) return matches;

  // Determinar tamanho da chave da segunda divisão (potência de 2)
  let bracketSize = 4;
  while (bracketSize < athletes.length) {
    bracketSize *= 2;
  }

  // Embaralhar atletas para distribuição aleatória
  const shuffledAthletes = [...athletes].sort(() => Math.random() - 0.5);
  const orderedAthletes: (Athlete | null)[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // Preencher com atletas
  for (let i = 0; i < Math.min(shuffledAthletes.length, bracketSize); i++) {
    orderedAthletes[i] = shuffledAthletes[i];
  }

  // Gerar partidas da primeira rodada da segunda divisão
  const rounds = Math.log2(bracketSize);
  const roundNames = [
    "Final 2ª Div",
    "Semifinal 2ª Div",
    "Quartas 2ª Div",
    "Oitavas 2ª Div",
  ];
  const currentRoundName =
    rounds <= 3 ? roundNames[rounds - 1] : "Oitavas 2ª Div";

  // Criar partidas em pares
  for (let i = 0; i < orderedAthletes.length; i += 2) {
    if (orderedAthletes[i] && orderedAthletes[i + 1]) {
      const match: Match = {
        id: `second-div-${i / 2}`,
        player1Id: orderedAthletes[i]!.id,
        player2Id: orderedAthletes[i + 1]!.id,
        player1: orderedAthletes[i]!,
        player2: orderedAthletes[i + 1]!,
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: currentRoundName,
        position: i / 2,
        timeoutsUsed: {
          player1: false,
          player2: false,
        },
        createdAt: new Date(),
      };
      matches.push(match);
    }
  }

  return matches;
};

// Geração da próxima rodada do mata-mata
export const generateNextRoundMatches = (
  currentRoundMatches: Match[],
  round: string
): Match[] => {
  const matches: Match[] = [];

  // Verificar se todas as partidas da rodada atual foram completadas
  const completedMatches = currentRoundMatches.filter((m) => m.isCompleted);
  if (completedMatches.length !== currentRoundMatches.length) {
    return matches; // Ainda há partidas pendentes
  }

  // Gerar próxima rodada
  for (let i = 0; i < completedMatches.length; i += 2) {
    const match1 = completedMatches[i];
    const match2 = completedMatches[i + 1];

    if (match1 && match2) {
      const winner1 = getMatchWinner(
        match1.sets,
        5,
        match1.player1Id,
        match1.player2Id
      );
      const winner2 = getMatchWinner(
        match2.sets,
        5,
        match2.player1Id,
        match2.player2Id
      );

      if (winner1 && winner2) {
        const newMatch: Match = {
          id: `${round}-${i / 2}`,
          player1Id: winner1,
          player2Id: winner2,
          sets: [],
          isCompleted: false,
          phase: "knockout",
          round: round,
          position: i / 2,
          timeoutsUsed: {
            player1: false,
            player2: false,
          },
          createdAt: new Date(),
        };
        matches.push(newMatch);
      }
    }
  }

  return matches;
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
  const maxSets = championship.groupsBestOf;
  for (let i = 0; i < maxSets; i++) {
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
  }

  // Resultado Final
  const resultY = startY + (maxSets + 2) * cellHeight + 20;
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

// Validação de dados
export const validateAthlete = (athlete: Partial<Athlete>): string[] => {
  const errors: string[] = [];

  if (!athlete.name?.trim()) {
    errors.push("Nome é obrigatório");
  }

  if (athlete.name && athlete.name.trim().length < 2) {
    errors.push("Nome deve ter pelo menos 2 caracteres");
  }

  return errors;
};

// Utilitários para localStorage
export const saveToLocalStorage = (key: string, data: unknown): void => {
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
export const exportToJSON = <T>(data: T, filename: string): void => {
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

// Utilitários para manipulação de strings
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9 -]/g, "") // Remove caracteres especiais
    .replace(/\s+/g, "-") // Substitui espaços por hífens
    .replace(/-+/g, "-") // Remove hífens duplicados
    .trim();
};
