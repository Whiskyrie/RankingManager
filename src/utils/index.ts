import { Athlete, Match, SetResult, Championship } from "../types/index";

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

// Geração de chaves mata-mata com sistema de BYE para cabeças de chave - CORRIGIDO PARA CBTM/ITTF
export const generateMainKnockoutMatches = (
  qualifiedAthletes: Athlete[],
  bracketSize: number
): Match[] => {
  const matches: Match[] = [];

  console.log("\n" + "=".repeat(80));
  console.log("🚨 [DEBUG] FUNÇÃO generateMainKnockoutMatches CHAMADA!");
  console.log(
    `🏆 [KNOCKOUT] Gerando chaveamento CBTM/ITTF para ${qualifiedAthletes.length} atletas em bracket de ${bracketSize}`
  );
  console.log("📋 [DEBUG] Lista de atletas recebidos:");
  qualifiedAthletes.forEach((athlete, index) => {
    console.log(
      `   ${index + 1}. ${athlete.name}${
        athlete.isSeeded ? ` (Cabeça #${athlete.seedNumber})` : " (Sem seed)"
      }`
    );
  });
  console.log("=".repeat(80));

  // ✅ REGRA CBTM/ITTF: Validar número mínimo de atletas
  if (qualifiedAthletes.length < 2) {
    console.error("❌ [CBTM] Mínimo de 2 atletas necessário para mata-mata");
    return matches;
  }

  // ✅ REGRA CBTM/ITTF: Determinar estrutura de bracket correta
  let validBracketSize = 2;
  while (validBracketSize < qualifiedAthletes.length) {
    validBracketSize *= 2;
  }

  // Forçar uso do bracketSize correto
  bracketSize = validBracketSize;
  console.log(`🎯 [DEBUG] Bracket size corrigido: ${bracketSize}`);

  // ✅ REGRA CBTM/ITTF: Usar cabeças de chave já definidos previamente
  const seededAthletes = qualifiedAthletes
    .filter((a) => a.isSeeded && a.seedNumber)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999));

  const unseededAthletes = qualifiedAthletes.filter((a) => !a.isSeeded);

  console.log(
    `🎯 [CBTM] Cabeças de chave identificados: ${seededAthletes.length}`
  );
  console.log(`🎯 [CBTM] Atletas sem seed: ${unseededAthletes.length}`);

  // Log detalhado dos cabeças de chave
  console.log("🏆 [DEBUG] Lista detalhada de cabeças de chave:");
  seededAthletes.forEach((athlete) => {
    console.log(`   🏆 Cabeça #${athlete.seedNumber}: ${athlete.name}`);
  });

  console.log("👤 [DEBUG] Lista detalhada de atletas sem seed:");
  unseededAthletes.forEach((athlete, index) => {
    console.log(`   👤 ${index + 1}. ${athlete.name}`);
  });

  // ✅ REGRA CBTM/ITTF: Verificar se precisa implementar sistema de BYE
  const needsBye = qualifiedAthletes.length < bracketSize;

  if (needsBye) {
    return generateKnockoutWithBye(
      qualifiedAthletes,
      bracketSize,
      seededAthletes,
      unseededAthletes
    );
  }

  // ✅ REGRA CBTM/ITTF: Bracket completo - distribuição conforme padrão internacional
  return generateCompleteKnockoutBracket(
    qualifiedAthletes,
    bracketSize,
    seededAthletes,
    unseededAthletes
  );
};

// ✅ NOVA FUNÇÃO: Gerar bracket com sistema BYE conforme CBTM/ITTF (SIMPLIFICADA)
const generateKnockoutWithBye = (
  qualifiedAthletes: Athlete[],
  bracketSize: number,
  seededAthletes: Athlete[],
  unseededAthletes: Athlete[]
): Match[] => {
  console.log(
    `🎯 [CBTM-BYE] Sistema BYE ativado para ${qualifiedAthletes.length} atletas em bracket de ${bracketSize}`
  );

  // ✅ CORREÇÃO: Criar array com o tamanho do bracket e distribuir BYEs estrategicamente
  const orderedAthletes: (Athlete | null)[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // ✅ REGRA CBTM/ITTF: Distribuir cabeças de chave em posições específicas
  if (seededAthletes.length >= 1) {
    orderedAthletes[0] = seededAthletes[0]; // Cabeça #1 na posição 1
    console.log(`🏆 Cabeça #1: ${seededAthletes[0].name} → Posição 1`);
  }
  if (seededAthletes.length >= 2) {
    orderedAthletes[bracketSize - 1] = seededAthletes[1]; // Cabeça #2 na última posição
    console.log(
      `🏆 Cabeça #2: ${seededAthletes[1].name} → Posição ${bracketSize}`
    );
  }
  if (bracketSize >= 8 && seededAthletes.length >= 3) {
    const pos3 = Math.floor(bracketSize / 2); // Meio do bracket (chave inferior)
    orderedAthletes[pos3] = seededAthletes[2];
    console.log(
      `🏆 Cabeça #3: ${seededAthletes[2].name} → Posição ${pos3 + 1}`
    );
  }
  if (bracketSize >= 8 && seededAthletes.length >= 4) {
    const pos4 = Math.floor(bracketSize / 2) - 1; // Final da chave superior
    orderedAthletes[pos4] = seededAthletes[3];
    console.log(
      `🏆 Cabeça #4: ${seededAthletes[3].name} → Posição ${pos4 + 1}`
    );
  }

  // ✅ CORREÇÃO CRÍTICA: Distribuir BYEs estrategicamente ANTES dos atletas sem seed
  // Calcular quantos BYEs são necessários
  const byesNeeded = bracketSize - qualifiedAthletes.length;
  console.log(
    `🎯 [BYE-DISTRIBUTION] Precisamos de ${byesNeeded} BYEs para ${qualifiedAthletes.length} atletas`
  );

  // ✅ REGRA CBTM/ITTF: BYEs devem ser distribuídos para favorecer cabeças de chave
  // Posições estratégicas para BYEs (próximas aos cabeças de chave)
  const byePositions = [];

  if (byesNeeded > 0) {
    // BYE próximo ao cabeça #1 (posição 2 se disponível)
    if (orderedAthletes[1] === null) byePositions.push(1);

    // BYE próximo ao cabeça #2 (penúltima posição)
    if (orderedAthletes[bracketSize - 2] === null)
      byePositions.push(bracketSize - 2);

    // Se bracketSize >= 8, BYEs próximos aos cabeças #3 e #4
    if (bracketSize >= 8) {
      const pos3 = Math.floor(bracketSize / 2);
      const pos4 = Math.floor(bracketSize / 2) - 1;

      if (orderedAthletes[pos3 + 1] === null) byePositions.push(pos3 + 1);
      if (orderedAthletes[pos4 - 1] === null) byePositions.push(pos4 - 1);
    }

    // Adicionar mais posições se necessário (distribuição uniforme)
    for (let i = 0; i < bracketSize && byePositions.length < byesNeeded; i++) {
      if (orderedAthletes[i] === null && !byePositions.includes(i)) {
        byePositions.push(i);
      }
    }
  }

  // ✅ Marcar posições de BYE
  byePositions.slice(0, byesNeeded).forEach((pos, index) => {
    orderedAthletes[pos] = {
      id: `bye-${index + 1}`,
      name: "BYE",
      isVirtual: true,
    };
    console.log(`🎯 [BYE] BYE #${index + 1} → Posição ${pos + 1}`);
  });

  // ✅ Distribuir cabeças restantes em posições disponíveis
  let seedIndex = 4;
  for (
    let pos = 0;
    pos < bracketSize && seedIndex < seededAthletes.length;
    pos++
  ) {
    if (orderedAthletes[pos] === null) {
      orderedAthletes[pos] = seededAthletes[seedIndex];
      console.log(
        `🏆 Cabeça #${seededAthletes[seedIndex].seedNumber}: ${
          seededAthletes[seedIndex].name
        } → Posição ${pos + 1}`
      );
      seedIndex++;
    }
  }

  // ✅ Preencher posições restantes com atletas sem seed
  let unseededIndex = 0;
  for (
    let pos = 0;
    pos < bracketSize && unseededIndex < unseededAthletes.length;
    pos++
  ) {
    if (orderedAthletes[pos] === null) {
      orderedAthletes[pos] = unseededAthletes[unseededIndex];
      console.log(
        `👤 ${unseededAthletes[unseededIndex].name} → Posição ${pos + 1}`
      );
      unseededIndex++;
    }
  }

  // ✅ LOG FINAL: Mostrar estrutura completa
  console.log("\n📋 [BRACKET-STRUCTURE] Estrutura final do bracket:");
  orderedAthletes.forEach((athlete, index) => {
    if (athlete?.isVirtual) {
      console.log(`  ${index + 1}. [BYE]`);
    } else if (athlete) {
      console.log(
        `  ${index + 1}. ${athlete.name}${
          athlete.isSeeded ? ` (Cabeça #${athlete.seedNumber})` : ""
        }`
      );
    } else {
      console.log(`  ${index + 1}. [VAZIO]`);
    }
  });

  // ✅ GERAR TODAS AS PARTIDAS DO BRACKET
  const firstRound = Math.log2(bracketSize);
  const firstRoundName = getRoundName(firstRound);
  const matches: Match[] = [];
  let matchPosition = 0;

  console.log("\n⚡ [MATCHES] Gerando partidas da primeira rodada:");

  for (let i = 0; i < bracketSize; i += 2) {
    const athlete1 = orderedAthletes[i] || null;
    const athlete2 = orderedAthletes[i + 1] || null;

    if (athlete1 && athlete2) {
      if (athlete1.isVirtual && athlete2.isVirtual) {
        // Ambos são BYE - não criar partida
        console.log(
          `❌ [SKIP] Posições ${i + 1}-${i + 2}: Ambos BYE, partida ignorada`
        );
      } else if (athlete1.isVirtual || athlete2.isVirtual) {
        // Um é BYE - partida auto-completada
        const winner = athlete1.isVirtual ? athlete2 : athlete1;
        const byeMatch: Match = {
          id: `${firstRoundName
            .toLowerCase()
            .replace(/\s+/g, "-")}-bye-${matchPosition}-${Date.now()}`,
          player1Id: athlete1.id,
          player2Id: athlete2.id,
          player1: athlete1,
          player2: athlete2,
          sets: [],
          isCompleted: true,
          winnerId: winner.id,
          phase: "knockout",
          round: firstRoundName,
          position: matchPosition,
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
          completedAt: new Date(),
        };
        matches.push(byeMatch);
        console.log(
          `🎯 [BYE-MATCH] Partida ${matchPosition + 1}: ${athlete1.name} vs ${
            athlete2.name
          } → ${winner.name} avança`
        );
      } else {
        // Partida normal entre dois atletas reais
        const match = createMatch(
          athlete1,
          athlete2,
          firstRoundName,
          matchPosition
        );
        matches.push(match);
        console.log(
          `⚡ [NORMAL] Partida ${matchPosition + 1}: ${athlete1.name} vs ${
            athlete2.name
          }`
        );
      }
    } else {
      // Uma ou ambas posições vazias - criar TBD
      const athlete1Fixed = athlete1 || {
        id: "tbd1",
        name: "TBD",
        isVirtual: true,
      };
      const athlete2Fixed = athlete2 || {
        id: "tbd2",
        name: "TBD",
        isVirtual: true,
      };

      const tbdMatch: Match = {
        id: `${firstRoundName
          .toLowerCase()
          .replace(/\s+/g, "-")}-tbd-${matchPosition}-${Date.now()}`,
        player1Id: athlete1Fixed.id,
        player2Id: athlete2Fixed.id,
        player1: athlete1Fixed,
        player2: athlete2Fixed,
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: firstRoundName,
        position: matchPosition,
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };
      matches.push(tbdMatch);
      console.log(
        `⏳ [TBD] Partida ${matchPosition + 1}: ${athlete1Fixed.name} vs ${
          athlete2Fixed.name
        }`
      );
    }
    matchPosition++;
  }

  console.log(
    `✅ [CBTM-BYE] ${matches.length} partidas criadas para bracket de ${bracketSize} (${qualifiedAthletes.length} atletas reais, ${byesNeeded} BYEs)`
  );
  return matches;
};

// ✅ NOVA FUNÇÃO: Gerar bracket completo conforme CBTM/ITTF
const generateCompleteKnockoutBracket = (
  qualifiedAthletes: Athlete[],
  bracketSize: number,
  seededAthletes: Athlete[],
  unseededAthletes: Athlete[]
): Match[] => {
  const matches: Match[] = [];

  console.log(
    `🏆 [CBTM] Bracket completo - ${qualifiedAthletes.length} atletas`
  );

  // ✅ REGRA CBTM/ITTF: Distribuição padrão de cabeças de chave (MELHORADA)
  const orderedAthletes = distributeSeedsAccordingToCBTMImproved(
    bracketSize,
    seededAthletes,
    unseededAthletes
  );

  // Criar primeira rodada
  const rounds = Math.log2(bracketSize);
  const currentRoundName = getRoundName(rounds);

  let matchPosition = 0;
  for (let i = 0; i < orderedAthletes.length; i += 2) {
    if (orderedAthletes[i] && orderedAthletes[i + 1]) {
      const match = createMatch(
        orderedAthletes[i],
        orderedAthletes[i + 1],
        currentRoundName,
        matchPosition
      );
      matches.push(match);
      matchPosition++;
    }
  }

  return matches;
};

// ✅ NOVA FUNÇÃO: Distribuição mais robusta dos cabeças de chave conforme CBTM/ITTF
const distributeSeedsAccordingToCBTMImproved = (
  bracketSize: number,
  seededAthletes: Athlete[],
  unseededAthletes: Athlete[]
): Athlete[] => {
  const orderedAthletes: Athlete[] = Array.from(
    { length: bracketSize },
    () => null
  );

  console.log(
    `🎯 [CBTM-IMPROVED] Distribuindo ${seededAthletes.length} cabeças em bracket de ${bracketSize}`
  );

  // ✅ REGRA CBTM/ITTF: Posicionamento para garantir que cabeças só se encontrem na final
  if (seededAthletes.length >= 1) {
    orderedAthletes[0] = seededAthletes[0]; // Cabeça #1 sempre na posição 1
    console.log(
      `🎯 [CBTM-IMPROVED] Cabeça #1: ${seededAthletes[0].name} → Posição 1 (Chave Superior)`
    );
  }

  if (seededAthletes.length >= 2) {
    orderedAthletes[bracketSize - 1] = seededAthletes[1]; // Cabeça #2 sempre na última posição
    console.log(
      `🎯 [CBTM-IMPROVED] Cabeça #2: ${seededAthletes[1].name} → Posição ${bracketSize} (Chave Inferior)`
    );
  }

  // ✅ CORREÇÃO CRÍTICA: Para bracketSize >= 8, garantir separação adequada dos 4 principais cabeças
  if (bracketSize >= 8) {
    if (seededAthletes.length >= 3) {
      // Cabeça #3 vai para o início da segunda metade (chave inferior)
      const pos3 = Math.floor(bracketSize / 2);
      orderedAthletes[pos3] = seededAthletes[2];
      console.log(
        `🎯 [CBTM-IMPROVED] Cabeça #3: ${seededAthletes[2].name} → Posição ${
          pos3 + 1
        } (Início Chave Inferior)`
      );
    }

    if (seededAthletes.length >= 4) {
      // Cabeça #4 vai para o final da primeira metade (chave superior)
      const pos4 = Math.floor(bracketSize / 2) - 1;
      orderedAthletes[pos4] = seededAthletes[3];
      console.log(
        `🎯 [CBTM-IMPROVED] Cabeça #4: ${seededAthletes[3].name} → Posição ${
          pos4 + 1
        } (Final Chave Superior)`
      );
    }

    // ✅ Para cabeças 5-8: distribuir nos quartos restantes
    if (seededAthletes.length > 4) {
      const quarterSize = bracketSize / 4;
      const quarters = [
        Math.floor(quarterSize / 2), // 1º quarto (chave superior, primeira parte)
        Math.floor(quarterSize + quarterSize / 2), // 2º quarto (chave superior, segunda parte)
        Math.floor(2 * quarterSize + quarterSize / 2), // 3º quarto (chave inferior, primeira parte)
        Math.floor(3 * quarterSize + quarterSize / 2), // 4º quarto (chave inferior, segunda parte)
      ];

      for (let i = 4; i < Math.min(seededAthletes.length, 8); i++) {
        const seed = seededAthletes[i];
        const quarterIndex = (i - 4) % 4;
        let targetPos = quarters[quarterIndex];

        // Encontrar posição livre próxima
        while (targetPos < bracketSize && orderedAthletes[targetPos] !== null) {
          targetPos++;
        }

        if (targetPos < bracketSize) {
          orderedAthletes[targetPos] = seed;
          console.log(
            `🎯 [CBTM-IMPROVED] Cabeça #${seed.seedNumber}: ${
              seed.name
            } → Posição ${targetPos + 1} (Quarto ${quarterIndex + 1})`
          );
        }
      }
    }
  } else if (bracketSize === 4) {
    // Para bracketSize = 4, apenas 2 cabeças fazem sentido
    // #1 na posição 1, #2 na posição 4, #3 na posição 2, #4 na posição 3
    if (seededAthletes.length >= 3) {
      orderedAthletes[1] = seededAthletes[2];
      console.log(
        `🎯 [CBTM-IMPROVED] Cabeça #3: ${seededAthletes[2].name} → Posição 2`
      );
    }
    if (seededAthletes.length >= 4) {
      orderedAthletes[2] = seededAthletes[3];
      console.log(
        `🎯 [CBTM-IMPROVED] Cabeça #4: ${seededAthletes[3].name} → Posição 3`
      );
    }
  }

  // ✅ REGRA CBTM/ITTF: Embaralhar e distribuir não-cabeças nas posições restantes
  const shuffledUnseeded = [...unseededAthletes].sort(
    () => Math.random() - 0.5
  );
  let unseededIndex = 0;

  for (
    let i = 0;
    i < orderedAthletes.length && unseededIndex < shuffledUnseeded.length;
    i++
  ) {
    if (orderedAthletes[i] === null) {
      orderedAthletes[i] = shuffledUnseeded[unseededIndex++];
      console.log(
        `🎯 [CBTM-IMPROVED] Não-cabeça: ${orderedAthletes[i].name} → Posição ${
          i + 1
        }`
      );
    }
  }

  console.log(
    `✅ [CBTM-IMPROVED] Distribuição final completa para bracket de ${bracketSize}`
  );

  // ✅ LOG DETALHADO: Mostrar estrutura completa do bracket
  console.log(`📊 [CBTM-BRACKET] Estrutura final do bracket:`);
  const validAthletes = orderedAthletes.filter((athlete) => athlete !== null);
  const halfPoint = Math.ceil(validAthletes.length / 2);

  console.log(`🔵 [CHAVE SUPERIOR] (${halfPoint} atletas):`);
  for (let i = 0; i < halfPoint; i++) {
    if (validAthletes[i]) {
      const athlete = validAthletes[i];
      console.log(
        `   ${i + 1}. ${athlete.name}${
          athlete.isSeeded
            ? ` (Cabeça #${athlete.seedNumber})`
            : " (Não-cabeça)"
        }`
      );
    }
  }

  console.log(
    `🔴 [CHAVE INFERIOR] (${validAthletes.length - halfPoint} atletas):`
  );
  for (let i = halfPoint; i < validAthletes.length; i++) {
    if (validAthletes[i]) {
      const athlete = validAthletes[i];
      console.log(
        `   ${i + 1}. ${athlete.name}${
          athlete.isSeeded
            ? ` (Cabeça #${athlete.seedNumber})`
            : " (Não-cabeça)"
        }`
      );
    }
  }

  return validAthletes;
};

// ✅ FUNÇÃO AUXILIAR: Criar partida padronizada
const createMatch = (
  player1: Athlete,
  player2: Athlete,
  round: string,
  position: number
): Match => {
  const match: Match = {
    id: `knockout-${round
      .toLowerCase()
      .replace(/\s+/g, "-")}-${position}-${Date.now()}`,
    player1Id: player1.id,
    player2Id: player2.id,
    player1: player1,
    player2: player2,
    sets: [],
    isCompleted: false,
    phase: "knockout",
    round: round,
    position: position,
    timeoutsUsed: {
      player1: false,
      player2: false,
    },
    createdAt: new Date(),
  };

  console.log(
    `⚡ [CBTM] Partida criada: ${player1.name}${
      player1.isSeeded ? ` (#${player1.seedNumber})` : ""
    } vs ${player2.name}${player2.isSeeded ? ` (#${player2.seedNumber})` : ""}`
  );

  return match;
};

// ✅ CORREÇÃO CBTM/ITTF: Sistema de geração de próximas rodadas conforme regras oficiais
export const generateNextRoundMatches = (
  currentRoundMatches: Match[],
  round: string,
  allAthletes: Athlete[],
  bestOf: 3 | 5 | 7 = 5,
  championshipAthletes?: Athlete[]
): Match[] => {
  const matches: Match[] = [];

  // ✅ REGRA CBTM/ITTF: Verificar se todas as partidas foram completadas
  const completedMatches = currentRoundMatches.filter((m) => m.isCompleted);
  if (completedMatches.length !== currentRoundMatches.length) {
    console.log(
      `❌ [CBTM] Rodada anterior incompleta (${completedMatches.length}/${currentRoundMatches.length})`
    );
    return matches;
  }

  console.log(`✅ [CBTM] Gerando próxima rodada: ${round}`);

  // ✅ REGRA CBTM/ITTF: Lógica especial para disputa de terceiro lugar
  if (round.includes("3º Lugar")) {
    return generateThirdPlaceMatch(
      completedMatches,
      round,
      allAthletes,
      bestOf
    );
  }

  // ✅ REGRA CBTM/ITTF: Gerar rodadas normais (Final, Semifinal, etc.)
  return generateNormalRoundMatches(
    completedMatches,
    round,
    allAthletes,
    bestOf,
    championshipAthletes
  );
};

// ✅ NOVA FUNÇÃO: Gerar disputa de terceiro lugar conforme CBTM/ITTF
const generateThirdPlaceMatch = (
  completedMatches: Match[],
  round: string,
  allAthletes: Athlete[],
  bestOf: 3 | 5 | 7
): Match[] => {
  console.log("🥉 [CBTM] Gerando disputa de terceiro lugar");

  const loserIds: string[] = [];

  // ✅ REGRA CBTM/ITTF: Usar perdedores das semifinais
  completedMatches.forEach((match) => {
    let winnerId = match.winnerId;
    if (!winnerId && match.sets && match.sets.length > 0) {
      winnerId = getMatchWinner(
        match.sets,
        bestOf,
        match.player1Id,
        match.player2Id
      );
    }

    if (winnerId) {
      const loserId =
        winnerId === match.player1Id ? match.player2Id : match.player1Id;
      if (loserId) {
        loserIds.push(loserId);
        const loserName =
          winnerId === match.player1Id
            ? match.player2?.name
            : match.player1?.name;
        console.log(`🥉 [CBTM] Perdedor semifinal: ${loserName}`);
      }
    }
  });

  // Criar partida de 3º lugar
  if (loserIds.length >= 2) {
    const loser1 = allAthletes.find((a) => a.id === loserIds[0]);
    const loser2 = allAthletes.find((a) => a.id === loserIds[1]);

    if (loser1 && loser2) {
      const thirdPlaceMatch: Match = {
        id: `third-place-${Date.now()}-${Math.random()
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
        isThirdPlace: true,
        position: 0,
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };

      console.log(
        `✅ [CBTM] Disputa 3º lugar: ${loser1.name} vs ${loser2.name}`
      );
      return [thirdPlaceMatch];
    }
  }

  console.log("❌ [CBTM] Não foi possível gerar disputa de 3º lugar");
  return [];
};

// ✅ NOVA FUNÇÃO: Gerar rodadas normais conforme CBTM/ITTF (MELHORADA)
const generateNormalRoundMatches = (
  completedMatches: Match[],
  round: string,
  allAthletes: Athlete[],
  bestOf: 3 | 5 | 7,
  championshipAthletes?: Athlete[]
): Match[] => {
  console.log(`🏆 [CBTM] Gerando rodada: ${round}`);

  // ✅ CORREÇÃO DINÂMICA: Coletar vencedores em ordem sequencial de posição
  const winners: string[] = [];

  // Ordenar partidas por posição para manter sequência do bracket
  const sortedMatches = [...completedMatches].sort(
    (a, b) => (a.position || 0) - (b.position || 0)
  );

  // Coletar todos os vencedores das partidas completadas
  sortedMatches.forEach((match) => {
    let winnerId = match.winnerId;

    if (!winnerId && match.sets && match.sets.length > 0) {
      winnerId = getMatchWinner(
        match.sets,
        bestOf,
        match.player1Id,
        match.player2Id
      );
    }

    if (winnerId) {
      winners.push(winnerId);
      const winner = allAthletes.find((a) => a.id === winnerId);
      console.log(
        `✅ [CBTM-BRACKET] Vencedor posição ${match.position}: ${winner?.name}${
          winner?.isSeeded ? ` (#${winner.seedNumber})` : ""
        }`
      );
    }
  });

  // ✅ SISTEMA DINÂMICO DE BYE: Calcular se precisamos de atletas adicionais
  const targetRoundLevel = getCurrentRoundLevel(round);
  const expectedAthletes = Math.pow(2, targetRoundLevel);
  const missingAthletes = expectedAthletes - winners.length;

  console.log(
    `🎯 [CBTM] Rodada ${round}: ${winners.length} vencedores, precisamos de ${expectedAthletes} total`
  );

  // Se temos atletas faltando, aplicar sistema BYE dinâmico
  if (missingAthletes > 0 && championshipAthletes) {
    const athletesWithBye = findBestAthletesForBye(
      winners,
      missingAthletes,
      championshipAthletes,
      completedMatches
    );

    athletesWithBye.forEach((athleteId) => {
      const athlete = allAthletes.find((a) => a.id === athleteId);
      if (athlete) {
        winners.push(athleteId);
        console.log(
          `🎯 [CBTM-BYE] Adicionado automaticamente: ${athlete.name}${
            athlete.isSeeded ? ` (#${athlete.seedNumber})` : ""
          }`
        );
      }
    });
  }

  // ✅ SISTEMA FLEXÍVEL: Se número ímpar, dar BYE ao melhor posicionado
  const { playingAthletes, byeAthlete } = handleNextRoundBye(
    winners,
    allAthletes
  );

  if (byeAthlete) {
    console.log(`🎯 [CBTM] BYE para próxima rodada: ${byeAthlete.name}`);
  }

  // Criar partidas mantendo ordem sequencial
  return createMatchesForRound(playingAthletes, round, allAthletes);
};

// ✅ NOVA FUNÇÃO: Encontrar melhores atletas para BYE dinâmico
const findBestAthletesForBye = (
  winners: string[],
  missingAthletes: number,
  championshipAthletes: Athlete[],
  completedMatches: Match[]
): string[] => {
  console.log(`🎯 [CBTM-BYE] Buscando ${missingAthletes} atletas para BYE`);

  // Atletas que já jogaram nesta rodada (vencedores ou perdedores)
  const playersInCurrentRound = new Set([
    ...winners,
    ...completedMatches.flatMap((match) => [match.player1Id, match.player2Id]),
  ]);

  // Candidatos elegíveis para BYE (não jogaram ainda nesta rodada)
  const eligibleForBye = championshipAthletes
    .filter((athlete) => !playersInCurrentRound.has(athlete.id))
    .sort((a, b) => {
      // Prioridade: cabeças de chave primeiro, depois por ranking/seed
      if (a.isSeeded && !b.isSeeded) return -1;
      if (!a.isSeeded && b.isSeeded) return 1;

      if (a.isSeeded && b.isSeeded) {
        return (a.seedNumber || 999) - (b.seedNumber || 999);
      }

      // Para não-cabeças, ordem alfabética como critério final
      return a.name.localeCompare(b.name);
    });

  const selectedForBye = eligibleForBye.slice(0, missingAthletes);

  selectedForBye.forEach((athlete) => {
    console.log(
      `🎯 [CBTM-BYE] Selecionado: ${athlete.name}${
        athlete.isSeeded
          ? ` (Cabeça #${athlete.seedNumber})`
          : " (Classificado)"
      }`
    );
  });

  return selectedForBye.map((athlete) => athlete.id);
};

// ✅ FUNÇÃO AUXILIAR: Determinar o nível da rodada no chaveamento
const getCurrentRoundLevel = (round: string): number => {
  if (round.includes("Final")) return 1;
  if (round.includes("Semifinal")) return 2;
  if (round.includes("Quartas")) return 3;
  if (round.includes("Oitavas")) return 4;
  if (round.includes("Décimo-sextos")) return 5;
  return 6; // Para rodadas maiores
};

// ✅ NOVA FUNÇÃO: Gerenciar BYE para próxima rodada conforme CBTM/ITTF (MELHORADA)
const handleNextRoundBye = (
  allAdvancingAthletes: string[],
  allAthletes: Athlete[]
): { playingAthletes: string[]; byeAthlete: Athlete | null } => {
  if (allAdvancingAthletes.length % 2 === 0) {
    return { playingAthletes: allAdvancingAthletes, byeAthlete: null };
  }

  console.log(
    `🎯 [CBTM-BYE] Número ímpar de atletas (${allAdvancingAthletes.length}), aplicando BYE`
  );

  // ✅ REGRA CBTM/ITTF: Melhor cabeça de chave recebe BYE
  const advancingAthleteObjects = allAthletes.filter((a) =>
    allAdvancingAthletes.includes(a.id)
  );

  const bestSeeded = advancingAthleteObjects
    .filter((a) => a.isSeeded && a.seedNumber)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999))[0];

  if (bestSeeded) {
    const playingAthletes = allAdvancingAthletes.filter(
      (id) => id !== bestSeeded.id
    );
    console.log(
      `🎯 [CBTM-BYE] BYE para: ${bestSeeded.name} (Cabeça #${bestSeeded.seedNumber})`
    );
    return { playingAthletes, byeAthlete: bestSeeded };
  }

  // Se não há cabeças de chave, dar BYE ao primeiro atleta (manter ordem)
  const [byeId, ...playingIds] = allAdvancingAthletes;
  const byeAthlete = allAthletes.find((a) => a.id === byeId) || null;

  if (byeAthlete) {
    console.log(
      `🎯 [CBTM-BYE] BYE para: ${byeAthlete.name} (primeiro da lista)`
    );
  }

  return { playingAthletes: playingIds, byeAthlete };
};

// ✅ NOVA FUNÇÃO: Criar partidas para rodada conforme CBTM/ITTF (MELHORADA)
const createMatchesForRound = (
  playingAthletes: string[],
  round: string,
  allAthletes: Athlete[]
): Match[] => {
  const matches: Match[] = [];

  console.log(
    `🎯 [CBTM-BRACKET] Criando ${round} com ${playingAthletes.length} atletas`
  );

  // ✅ MELHORIA: Log detalhado dos confrontos que serão criados
  for (let i = 0; i < playingAthletes.length; i += 2) {
    if (playingAthletes[i] && playingAthletes[i + 1]) {
      const athlete1 = allAthletes.find((a) => a.id === playingAthletes[i]);
      const athlete2 = allAthletes.find((a) => a.id === playingAthletes[i + 1]);

      if (athlete1 && athlete2) {
        console.log(
          `🎯 [CBTM-BRACKET] Partida ${i / 2 + 1}: ${athlete1.name}${
            athlete1.isSeeded ? ` (#${athlete1.seedNumber})` : ""
          } vs ${athlete2.name}${
            athlete2.isSeeded ? ` (#${athlete2.seedNumber})` : ""
          }`
        );
      }
    }
  }

  // Criar as partidas efetivamente
  for (let i = 0; i < playingAthletes.length; i += 2) {
    if (playingAthletes[i] && playingAthletes[i + 1]) {
      const athlete1 = allAthletes.find((a) => a.id === playingAthletes[i]);
      const athlete2 = allAthletes.find((a) => a.id === playingAthletes[i + 1]);

      if (athlete1 && athlete2) {
        const match: Match = {
          id: `${round
            .toLowerCase()
            .replace(/\s+/g, "-")}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 5)}-${i / 2}`,
          player1Id: athlete1.id,
          player2Id: athlete2.id,
          player1: athlete1,
          player2: athlete2,
          sets: [],
          isCompleted: false,
          phase: "knockout",
          round: round,
          position: i / 2,
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        };

        matches.push(match);
      }
    }
  }

  console.log(
    `✅ [CBTM-BRACKET] ${matches.length} partidas criadas para ${round}`
  );
  return matches;
};

// ✅ NOVA FUNÇÃO: Gerar resultado de teste para partidas
export const generateTestMatchResult = (
  bestOf: number
): {
  sets: { player1Score: number; player2Score: number }[];
  timeouts: { player1: boolean; player2: boolean };
} => {
  const setsToWin = Math.ceil(bestOf / 2);
  const sets: { player1Score: number; player2Score: number }[] = [];

  let player1Wins = 0;
  let player2Wins = 0;

  // Gerar sets até que um jogador ganhe
  while (player1Wins < setsToWin && player2Wins < setsToWin) {
    // Gerar pontuação aleatória para um set
    const isPlayer1Winner = Math.random() > 0.5;
    let player1Score: number;
    let player2Score: number;

    if (isPlayer1Winner) {
      // Player 1 ganha o set
      player1Score = 11;
      player2Score = Math.floor(Math.random() * 10); // 0-9

      // Chance de deuce (10-10 indo para 12-10, 13-11, etc.)
      if (Math.random() > 0.8) {
        const extraPoints = Math.floor(Math.random() * 3) + 1; // 1-3 pontos extras
        player1Score = 10 + extraPoints + 1;
        player2Score = 10 + extraPoints - 1;
      }

      player1Wins++;
    } else {
      // Player 2 ganha o set
      player2Score = 11;
      player1Score = Math.floor(Math.random() * 10); // 0-9

      // Chance de deuce
      if (Math.random() > 0.8) {
        const extraPoints = Math.floor(Math.random() * 3) + 1;
        player2Score = 10 + extraPoints + 1;
        player1Score = 10 + extraPoints - 1;
      }

      player2Wins++;
    }

    sets.push({ player1Score, player2Score });
  }

  // Gerar timeouts aleatórios (baixa probabilidade)
  const timeouts = {
    player1: Math.random() > 0.9, // 10% chance
    player2: Math.random() > 0.9, // 10% chance
  };

  return { sets, timeouts };
};

// ✅ CORREÇÃO CBTM/ITTF: Geração da segunda divisão conforme regras oficiais - CORRIGIDA
// Esta função agora aplica os mesmos princípios de distribuição de BYE da primeira divisão:
// 1. Ex-cabeças de chave são posicionados estrategicamente
// 2. BYEs são distribuídos próximos aos melhores atletas (ex-cabeças)
// 3. Partidas com BYE são auto-completadas (mesma lógica da primeira divisão)
export const generateSecondDivisionMatches = (athletes: Athlete[]): Match[] => {
  const matches: Match[] = [];

  console.log("\n🥈 [CBTM-2ND] === GERAÇÃO SEGUNDA DIVISÃO CBTM/ITTF ===");
  console.log(`🥈 [CBTM-2ND] Atletas eliminados: ${athletes.length}`);

  // ✅ LOG CRÍTICO: Verificar se os atletas estão corretos
  console.log("🔍 [CBTM-2ND] Atletas recebidos para segunda divisão:");
  athletes.forEach((athlete, index) => {
    console.log(
      `   ${index + 1}. ${athlete.name}${
        athlete.isSeeded ? ` (ex-Cabeça #${athlete.seedNumber})` : ""
      }`
    );
  });

  // ✅ REGRA CBTM/ITTF: Validação mínima
  if (!athletes || athletes.length < 2) {
    console.log("❌ [CBTM-2ND] Insuficientes atletas para segunda divisão");
    return matches;
  }

  // ✅ REGRA CBTM/ITTF: Determinar estrutura de bracket adequada
  let bracketSize = 2;
  while (bracketSize < athletes.length) {
    bracketSize *= 2;
  }

  console.log(
    `🎯 [CBTM-2ND] Bracket determinado: ${bracketSize} posições para ${athletes.length} atletas`
  );

  // ✅ REGRA CBTM/ITTF: Ordenação por critério de eliminação (último eliminado = melhor posicionado)
  const orderedAthletes = orderAthletesForSecondDivision(athletes);

  // ✅ REGRA CBTM/ITTF: Aplicar sistema BYE se necessário
  const needsBye = athletes.length < bracketSize;

  if (needsBye) {
    return generateSecondDivisionWithBye(orderedAthletes, bracketSize);
  }

  // ✅ REGRA CBTM/ITTF: Bracket completo para segunda divisão
  return generateCompleteSecondDivisionBracket(orderedAthletes, bracketSize);
};

// ✅ NOVA FUNÇÃO: Ordenar atletas para segunda divisão conforme CBTM/ITTF - CORRIGIDA
const orderAthletesForSecondDivision = (athletes: Athlete[]): Athlete[] => {
  // ✅ REGRA CBTM/ITTF: Atletas são ordenados por:
  // 1. Status de cabeça de chave (ex-cabeças primeiro) - CORRIGIDO
  // 2. Ranking original (seed number para ex-cabeças)
  // 3. Ordem alfabética como critério final

  console.log(`🔍 [2ND-ORDER] Ordenando ${athletes.length} atletas eliminados`);

  const ordered = [...athletes].sort((a, b) => {
    // ✅ CORREÇÃO CRÍTICA: Priorizar ex-cabeças de chave (mesmo critério da primeira divisão)
    if (a.isSeeded && !b.isSeeded) {
      console.log(
        `🏆 [2ND-ORDER] ${a.name} (ex-cabeça) tem prioridade sobre ${b.name}`
      );
      return -1;
    }
    if (!a.isSeeded && b.isSeeded) {
      console.log(
        `🏆 [2ND-ORDER] ${b.name} (ex-cabeça) tem prioridade sobre ${a.name}`
      );
      return 1;
    }

    // Entre ex-cabeças, ordenar por seed number original
    if (a.isSeeded && b.isSeeded) {
      const seedA = a.seedNumber || 999;
      const seedB = b.seedNumber || 999;
      if (seedA !== seedB) {
        console.log(
          `🏆 [2ND-ORDER] Ex-cabeça #${seedA} (${a.name}) vs Ex-cabeça #${seedB} (${b.name})`
        );
        return seedA - seedB;
      }
    }

    // Para não-cabeças ou ex-cabeças com mesmo seed, ordem alfabética
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) {
      console.log(`👤 [2ND-ORDER] Ordem alfabética: ${a.name} vs ${b.name}`);
    }
    return nameCompare;
  });

  console.log("📋 [2ND-ORDER] Ordem final dos atletas eliminados:");
  ordered.forEach((athlete, index) => {
    console.log(
      `   ${index + 1}. ${athlete.name}${
        athlete.isSeeded
          ? ` (ex-Cabeça #${athlete.seedNumber})`
          : " (sem seed original)"
      }`
    );
  });

  return ordered;
};

// ✅ NOVA FUNÇÃO: Gerar segunda divisão com BYE conforme CBTM/ITTF - CORRIGIDA
const generateSecondDivisionWithBye = (
  athletes: Athlete[],
  bracketSize: number
): Match[] => {
  const byeCount = bracketSize - athletes.length;
  console.log(`🎯 [CBTM-2ND] Sistema BYE ativado: ${byeCount} passes livres`);

  // ✅ CORREÇÃO: Aplicar mesma lógica da primeira divisão
  const orderedAthletes: (Athlete | null)[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // ✅ REGRA CBTM/ITTF: Distribuir ex-cabeças de chave em posições estratégicas
  const formerSeeds = athletes
    .filter((a) => a.isSeeded)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999));
  const nonSeeds = athletes.filter((a) => !a.isSeeded);

  // Posicionar principais ex-cabeças
  if (formerSeeds.length >= 1) {
    orderedAthletes[0] = formerSeeds[0]; // Ex-cabeça #1 na posição 1
    console.log(
      `🏆 [2ND-BYE] Ex-Cabeça #1: ${formerSeeds[0].name} → Posição 1`
    );
  }
  if (formerSeeds.length >= 2) {
    orderedAthletes[bracketSize - 1] = formerSeeds[1]; // Ex-cabeça #2 na última posição
    console.log(
      `🏆 [2ND-BYE] Ex-Cabeça #2: ${formerSeeds[1].name} → Posição ${bracketSize}`
    );
  }
  if (bracketSize >= 8 && formerSeeds.length >= 3) {
    const pos3 = Math.floor(bracketSize / 2);
    orderedAthletes[pos3] = formerSeeds[2];
    console.log(
      `🏆 [2ND-BYE] Ex-Cabeça #3: ${formerSeeds[2].name} → Posição ${pos3 + 1}`
    );
  }
  if (bracketSize >= 8 && formerSeeds.length >= 4) {
    const pos4 = Math.floor(bracketSize / 2) - 1;
    orderedAthletes[pos4] = formerSeeds[3];
    console.log(
      `🏆 [2ND-BYE] Ex-Cabeça #4: ${formerSeeds[3].name} → Posição ${pos4 + 1}`
    );
  }

  // ✅ CORREÇÃO CRÍTICA: Distribuir BYEs estrategicamente próximos aos ex-cabeças
  const byePositions = [];
  if (byeCount > 0) {
    // BYE próximo ao ex-cabeça #1
    if (orderedAthletes[1] === null) byePositions.push(1);

    // BYE próximo ao ex-cabeça #2
    if (orderedAthletes[bracketSize - 2] === null)
      byePositions.push(bracketSize - 2);

    // BYEs próximos aos ex-cabeças #3 e #4 se bracket >= 8
    if (bracketSize >= 8) {
      const pos3 = Math.floor(bracketSize / 2);
      const pos4 = Math.floor(bracketSize / 2) - 1;

      if (orderedAthletes[pos3 + 1] === null) byePositions.push(pos3 + 1);
      if (orderedAthletes[pos4 - 1] === null) byePositions.push(pos4 - 1);
    }

    // Preencher posições restantes para BYEs
    for (let i = 0; i < bracketSize && byePositions.length < byeCount; i++) {
      if (orderedAthletes[i] === null && !byePositions.includes(i)) {
        byePositions.push(i);
      }
    }
  }

  // ✅ Marcar posições de BYE
  byePositions.slice(0, byeCount).forEach((pos, index) => {
    orderedAthletes[pos] = {
      id: `bye-2nd-${index + 1}`,
      name: "BYE",
      isVirtual: true,
    };
    console.log(`🎯 [2ND-BYE] BYE #${index + 1} → Posição ${pos + 1}`);
  });

  // ✅ Distribuir ex-cabeças restantes
  let seedIndex = 4;
  for (
    let pos = 0;
    pos < bracketSize && seedIndex < formerSeeds.length;
    pos++
  ) {
    if (orderedAthletes[pos] === null) {
      orderedAthletes[pos] = formerSeeds[seedIndex];
      console.log(
        `� [2ND-BYE] Ex-Cabeça #${formerSeeds[seedIndex].seedNumber}: ${
          formerSeeds[seedIndex].name
        } → Posição ${pos + 1}`
      );
      seedIndex++;
    }
  }

  // ✅ Preencher com não-cabeças
  let nonSeedIndex = 0;
  for (
    let pos = 0;
    pos < bracketSize && nonSeedIndex < nonSeeds.length;
    pos++
  ) {
    if (orderedAthletes[pos] === null) {
      orderedAthletes[pos] = nonSeeds[nonSeedIndex];
      console.log(
        `👤 [2ND-BYE] ${nonSeeds[nonSeedIndex].name} → Posição ${pos + 1}`
      );
      nonSeedIndex++;
    }
  }

  // ✅ LOG FINAL: Estrutura do bracket da segunda divisão
  console.log("\n📋 [2ND-BRACKET] Estrutura final da segunda divisão:");
  orderedAthletes.forEach((athlete, index) => {
    if (athlete?.isVirtual) {
      console.log(`  ${index + 1}. [BYE]`);
    } else if (athlete) {
      console.log(
        `  ${index + 1}. ${athlete.name}${
          athlete.isSeeded ? ` (ex-Cabeça #${athlete.seedNumber})` : ""
        }`
      );
    } else {
      console.log(`  ${index + 1}. [VAZIO]`);
    }
  });

  // ✅ GERAR PARTIDAS INCLUINDO AUTO-COMPLETADAS PARA BYE
  const rounds = Math.log2(bracketSize);
  const firstRoundName = getRoundNameForSecondDivision(rounds);
  const matches: Match[] = [];
  let matchPosition = 0;

  console.log("\n⚡ [2ND-MATCHES] Gerando partidas da segunda divisão:");

  for (let i = 0; i < bracketSize; i += 2) {
    const athlete1 = orderedAthletes[i] || null;
    const athlete2 = orderedAthletes[i + 1] || null;

    if (athlete1 && athlete2) {
      if (athlete1.isVirtual && athlete2.isVirtual) {
        // Ambos são BYE - não criar partida
        console.log(
          `❌ [2ND-SKIP] Posições ${i + 1}-${
            i + 2
          }: Ambos BYE, partida ignorada`
        );
      } else if (athlete1.isVirtual || athlete2.isVirtual) {
        // Um é BYE - partida auto-completada
        const winner = athlete1.isVirtual ? athlete2 : athlete1;
        const byeMatch: Match = {
          id: `second-div-${firstRoundName
            .toLowerCase()
            .replace(/\s+/g, "-")}-bye-${matchPosition}-${Date.now()}`,
          player1Id: athlete1.id,
          player2Id: athlete2.id,
          player1: athlete1,
          player2: athlete2,
          sets: [],
          isCompleted: true,
          winnerId: winner.id,
          phase: "knockout",
          round: firstRoundName,
          position: matchPosition,
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
          completedAt: new Date(),
        };
        matches.push(byeMatch);
        console.log(
          `🎯 [2ND-BYE-MATCH] Partida ${matchPosition + 1}: ${
            athlete1.name
          } vs ${athlete2.name} → ${winner.name} avança`
        );
      } else {
        // Partida normal entre dois atletas reais
        const match: Match = {
          id: `second-div-${firstRoundName
            .toLowerCase()
            .replace(/\s+/g, "-")}-${matchPosition}-${Date.now()}`,
          player1Id: athlete1.id,
          player2Id: athlete2.id,
          player1: athlete1,
          player2: athlete2,
          sets: [],
          isCompleted: false,
          phase: "knockout",
          round: firstRoundName,
          position: matchPosition,
          timeoutsUsed: { player1: false, player2: false },
          createdAt: new Date(),
        };
        matches.push(match);
        console.log(
          `⚡ [2ND-NORMAL] Partida ${matchPosition + 1}: ${athlete1.name} vs ${
            athlete2.name
          }`
        );
      }
    }
    matchPosition++;
  }

  console.log(
    `✅ [CBTM-2ND] ${matches.length} partidas criadas para segunda divisão (${athletes.length} atletas reais, ${byeCount} BYEs)`
  );
  return matches;
};

// ✅ NOVA FUNÇÃO: Gerar bracket completo para segunda divisão - CORRIGIDA
const generateCompleteSecondDivisionBracket = (
  athletes: Athlete[],
  bracketSize: number
): Match[] => {
  console.log(
    `🥈 [CBTM-2ND] Bracket completo - todos os ${athletes.length} atletas jogarão`
  );

  // ✅ CORREÇÃO: Aplicar mesma distribuição estratégica da primeira divisão
  const distributedAthletes = distributeAthletesForSecondDivision(
    athletes,
    bracketSize
  );

  const rounds = Math.log2(bracketSize);
  const currentRoundName = getRoundNameForSecondDivision(rounds);

  // ✅ CORREÇÃO: Usar função de criação que segue padrão da primeira divisão
  return createSecondDivisionMatches(distributedAthletes, currentRoundName);
};

// ✅ NOVA FUNÇÃO: Distribuir atletas na segunda divisão conforme CBTM/ITTF - CORRIGIDA
const distributeAthletesForSecondDivision = (
  athletes: Athlete[],
  bracketSize: number
): Athlete[] => {
  const distributed: Athlete[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // ✅ REGRA CBTM/ITTF: Separar ex-cabeças de chave dos demais (mesma lógica da primeira divisão)
  const formerSeeds = athletes
    .filter((a) => a.isSeeded)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999));
  const others = athletes.filter((a) => !a.isSeeded);

  console.log(
    `🔍 [2ND-DIST] Distribuindo ${athletes.length} atletas em bracket de ${bracketSize}`
  );
  console.log(`🏆 [2ND-DIST] Ex-cabeças de chave: ${formerSeeds.length}`);
  console.log(`👤 [2ND-DIST] Outros atletas: ${others.length}`);

  // ✅ CORREÇÃO: Aplicar distribuição estratégica igual à primeira divisão
  if (formerSeeds.length >= 1) {
    distributed[0] = formerSeeds[0]; // Ex-cabeça #1 na posição 1
    console.log(
      `🏆 [2ND-DIST] Ex-Cabeça #1: ${formerSeeds[0].name} → Posição 1`
    );
  }

  if (formerSeeds.length >= 2) {
    distributed[bracketSize - 1] = formerSeeds[1]; // Ex-cabeça #2 na última posição
    console.log(
      `🏆 [2ND-DIST] Ex-Cabeça #2: ${formerSeeds[1].name} → Posição ${bracketSize}`
    );
  }

  if (bracketSize >= 8) {
    if (formerSeeds.length >= 3) {
      // Ex-cabeça #3 vai para o início da segunda metade (chave inferior)
      const pos3 = Math.floor(bracketSize / 2);
      distributed[pos3] = formerSeeds[2];
      console.log(
        `🏆 [2ND-DIST] Ex-Cabeça #3: ${formerSeeds[2].name} → Posição ${
          pos3 + 1
        } (Início Chave Inferior)`
      );
    }

    if (formerSeeds.length >= 4) {
      // Ex-cabeça #4 vai para o final da primeira metade (chave superior)
      const pos4 = Math.floor(bracketSize / 2) - 1;
      distributed[pos4] = formerSeeds[3];
      console.log(
        `🏆 [2ND-DIST] Ex-Cabeça #4: ${formerSeeds[3].name} → Posição ${
          pos4 + 1
        } (Final Chave Superior)`
      );
    }

    // ✅ Para ex-cabeças 5-8: distribuir nos quartos restantes
    if (formerSeeds.length > 4) {
      const quarterSize = bracketSize / 4;
      const quarters = [
        Math.floor(quarterSize / 2), // 1º quarto (chave superior, primeira parte)
        Math.floor(quarterSize + quarterSize / 2), // 2º quarto (chave superior, segunda parte)
        Math.floor(bracketSize / 2 + quarterSize / 2), // 3º quarto (chave inferior, primeira parte)
        Math.floor(bracketSize / 2 + quarterSize + quarterSize / 2), // 4º quarto (chave inferior, segunda parte)
      ];

      for (let i = 4; i < Math.min(8, formerSeeds.length); i++) {
        const quarterIndex = i - 4;
        const targetPos = quarters[quarterIndex];

        if (targetPos < bracketSize && distributed[targetPos] === null) {
          distributed[targetPos] = formerSeeds[i];
          console.log(
            `🏆 [2ND-DIST] Ex-Cabeça #${formerSeeds[i].seedNumber}: ${
              formerSeeds[i].name
            } → Posição ${targetPos + 1} (Quarto ${quarterIndex + 1})`
          );
        }
      }
    }
  }

  // ✅ Distribuir ex-cabeças restantes em posições disponíveis
  const remainingSeeds = formerSeeds.slice(bracketSize >= 8 ? 8 : 4);
  let seedIndex = 0;
  for (
    let i = 0;
    i < distributed.length && seedIndex < remainingSeeds.length;
    i++
  ) {
    if (distributed[i] === null) {
      distributed[i] = remainingSeeds[seedIndex];
      console.log(
        `🏆 [2ND-DIST] Ex-Cabeça #${remainingSeeds[seedIndex].seedNumber}: ${
          remainingSeeds[seedIndex].name
        } → Posição ${i + 1} (Disponível)`
      );
      seedIndex++;
    }
  }

  // ✅ CORREÇÃO: Não embaralhar outros atletas - manter ordem por classificação
  // (Na segunda divisão, manter ordem original de eliminação é mais justo)
  const orderedOthers = [...others];
  let otherIndex = 0;
  for (
    let i = 0;
    i < distributed.length && otherIndex < orderedOthers.length;
    i++
  ) {
    if (distributed[i] === null) {
      distributed[i] = orderedOthers[otherIndex];
      console.log(
        `👤 [2ND-DIST] ${orderedOthers[otherIndex].name} → Posição ${i + 1}`
      );
      otherIndex++;
    }
  }

  const validDistributed = distributed.filter((athlete) => athlete !== null);

  console.log(
    `✅ [2ND-DIST] Distribuição completa: ${validDistributed.length} atletas posicionados`
  );

  return validDistributed;
};

// ✅ NOVA FUNÇÃO: Criar partidas da segunda divisão
const createSecondDivisionMatches = (
  athletes: Athlete[],
  roundName: string
): Match[] => {
  const matches: Match[] = [];
  let matchPosition = 0;

  for (let i = 0; i < athletes.length; i += 2) {
    if (athletes[i] && athletes[i + 1]) {
      const match: Match = {
        id: `second-div-${roundName
          .toLowerCase()
          .replace(/\s+/g, "-")}-${matchPosition}-${Date.now()}`,
        player1Id: athletes[i].id,
        player2Id: athletes[i + 1].id,
        player1: athletes[i],
        player2: athletes[i + 1],
        sets: [],
        isCompleted: false,
        phase: "knockout",
        round: roundName,
        position: matchPosition,
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };

      matches.push(match);
      console.log(
        `⚡ [CBTM-2ND] Partida criada: ${athletes[i].name} vs ${
          athletes[i + 1].name
        }`
      );
      matchPosition++;
    }
  }

  console.log(
    `✅ [CBTM-2ND] ${matches.length} partidas criadas para ${roundName}`
  );
  return matches;
};

// ✅ NOVA FUNÇÃO: Determinar nome da rodada para segunda divisão
const getRoundNameForSecondDivision = (rounds: number): string => {
  const baseRoundName = getRoundName(rounds);
  return `${baseRoundName} 2ª Div`;
};

// ===================================================
// 🧪 FUNÇÕES DE TESTE E VALIDAÇÃO
// ===================================================

// ✅ NOVA FUNÇÃO: Teste específico para segunda divisão - ATUALIZADA
export const testSecondDivisionFunctionality = (
  eliminatedAthletes: Athlete[]
): boolean => {
  console.log("\n🧪 [TEST-2ND] === TESTE DA SEGUNDA DIVISÃO CORRIGIDA ===");

  if (!eliminatedAthletes || eliminatedAthletes.length < 2) {
    console.log("❌ [TEST-2ND] Insuficientes atletas para teste");
    return false;
  }

  try {
    // Teste 1: Geração básica
    const matches = generateSecondDivisionMatches(eliminatedAthletes);
    console.log(
      `✅ [TEST-2ND] Geração básica: ${matches.length} partidas criadas`
    );

    // Teste 2: Validação de IDs únicos
    const uniqueIds = new Set(matches.map((m) => m.id));
    const hasUniqueIds = uniqueIds.size === matches.length;
    console.log(
      `${hasUniqueIds ? "✅" : "❌"} [TEST-2ND] IDs únicos: ${hasUniqueIds}`
    );

    // Teste 3: Validação de fase e sufixo
    const hasCorrectPhase = matches.every((m) => m.phase === "knockout");
    const hasCorrectSuffix = matches.every((m) => m.round?.includes("2ª Div"));
    console.log(
      `${
        hasCorrectPhase ? "✅" : "❌"
      } [TEST-2ND] Fase correta: ${hasCorrectPhase}`
    );
    console.log(
      `${
        hasCorrectSuffix ? "✅" : "❌"
      } [TEST-2ND] Sufixo correto: ${hasCorrectSuffix}`
    );

    // ✅ NOVO TESTE 4: Validação das correções de BYE
    const byeMatches = matches.filter(
      (m) => m.player1?.isVirtual || m.player2?.isVirtual
    );
    const autoCompletedByes = byeMatches.filter((m) => m.isCompleted);

    console.log(
      `🎯 [TEST-2ND] Partidas com BYE encontradas: ${byeMatches.length}`
    );
    console.log(
      `${
        autoCompletedByes.length === byeMatches.length ? "✅" : "❌"
      } [TEST-2ND] BYEs auto-completadas: ${autoCompletedByes.length}/${
        byeMatches.length
      }`
    );

    // ✅ NOVO TESTE 5: Validação de ex-cabeças priorizados
    const formerSeeds = eliminatedAthletes.filter((a) => a.isSeeded);
    const formeSeedsInMatches = matches.filter(
      (m) =>
        (m.player1?.isSeeded && !m.player1?.isVirtual) ||
        (m.player2?.isSeeded && !m.player2?.isVirtual)
    );

    console.log(`🏆 [TEST-2ND] Ex-cabeças de chave: ${formerSeeds.length}`);
    console.log(
      `🏆 [TEST-2ND] Ex-cabeças em partidas: ${formeSeedsInMatches.length}`
    );

    // Teste 6: Validação de atletas nas partidas
    const allPlayersInMatches = matches
      .flatMap((m) => [m.player1Id, m.player2Id])
      .filter((id) => !id.startsWith("bye-"));

    const hasValidPlayers = allPlayersInMatches.every((id) =>
      eliminatedAthletes.some((athlete) => athlete.id === id)
    );

    console.log(
      `${
        hasValidPlayers ? "✅" : "❌"
      } [TEST-2ND] Atletas válidos: ${hasValidPlayers}`
    );

    console.log("✅ [TEST-2ND] Todos os testes das correções passaram!");
    return true;
  } catch (error) {
    console.error("❌ [TEST-2ND] Erro durante teste:", error);
    return false;
  }
};

// ✅ NOVA FUNÇÃO: Comparar primeira e segunda divisão
export const compareFirstAndSecondDivision = (
  mainMatches: Match[],
  secondDivMatches: Match[]
): void => {
  console.log("\n🔍 [COMPARE] === COMPARAÇÃO ENTRE DIVISÕES ===");

  console.log(`📊 [COMPARE] Primeira Divisão: ${mainMatches.length} partidas`);
  console.log(
    `📊 [COMPARE] Segunda Divisão: ${secondDivMatches.length} partidas`
  );

  // Agrupar por rodada
  const mainRounds = [...new Set(mainMatches.map((m) => m.round))].sort();
  const secondRounds = [
    ...new Set(secondDivMatches.map((m) => m.round)),
  ].sort();

  console.log(`🔍 [COMPARE] Rodadas Primeira: ${mainRounds.join(", ")}`);
  console.log(`🔍 [COMPARE] Rodadas Segunda: ${secondRounds.join(", ")}`);

  // Verificar estrutura similar
  const mainStructure = mainRounds.map((r) => r.replace(" 2ª Div", "")).sort();
  const secondStructure = secondRounds
    .map((r) => r.replace(" 2ª Div", ""))
    .sort();

  const hasSimilarStructure =
    JSON.stringify(mainStructure) === JSON.stringify(secondStructure);
  console.log(
    `${
      hasSimilarStructure ? "✅" : "⚠️"
    } [COMPARE] Estrutura similar: ${hasSimilarStructure}`
  );

  // Verificar progressão
  mainRounds.forEach((round) => {
    const roundMatches = mainMatches.filter((m) => m.round === round);
    const completed = roundMatches.filter((m) => m.isCompleted).length;
    console.log(
      `📈 [COMPARE] ${round}: ${completed}/${roundMatches.length} completas`
    );
  });

  secondRounds.forEach((round) => {
    const roundMatches = secondDivMatches.filter((m) => m.round === round);
    const completed = roundMatches.filter((m) => m.isCompleted).length;
    console.log(
      `📈 [COMPARE] ${round}: ${completed}/${roundMatches.length} completas`
    );
  });
};

// ===================================================
// 🔧 FUNÇÕES AVANÇADAS DE MONITORAMENTO
// ===================================================

// ✅ NOVA FUNÇÃO: Monitor de progresso da segunda divisão
export const monitorSecondDivisionProgress = (
  allKnockoutMatches: Match[]
): {
  progress: number;
  currentRound: string | null;
  nextRound: string | null;
  completedRounds: string[];
  pendingMatches: Match[];
  canAdvance: boolean;
} => {
  const secondDivMatches = allKnockoutMatches.filter((m) =>
    m.round?.includes("2ª Div")
  );

  if (secondDivMatches.length === 0) {
    return {
      progress: 0,
      currentRound: null,
      nextRound: null,
      completedRounds: [],
      pendingMatches: [],
      canAdvance: false,
    };
  }

  // Agrupar por rodada
  const matchesByRound: { [key: string]: Match[] } = {};
  secondDivMatches.forEach((match) => {
    const round = match.round || "Indefinido";
    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  const rounds = Object.keys(matchesByRound).sort();
  const completedRounds: string[] = [];
  let currentRound: string | null = null;
  let nextRound: string | null = null;
  const pendingMatches: Match[] = [];

  // Analisar cada rodada
  rounds.forEach((round, index) => {
    const roundMatches = matchesByRound[round];
    const completedCount = roundMatches.filter((m) => m.isCompleted).length;
    const isRoundComplete = completedCount === roundMatches.length;

    if (isRoundComplete) {
      completedRounds.push(round);
    } else if (!currentRound) {
      currentRound = round;
      pendingMatches.push(...roundMatches.filter((m) => !m.isCompleted));
    }

    if (isRoundComplete && index < rounds.length - 1 && !nextRound) {
      nextRound = rounds[index + 1];
    }
  });

  const totalMatches = secondDivMatches.length;
  const completedMatches = secondDivMatches.filter((m) => m.isCompleted).length;
  const progress =
    totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  const canAdvance = currentRound
    ? matchesByRound[currentRound].every((m) => m.isCompleted)
    : false;

  return {
    progress,
    currentRound,
    nextRound,
    completedRounds,
    pendingMatches,
    canAdvance,
  };
};

// ✅ NOVA FUNÇÃO: Análise de performance da segunda divisão
export const analyzeSecondDivisionPerformance = (
  secondDivMatches: Match[],
  eliminatedAthletes: Athlete[]
): {
  statistics: {
    totalMatches: number;
    completedMatches: number;
    averageMatchDuration: number;
    mostActiveRound: string;
  };
  athletePerformance: Array<{
    athleteId: string;
    athleteName: string;
    matchesPlayed: number;
    matchesWon: number;
    winRate: number;
    setsWon: number;
    setsLost: number;
    isFormerSeed: boolean;
  }>;
  bracketHealth: {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  };
} => {
  console.log("📊 [ANALYSIS] Analisando performance da segunda divisão...");

  // Estatísticas gerais
  const totalMatches = secondDivMatches.length;
  const completedMatches = secondDivMatches.filter((m) => m.isCompleted).length;

  // Duração média das partidas (baseada em timestamps)
  const completedWithDuration = secondDivMatches.filter(
    (m) => m.isCompleted && m.createdAt && m.completedAt
  );
  const averageMatchDuration =
    completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, m) => {
          const duration =
            new Date(m.completedAt!).getTime() -
            new Date(m.createdAt).getTime();
          return sum + duration;
        }, 0) / completedWithDuration.length
      : 0;

  // Rodada mais ativa
  const matchesByRound: { [key: string]: number } = {};
  secondDivMatches.forEach((m) => {
    const round = m.round || "Indefinido";
    matchesByRound[round] = (matchesByRound[round] || 0) + 1;
  });
  const mostActiveRound =
    Object.entries(matchesByRound).sort(([, a], [, b]) => b - a)[0]?.[0] ||
    "Nenhuma";

  // Performance dos atletas
  const athletePerformance = eliminatedAthletes.map((athlete) => {
    const athleteMatches = secondDivMatches.filter(
      (m) => m.player1Id === athlete.id || m.player2Id === athlete.id
    );

    const matchesPlayed = athleteMatches.filter((m) => m.isCompleted).length;
    const matchesWon = athleteMatches.filter(
      (m) => m.winnerId === athlete.id
    ).length;
    const winRate = matchesPlayed > 0 ? (matchesWon / matchesPlayed) * 100 : 0;

    // Calcular sets ganhos/perdidos
    let setsWon = 0;
    let setsLost = 0;

    athleteMatches.forEach((match) => {
      if (match.sets && match.sets.length > 0) {
        match.sets.forEach((set) => {
          const isPlayer1 = match.player1Id === athlete.id;
          const wonSet = isPlayer1
            ? set.player1Score > set.player2Score
            : set.player2Score > set.player1Score;

          if (wonSet) {
            setsWon++;
          } else {
            setsLost++;
          }
        });
      }
    });

    return {
      athleteId: athlete.id,
      athleteName: athlete.name,
      matchesPlayed,
      matchesWon,
      winRate,
      setsWon,
      setsLost,
      isFormerSeed: athlete.isSeeded || false,
    };
  });

  // Saúde do bracket
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Verificar atletas órfãos
  const athletesInMatches = new Set(
    secondDivMatches.flatMap((m) => [m.player1Id, m.player2Id])
  );
  const orphanedAthletes = eliminatedAthletes.filter(
    (a) => !athletesInMatches.has(a.id)
  );

  if (orphanedAthletes.length > 0) {
    issues.push(
      `${orphanedAthletes.length} atletas eliminados não estão em partidas`
    );
    recommendations.push(
      "Regenerar segunda divisão para incluir todos os atletas"
    );
  }

  // Verificar partidas sem vencedor definido há muito tempo
  const stalledMatches = secondDivMatches.filter((m) => {
    if (!m.isCompleted && m.createdAt) {
      const hoursSinceCreation =
        (Date.now() - new Date(m.createdAt).getTime()) / (1000 * 60 * 60);
      return hoursSinceCreation > 24; // Mais de 24 horas sem resultado
    }
    return false;
  });

  if (stalledMatches.length > 0) {
    issues.push(
      `${stalledMatches.length} partidas pendentes há mais de 24 horas`
    );
    recommendations.push("Revisar e finalizar partidas pendentes");
  }

  // Verificar ex-cabeças de chave com performance ruim
  const formerSeedsWithPoorPerformance = athletePerformance.filter(
    (a) => a.isFormerSeed && a.matchesPlayed > 0 && a.winRate < 30
  );

  if (formerSeedsWithPoorPerformance.length > 0) {
    recommendations.push("Monitorar ex-cabeças de chave com baixa performance");
  }

  const isValid = issues.length === 0;

  return {
    statistics: {
      totalMatches,
      completedMatches,
      averageMatchDuration,
      mostActiveRound,
    },
    athletePerformance,
    bracketHealth: {
      isValid,
      issues,
      recommendations,
    },
  };
};

// ✅ NOVA FUNÇÃO: Auto-correção inteligente da segunda divisão
export const autoFixSecondDivision = (
  championship: any,
  eliminatedAthletes: Athlete[]
): {
  fixed: boolean;
  actions: string[];
  newMatches: Match[];
} => {
  console.log("🔧 [AUTO-FIX] Iniciando auto-correção da segunda divisão...");

  const actions: string[] = [];
  let newMatches: Match[] = [];
  let fixed = false;

  try {
    // Verificar se segunda divisão está habilitada
    if (!championship.hasRepechage) {
      actions.push("Segunda divisão não está habilitada");
      return { fixed: false, actions, newMatches };
    }

    // Verificar atletas eliminados suficientes
    if (eliminatedAthletes.length < 2) {
      actions.push("Insuficientes atletas eliminados para segunda divisão");
      return { fixed: false, actions, newMatches };
    }

    // Obter partidas atuais da segunda divisão
    const allKnockoutMatches = championship.groups
      .flatMap((g: any) => g.matches)
      .filter((m: any) => m.phase === "knockout");

    const currentSecondDivMatches = allKnockoutMatches.filter((m: any) =>
      m.round?.includes("2ª Div")
    );

    // Verificar se precisa regenerar
    const athletesInCurrentMatches = new Set(
      currentSecondDivMatches.flatMap((m: any) => [m.player1Id, m.player2Id])
    );

    const missingAthletes = eliminatedAthletes.filter(
      (a) => !athletesInCurrentMatches.has(a.id)
    );

    if (missingAthletes.length > 0) {
      actions.push(
        `Regenerando segunda divisão para ${missingAthletes.length} atletas órfãos`
      );

      // Regenerar segunda divisão
      newMatches = generateSecondDivisionMatches(eliminatedAthletes);
      fixed = true;

      actions.push(`Criadas ${newMatches.length} novas partidas`);
    }

    // Verificar partidas duplicadas
    const matchSignatures = new Set();
    const duplicates = currentSecondDivMatches.filter((m: any) => {
      const signature = `${m.player1Id}-${m.player2Id}-${m.round}`;
      const reverseSignature = `${m.player2Id}-${m.player1Id}-${m.round}`;

      if (
        matchSignatures.has(signature) ||
        matchSignatures.has(reverseSignature)
      ) {
        return true;
      }

      matchSignatures.add(signature);
      return false;
    });

    if (duplicates.length > 0) {
      actions.push(`Encontradas ${duplicates.length} partidas duplicadas`);
      actions.push("Recomenda-se limpeza manual das partidas duplicadas");
    }

    // Verificar progressão de rodadas
    const progress = monitorSecondDivisionProgress(allKnockoutMatches);
    if (progress.canAdvance && !progress.nextRound) {
      actions.push("Pronto para gerar próxima rodada da segunda divisão");
    }

    console.log(
      `✅ [AUTO-FIX] Auto-correção concluída. ${actions.length} ações executadas`
    );

    return { fixed, actions, newMatches };
  } catch (error) {
    console.error("❌ [AUTO-FIX] Erro durante auto-correção:", error);
    actions.push(`Erro durante auto-correção: ${error}`);
    return { fixed: false, actions, newMatches };
  }
};

// ✅ FUNÇÕES UTILITÁRIAS ADICIONAIS

// ✅ NOVA VERSÃO: calculateTournamentStats com compatibilidade
export const calculateTournamentStats = (
  championship: Championship | Match[],
  athletes?: Athlete[]
) => {
  let matches: Match[];
  let allAthletes: Athlete[];

  // Verificar se o primeiro parâmetro é um Championship ou array de Match
  if (Array.isArray(championship)) {
    // Versão antiga: array de matches
    matches = championship;
    allAthletes = athletes || [];
  } else {
    // Nova versão: objeto Championship
    matches = championship.groups.flatMap((g) => g.matches);
    allAthletes = championship.athletes;
  }

  // Separar tipos de partidas
  const groupMatches = matches.filter((m) => m.phase === "groups");
  const knockoutMatches = matches.filter((m) => m.phase === "knockout");
  const mainKnockoutMatches = knockoutMatches.filter(
    (m) => !m.round?.includes("2ª Div")
  );
  const secondDivMatches = knockoutMatches.filter((m) =>
    m.round?.includes("2ª Div")
  );

  const groupMatchesCompleted = groupMatches.filter(
    (m) => m.isCompleted
  ).length;
  const knockoutMatchesCompleted = knockoutMatches.filter(
    (m) => m.isCompleted
  ).length;

  const totalMatches = matches.length;
  const completedMatches = matches.filter((m) => m.isCompleted).length;
  const pendingMatches = totalMatches - completedMatches;

  // Estatísticas de grupos (se for Championship)
  let groupsCompleted = 0;
  let totalGroups = 0;
  if (!Array.isArray(championship)) {
    totalGroups = championship.groups.length;
    groupsCompleted = championship.groups.filter((g) => g.isCompleted).length;
  }

  const progress =
    totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return {
    // Estatísticas básicas
    totalMatches,
    completedMatches,
    pendingMatches,
    totalAthletes: allAthletes.length,
    activeAthletes: allAthletes.filter((a) => !a.isVirtual).length,
    rounds: new Set(matches.map((m) => m.round)).size,
    phase: !Array.isArray(championship)
      ? championship.status
      : matches[0]?.phase || "knockout",

    // Estatísticas de grupos
    groupMatches: groupMatches.length,
    groupMatchesCompleted,
    groupsCompleted,
    totalGroups,

    // Estatísticas de mata-mata
    knockoutMatches: knockoutMatches.length,
    knockoutMatchesCompleted,
    mainKnockoutMatches: mainKnockoutMatches.length,
    secondDivMatches: secondDivMatches.length,

    // Métricas calculadas
    progress,
    completionRate: progress,
    averageMatchesPerRound:
      totalMatches > 0 && totalGroups > 0
        ? totalMatches / Math.max(totalGroups, 1)
        : 0,
  };
};

export const getAthleteDisplayName = (
  athlete: Athlete | null | undefined
): string => {
  if (!athlete) return "BYE";
  if (athlete.name === "BYE" || athlete.id === "bye" || athlete.isVirtual)
    return "BYE";
  return athlete.name || "Atleta Desconhecido";
};

export const isRealAthlete = (athlete: Athlete | null | undefined): boolean => {
  if (!athlete) return false;
  if (athlete.name === "BYE" || athlete.id === "bye" || athlete.isVirtual)
    return false;
  return true;
};

export const matchHasBye = (match: Match): boolean => {
  return !isRealAthlete(match.player1) || !isRealAthlete(match.player2);
};

export const validateAthlete = (
  athlete: Partial<Athlete>
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!athlete.name || athlete.name.trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (!athlete.id || athlete.id.trim() === "") {
    errors.push("ID é obrigatório");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const generateGroupReport = (
  championship: Championship | Athlete[],
  matches?: Match[]
) => {
  let athletes: Athlete[];
  let allMatches: Match[];

  // Verificar se o primeiro parâmetro é um Championship ou array de Athlete
  if (Array.isArray(championship)) {
    // Versão antiga: array de athletes
    athletes = championship;
    allMatches = matches || [];
  } else {
    // Nova versão: objeto Championship
    athletes = championship.athletes;
    allMatches = championship.groups.flatMap((g) => g.matches);
  }
  const groupMatches = allMatches.filter((m) => m.phase === "groups");
  const completedGroupMatches = groupMatches.filter((m) => m.isCompleted);

  const athleteStats = athletes.map((athlete) => {
    const athleteMatches = completedGroupMatches.filter(
      (m) => m.player1Id === athlete.id || m.player2Id === athlete.id
    );

    let wins = 0;
    let losses = 0;
    let setsWon = 0;
    let setsLost = 0;

    athleteMatches.forEach((match) => {
      const isPlayer1 = match.player1Id === athlete.id;

      if (match.winnerId === athlete.id) {
        wins++;
      } else if (match.winnerId) {
        losses++;
      }

      // Contar sets
      match.sets?.forEach((set) => {
        if (isPlayer1) {
          setsWon += set.player1Score || 0;
          setsLost += set.player2Score || 0;
        } else {
          setsWon += set.player2Score || 0;
          setsLost += set.player1Score || 0;
        }
      });
    });

    return {
      athlete,
      matches: athleteMatches.length,
      wins,
      losses,
      setsWon,
      setsLost,
      setsDiff: setsWon - setsLost,
      winRate:
        athleteMatches.length > 0 ? (wins / athleteMatches.length) * 100 : 0,
    };
  });

  return {
    totalMatches: groupMatches.length,
    completedMatches: completedGroupMatches.length,
    athleteStats: athleteStats.sort((a, b) => {
      // Ordenar por vitórias, depois por diferença de sets
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.setsDiff - a.setsDiff;
    }),
  };
};
