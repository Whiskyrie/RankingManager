# 🧪 Suite de Testes - Sistema de Gerenciamento de Campeonatos

## 📋 Visão Geral

Suite de testes unitários completa implementada com **Vitest** para garantir a qualidade e confiabilidade do sistema de gerenciamento de campeonatos de tênis de mesa.

## 📊 Estatísticas de Testes

- **Total de Testes**: 97
- **Testes Passando**: 86 (88.7%)
- **Testes Falhando**: 11 (11.3%)
- **Cobertura**: Schemas, Standings, Knockout Logic

## 🚀 Como Executar

### Executar todos os testes
```bash
pnpm test
```

### Executar testes uma vez (CI/CD)
```bash
pnpm test:run
```

### Executar com interface visual
```bash
pnpm test:ui
```

### Executar com relatório de cobertura
```bash
pnpm test:coverage
```

## 📁 Estrutura de Testes

```
src/tests/
├── helpers/
│   └── test-data.ts          # Funções auxiliares para criar mocks
├── schemas/
│   └── validation.test.ts    # Testes de validação com Zod
├── utils/
│   ├── standings.test.ts     # Testes de cálculo de classificação
│   └── knockout.test.ts      # Testes de lógica de mata-mata
├── setup.ts                  # Configuração global dos testes
└── README.md                 # Este arquivo
```

## ✅ Testes Implementados

### 1. **Validações de Schema** (validation.test.ts)

#### AthleteSchema (7 testes) ✅
- ✅ Validação de atleta válido
- ✅ Validação de atleta com seed
- ✅ Falha quando seed não tem número
- ✅ Falha com nome muito curto
- ✅ Falha com nome inválido (números)
- ✅ Remoção de espaços do nome
- ✅ Validação de nome com hífen e apóstrofo

#### SetResultSchema (8 testes) ✅
- ✅ Validação de set normal (11-9)
- ✅ Validação de set com deuce (12-10)
- ✅ Validação de set com deuce prolongado (15-13)
- ✅ Falha com score muito baixo
- ✅ Falha com diferença menor que 2 após 10-10
- ✅ Falha com empate
- ✅ Falha com score negativo
- ✅ Falha com score muito alto

#### MatchSchema (6 testes)
- ⚠️ Validação de partida básica
- ⚠️ Validação de partida completa com sets
- ✅ Validação de walkover
- ✅ Falha quando jogador joga contra si mesmo
- ✅ Falha quando walkover não tem vencedor
- ✅ Falha quando vencedor do walkover não é um dos jogadores

#### GroupSchema (6 testes)
- ⚠️ Validação de grupo com 4 atletas
- ⚠️ Validação de grupo com 3 atletas
- ⚠️ Validação de grupo com 5 atletas
- ✅ Falha com menos de 3 atletas
- ✅ Falha com mais de 5 atletas
- ✅ Falha quando vagas >= número de atletas

#### TournamentConfigSchema (7 testes) ✅
- ✅ Validação de configuração válida
- ✅ Validação de diferentes tamanhos de grupo
- ✅ Validação de melhor de 3, 5 e 7
- ✅ Falha com tamanho de grupo inválido
- ✅ Falha quando classificados >= tamanho do grupo
- ✅ Remoção de espaços do nome

#### ChampionshipSchema (4 testes)
- ⚠️ Validação de campeonato completo
- ✅ Falha quando totalAthletes não bate com array
- ✅ Falha quando completadas > total
- ⚠️ Validação de diferentes status

### 2. **Cálculos de Standings** (standings.test.ts)

#### Standings Básicos (3 testes) ✅
- ✅ Inicialização de standings vazios
- ✅ Cálculo com uma partida completa
- ✅ Contabilização de sets e pontos

#### Critérios de Desempate (3 testes) ✅
- ✅ Ordenação por pontos (1º critério)
- ✅ Uso de saldo de sets (2º critério)
- ✅ Uso de saldo de pontos (3º critério)

#### Walkover (1 teste) ✅
- ✅ Contabilização de walkover corretamente

#### Qualificação (2 testes) ✅
- ✅ Marcação de atletas qualificados
- ✅ Respeito ao número de vagas

#### Posições (1 teste) ✅
- ✅ Atribuição de posições sequenciais

### 3. **Lógica de Mata-mata** (knockout.test.ts)

#### getMatchWinner (14 testes)
- ✅ Melhor de 3: vencedor com 2-0, 2-1
- ✅ Melhor de 5: vencedor com 3-0, 3-1, 3-2
- ✅ Melhor de 7: vencedor com 4-0, 4-3
- ⚠️ Validação de sets inválidos (2 testes)
- ✅ Identificação de player2 como vencedor
- ✅ Contagem de set com deuce

#### Geração de Chaves (10 testes) ✅
- ✅ Funcionamento com 4, 8, 16 atletas
- ✅ Funcionamento com número não-potência de 2
- ✅ Identificação de cabeças de chave
- ✅ Ordenação de cabeças de chave
- ✅ Cálculo de BYEs necessários
- ✅ Cálculo de número de rodadas
- ✅ Nomes de rodadas

#### Progressão no Mata-mata (2 testes) ✅
- ✅ Permissão de progressão apenas com vencedor
- ✅ Bloqueio de progressão sem vencedor

#### Segunda Divisão (4 testes) ✅
- ✅ Separação de qualificados e eliminados
- ✅ Geração de mata-mata de segunda divisão
- ✅ Verificação de habilitação
- ✅ Não geração se desabilitada

#### Terceiro Lugar (3 testes) ✅
- ✅ Geração se habilitada
- ✅ Não geração se desabilitada
- ✅ Uso de perdedores das semifinais

#### Validações de Integridade (4 testes) ✅
- ✅ Prevenção de atleta jogar contra si mesmo
- ✅ Garantia de 2 atletas diferentes por partida
- ✅ Validação de bracket size potência de 2
- ✅ Invalidação de bracket sizes inválidos

#### Casos Extremos (3 testes) ✅
- ✅ Funcionamento com 2 atletas (mínimo)
- ✅ Funcionamento com número ímpar
- ✅ Cálculo correto de próxima potência de 2

## 🐛 Testes Falhando

### Schemas de Validação (8 testes)
Os testes de validação de schemas estão falhando devido a incompatibilidades entre os mocks e as validações estritas do Zod. Especificamente:

1. **MatchSchema**: Requer validação adicional dos sets completos
2. **GroupSchema**: Precisa de ajustes nos mocks de atletas
3. **ChampionshipSchema**: Necessita de datas válidas e estrutura completa

### Knockout Logic (3 testes)
- Validação de sets inválidos precisa ser refinada

## 🔧 Helpers de Teste

### `createMockAthlete(overrides?)`
Cria um atleta mock com opções personalizáveis.

```typescript
const athlete = createMockAthlete({ name: "João Silva", isSeeded: true });
```

### `createMockAthletes(count)`
Cria múltiplos atletas mock, com os primeiros 4 sendo cabeças de chave.

```typescript
const athletes = createMockAthletes(16); // 4 cabeças, 12 normais
```

### `createMockMatch(overrides?)`
Cria uma partida mock.

```typescript
const match = createMockMatch({ phase: "knockout" });
```

### `createCompletedMatch(player1Id, player2Id, winnerId, bestOf?)`
Cria uma partida completa com sets válidos.

```typescript
const match = createCompletedMatch(athlete1.id, athlete2.id, athlete1.id, 5);
```

### `createMockGroup(athleteCount, overrides?)`
Cria um grupo mock completo com partidas.

```typescript
const group = createMockGroup(4);
```

### `createMockChampionship(athleteCount, overrides?)`
Cria um campeonato mock completo.

```typescript
const championship = createMockChampionship(16);
```

## 📝 Boas Práticas

1. **Isolamento**: Cada teste é independente
2. **Mocks**: Use helpers ao invés de criar objetos manualmente
3. **Validação**: Teste tanto casos válidos quanto inválidos
4. **Nomenclatura**: Use nomes descritivos em português
5. **Organização**: Agrupe testes relacionados com `describe()`

## 🚦 CI/CD

Os testes podem ser integrados em pipelines CI/CD:

```yaml
# Exemplo GitHub Actions
- name: Run tests
  run: pnpm test:run

- name: Generate coverage
  run: pnpm test:coverage
```

## 📈 Próximos Passos

1. ✅ ~~Implementar testes de schemas~~
2. ✅ ~~Implementar testes de standings~~
3. ✅ ~~Implementar testes de mata-mata~~
4. ⚠️ Corrigir testes falhando de validação
5. ⏳ Adicionar testes de integração
6. ⏳ Adicionar testes de componentes React
7. ⏳ Aumentar cobertura para 95%+

## 🤝 Contribuindo

Ao adicionar novos recursos:

1. Adicione testes correspondentes
2. Garanta que todos os testes passem
3. Mantenha cobertura acima de 80%
4. Use os helpers existentes quando possível

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Zod Validation](https://zod.dev/)

---

**Última atualização**: 2025-11-13
**Versão**: 1.0.0
