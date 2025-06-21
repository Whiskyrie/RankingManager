import { Athlete } from "../types";

// Array de atletas vazio - os atletas serão adicionados manualmente
export const sampleAthletes: Omit<Athlete, "id">[] = [];

// Nomes para gerar atletas automaticamente se necessário
export const athleteNames = [
  "Carlos Silva",
  "José Santos",
  "João Oliveira",
  "Antonio Souza",
  "Francisco Rodrigues",
  "Paulo Ferreira",
  "Pedro Alves",
  "Lucas Pereira",
  "Luis Lima",
  "Marcos Gomes",
  "Rafael Costa",
  "Daniel Ribeiro",
  "Marcelo Martins",
  "Bruno Carvalho",
  "Eduardo Almeida",
  "Felipe Lopes",
  "Rodrigo Soares",
  "Gabriel Fernandes",
  "Maria Silva",
  "Ana Santos",
  "Francisca Oliveira",
  "Antonia Souza",
  "Adriana Rodrigues",
  "Juliana Ferreira",
  "Marcia Alves",
  "Fernanda Pereira",
  "Patricia Lima",
  "Aline Gomes",
  "Sandra Costa",
  "Camila Ribeiro",
  "Amanda Martins",
  "Bruna Carvalho",
  "Jessica Almeida",
  "Leticia Lopes",
  "Julia Soares",
  "Luciana Fernandes",
  "Vanessa Vieira",
  "Mariana Barbosa",
  "Matheus Rocha",
  "Guilherme Dias",
  "Gustavo Monteiro",
  "Andre Cardoso",
  "Leonardo Reis",
  "Thiago Araujo",
  "Vinicius Campos",
  "Diego Castro",
  "Caio Freitas",
  "Henrique Dantas",
  "Isabella Takahashi",
  "Sophia Yamamoto",
  "Valentina Tanaka",
  "Alice Sato",
  "Laura Nakamura",
  "Helena Watanabe",
  "Manuela Iizuka",
  "Giovanna Kumahara",
  "Beatriz Ishida",
  "Vitoria Hayashi",
];

// Função para gerar atleta aleatório simples
export const generateRandomAthlete = (): Omit<Athlete, "id"> => {
  const name = athleteNames[Math.floor(Math.random() * athleteNames.length)];

  return {
    name,
  };
};
