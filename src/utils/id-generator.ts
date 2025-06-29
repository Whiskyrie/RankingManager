import { v4 as uuidv4 } from "uuid";

/**
 * Gera um UUID v4 único
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Gera um ID único baseado em timestamp e random
 * Usado como fallback se uuid não estiver disponível
 */
export function generateFallbackId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica se um string é um UUID válido
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
