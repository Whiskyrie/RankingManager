import { jsPDF } from "jspdf";
import { Championship, Athlete, Group, Match, SetResult } from "../types/index";

// ✅ CORREÇÃO: Funções de formatação com validação robusta
const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

const safeParseDate = (date: any): Date | null => {
  if (!date) return null;

  // Se já é um Date válido
  if (date instanceof Date && isValidDate(date)) {
    return date;
  }

  // Tentar converter string/number para Date
  try {
    const parsed = new Date(date);
    return isValidDate(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const formatDate = (date: Date | string | null | undefined): string => {
  const safeDate = safeParseDate(date);

  if (!safeDate) {
    console.warn("formatDate: Data inválida recebida:", date);
    return "Data inválida";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(safeDate);
  } catch (error) {
    console.error("formatDate: Erro ao formatar data:", error);
    return "Data inválida";
  }
};

export const formatDateTime = (
  date: Date | string | null | undefined
): string => {
  const safeDate = safeParseDate(date);

  if (!safeDate) {
    console.warn("formatDateTime: Data inválida recebida:", date);
    return "Data/hora inválida";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(safeDate);
  } catch (error) {
    console.error("formatDateTime: Erro ao formatar data/hora:", error);
    return "Data/hora inválida";
  }
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
export const isValidSet = (set: SetResult): boolean => {
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

// Função principal para determinar vencedor da partida - CORRIGIDA E UNIFICADA
export const getMatchWinner = (
  sets: Array<{
    player1Score: number;
    player2Score: number;
    player1Id?: string;
    player2Id?: string;
  }>,
  bestOf: 3 | 5 | 7,
  player1Id?: string,
  player2Id?: string
): string | undefined => {
  if (sets.length === 0) return undefined;

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

  console.log(
    `🎯 [UTILS-WINNER] Calculando vencedor - BestOf: ${bestOf}, SetsToWin: ${setsToWin}, ValidSets: ${validSets.length}`
  );

  // Contar sets válidos
  validSets.forEach((set) => {
    if (set.player1Score > set.player2Score) {
      player1Sets++;
    } else if (set.player2Score > set.player1Score) {
      player2Sets++;
    }
    console.log(
      `  Set: ${set.player1Score}-${set.player2Score} → P1Sets: ${player1Sets}, P2Sets: ${player2Sets}`
    );
  });

  console.log(
    `🎯 [UTILS-WINNER] Resultado final: P1=${player1Sets} sets, P2=${player2Sets} sets`
  );

  // Verificar se algum jogador atingiu o número necessário de sets
  if (player1Sets >= setsToWin) {
    const winnerId = player1Id || sets[0]?.player1Id || "player1";
    console.log(`✅ [UTILS-WINNER] Player1 venceu! ID: ${winnerId}`);
    return winnerId;
  } else if (player2Sets >= setsToWin) {
    const winnerId = player2Id || sets[0]?.player2Id || "player2";
    console.log(`✅ [UTILS-WINNER] Player2 venceu! ID: ${winnerId}`);
    return winnerId;
  }

  console.log(`⏳ [UTILS-WINNER] Nenhum vencedor ainda - partida em andamento`);
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

export const generateSecondDivisionMatches = (athletes: Athlete[]): Match[] => {
  const matches: Match[] = [];

  console.log("\n🥈 [UTILS-2ND] === GERAÇÃO SEGUNDA DIVISÃO ===");
  console.log("🥈 [UTILS-2ND] Atletas recebidos:", athletes.length);
  athletes.forEach((athlete, index) => {
    console.log(`  ${index + 1}. ${athlete.name} (ID: ${athlete.id})`);
  });

  // Validação inicial
  if (!athletes || athletes.length < 2) {
    console.log(
      "❌ [UTILS-2ND] Insuficientes atletas para segunda divisão:",
      athletes?.length || 0
    );
    return matches;
  }

  // ✅ CORREÇÃO: Melhor determinação do tamanho da chave
  let bracketSize = 2;
  while (bracketSize < athletes.length) {
    bracketSize *= 2;
  }

  console.log(
    `🎯 [UTILS-2ND] Tamanho da chave determinado: ${bracketSize} (para ${athletes.length} atletas)`
  );

  // ✅ CORREÇÃO: Embaralhar atletas de forma mais robusta
  const shuffledAthletes = [...athletes]
    .map((athlete) => ({ athlete, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.athlete);

  console.log("🔀 [UTILS-2ND] Atletas embaralhados:");
  shuffledAthletes.forEach((athlete, index) => {
    console.log(`  ${index + 1}. ${athlete.name}`);
  });

  // ✅ CORREÇÃO: Criar array ordenado mais robusto
  const orderedAthletes: (Athlete | null)[] = Array.from(
    { length: bracketSize },
    (_, index) =>
      index < shuffledAthletes.length ? shuffledAthletes[index] : null
  );

  console.log("📋 [UTILS-2ND] Posições na chave:");
  orderedAthletes.forEach((athlete, index) => {
    console.log(`  Posição ${index + 1}: ${athlete?.name || "null"}`);
  });

  // ✅ CORREÇÃO: Determinação mais robusta da rodada inicial
  const rounds = Math.log2(bracketSize);
  const roundNames = {
    1: "Final 2ª Div",
    2: "Semifinal 2ª Div",
    3: "Quartas 2ª Div",
    4: "Oitavas 2ª Div",
    5: "Décimo-sextos 2ª Div",
  };

  const currentRoundName =
    roundNames[rounds as keyof typeof roundNames] || "Oitavas 2ª Div";

  console.log(
    `🏆 [UTILS-2ND] Rodada inicial: ${currentRoundName} (${rounds} rodadas)`
  );

  // ✅ CORREÇÃO: Geração de partidas mais robusta
  let matchCount = 0;
  for (let i = 0; i < orderedAthletes.length; i += 2) {
    const player1 = orderedAthletes[i];
    const player2 = orderedAthletes[i + 1];

    // ✅ Só criar partida se ambos os jogadores existem
    if (player1 && player2) {
      const matchId = `second-div-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}-${matchCount}`;

      const match: Match = {
        id: matchId,
        player1Id: player1.id,
        player2Id: player2.id,
        player1: player1,
        player2: player2,
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: currentRoundName,
        position: matchCount,
        timeoutsUsed: {
          player1: false,
          player2: false,
        },
        createdAt: new Date(),
      };

      matches.push(match);
      matchCount++;

      console.log(`✅ [UTILS-2ND] Partida ${matchCount} criada:`);
      console.log(`    ID: ${matchId}`);
      console.log(`    Jogadores: ${player1.name} vs ${player2.name}`);
      console.log(`    Rodada: ${currentRoundName}`);
      console.log(`    Posição: ${matchCount - 1}`);
    } else if (player1 && !player2) {
      // ✅ CORREÇÃO: Player1 avança automaticamente se não há oponente
      console.log(
        `⭐ [UTILS-2ND] ${player1.name} avança automaticamente (sem oponente)`
      );
      // Nota: Em uma implementação mais avançada, poderia criar um "bye" ou avançar diretamente
    }
  }

  console.log(
    `🎉 [UTILS-2ND] Geração concluída: ${matches.length} partidas criadas`
  );
  console.log("🥈 [UTILS-2ND] === FIM GERAÇÃO SEGUNDA DIVISÃO ===\n");

  return matches;
};
export const validateSecondDivisionMatches = (matches: Match[]): boolean => {
  console.log("\n🔍 [VALIDATE-2ND] Validando partidas da segunda divisão...");

  const issues: string[] = [];

  matches.forEach((match, index) => {
    // Verificar estrutura básica
    if (!match.id) {
      issues.push(`Partida ${index + 1}: ID ausente`);
    }

    if (!match.player1Id || !match.player2Id) {
      issues.push(`Partida ${index + 1}: IDs dos jogadores ausentes`);
    }

    if (!match.player1 || !match.player2) {
      issues.push(`Partida ${index + 1}: Objetos dos jogadores ausentes`);
    }

    if (match.phase !== "knockout") {
      issues.push(`Partida ${index + 1}: Fase incorreta (${match.phase})`);
    }

    if (!match.round?.includes("2ª Div")) {
      issues.push(`Partida ${index + 1}: Rodada incorreta (${match.round})`);
    }

    // Verificar duplicação de IDs
    const duplicateId = matches.findIndex(
      (m, i) => i !== index && m.id === match.id
    );
    if (duplicateId !== -1) {
      issues.push(
        `Partida ${index + 1}: ID duplicado com partida ${duplicateId + 1}`
      );
    }
  });

  if (issues.length === 0) {
    console.log("✅ [VALIDATE-2ND] Todas as partidas são válidas");
    return true;
  } else {
    console.log("❌ [VALIDATE-2ND] Problemas encontrados:");
    issues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
    return false;
  }
};

// ✅ FUNÇÃO DE TESTE: Simular geração da segunda divisão
export const testSecondDivisionGeneration = () => {
  console.log("\n🧪 [TEST-2ND] === TESTE DE GERAÇÃO ===");

  // Criar atletas de teste
  const testAthletes: Athlete[] = [
    { id: "test-1", name: "Atleta A" },
    { id: "test-2", name: "Atleta B" },
    { id: "test-3", name: "Atleta C" },
    { id: "test-4", name: "Atleta D" },
    { id: "test-5", name: "Atleta E" },
    { id: "test-6", name: "Atleta F" },
  ];

  console.log("🧪 [TEST-2ND] Testando com 6 atletas eliminados...");

  // Testar geração
  const matches = generateSecondDivisionMatches(testAthletes);

  // Validar resultado
  const isValid = validateSecondDivisionMatches(matches);

  console.log(`🧪 [TEST-2ND] Resultado: ${matches.length} partidas geradas`);
  console.log(
    `🧪 [TEST-2ND] Validação: ${isValid ? "✅ Passou" : "❌ Falhou"}`
  );

  // Teste com 2 atletas
  console.log("\n🧪 [TEST-2ND] Testando com 2 atletas eliminados...");
  const matches2 = generateSecondDivisionMatches(testAthletes.slice(0, 2));
  console.log(`🧪 [TEST-2ND] Resultado: ${matches2.length} partidas geradas`);

  // Teste com 1 atleta (deve falhar)
  console.log("\n🧪 [TEST-2ND] Testando com 1 atleta (deve falhar)...");
  const matches3 = generateSecondDivisionMatches(testAthletes.slice(0, 1));
  console.log(`🧪 [TEST-2ND] Resultado: ${matches3.length} partidas geradas`);

  console.log("🧪 [TEST-2ND] === FIM TESTE ===\n");

  return {
    test6Athletes: { matches: matches.length, valid: isValid },
    test2Athletes: { matches: matches2.length },
    test1Athlete: { matches: matches3.length },
  };
};

// ✅ CORREÇÃO: Usar consistentemente winnerId ao invés de winner
export const generateNextRoundMatches = (
  currentRoundMatches: Match[],
  round: string,
  allAthletes: Athlete[],
  bestOf: 3 | 5 | 7 = 5 // Parâmetro adicionado com valor padrão
): Match[] => {
  const matches: Match[] = [];

  // Verificar se todas as partidas da rodada atual foram completadas
  const completedMatches = currentRoundMatches.filter((m) => m.isCompleted);
  if (completedMatches.length !== currentRoundMatches.length) {
    console.log(
      `❌ [GENERATE] Ainda há partidas pendentes na rodada anterior (${completedMatches.length}/${currentRoundMatches.length})`
    );
    return matches; // Ainda há partidas pendentes
  }

  console.log(`✅ [GENERATE] Gerando próxima rodada: ${round}`, {
    completedMatches: completedMatches.length,
    round,
  });

  // ✅ LÓGICA ESPECIAL PARA DISPUTA DE TERCEIRO LUGAR
  if (round.includes("3º Lugar")) {
    console.log(
      "🥉 [GENERATE] Gerando disputa de terceiro lugar - usando PERDEDORES das semifinais"
    );

    // Para terceiro lugar, usar os PERDEDORES das semifinais
    const loserIds: string[] = [];

    completedMatches.forEach((match) => {
      // ✅ CORREÇÃO: Usar winnerId consistentemente
      let winnerId = match.winnerId;
      if (!winnerId && match.sets && match.sets.length > 0) {
        winnerId = getMatchWinner(
          match.sets,
          bestOf,
          match.player1Id,
          match.player2Id
        );
      }

      // Identificar o perdedor da partida
      const loserId =
        winnerId === match.player1Id ? match.player2Id : match.player1Id;

      if (loserId) {
        loserIds.push(loserId);
        const loserName =
          winnerId === match.player1Id
            ? match.player2?.name
            : match.player1?.name;
        console.log(
          `  🥉 [GENERATE] Perdedor encontrado: ${loserName} (ID: ${loserId})`
        );
      }
    });

    // Criar partida de 3º lugar com os dois perdedores
    if (loserIds.length >= 2) {
      const loser1 = allAthletes.find((a) => a.id === loserIds[0]);
      const loser2 = allAthletes.find((a) => a.id === loserIds[1]);

      if (loser1 && loser2) {
        const thirdPlaceMatch: Match = {
          id: `${round
            .replace(/\s+/g, "-")
            .toLowerCase()}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 5)}`,
          player1Id: loser1.id,
          player2Id: loser2.id,
          player1: loser1,
          player2: loser2,
          sets: [],
          isCompleted: false,
          phase: "knockout",
          round: round,
          isThirdPlace: true, // ✅ MARCAR COMO TERCEIRO LUGAR
          position: 0,
          timeoutsUsed: {
            player1: false,
            player2: false,
          },
          createdAt: new Date(),
        };
        matches.push(thirdPlaceMatch);
        console.log(
          `✅ [GENERATE] Partida de 3º lugar criada: ${loser1.name} vs ${loser2.name}`
        );
      }
    }
  } else {
    // ✅ LÓGICA PARA FINAL E OUTRAS RODADAS (usar VENCEDORES)
    console.log("🏆 [GENERATE] Gerando rodada normal - usando VENCEDORES");

    // Coletar todos os vencedores - ✅ USAR winnerId CONSISTENTEMENTE
    const winnerIds: string[] = [];

    completedMatches.forEach((match, index) => {
      let winnerId = match.winnerId;

      // Se não houver winnerId definido, calcular usando getMatchWinner
      if (!winnerId && match.sets && match.sets.length > 0) {
        console.log(
          `⚠️ [GENERATE] Campo winnerId não definido para partida ${match.id}, recalculando...`
        );
        winnerId = getMatchWinner(
          match.sets,
          bestOf,
          match.player1Id,
          match.player2Id
        );
        console.log(`   Resultado do recálculo: ${winnerId}`);
      }

      if (winnerId) {
        winnerIds.push(winnerId);
        const winnerName =
          winnerId === match.player1Id
            ? match.player1?.name
            : match.player2?.name;
        console.log(
          `  ✅ [GENERATE] Partida ${
            index + 1
          } - Vencedor: ${winnerName} (ID: ${winnerId})`
        );
      } else {
        console.log(
          `  ❌ [GENERATE] Nenhum vencedor encontrado para partida ${
            index + 1
          }: ${match.player1?.name} vs ${match.player2?.name}`
        );
      }
    });

    console.log(
      `📊 [GENERATE] Total de vencedores encontrados: ${winnerIds.length}`
    );

    // Criar partidas com os vencedores em pares
    for (let i = 0; i < winnerIds.length; i += 2) {
      if (winnerIds[i] && winnerIds[i + 1]) {
        const winner1 = allAthletes.find((a) => a.id === winnerIds[i]);
        const winner2 = allAthletes.find((a) => a.id === winnerIds[i + 1]);

        if (winner1 && winner2) {
          const newMatch: Match = {
            id: `${round
              .replace(/\s+/g, "-")
              .toLowerCase()}-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 5)}-${i / 2}`,
            player1Id: winner1.id,
            player2Id: winner2.id,
            player1: winner1,
            player2: winner2,
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

          console.log(
            `✅ [GENERATE] Partida ${round} criada: ${winner1.name} vs ${winner2.name} (ID: ${newMatch.id})`
          );
        }
      }
    }
  }

  console.log(
    `📊 [GENERATE] Total de partidas criadas para ${round}: ${matches.length}`
  );
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

// Utilitários para cálculos estatísticos - ✅ CORRIGIDO
export const calculateTournamentStats = (championship: Championship) => {
  // ✅ CORREÇÃO: Incluir TODAS as partidas, incluindo mata-mata da segunda divisão
  const allMatches = championship.groups.flatMap((group) => group.matches);

  // Filtrar apenas partidas válidas (com jogadores definidos)
  const validMatches = allMatches.filter(
    (match) =>
      match.player1?.id &&
      match.player2?.id &&
      match.player1.id !== match.player2.id
  );

  const totalMatches = validMatches.length;
  const completedMatches = validMatches.filter(
    (match) => match.isCompleted
  ).length;

  // ✅ CORREÇÃO: Garantir que o progresso nunca ultrapasse 100%
  const progress =
    totalMatches > 0
      ? Math.min(100, Math.round((completedMatches / totalMatches) * 100))
      : 0;

  // ✅ SEPARAR estatísticas por fase
  const groupMatches = validMatches.filter((match) => match.phase === "groups");
  const knockoutMatches = validMatches.filter(
    (match) => match.phase === "knockout"
  );
  const mainKnockoutMatches = knockoutMatches.filter(
    (m) => !m.round?.includes("2ª Div")
  );
  const secondDivMatches = knockoutMatches.filter((m) =>
    m.round?.includes("2ª Div")
  );

  // ✅ CORREÇÃO: Contar apenas grupos com partidas válidas
  const validGroups = championship.groups.filter((group) =>
    group.matches.some(
      (match) =>
        match.player1?.id &&
        match.player2?.id &&
        match.player1.id !== match.player2.id &&
        match.phase === "groups"
    )
  );

  const groupsCompleted = validGroups.filter((group) => {
    const groupValidMatches = group.matches.filter(
      (match) =>
        match.player1?.id &&
        match.player2?.id &&
        match.player1.id !== match.player2.id &&
        match.phase === "groups"
    );
    return (
      groupValidMatches.length > 0 &&
      groupValidMatches.every((match) => match.isCompleted)
    );
  }).length;

  const totalGroups = validGroups.length;
  const groupsProgress =
    totalGroups > 0
      ? Math.min(100, Math.round((groupsCompleted / totalGroups) * 100))
      : 0;

  console.log("📊 [STATS] Estatísticas recalculadas:", {
    totalMatches,
    groupMatches: groupMatches.length,
    knockoutMatches: knockoutMatches.length,
    mainKnockoutMatches: mainKnockoutMatches.length,
    secondDivMatches: secondDivMatches.length,
    completedMatches,
    progress,
    validGroups: totalGroups,
    groupsCompleted,
    groupsProgress,
  });

  return {
    totalMatches,
    completedMatches,
    pendingMatches: Math.max(0, totalMatches - completedMatches),
    progress,
    groupsCompleted,
    totalGroups,
    groupsProgress,
    // ✅ NOVO: Estatísticas detalhadas
    groupMatches: groupMatches.length,
    knockoutMatches: knockoutMatches.length,
    mainKnockoutMatches: mainKnockoutMatches.length,
    secondDivMatches: secondDivMatches.length,
    groupMatchesCompleted: groupMatches.filter((m) => m.isCompleted).length,
    knockoutMatchesCompleted: knockoutMatches.filter((m) => m.isCompleted)
      .length,
  };
};

// ✅ FUNÇÃO PARA CRIAR DADOS DE TESTE COMPLETOS
export const createTestChampionshipData = () => {
  // Lista de nomes realistas para teste
  const testAthletes = [
    "João Silva",
    "Maria Santos",
    "Pedro Oliveira",
    "Ana Costa",
    "Carlos Ferreira",
    "Lucia Rodrigues",
    "Bruno Almeida",
    "Fernanda Lima",
    "Rafael Santos",
    "Julia Pereira",
    "Diego Souza",
    "Camila Barbosa",
    "Lucas Martins",
    "Beatriz Castro",
    "Marcos Ribeiro",
    "Amanda Rocha",
    "Thiago Carvalho",
    "Leticia Gomes",
    "Rodrigo Dias",
    "Gabriela Nunes",
    "Anderson Moura",
    "Carolina Lopes",
    "Felipe Cardoso",
    "Renata Freitas",
  ];

  const config = {
    name: "Campeonato de Teste - TM Club",
    date: new Date(),
    groupSize: 4 as const,
    qualificationSpotsPerGroup: 2,
    groupsBestOf: 5 as const,
    knockoutBestOf: 5 as const,
    hasThirdPlace: true,
    hasRepechage: true,
  };

  const athletes = testAthletes.slice(0, 18).map((name, index) => ({
    id: `test-athlete-${index}`,
    name,
    isSeeded: index < 4, // Primeiros 4 são cabeças de chave
    seedNumber: index < 4 ? index + 1 : undefined,
  }));

  return { config, athletes };
};

// ✅ FUNÇÃO PARA GERAR RESULTADOS DE TESTE REALISTAS
export const generateTestMatchResult = (bestOf: 3 | 5 | 7 = 5) => {
  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  const sets: { player1Score: number; player2Score: number }[] = [];
  let player1Sets = 0;
  let player2Sets = 0;

  // Tipos de sets realistas
  const setTypes = [
    {
      type: "normal",
      weight: 0.5,
      scores: [
        [11, 8],
        [11, 6],
        [11, 9],
        [11, 7],
        [11, 5],
      ],
    },
    {
      type: "close",
      weight: 0.3,
      scores: [
        [11, 9],
        [12, 10],
        [13, 11],
        [14, 12],
      ],
    },
    {
      type: "tight",
      weight: 0.2,
      scores: [
        [15, 13],
        [16, 14],
        [17, 15],
        [18, 16],
      ],
    },
  ];

  const generateSet = () => {
    const random = Math.random();
    let cumulativeWeight = 0;
    let selectedType = setTypes[0];

    for (const type of setTypes) {
      cumulativeWeight += type.weight;
      if (random <= cumulativeWeight) {
        selectedType = type;
        break;
      }
    }

    const scores = selectedType.scores;
    const scoreIndex = Math.floor(Math.random() * scores.length);
    const [score1, score2] = scores[scoreIndex];

    // 50% chance de inverter o resultado
    if (Math.random() < 0.5) {
      return { player1Score: score1, player2Score: score2 };
    } else {
      return { player1Score: score2, player2Score: score1 };
    }
  };

  // Gerar sets até um jogador vencer
  while (player1Sets < setsToWin && player2Sets < setsToWin) {
    const set = generateSet();
    sets.push(set);

    if (set.player1Score > set.player2Score) {
      player1Sets++;
    } else {
      player2Sets++;
    }
  }

  return {
    sets,
    timeouts: {
      player1: Math.random() < 0.2,
      player2: Math.random() < 0.2,
    },
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

// ✅ NOVA FUNÇÃO: Gerenciar cache de abas do bracket
export const clearBracketTabCache = (championshipId?: string): void => {
  if (typeof window === "undefined") return;

  try {
    if (championshipId) {
      localStorage.removeItem(`bracket-tab-${championshipId}`);
    } else {
      // Limpar todos os caches de abas
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("bracket-tab-")) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.warn("Erro ao limpar cache de abas:", error);
  }
};

export const getBracketTabCache = (championshipId: string): string | null => {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(`bracket-tab-${championshipId}`);
  } catch (error) {
    console.warn("Erro ao recuperar cache de aba:", error);
    return null;
  }
};

export const setBracketTabCache = (
  championshipId: string,
  tab: string
): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`bracket-tab-${championshipId}`, tab);
  } catch (error) {
    console.warn("Erro ao salvar cache de aba:", error);
  }
};

// ✅ FUNÇÃO APRIMORADA: Gerenciar cache do store de forma segura
export const clearStoreCache = (): void => {
  try {
    // Acessar o store e limpar cache se disponível
    if (typeof window !== "undefined" && (window as any).championshipStore) {
      const store = (window as any).championshipStore;
      const state = store.getState();

      if (
        state.invalidateCache &&
        typeof state.invalidateCache === "function"
      ) {
        state.invalidateCache();
        console.log("✅ Cache do store limpo com sucesso");
      }
    }
  } catch (error) {
    console.warn("Erro ao limpar cache do store:", error);
  }
};

// ✅ NOVA FUNÇÃO: Converter qualquer valor para timestamp seguro
export const getSafeTimestamp = (date: any): number => {
  try {
    if (!date) return Date.now();

    // Se já é um número (timestamp)
    if (typeof date === "number" && !isNaN(date)) {
      return date;
    }

    // Se é um objeto Date válido
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.getTime();
    }

    // Se é uma string, tentar converter
    if (typeof date === "string") {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.getTime();
      }
    }

    // Fallback: usar timestamp atual
    return Date.now();
  } catch (error) {
    console.warn("getSafeTimestamp: Erro ao processar data:", error);
    return Date.now();
  }
};

// ✅ FUNÇÃO APRIMORADA: Formatação de data mais robusta
export const formatDateSafe = (date: any): string => {
  const safeDate = safeParseDate(date);

  if (!safeDate) {
    return "Data inválida";
  }

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(safeDate);
  } catch (error) {
    console.error("formatDateSafe: Erro ao formatar:", error);
    return "Data inválida";
  }
};

// ✅ NOVA FUNÇÃO: Validar se um objeto tem propriedades de data válidas
export const hasValidDateProperty = (
  obj: any,
  propertyName: string
): boolean => {
  try {
    const value = obj?.[propertyName];
    return safeParseDate(value) !== null;
  } catch {
    return false;
  }
};
