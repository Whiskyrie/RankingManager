import { Group, Athlete, Championship } from "../types";
import { generateGroupMatches } from "../utils/group-utils";
import { calculateGroupStandings } from "../utils/standings-utils";
import { v4 as uuidv4 } from "uuid";

/**
 * Service para gerenciar lógica de grupos
 */
export class GroupService {
  /**
   * Gera grupos automaticamente com distribuição de cabeças de chave
   */
  static generateGroups(
    championship: Championship
  ): { groups: Group[]; totalMatches: number } {
    const { athletes, groupSize } = championship;
    const totalAthletes = athletes.length;

    // Calcular número de grupos
    const maxCompleteGroups = Math.floor(totalAthletes / groupSize);
    const remainingAthletes = totalAthletes % groupSize;

    let numGroups = maxCompleteGroups;
    if (remainingAthletes > 0) {
      if (remainingAthletes < 3 && maxCompleteGroups > 0) {
        numGroups = maxCompleteGroups;
      } else {
        numGroups = maxCompleteGroups + 1;
      }
    }

    // Separar cabeças de chave e não cabeças
    const seeded = athletes
      .filter((a) => a.isSeeded)
      .sort((a, b) => (a.seedNumber || 0) - (b.seedNumber || 0));
    const unseeded = athletes.filter((a) => !a.isSeeded);

    // Criar grupos
    const groups: Group[] = Array.from({ length: numGroups }, (_, i) => ({
      id: uuidv4(),
      name: `Grupo ${String.fromCharCode(65 + i)}`,
      athletes: [],
      matches: [],
      standings: [],
      qualificationSpots: championship.qualificationSpotsPerGroup,
      isCompleted: false,
    }));

    // Distribuir cabeças de chave
    seeded.forEach((athlete, index) => {
      const groupIndex = index % numGroups;
      groups[groupIndex].athletes.push(athlete);
    });

    // Distribuir atletas não cabeça de chave
    if (remainingAthletes > 0 && remainingAthletes < 3 && maxCompleteGroups > 0) {
      // Caso especial: distribuir atletas restantes
      const athletesToDistribute = [...unseeded];
      const athletesForCompleteGroups = athletesToDistribute.splice(
        0,
        maxCompleteGroups * (groupSize - 1)
      );

      athletesForCompleteGroups.forEach((athlete, index) => {
        const groupIndex = index % maxCompleteGroups;
        groups[groupIndex].athletes.push(athlete);
      });

      // Sortear os atletas restantes
      const shuffledGroups = [...Array(numGroups).keys()].sort(
        () => Math.random() - 0.5
      );

      athletesToDistribute.forEach((athlete, index) => {
        const groupIndex = shuffledGroups[index % numGroups];
        groups[groupIndex].athletes.push(athlete);
      });
    } else {
      // Distribuição normal
      unseeded.forEach((athlete, index) => {
        const groupIndex = index % numGroups;
        groups[groupIndex].athletes.push(athlete);
      });
    }

    // Gerar partidas para cada grupo
    let totalMatches = 0;
    groups.forEach((group) => {
      const groupMatches = generateGroupMatches(group);
      group.matches = groupMatches;
      group.standings = calculateGroupStandings(group, championship.groupsBestOf);
      totalMatches += groupMatches.length;
    });

    return { groups, totalMatches };
  }

  /**
   * Cria grupos manualmente
   */
  static createManualGroups(
    championship: Championship,
    manualGroups: { name: string; athleteIds: string[] }[]
  ): { groups: Group[]; totalMatches: number } {
    const groups: Group[] = manualGroups.map((manualGroup, index) => {
      const groupAthletes = manualGroup.athleteIds
        .map((id) => championship.athletes.find((a) => a.id === id))
        .filter((athlete): athlete is Athlete => athlete !== undefined);

      const group: Group = {
        id: uuidv4(),
        name: manualGroup.name || `Grupo ${String.fromCharCode(65 + index)}`,
        athletes: groupAthletes,
        matches: [],
        standings: [],
        qualificationSpots: championship.qualificationSpotsPerGroup,
        isCompleted: false,
      };

      group.matches = generateGroupMatches(group);
      group.standings = calculateGroupStandings(group, championship.groupsBestOf);
      return group;
    });

    const totalMatches = groups.reduce(
      (total, group) => total + group.matches.length,
      0
    );

    return { groups, totalMatches };
  }

  /**
   * Verifica se todos os grupos estão completos
   */
  static areGroupsCompleted(groups: Group[]): boolean {
    return groups.every(
      (group) =>
        group.isCompleted ||
        group.matches.every((m) => m.isCompleted)
    );
  }

  /**
   * Obtém atletas qualificados de todos os grupos
   */
  static getQualifiedAthletes(groups: Group[]): Athlete[] {
    return groups
      .flatMap((group) =>
        group.standings.filter((s) => s.qualified).map((s) => s.athlete)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Obtém atletas eliminados de todos os grupos
   */
  static getEliminatedAthletes(groups: Group[]): Athlete[] {
    const eliminated: Athlete[] = [];

    groups.forEach((group) => {
      if (group.isCompleted && group.standings.length > 0) {
        const groupEliminated = group.standings
          .filter((standing) => !standing.qualified)
          .map((standing) => standing.athlete);

        eliminated.push(...groupEliminated);
      }
    });

    return eliminated;
  }
}
