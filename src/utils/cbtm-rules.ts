// Regras específicas da CBTM e ITTF para validação de campeonatos de tênis de mesa

export interface CBTMRules {
  // Regras de sets
  minimumPointsToWin: number;
  minimumDifferenceToWin: number;
  deuceDifference: number;

  // Regras de partidas
  bestOfOptions: (3 | 5 | 7)[];
  defaultGroupsBestOf: 3 | 5;
  defaultKnockoutBestOf: 3 | 5 | 7;

  // Regras de timeouts
  timeoutsPerPlayer: number;

  // Regras de grupos
  minAthletesPerGroup: number;
  maxAthletesPerGroup: number;
  minGroupsForTournament: number;

  // Regras de chaveamento
  minAthletesForKnockout: number;
  maxSeedsAllowed: number;

  // Regras de classificação
  pointsForWin: number;
  pointsForLoss: number;
}

// ✅ CONFIGURAÇÃO OFICIAL CBTM/ITTF
export const CBTM_OFFICIAL_RULES: CBTMRules = {
  // Sets: 11 pontos com diferença mínima de 2
  minimumPointsToWin: 11,
  minimumDifferenceToWin: 2,
  deuceDifference: 2, // Em caso de 10-10, diferença de 2 pontos

  // Partidas: Melhor de 3, 5 ou 7 sets
  bestOfOptions: [3, 5, 7],
  defaultGroupsBestOf: 5, // CBTM usa melhor de 5 para grupos
  defaultKnockoutBestOf: 5, // CBTM usa melhor de 5 para mata-mata

  // Timeouts: 1 por jogador por partida
  timeoutsPerPlayer: 1,

  // Grupos: 3 a 5 atletas por grupo
  minAthletesPerGroup: 3,
  maxAthletesPerGroup: 5,
  minGroupsForTournament: 2,

  // Mata-mata: mínimo 4 atletas
  minAthletesForKnockout: 4,
  maxSeedsAllowed: 16, // Máximo de cabeças de chave permitidas

  // Classificação: 3 pontos por vitória, 0 por derrota
  pointsForWin: 3,
  pointsForLoss: 0,
};

// ✅ VALIDAÇÕES ESPECÍFICAS CBTM/ITTF

/**
 * Valida se um set está conforme as regras CBTM/ITTF
 */
export const validateSetCBTM = (
  player1Score: number,
  player2Score: number
): {
  isValid: boolean;
  error?: string;
} => {
  const rules = CBTM_OFFICIAL_RULES;

  // Validações básicas
  if (player1Score < 0 || player2Score < 0) {
    return { isValid: false, error: "Pontuação não pode ser negativa" };
  }

  if (player1Score === 0 && player2Score === 0) {
    return { isValid: false, error: "Deve haver pelo menos um ponto marcado" };
  }

  const maxScore = Math.max(player1Score, player2Score);
  const minScore = Math.min(player1Score, player2Score);
  const diff = Math.abs(player1Score - player2Score);

  // Pontuação mínima para vencer
  if (maxScore < rules.minimumPointsToWin) {
    return {
      isValid: false,
      error: `Vencedor deve ter pelo menos ${rules.minimumPointsToWin} pontos`,
    };
  }

  // Diferença mínima
  if (diff < rules.minimumDifferenceToWin) {
    return {
      isValid: false,
      error: `Diferença mínima de ${rules.minimumDifferenceToWin} pontos necessária`,
    };
  }

  // Regra do deuce (10-10 ou mais)
  if (minScore >= 10) {
    if (diff !== rules.deuceDifference) {
      return {
        isValid: false,
        error: `Em empate 10-10 ou mais, diferença deve ser exatamente ${rules.deuceDifference} pontos`,
      };
    }
  }

  return { isValid: true };
};

/**
 * Valida se uma partida está conforme as regras CBTM/ITTF
 */
export const validateMatchCBTM = (
  sets: { player1Score: number; player2Score: number }[],
  bestOf: 3 | 5 | 7
): {
  isValid: boolean;
  error?: string;
  winner?: "player1" | "player2";
} => {
  const rules = CBTM_OFFICIAL_RULES;

  // Verificar se bestOf é válido
  if (!rules.bestOfOptions.includes(bestOf)) {
    return {
      isValid: false,
      error: `Formato de partida inválido. Use: ${rules.bestOfOptions.join(
        ", "
      )}`,
    };
  }

  // Validar cada set
  for (let i = 0; i < sets.length; i++) {
    const setValidation = validateSetCBTM(
      sets[i].player1Score,
      sets[i].player2Score
    );
    if (!setValidation.isValid) {
      return {
        isValid: false,
        error: `Set ${i + 1}: ${setValidation.error}`,
      };
    }
  }

  // Verificar se a partida está completa
  const setsToWin = bestOf === 3 ? 2 : bestOf === 5 ? 3 : 4;
  let player1Sets = 0;
  let player2Sets = 0;

  for (const set of sets) {
    if (set.player1Score > set.player2Score) {
      player1Sets++;
    } else {
      player2Sets++;
    }
  }

  // Verificar se alguém venceu
  if (player1Sets >= setsToWin) {
    return { isValid: true, winner: "player1" };
  } else if (player2Sets >= setsToWin) {
    return { isValid: true, winner: "player2" };
  }

  // Partida ainda em andamento
  return { isValid: true };
};

/**
 * Valida configuração de campeonato conforme CBTM/ITTF
 */
export const validateChampionshipConfigCBTM = (config: {
  athletesCount: number;
  groupSize: number;
  qualificationSpotsPerGroup: number;
  groupsBestOf: 3 | 5;
  knockoutBestOf: 3 | 5 | 7;
  hasThirdPlace: boolean;
  hasRepechage: boolean;
}): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const rules = CBTM_OFFICIAL_RULES;
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar tamanho dos grupos
  if (
    config.groupSize < rules.minAthletesPerGroup ||
    config.groupSize > rules.maxAthletesPerGroup
  ) {
    errors.push(
      `Grupos devem ter entre ${rules.minAthletesPerGroup} e ${rules.maxAthletesPerGroup} atletas`
    );
  }

  // Validar número de classificados por grupo
  if (config.qualificationSpotsPerGroup >= config.groupSize) {
    errors.push(
      "Número de classificados deve ser menor que o tamanho do grupo"
    );
  }

  if (config.qualificationSpotsPerGroup < 1) {
    errors.push("Deve haver pelo menos 1 classificado por grupo");
  }

  // Validar formatos de partida
  if (!rules.bestOfOptions.includes(config.groupsBestOf)) {
    errors.push(
      `Formato de grupos inválido. Use: ${rules.bestOfOptions.join(", ")}`
    );
  }

  if (!rules.bestOfOptions.includes(config.knockoutBestOf)) {
    errors.push(
      `Formato de mata-mata inválido. Use: ${rules.bestOfOptions.join(", ")}`
    );
  }

  // Validar número mínimo de atletas para mata-mata
  const groupsCount = Math.ceil(config.athletesCount / config.groupSize);
  const qualifiedAthletes = groupsCount * config.qualificationSpotsPerGroup;

  if (qualifiedAthletes < rules.minAthletesForKnockout) {
    errors.push(
      `Configuração resulta em apenas ${qualifiedAthletes} classificados. Mínimo: ${rules.minAthletesForKnockout}`
    );
  }

  // Warnings para melhores práticas
  if (config.groupsBestOf !== rules.defaultGroupsBestOf) {
    warnings.push(
      `CBTM recomenda melhor de ${rules.defaultGroupsBestOf} sets para grupos`
    );
  }

  if (config.knockoutBestOf !== rules.defaultKnockoutBestOf) {
    warnings.push(
      `CBTM recomenda melhor de ${rules.defaultKnockoutBestOf} sets para mata-mata`
    );
  }

  if (!config.hasThirdPlace) {
    warnings.push("CBTM recomenda disputa de 3º lugar em torneios oficiais");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Valida distribuição de cabeças de chave conforme CBTM/ITTF
 */
export const validateSeedingCBTM = (
  totalAthletes: number,
  seedsCount: number
): { isValid: boolean; error?: string; recommendedSeeds?: number } => {
  const rules = CBTM_OFFICIAL_RULES;

  if (seedsCount < 0) {
    return { isValid: false, error: "Número de cabeças não pode ser negativo" };
  }

  if (seedsCount > totalAthletes) {
    return {
      isValid: false,
      error: "Número de cabeças não pode ser maior que o total de atletas",
    };
  }

  if (seedsCount > rules.maxSeedsAllowed) {
    return {
      isValid: false,
      error: `Máximo de ${rules.maxSeedsAllowed} cabeças de chave permitidas`,
    };
  }

  // Recomendações baseadas no número de atletas
  let recommendedSeeds = 0;
  if (totalAthletes >= 32) recommendedSeeds = 8;
  else if (totalAthletes >= 16) recommendedSeeds = 4;
  else if (totalAthletes >= 8) recommendedSeeds = 2;
  else recommendedSeeds = 0;

  return {
    isValid: true,
    recommendedSeeds: recommendedSeeds > 0 ? recommendedSeeds : undefined,
  };
};

/**
 * Gera estrutura de chave conforme padrão CBTM/ITTF
 */
export const generateBracketStructureCBTM = (
  athletesCount: number
): {
  bracketSize: number;
  rounds: { name: string; matchesCount: number }[];
  needsBye: boolean;
  byeCount: number;
} => {
  // Determinar tamanho do bracket (próxima potência de 2)
  let bracketSize = 2;
  while (bracketSize < athletesCount) {
    bracketSize *= 2;
  }

  const needsBye = athletesCount < bracketSize;
  const byeCount = bracketSize - athletesCount;

  // Gerar estrutura das rodadas
  const rounds: { name: string; matchesCount: number }[] = [];
  let currentSize = bracketSize;
  let roundNumber = Math.log2(bracketSize);

  while (currentSize > 1) {
    const roundName = getRoundNameCBTM(roundNumber);
    const matchesCount = currentSize / 2;

    rounds.push({
      name: roundName,
      matchesCount: matchesCount,
    });

    currentSize /= 2;
    roundNumber--;
  }

  return {
    bracketSize,
    rounds,
    needsBye,
    byeCount,
  };
};

/**
 * Nomes das rodadas conforme padrão CBTM/ITTF
 */
const getRoundNameCBTM = (roundLevel: number): string => {
  const roundNames: Record<number, string> = {
    1: "Final",
    2: "Semifinal",
    3: "Quartas de Final",
    4: "Oitavas de Final",
    5: "Décimo-sextos de Final",
    6: "Trinta-e-dois avos de Final",
    7: "Sessenta-e-quatro avos de Final",
  };

  return roundNames[roundLevel] || `${Math.pow(2, roundLevel)}-avos de Final`;
};

export default CBTM_OFFICIAL_RULES;
