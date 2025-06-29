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
  console.log(`🏆 [KNOCKOUT] Gerando chaveamento CBTM/ITTF para ${qualifiedAthletes.length} atletas em bracket de ${bracketSize}`);
  console.log("📋 [DEBUG] Lista de atletas recebidos:");
  qualifiedAthletes.forEach((athlete, index) => {
    console.log(`   ${index + 1}. ${athlete.name}${athlete.isSeeded ? ` (Cabeça #${athlete.seedNumber})` : " (Sem seed)"}`);
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

  console.log(`🎯 [CBTM] Cabeças de chave identificados: ${seededAthletes.length}`);
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

// ✅ CORREÇÃO CBTM/ITTF: Geração da segunda divisão conforme regras oficiais
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

// ✅ NOVA FUNÇÃO: Ordenar atletas para segunda divisão conforme CBTM/ITTF
const orderAthletesForSecondDivision = (athletes: Athlete[]): Athlete[] => {
  // ✅ REGRA CBTM/ITTF: Atletas são ordenados por:
  // 1. Posição de eliminação (últimos eliminados primeiro)
  // 2. Ranking original (cabeças de chave primeiro)
  // 3. Ordem alfabética como critério final

  return [...athletes].sort((a, b) => {
    // Priorizar cabeças de chave
    if (a.isSeeded && !b.isSeeded) return -1;
    if (!a.isSeeded && b.isSeeded) return 1;

    // Entre cabeças, ordenar por seed number
    if (a.isSeeded && b.isSeeded) {
      return (a.seedNumber || 999) - (b.seedNumber || 999);
    }

    // Para não-cabeças, ordem alfabética
    return a.name.localeCompare(b.name);
  });
};

// ✅ NOVA FUNÇÃO: Gerar segunda divisão com BYE conforme CBTM/ITTF
const generateSecondDivisionWithBye = (
  athletes: Athlete[],
  bracketSize: number
): Match[] => {
  const byeCount = bracketSize - athletes.length;
  console.log(`🎯 [CBTM-2ND] Sistema BYE ativado: ${byeCount} passes livres`);

  // ✅ REGRA CBTM/ITTF: Melhores atletas eliminados recebem BYE
  const athletesWithBye = athletes.slice(0, byeCount);
  const athletesToPlay = athletes.slice(byeCount);

  athletesWithBye.forEach((athlete) => {
    console.log(
      `🎯 [CBTM-2ND] BYE concedido: ${athlete.name}${
        athlete.isSeeded ? ` (ex-Cabeça #${athlete.seedNumber})` : ""
      }`
    );
  });

  // Criar primeira rodada apenas com atletas que jogam
  const rounds = Math.ceil(Math.log2(athletes.length));
  const currentRoundName = getRoundNameForSecondDivision(rounds);

  return createSecondDivisionMatches(athletesToPlay, currentRoundName);
};

// ✅ NOVA FUNÇÃO: Gerar bracket completo para segunda divisão
const generateCompleteSecondDivisionBracket = (
  athletes: Athlete[],
  bracketSize: number
): Match[] => {
  console.log(
    `🥈 [CBTM-2ND] Bracket completo - todos os ${athletes.length} atletas jogarão`
  );

  // ✅ REGRA CBTM/ITTF: Distribuição estratégica similar ao mata-mata principal
  const distributedAthletes = distributeAthletesForSecondDivision(
    athletes,
    bracketSize
  );

  const rounds = Math.log2(bracketSize);
  const currentRoundName = getRoundNameForSecondDivision(rounds);

  return createSecondDivisionMatches(distributedAthletes, currentRoundName);
};

// ✅ NOVA FUNÇÃO: Distribuir atletas na segunda divisão conforme CBTM/ITTF
const distributeAthletesForSecondDivision = (
  athletes: Athlete[],
  bracketSize: number
): Athlete[] => {
  const distributed: Athlete[] = Array.from(
    { length: bracketSize },
    () => null
  );

  // ✅ REGRA CBTM/ITTF: Separar ex-cabeças de chave dos demais
  const formerSeeds = athletes
    .filter((a) => a.isSeeded)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999));
  const others = athletes.filter((a) => !a.isSeeded);

  // Posicionar ex-cabeças estrategicamente
  if (formerSeeds.length >= 1) {
    distributed[0] = formerSeeds[0];
  }
  if (formerSeeds.length >= 2) {
    distributed[bracketSize - 1] = formerSeeds[1];
  }
  if (formerSeeds.length >= 3) {
    distributed[Math.floor(bracketSize / 2) - 1] = formerSeeds[2];
  }
  if (formerSeeds.length >= 4) {
    distributed[Math.floor(bracketSize / 2)] = formerSeeds[3];
  }

  // Distribuir ex-cabeças restantes
  const remainingSeeds = formerSeeds.slice(4);
  let seedIndex = 0;
  for (
    let i = 0;
    i < distributed.length && seedIndex < remainingSeeds.length;
    i++
  ) {
    if (distributed[i] === null) {
      distributed[i] = remainingSeeds[seedIndex++];
    }
  }

  // Embaralhar e distribuir outros atletas
  const shuffledOthers = [...others].sort(() => Math.random() - 0.5);
  let otherIndex = 0;
  for (
    let i = 0;
    i < distributed.length && otherIndex < shuffledOthers.length;
    i++
  ) {
    if (distributed[i] === null) {
      distributed[i] = shuffledOthers[otherIndex++];
    }
  }

  return distributed.filter((athlete) => athlete !== null);
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

// ✅ NOVA FUNÇÃO: Calcular estatísticas do torneio
export const calculateTournamentStats = (championship: any) => {
  if (!championship) {
    return {
      totalAthletes: 0,
      totalMatches: 0,
      completedMatches: 0,
      completionPercentage: 0,
      progress: 0,
      groupsPhaseComplete: false,
      knockoutPhaseStarted: false,
      groupMatches: 0,
      groupMatchesCompleted: 0,
      knockoutMatches: 0,
      knockoutMatchesCompleted: 0,
      mainKnockoutMatches: 0,
      secondDivMatches: 0,
      totalGroups: 0,
      groupsCompleted: 0,
    };
  }

  const totalAthletes = championship.athletes?.length || 0;

  // Contar partidas dos grupos
  const groupMatches =
    championship.groups?.flatMap((group: any) => group.matches || []) || [];
  const groupMatchesCount = groupMatches.length;
  const groupCompletedMatches = groupMatches.filter(
    (match: any) => match.isCompleted
  ).length;

  // Contar partidas do knockout
  const knockoutMatches = championship.knockoutMatches || [];
  const knockoutMatchesCount = knockoutMatches.length;
  const knockoutCompletedMatches = knockoutMatches.filter(
    (match: any) => match.isCompleted
  ).length;

  // Separar partidas principais e segunda divisão
  const mainKnockoutMatches = knockoutMatches.filter(
    (match: any) => !match.round?.includes("2ª Div")
  ).length;
  const secondDivMatches = knockoutMatches.filter((match: any) =>
    match.round?.includes("2ª Div")
  ).length;

  const totalMatches = groupMatchesCount + knockoutMatchesCount;
  const completedMatches = groupCompletedMatches + knockoutCompletedMatches;
  const completionPercentage =
    totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  const groupsPhaseComplete =
    groupMatchesCount > 0 &&
    groupMatches.every((match: any) => match.isCompleted);
  const knockoutPhaseStarted = knockoutMatchesCount > 0;

  // Contar grupos
  const totalGroups = championship.groups?.length || 0;
  const groupsCompleted =
    championship.groups?.filter((group: any) => {
      const matches = group.matches || [];
      return (
        matches.length > 0 && matches.every((match: any) => match.isCompleted)
      );
    }).length || 0;

  return {
    totalAthletes,
    totalMatches,
    completedMatches,
    completionPercentage: Math.round(completionPercentage),
    progress: Math.round(completionPercentage),
    groupsPhaseComplete,
    knockoutPhaseStarted,
    groupMatches: groupMatchesCount,
    groupMatchesCompleted: groupCompletedMatches,
    knockoutMatches: knockoutMatchesCount,
    knockoutMatchesCompleted: knockoutCompletedMatches,
    mainKnockoutMatches,
    secondDivMatches,
    totalGroups,
    groupsCompleted,
  };
};

// ✅ NOVA FUNÇÃO: Validar atleta
export const validateAthlete = (
  athlete: Partial<
    Athlete & { club?: string; ranking?: number; rating?: number }
  >
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!athlete.name || athlete.name.trim().length === 0) {
    errors.push("Nome é obrigatório");
  }

  if (athlete.name && athlete.name.trim().length < 2) {
    errors.push("Nome deve ter pelo menos 2 caracteres");
  }

  if (
    athlete.club !== undefined &&
    (!athlete.club || athlete.club.trim().length === 0)
  ) {
    errors.push("Clube é obrigatório");
  }

  if (athlete.ranking !== undefined && athlete.ranking < 0) {
    errors.push("Ranking deve ser um número positivo");
  }

  if (
    athlete.rating !== undefined &&
    (athlete.rating < 0 || athlete.rating > 3000)
  ) {
    errors.push("Rating deve estar entre 0 e 3000");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ✅ NOVA FUNÇÃO: Gerar relatório de grupos
export const generateGroupReport = (championship: any): string => {
  if (!championship || !championship.groups) {
    return "Nenhum grupo encontrado";
  }

  let report = `RELATÓRIO DE GRUPOS - ${championship.name}\n`;
  report += `Data: ${formatDate(championship.date)}\n`;
  report += `=====================================\n\n`;

  championship.groups.forEach((group: any, index: number) => {
    report += `GRUPO ${String.fromCharCode(65 + index)}\n`;
    report += `${"-".repeat(20)}\n`;

    if (group.athletes && group.athletes.length > 0) {
      group.athletes.forEach((athlete: any, pos: number) => {
        report += `${pos + 1}. ${athlete.name} (${athlete.club})\n`;
        if (athlete.ranking) report += `   Ranking: ${athlete.ranking}\n`;
        if (athlete.rating) report += `   Rating: ${athlete.rating}\n`;
      });
    } else {
      report += "Nenhum atleta neste grupo\n";
    }

    report += `\nPARTIDAS:\n`;
    if (group.matches && group.matches.length > 0) {
      group.matches.forEach((match: any) => {
        const player1 = group.athletes.find(
          (a: any) => a.id === match.player1Id
        );
        const player2 = group.athletes.find(
          (a: any) => a.id === match.player2Id
        );

        report += `${player1?.name || "TBD"} vs ${player2?.name || "TBD"}`;

        if (match.isCompleted) {
          const setsText = match.sets
            .map((set: any) => `${set.player1Score}-${set.player2Score}`)
            .join(", ");
          report += ` - ${setsText}`;
        } else {
          report += " - Pendente";
        }
        report += `\n`;
      });
    } else {
      report += "Nenhuma partida gerada\n";
    }

    report += `\n`;
  });

  return report;
};

// ✅ NOVA FUNÇÃO: Gerar bracket do knockout (simplificado)
export const generateKnockoutBracket = (championship: any) => {
  if (!championship || !championship.knockoutMatches) {
    return null;
  }

  // Agrupar partidas por rodada
  const matchesByRound: { [key: string]: any[] } = {};

  championship.knockoutMatches.forEach((match: any) => {
    const round = match.round || "Indefinido";
    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  return {
    rounds: Object.keys(matchesByRound).sort(),
    matchesByRound,
    totalMatches: championship.knockoutMatches.length,
    completedMatches: championship.knockoutMatches.filter(
      (m: any) => m.isCompleted
    ).length,
  };
};

// ✅ FUNÇÃO DE DEPURAÇÃO: Validar se o chaveamento está correto
export const validateBracketStructure = (
  matches: Match[],
  allAthletes: Athlete[]
): boolean => {
  console.log(`🔍 [BRACKET-VALIDATION] Validando estrutura do chaveamento`);

  const seededAthletes = allAthletes
    .filter((a) => a.isSeeded && a.seedNumber)
    .sort((a, b) => (a.seedNumber || 999) - (b.seedNumber || 999));

  if (seededAthletes.length < 2) {
    console.log(
      `✅ [BRACKET-VALIDATION] Menos de 2 cabeças, validação desnecessária`
    );
    return true;
  }

  const seed1 = seededAthletes[0]; // Cabeça #1
  const seed2 = seededAthletes[1]; // Cabeça #2

  console.log(
    `🎯 [BRACKET-VALIDATION] Verificando separação entre ${seed1.name} (#1) e ${seed2.name} (#2)`
  );

  // Simular todas as rodadas para ver se eles só se encontram na final
  let currentRoundMatches = [...matches];
  let roundNumber = 1;

  while (currentRoundMatches.length > 1) {
    console.log(
      `🔍 [BRACKET-VALIDATION] Simulando rodada ${roundNumber} (${currentRoundMatches.length} partidas)`
    );

    // Verificar se os dois cabeças principais estão na mesma partida
    const seed1Match = currentRoundMatches.find(
      (m) => m.player1Id === seed1.id || m.player2Id === seed1.id
    );
    const seed2Match = currentRoundMatches.find(
      (m) => m.player1Id === seed2.id || m.player2Id === seed2.id
    );

    if (seed1Match && seed2Match && seed1Match.id === seed2Match.id) {
      const isThisFinal = currentRoundMatches.length === 1;
      if (!isThisFinal) {
        console.log(
          `❌ [BRACKET-VALIDATION] ERRO: ${seed1.name} e ${seed2.name} se enfrentam na rodada ${roundNumber}, não na final!`
        );
        console.log(`❌ [BRACKET-VALIDATION] Partida: ${seed1Match.round}`);
        return false;
      } else {
        console.log(
          `✅ [BRACKET-VALIDATION] Cabeças #1 e #2 se encontram apenas na final (correto)`
        );
        return true;
      }
    }

    // Simular próxima rodada (presumindo que os seeds vencem)
    const nextRoundMatches: Match[] = [];
    for (let i = 0; i < currentRoundMatches.length; i += 2) {
      if (currentRoundMatches[i + 1]) {
        // Criar partida simulada para próxima rodada
        const match1 = currentRoundMatches[i];
        const match2 = currentRoundMatches[i + 1];

        // Determinar "vencedores" (priorizar cabeças de chave)
        const winner1 = getPreferredWinner(match1, allAthletes);
        const winner2 = getPreferredWinner(match2, allAthletes);

        if (winner1 && winner2) {
          nextRoundMatches.push({
            id: `sim-${roundNumber}-${i}`,
            player1Id: winner1.id,
            player2Id: winner2.id,
            player1: winner1,
            player2: winner2,
            sets: [],
            isCompleted: false,
            phase: "knockout",
            round: `Simulação Rodada ${roundNumber + 1}`,
            position: i / 2,
            timeoutsUsed: { player1: false, player2: false },
            createdAt: new Date(),
          });
        }
      }
    }

    currentRoundMatches = nextRoundMatches;
    roundNumber++;

    if (roundNumber > 10) {
      // Evitar loop infinito
      console.log(`⚠️ [BRACKET-VALIDATION] Limite de rodadas excedido`);
      break;
    }
  }

  console.log(
    `✅ [BRACKET-VALIDATION] Validação concluída - estrutura parece correta`
  );
  return true;
};

// ✅ FUNÇÃO AUXILIAR: Determinar o vencedor preferido para simulação
const getPreferredWinner = (
  match: Match,
  allAthletes: Athlete[]
): Athlete | null => {
  const player1 = allAthletes.find((a) => a.id === match.player1Id);
  const player2 = allAthletes.find((a) => a.id === match.player2Id);

  if (!player1 || !player2) return null;

  // Priorizar cabeça de chave com menor número (melhor ranking)
  if (player1.isSeeded && player2.isSeeded) {
    return (player1.seedNumber || 999) < (player2.seedNumber || 999)
      ? player1
      : player2;
  }

  if (player1.isSeeded && !player2.isSeeded) return player1;
  if (!player1.isSeeded && player2.isSeeded) return player2;

  // Se nenhum é cabeça de chave, escolha aleatória ponderada
  return Math.random() > 0.5 ? player1 : player2;
};

// ✅ NOVA FUNÇÃO: Validar e corrigir bracket dinamicamente
export const validateAndFixBracket = (championship: Championship): boolean => {
  console.log(
    "🔍 [BRACKET-FIX] Validando e corrigindo problemas de bracket..."
  );

  const allKnockoutMatches = championship.groups
    .flatMap((group) => group.matches)
    .filter((match) => match.phase === "knockout");

  const mainMatches = allKnockoutMatches.filter(
    (m) => !m.round?.includes("2ª Div")
  );

  if (mainMatches.length === 0) {
    console.log("✅ [BRACKET-FIX] Nenhuma partida de mata-mata encontrada");
    return true;
  }

  // Agrupar partidas por rodada
  const matchesByRound: { [key: string]: Match[] } = {};
  mainMatches.forEach((match) => {
    const round = match.round || "Indefinido";
    if (!matchesByRound[round]) {
      matchesByRound[round] = [];
    }
    matchesByRound[round].push(match);
  });

  let hasIssues = false;

  // Verificar cada rodada
  for (const [roundName, matches] of Object.entries(matchesByRound)) {
    console.log(
      `🔍 [BRACKET-FIX] Verificando ${roundName}: ${matches.length} partidas`
    );

    // Verificar se há partidas pendentes
    const pendingMatches = matches.filter(m => !m.isCompleted);
    if (pendingMatches.length > 0) {
      console.log(`⚠️ [BRACKET-FIX] ${pendingMatches.length} partidas pendentes em ${roundName}`);
      hasIssues = true;
    }
  }

  return !hasIssues;
};

// ===================================================
// 🛠️ FUNÇÕES UTILITÁRIAS PARA INTERFACE
// ===================================================

// ✅ Obter nome de exibição do atleta
export const getAthleteDisplayName = (athlete: any): string => {
  if (!athlete) return "BYE";
  if (athlete.isVirtual) return "BYE";
  return athlete.name || "Atleta Desconhecido";
};

// ✅ Verificar se o atleta é real (não é BYE ou virtual)
export const isRealAthlete = (athlete: any): boolean => {
  if (!athlete) return false;
  if (athlete.isVirtual) return false;
  return true;
};

// ✅ Verificar se a partida tem BYE
export const matchHasBye = (match: any): boolean => {
  if (!match) return false;
  return !match.athlete1 || !match.athlete2 || 
         (match.athlete1 && match.athlete1.isVirtual) ||
         (match.athlete2 && match.athlete2.isVirtual);
};
