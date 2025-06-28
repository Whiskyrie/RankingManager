// Validador principal para aplicação das regras CBTM/ITTF

import {
  validateSetCBTM,
  validateMatchCBTM,
  validateChampionshipConfigCBTM,
  validateSeedingCBTM,
  CBTM_OFFICIAL_RULES,
} from "./cbtm-rules";
import { Match, Athlete, Championship } from "../types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  correctedData?: any;
}

/**
 * Valida e corrige formação de chaves conforme CBTM/ITTF
 */
export const validateAndFixBracketFormation = (
  qualifiedAthletes: Athlete[],
  championship: Championship
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(
    "🔍 [VALIDATION] Iniciando validação CBTM/ITTF da formação de chaves"
  );

  // ✅ VALIDAÇÃO 1: Número mínimo de atletas
  if (qualifiedAthletes.length < CBTM_OFFICIAL_RULES.minAthletesForKnockout) {
    errors.push(
      `Mínimo de ${CBTM_OFFICIAL_RULES.minAthletesForKnockout} atletas necessário para mata-mata. Atual: ${qualifiedAthletes.length}`
    );
  }

  // ✅ VALIDAÇÃO 2: Cabeças de chave
  const seededAthletes = qualifiedAthletes.filter((a) => a.isSeeded);
  const seedValidation = validateSeedingCBTM(
    qualifiedAthletes.length,
    seededAthletes.length
  );

  if (!seedValidation.isValid) {
    errors.push(`Erro nas cabeças de chave: ${seedValidation.error}`);
  }

  if (
    seedValidation.recommendedSeeds &&
    seedValidation.recommendedSeeds !== seededAthletes.length
  ) {
    warnings.push(
      `Recomendado ${seedValidation.recommendedSeeds} cabeças de chave para ${qualifiedAthletes.length} atletas. Atual: ${seededAthletes.length}`
    );
  }

  // ✅ VALIDAÇÃO 3: Numeração sequencial das cabeças
  if (seededAthletes.length > 0) {
    const sortedSeeds = [...seededAthletes].sort(
      (a, b) => (a.seedNumber || 999) - (b.seedNumber || 999)
    );

    for (let i = 0; i < sortedSeeds.length; i++) {
      const expectedSeedNumber = i + 1;
      const actualSeedNumber = sortedSeeds[i].seedNumber;

      if (actualSeedNumber !== expectedSeedNumber) {
        errors.push(
          `Cabeça de chave ${sortedSeeds[i].name} tem número ${actualSeedNumber}, esperado: ${expectedSeedNumber}`
        );
      }
    }

    // Verificar duplicatas
    const seedNumbers = seededAthletes
      .map((a) => a.seedNumber)
      .filter((n) => n !== undefined);
    const uniqueSeedNumbers = new Set(seedNumbers);
    if (seedNumbers.length !== uniqueSeedNumbers.size) {
      errors.push("Existem números de cabeça de chave duplicados");
    }
  }

  // ✅ VALIDAÇÃO 4: Configuração de sets
  if (
    championship.knockoutBestOf &&
    !CBTM_OFFICIAL_RULES.bestOfOptions.includes(championship.knockoutBestOf)
  ) {
    errors.push(
      `Formato de mata-mata inválido: ${
        championship.knockoutBestOf
      }. Use: ${CBTM_OFFICIAL_RULES.bestOfOptions.join(", ")}`
    );
  }

  if (
    championship.groupsBestOf &&
    !CBTM_OFFICIAL_RULES.bestOfOptions.includes(championship.groupsBestOf)
  ) {
    errors.push(
      `Formato de grupos inválido: ${
        championship.groupsBestOf
      }. Use: ${CBTM_OFFICIAL_RULES.bestOfOptions.join(", ")}`
    );
  }

  // ✅ VALIDAÇÃO 5: Estrutura do bracket
  let bracketSize = 2;
  while (bracketSize < qualifiedAthletes.length) {
    bracketSize *= 2;
  }

  const needsBye = qualifiedAthletes.length < bracketSize;
  if (needsBye) {
    const byeCount = bracketSize - qualifiedAthletes.length;
    const availableSeeds = seededAthletes.length;

    if (byeCount > availableSeeds) {
      warnings.push(
        `${byeCount} passes livres necessários, mas apenas ${availableSeeds} cabeças disponíveis. Alguns não-cabeças receberão BYE.`
      );
    }
  }

  console.log(
    `✅ [VALIDATION] Validação concluída - Erros: ${errors.length}, Avisos: ${warnings.length}`
  );

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Valida partidas do mata-mata conforme CBTM/ITTF
 */
export const validateKnockoutMatches = (matches: Match[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log(
    `🔍 [VALIDATION] Validando ${matches.length} partidas do mata-mata`
  );

  for (const match of matches) {
    // ✅ VALIDAÇÃO 1: Estrutura básica da partida
    if (!match.player1Id || !match.player2Id) {
      errors.push(`Partida ${match.id}: Jogadores não definidos`);
      continue;
    }

    if (match.player1Id === match.player2Id) {
      errors.push(
        `Partida ${match.id}: Jogador não pode jogar contra si mesmo`
      );
      continue;
    }

    // ✅ VALIDAÇÃO 2: Sets da partida (se completa)
    if (match.isCompleted && match.sets && match.sets.length > 0) {
      const bestOf = 5; // Assumir padrão CBTM se não especificado
      const matchValidation = validateMatchCBTM(match.sets, bestOf);

      if (!matchValidation.isValid) {
        errors.push(`Partida ${match.id}: ${matchValidation.error}`);
      }

      // Verificar consistência do vencedor
      if (matchValidation.winner) {
        const expectedWinnerId =
          matchValidation.winner === "player1"
            ? match.player1Id
            : match.player2Id;
        if (match.winnerId && match.winnerId !== expectedWinnerId) {
          errors.push(
            `Partida ${match.id}: Vencedor inconsistente com o placar dos sets`
          );
        }
      }
    }

    // ✅ VALIDAÇÃO 3: Timeouts
    if (match.timeoutsUsed) {
      // Cada jogador pode usar apenas 1 timeout por partida
      // Esta validação seria aplicada na interface de input
    }

    // ✅ VALIDAÇÃO 4: Walkover
    if (match.isWalkover) {
      if (!match.walkoverWinnerId) {
        errors.push(`Partida ${match.id}: Walkover sem vencedor definido`);
      } else if (
        match.walkoverWinnerId !== match.player1Id &&
        match.walkoverWinnerId !== match.player2Id
      ) {
        errors.push(
          `Partida ${match.id}: Vencedor do walkover deve ser um dos jogadores`
        );
      }

      if (match.sets && match.sets.length > 0) {
        warnings.push(
          `Partida ${match.id}: Walkover não deveria ter sets registrados`
        );
      }
    }
  }

  console.log(
    `✅ [VALIDATION] Validação de partidas concluída - Erros: ${errors.length}, Avisos: ${warnings.length}`
  );

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Valida configuração completa do campeonato conforme CBTM/ITTF
 */
export const validateFullChampionshipCBTM = (
  championship: Championship
): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("🔍 [VALIDATION] Validação completa do campeonato CBTM/ITTF");

  // ✅ VALIDAÇÃO 1: Configuração básica
  const configValidation = validateChampionshipConfigCBTM({
    athletesCount: championship.athletes.length,
    groupSize: championship.groupSize,
    qualificationSpotsPerGroup: championship.qualificationSpotsPerGroup,
    groupsBestOf: championship.groupsBestOf,
    knockoutBestOf: championship.knockoutBestOf,
    hasThirdPlace: championship.hasThirdPlace,
    hasRepechage: championship.hasRepechage,
  });

  errors.push(...configValidation.errors);
  warnings.push(...configValidation.warnings);

  // ✅ VALIDAÇÃO 2: Atletas
  if (championship.athletes.length === 0) {
    errors.push("Campeonato deve ter pelo menos 1 atleta");
  }

  // Verificar nomes únicos
  const athleteNames = championship.athletes.map((a) =>
    a.name.trim().toLowerCase()
  );
  const uniqueNames = new Set(athleteNames);
  if (athleteNames.length !== uniqueNames.size) {
    errors.push("Existem atletas com nomes duplicados");
  }

  // ✅ VALIDAÇÃO 3: Grupos
  if (championship.groups.length === 0) {
    warnings.push("Nenhum grupo foi gerado ainda");
  } else {
    for (const group of championship.groups) {
      if (group.athletes.length !== championship.groupSize) {
        warnings.push(
          `Grupo ${group.name} tem ${group.athletes.length} atletas, esperado: ${championship.groupSize}`
        );
      }
    }
  }

  // ✅ VALIDAÇÃO 4: Partidas dos grupos
  const groupMatches = championship.groups.flatMap((g) =>
    g.matches.filter((m) => m.phase === "groups")
  );
  for (const match of groupMatches) {
    if (match.isCompleted && match.sets && match.sets.length > 0) {
      const matchValidation = validateMatchCBTM(
        match.sets,
        championship.groupsBestOf
      );
      if (!matchValidation.isValid) {
        errors.push(`Partida de grupo ${match.id}: ${matchValidation.error}`);
      }
    }
  }

  // ✅ VALIDAÇÃO 5: Mata-mata
  if (
    championship.status === "knockout" ||
    championship.status === "completed"
  ) {
    const knockoutMatches = championship.groups.flatMap((g) =>
      g.matches.filter((m) => m.phase === "knockout")
    );
    const knockoutValidation = validateKnockoutMatches(knockoutMatches);

    errors.push(...knockoutValidation.errors);
    warnings.push(...knockoutValidation.warnings);
  }

  console.log(
    `✅ [VALIDATION] Validação completa concluída - Erros: ${errors.length}, Avisos: ${warnings.length}`
  );

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Aplica correções automáticas conforme CBTM/ITTF
 */
export const applyAutomaticFixesCBTM = (
  championship: Championship
): Championship => {
  console.log("🔧 [FIXES] Aplicando correções automáticas CBTM/ITTF");

  const fixed = { ...championship };

  // ✅ CORREÇÃO 1: Garantir formatos de sets válidos
  if (!CBTM_OFFICIAL_RULES.bestOfOptions.includes(fixed.groupsBestOf)) {
    console.log(
      `🔧 [FIXES] Corrigindo formato de grupos: ${fixed.groupsBestOf} → ${CBTM_OFFICIAL_RULES.defaultGroupsBestOf}`
    );
    fixed.groupsBestOf = CBTM_OFFICIAL_RULES.defaultGroupsBestOf;
  }

  if (!CBTM_OFFICIAL_RULES.bestOfOptions.includes(fixed.knockoutBestOf)) {
    console.log(
      `🔧 [FIXES] Corrigindo formato de mata-mata: ${fixed.knockoutBestOf} → ${CBTM_OFFICIAL_RULES.defaultKnockoutBestOf}`
    );
    fixed.knockoutBestOf = CBTM_OFFICIAL_RULES.defaultKnockoutBestOf;
  }

  // ✅ CORREÇÃO 2: Corrigir numeração de cabeças de chave
  const seededAthletes = fixed.athletes.filter((a) => a.isSeeded);
  if (seededAthletes.length > 0) {
    // Ordenar por seed number atual e renumerar sequencialmente
    const sortedSeeds = [...seededAthletes].sort(
      (a, b) => (a.seedNumber || 999) - (b.seedNumber || 999)
    );

    sortedSeeds.forEach((athlete, index) => {
      const correctSeedNumber = index + 1;
      if (athlete.seedNumber !== correctSeedNumber) {
        console.log(
          `🔧 [FIXES] Corrigindo cabeça ${athlete.name}: #${athlete.seedNumber} → #${correctSeedNumber}`
        );
        athlete.seedNumber = correctSeedNumber;
      }
    });
  }

  // ✅ CORREÇÃO 3: Garantir disputa de 3º lugar para torneios oficiais
  if (!fixed.hasThirdPlace) {
    console.log(
      "🔧 [FIXES] Habilitando disputa de 3º lugar (recomendação CBTM)"
    );
    fixed.hasThirdPlace = true;
  }

  // ✅ CORREÇÃO 4: Limpar dados inconsistentes em partidas
  fixed.groups = fixed.groups.map((group) => ({
    ...group,
    matches: group.matches.map((match) => {
      const fixedMatch = { ...match };

      // Se é walkover, não deveria ter sets
      if (
        fixedMatch.isWalkover &&
        fixedMatch.sets &&
        fixedMatch.sets.length > 0
      ) {
        console.log(
          `🔧 [FIXES] Removendo sets de walkover na partida ${fixedMatch.id}`
        );
        fixedMatch.sets = [];
      }

      // Se tem vencedor mas não está marcada como completa
      if (fixedMatch.winnerId && !fixedMatch.isCompleted) {
        console.log(
          `🔧 [FIXES] Marcando partida ${fixedMatch.id} como completa`
        );
        fixedMatch.isCompleted = true;
        fixedMatch.completedAt = new Date();
      }

      return fixedMatch;
    }),
  }));

  console.log("✅ [FIXES] Correções automáticas aplicadas");

  return fixed;
};

export {
  validateSetCBTM,
  validateMatchCBTM,
  validateChampionshipConfigCBTM,
  validateSeedingCBTM,
  CBTM_OFFICIAL_RULES,
};
