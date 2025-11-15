import { z } from "zod";
import { ValidationError } from "../lib/error-handler";

// Schema base para ID
const IdSchema = z.string().uuid("ID deve ser um UUID válido");

// Schema para datas
const DateSchema = z
  .union([
    z.date(),
    z.string().datetime("Data deve estar em formato ISO válido"),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  ])
  .transform((val) => {
    if (val instanceof Date) return val;
    return new Date(val);
  });

// Schema base para atleta (sem validações complexas)
const BaseAthleteSchema = z.object({
  id: IdSchema,
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(
      /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'-]+$/,
      "Nome deve conter apenas letras, espaços, hífens e apostrofes"
    )
    .transform((val) => val.trim()),
  isSeeded: z.boolean().default(false),
  seedNumber: z
    .number()
    .int("Número da cabeça deve ser um inteiro")
    .min(1, "Número da cabeça deve ser maior que 0")
    .max(32, "Número da cabeça deve ser no máximo 32")
    .optional(),
  isVirtual: z.boolean().default(false),
});

// Schema para atleta com validações
const AthleteSchema = BaseAthleteSchema.refine(
  (data) => !data.isSeeded || (data.isSeeded && data.seedNumber !== undefined),
  {
    message: "Atletas com seed devem ter um número definido",
    path: ["seedNumber"],
  }
).refine((data) => !data.seedNumber || (data.seedNumber && data.isSeeded), {
  message: "Apenas atletas com seed podem ter número definido",
  path: ["isSeeded"],
});

// Schema para criação de atleta (sem ID)
const CreateAthleteSchema = BaseAthleteSchema.omit({ id: true });

// Schema para update de atleta (ID obrigatório, outros opcionais)
const UpdateAthleteSchema = BaseAthleteSchema.partial().required({ id: true });

// Schema para resultado de set
const SetResultSchema = z
  .object({
    player1Score: z
      .number()
      .int("Pontuação deve ser um número inteiro")
      .min(0, "Pontuação não pode ser negativa")
      .max(99, "Pontuação não pode ser maior que 99"),
    player2Score: z
      .number()
      .int("Pontuação deve ser um número inteiro")
      .min(0, "Pontuação não pode ser negativa")
      .max(99, "Pontuação não pode ser maior que 99"),
    winnerId: IdSchema.optional(),
  })
  .refine(
    (data) => {
      // Validação básica de tênis de mesa
      const { player1Score, player2Score } = data;

      // Um dos jogadores deve ter pelo menos 11 pontos para vencer
      const maxScore = Math.max(player1Score, player2Score);
      const minScore = Math.min(player1Score, player2Score);

      if (maxScore < 11) return false;

      // Se o jogo foi para deuce (10-10 ou mais), a diferença deve ser pelo menos 2
      if (minScore >= 10) {
        return maxScore - minScore >= 2;
      }

      // Se não foi para deuce, o vencedor deve ter 11+ e o perdedor menos de 11
      return maxScore >= 11 && minScore < 11;
    },
    {
      message: "Placar inválido para tênis de mesa",
    }
  );

// Schema para partida
const MatchSchema = z
  .object({
    id: IdSchema.optional(),
    player1Id: IdSchema,
    player2Id: IdSchema,
    player1: AthleteSchema.optional(),
    player2: AthleteSchema.optional(),
    sets: z.array(SetResultSchema).default([]),
    winnerId: IdSchema.optional(),
    isWalkover: z.boolean().default(false),
    walkoverWinnerId: IdSchema.optional(),
    isCompleted: z.boolean().default(false),
    phase: z.enum(["groups", "knockout"], {
      errorMap: () => ({ message: 'Fase deve ser "groups" ou "knockout"' }),
    }),
    groupId: z.string().optional(),
    round: z.string().optional(),
    position: z.number().int().min(0).optional(),
    isThirdPlace: z.boolean().default(false),
    timeoutsUsed: z
      .object({
        player1: z.boolean().default(false),
        player2: z.boolean().default(false),
      })
      .default({ player1: false, player2: false }),
    createdAt: DateSchema.default(() => new Date()),
    completedAt: DateSchema.optional(),
  })
  .refine((data) => data.player1Id !== data.player2Id, {
    message: "Um jogador não pode jogar contra si mesmo",
    path: ["player2Id"],
  })
  .refine((data) => !data.isWalkover || data.walkoverWinnerId, {
    message: "Walkover deve ter um vencedor definido",
    path: ["walkoverWinnerId"],
  })
  .refine(
    (data) =>
      !data.walkoverWinnerId ||
      [data.player1Id, data.player2Id].includes(data.walkoverWinnerId),
    {
      message: "Vencedor do walkover deve ser um dos jogadores",
      path: ["walkoverWinnerId"],
    }
  )
  .refine(
    (data) => {
      if (!data.isCompleted || data.sets.length === 0) return true;

      // Verificar se há um vencedor claro nos sets
      let player1Sets = 0;
      let player2Sets = 0;

      for (const set of data.sets) {
        if (set.player1Score > set.player2Score) {
          player1Sets++;
        } else if (set.player2Score > set.player1Score) {
          player2Sets++;
        }
      }

      // Para melhor de 3: precisa de 2 sets
      // Para melhor de 5: precisa de 3 sets
      // Para melhor de 7: precisa de 4 sets
      const maxSets = Math.max(player1Sets, player2Sets);
      return maxSets >= 2; // Mínimo para qualquer formato
    },
    {
      message: "Partida completa deve ter um vencedor claro",
      path: ["sets"],
    }
  );

// Schema para configuração de grupo
const GroupSchema = z
  .object({
    id: IdSchema.optional(),
    name: z
      .string()
      .min(1, "Nome do grupo é obrigatório")
      .max(50, "Nome do grupo deve ter no máximo 50 caracteres"),
    athletes: z.array(AthleteSchema),
    matches: z.array(MatchSchema).default([]),
    standings: z.array(z.any()).default([]), // GroupStanding schema seria muito complexo aqui
    qualificationSpots: z
      .number()
      .int("Número de vagas deve ser um inteiro")
      .min(1, "Deve haver pelo menos 1 vaga de classificação")
      .max(5, "Máximo de 5 vagas por grupo"),
    isCompleted: z.boolean().default(false),
  })
  .refine((data) => data.athletes.length >= 3 && data.athletes.length <= 5, {
    message: "Grupo deve ter entre 3 e 5 atletas",
    path: ["athletes"],
  })
  .refine((data) => data.qualificationSpots < data.athletes.length, {
    message: "Número de classificados deve ser menor que o número de atletas",
    path: ["qualificationSpots"],
  });

// Schema para configuração do torneio
const TournamentConfigSchema = z
  .object({
    name: z
      .string()
      .min(3, "Nome deve ter pelo menos 3 caracteres")
      .max(100, "Nome deve ter no máximo 100 caracteres")
      .trim(),
    date: DateSchema,
    groupSize: z.union([z.literal(3), z.literal(4), z.literal(5)], {
      errorMap: () => ({ message: "Tamanho do grupo deve ser 3, 4 ou 5" }),
    }),
    qualificationSpotsPerGroup: z
      .number()
      .int("Número de classificados deve ser um inteiro")
      .min(1, "Deve haver pelo menos 1 classificado por grupo")
      .max(4, "Máximo de 4 classificados por grupo"),
    groupsBestOf: z.union([z.literal(3), z.literal(5)], {
      errorMap: () => ({ message: "Grupos devem ser melhor de 3 ou 5" }),
    }),
    knockoutBestOf: z.union([z.literal(3), z.literal(5), z.literal(7)], {
      errorMap: () => ({ message: "Mata-mata deve ser melhor de 3, 5 ou 7" }),
    }),
    hasThirdPlace: z.boolean().default(true),
    hasRepechage: z.boolean().default(false),
  })
  .refine((data) => data.qualificationSpotsPerGroup < data.groupSize, {
    message: "Número de classificados deve ser menor que o tamanho do grupo",
    path: ["qualificationSpotsPerGroup"],
  })
  .refine((data) => data.date >= new Date(new Date().toDateString()), {
    message: "Data do torneio não pode ser no passado",
    path: ["date"],
  });

// Schema para campeonato completo
const BaseChampionshipSchema = z.object({
  id: IdSchema,
  name: z.string().min(1, "Nome é obrigatório"),
  date: DateSchema,
  status: z.enum(["created", "groups", "knockout", "completed"], {
    errorMap: () => ({ message: "Status inválido" }),
  }),
  groupSize: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  qualificationSpotsPerGroup: z.number().int().min(1).max(4),
  groupsBestOf: z.union([z.literal(3), z.literal(5)]),
  knockoutBestOf: z.union([z.literal(3), z.literal(5), z.literal(7)]),
  hasThirdPlace: z.boolean(),
  hasRepechage: z.boolean(),
  athletes: z.array(AthleteSchema),
  totalAthletes: z.number().int().min(0),
  groups: z.array(GroupSchema).default([]),
  knockoutBracket: z.array(z.any()).default([]), // KnockoutNode seria complexo
  totalMatches: z.number().int().min(0).default(0),
  completedMatches: z.number().int().min(0).default(0),
  createdAt: DateSchema.default(() => new Date()),
  updatedAt: DateSchema.default(() => new Date()),
});

const ChampionshipSchema = BaseChampionshipSchema.refine(
  (data) => data.totalAthletes === data.athletes.length,
  {
    message: "Total de atletas deve coincidir com o número real de atletas",
    path: ["totalAthletes"],
  }
)
  .refine((data) => data.completedMatches <= data.totalMatches, {
    message: "Partidas completadas não podem ser maiores que o total",
    path: ["completedMatches"],
  })
  .refine(
    (data) => {
      // Validar que não há seedNumbers duplicados
      const seedNumbers = data.athletes
        .filter((a) => a.seedNumber !== undefined)
        .map((a) => a.seedNumber);

      const uniqueSeeds = new Set(seedNumbers);
      return seedNumbers.length === uniqueSeeds.size;
    },
    {
      message: "Não pode haver atletas com o mesmo número de seed",
      path: ["athletes"],
    }
  );

// Schema para criação de campeonato (sem ID)
const CreateChampionshipSchema = BaseChampionshipSchema.omit({ id: true });

// Schema para resultado de partida (usado em updates)
const MatchResultSchema = z
  .object({
    matchId: IdSchema,
    sets: z.array(SetResultSchema),
    timeoutsUsed: z
      .object({
        player1: z.boolean(),
        player2: z.boolean(),
      })
      .optional(),
    isWalkover: z.boolean().optional(),
    walkoverWinnerId: IdSchema.optional(),
  })
  .refine((data) => !data.isWalkover || data.walkoverWinnerId, {
    message: "Walkover deve ter um vencedor definido",
    path: ["walkoverWinnerId"],
  });

// Função helper para validar dados com tratamento de erro personalizado
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.length > 0 ? `${err.path.join(".")}: ` : "";
        return `${path}${err.message}`;
      });

      console.error("[validation]", errorMessages);
      throw new ValidationError("Dados inválidos", errorMessages);
    }
    throw error;
  }
}

// Função helper para validação parcial (útil para updates)
export function validatePartialData<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  data: unknown
): Partial<z.infer<z.ZodObject<T>>> {
  const partialSchema = schema.partial();
  return validateData(partialSchema, data);
}

// Função helper para validação assíncrona
export async function validateDataAsync<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<T> {
  return validateData(schema, data);
}

// Types inferidos dos schemas
export type Athlete = z.infer<typeof AthleteSchema>;
export type CreateAthlete = z.infer<typeof CreateAthleteSchema>;
export type UpdateAthlete = z.infer<typeof UpdateAthleteSchema>;
export type SetResult = z.infer<typeof SetResultSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type TournamentConfig = z.infer<typeof TournamentConfigSchema>;
export type Championship = z.infer<typeof ChampionshipSchema>;
export type CreateChampionship = z.infer<typeof CreateChampionshipSchema>;
export type MatchResult = z.infer<typeof MatchResultSchema>;

// Exportar schemas para uso em outros arquivos
export {
  AthleteSchema,
  CreateAthleteSchema,
  UpdateAthleteSchema,
  SetResultSchema,
  MatchSchema,
  GroupSchema,
  TournamentConfigSchema,
  ChampionshipSchema,
  CreateChampionshipSchema,
  MatchResultSchema,
};
