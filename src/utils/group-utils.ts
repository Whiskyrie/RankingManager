import { Group, Match, Athlete } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Gera todas as partidas para um grupo (todos contra todos)
 */
export function generateGroupMatches(group: Group): Match[] {
  const groupMatches: Match[] = [];
  const groupAthletes = group.athletes;

  for (let i = 0; i < groupAthletes.length; i++) {
    for (let j = i + 1; j < groupAthletes.length; j++) {
      const match: Match = {
        id: uuidv4(),
        player1Id: groupAthletes[i].id,
        player2Id: groupAthletes[j].id,
        player1: groupAthletes[i],
        player2: groupAthletes[j],
        sets: [],
        isCompleted: false,
        phase: "groups",
        groupId: group.id,
        timeoutsUsed: { player1: false, player2: false },
        createdAt: new Date(),
      };
      groupMatches.push(match);
    }
  }

  return groupMatches;
}

/**
 * Garante que um atleta tenha ID válido
 */
export function ensureAthleteId(athlete: Partial<Athlete>): Athlete {
  return {
    ...athlete,
    id: athlete.id || uuidv4(),
    name: athlete.name || "",
    isSeeded: athlete.isSeeded || false,
    isVirtual: athlete.isVirtual || false,
  } as Athlete;
}

/**
 * Garante que todos os atletas tenham IDs válidos
 */
export function ensureAthletesIds(athletes: Partial<Athlete>[]): Athlete[] {
  return athletes.map(ensureAthleteId);
}
