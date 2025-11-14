# Guia Completo do Dark Mode

Este documento descreve a implementação completa do dark mode no CBTM Manager.

## 🌓 Visão Geral

O sistema de dark mode foi implementado usando **next-themes** e **Tailwind CSS**, proporcionando:
- ✅ Troca suave entre temas light/dark/system
- ✅ Persistência da preferência do usuário
- ✅ Prevenção de FOUC (Flash of Unstyled Content)
- ✅ Suporte completo em todos os componentes principais
- ✅ Design system consistente

## 📁 Arquitetura

### 1. **Configuração Base**

#### `index.html`
```html
<html lang="pt-BR" suppressHydrationWarning>
  <head>
    <!-- Script para prevenir FOUC -->
    <script>
      const theme = localStorage.getItem('theme') || 'system';
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const effectiveTheme = theme === 'system' ? systemTheme : theme;

      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    </script>
  </head>
</html>
```

**Função**: Detecta e aplica o tema antes do primeiro render, evitando flash de conteúdo.

#### `tailwind.config.js`
```javascript
module.exports = {
  darkMode: ['class'], // Ativa dark mode via classe CSS
  // ... resto da config
}
```

#### `src/index.css`
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  /* ... outras variáveis light */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... outras variáveis dark */
}
```

### 2. **Providers**

#### `ThemeProvider.tsx`
```tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

#### `AppRouter.tsx`
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {/* ... resto do app */}
</ThemeProvider>
```

### 3. **Componentes de UI**

#### `ThemeToggle.tsx`
```tsx
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      {/* Opções: Light, Dark, System */}
    </DropdownMenu>
  );
}
```

**Localização**: Header (desktop e mobile)

## 🎨 Design System - Cores

### Convenções de Cores Dark Mode

| Elemento | Light Mode | Dark Mode |
|----------|-----------|-----------|
| **Backgrounds** | | |
| Principal | `bg-white` | `dark:bg-gray-800` |
| Secundário | `bg-gray-50` | `dark:bg-gray-900` |
| Cards | `bg-white` | `dark:bg-gray-950` |
| **Textos** | | |
| Primário | `text-gray-900` | `dark:text-gray-100` |
| Secundário | `text-gray-600` | `dark:text-gray-400` |
| Terciário | `text-gray-500` | `dark:text-gray-400` |
| **Bordas** | | |
| Padrão | `border-gray-200` | `dark:border-gray-700` |
| Inputs | `border-gray-200` | `dark:border-gray-800` |
| **Ícones** | | |
| Blue | `text-blue-600` | `dark:text-blue-500` |
| Green | `text-green-600` | `dark:text-green-500` |
| Yellow | `text-yellow-600` | `dark:text-yellow-500` |
| Purple | `text-purple-600` | `dark:text-purple-500` |
| Red | `text-red-600` | `dark:text-red-400` |
| **Progress Bars** | | |
| Background | `bg-gray-200` | `dark:bg-gray-700` |
| Fill | `bg-blue-600` | `dark:bg-blue-500` |

## 📦 Componentes Implementados

### 1. **Layout** (src/components/Layout.tsx)
```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
    {/* Header content */}
  </header>

  <aside className="bg-white dark:bg-gray-800 border-r dark:border-gray-700">
    {/* Sidebar */}
  </aside>
</div>
```

**Elementos com dark mode:**
- ✅ Background principal
- ✅ Header
- ✅ Sidebar
- ✅ Textos e títulos
- ✅ Ícones de navegação
- ✅ Status badges
- ✅ Estatísticas rápidas
- ✅ Theme toggle (desktop e mobile)

### 2. **Dashboard** (src/pages/Dashboard.tsx)
```tsx
<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <h1 className="text-gray-900 dark:text-gray-100">Ranking</h1>
  <p className="text-gray-600 dark:text-gray-400">Descrição</p>
</div>
```

**Elementos com dark mode:**
- ✅ Background da página
- ✅ Header e títulos
- ✅ Cards de estatísticas (Total, Ativos, Concluídos, Atletas)
- ✅ Ícones coloridos (Trophy, BarChart3, Calendar, Users)
- ✅ Filtros e search
- ✅ Empty state
- ✅ Mensagens de erro

### 3. **ChampionshipCard** (src/components/championship/ChampionshipCard.tsx)
```tsx
<Card className="hover:shadow-lg">
  <CardTitle className="text-gray-800 dark:text-gray-100">
    {championship.name}
  </CardTitle>
  <Calendar className="text-blue-600 dark:text-blue-500" />
</Card>
```

**Elementos com dark mode:**
- ✅ Título do campeonato
- ✅ Data e ícone do calendário
- ✅ Ícones de estatísticas (Users, BarChart3)
- ✅ Progress bar (background e fill)
- ✅ Textos e labels
- ✅ Status badges

### 4. **Componentes Base de UI**

#### Button
```tsx
<Button className="bg-zinc-900 dark:bg-zinc-50">
  Botão
</Button>
```

#### Card
```tsx
<Card className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
  <CardDescription className="text-zinc-500 dark:text-zinc-400" />
</Card>
```

#### Input
```tsx
<Input className="border-zinc-200 dark:border-zinc-800" />
```

#### Dialog/Modal
```tsx
<DialogContent className="bg-white dark:bg-zinc-950">
  <DialogTitle className="text-zinc-950 dark:text-zinc-50" />
</DialogContent>
```

## 🔧 Como Usar

### 1. Trocar de Tema

**No código:**
```tsx
import { useTheme } from 'next-themes';

function MyComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme('dark')}>
      Ativar Dark Mode
    </button>
  );
}
```

**Usando o ThemeToggle:**
```tsx
import { ThemeToggle } from '@/components/ui/theme-toggle';

<ThemeToggle /> {/* Já está no Header */}
```

### 2. Adicionar Dark Mode em Novos Componentes

**Regra geral:**
```tsx
// ❌ ERRADO - sem dark mode
<div className="bg-white text-gray-900">
  <p className="text-gray-600">Texto</p>
</div>

// ✅ CORRETO - com dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <p className="text-gray-600 dark:text-gray-400">Texto</p>
</div>
```

**Checklist para novos componentes:**
- [ ] Background com `dark:bg-*`
- [ ] Textos com `dark:text-*`
- [ ] Bordas com `dark:border-*`
- [ ] Ícones com `dark:text-*` (use -500 para ícones coloridos)
- [ ] Hover/Focus states com dark mode

### 3. Cores de Ícones

```tsx
// Ícones azuis
<Icon className="text-blue-600 dark:text-blue-500" />

// Ícones verdes
<Icon className="text-green-600 dark:text-green-500" />

// Ícones amarelos
<Icon className="text-yellow-600 dark:text-yellow-500" />

// Ícones roxos
<Icon className="text-purple-600 dark:text-purple-500" />

// Ícones vermelhos
<Icon className="text-red-600 dark:text-red-400" />

// Ícones neutros
<Icon className="text-gray-400 dark:text-gray-500" />
```

## 🧪 Testando Dark Mode

### Testes Manuais

1. **Trocar tema via toggle**
   - Verificar transição suave
   - Verificar persistência após reload

2. **Preferência do sistema**
   - Selecionar "System" no toggle
   - Trocar tema do OS
   - Verificar se app segue automaticamente

3. **FOUC (Flash of Unstyled Content)**
   - Selecionar dark mode
   - Recarregar página (F5)
   - Verificar se NÃO há flash de light mode

4. **Responsividade**
   - Testar em desktop (toggle no header)
   - Testar em mobile (toggle no menu mobile)

### Checklist de Componentes

- [x] Layout (header, sidebar, main)
- [x] Dashboard (estatísticas, filtros, lista)
- [x] ChampionshipCard
- [x] ThemeToggle
- [ ] GroupsManagement
- [ ] KnockoutBracket
- [ ] AthletesManagement
- [ ] ChampionshipSettings
- [ ] Formulários e dialogs

## 🐛 Troubleshooting

### Problema: Flash de conteúdo ao carregar

**Causa**: Script no index.html não está sendo executado corretamente.

**Solução**:
```html
<!-- Verificar se o script está ANTES de qualquer CSS/JS -->
<script>
  try {
    const theme = localStorage.getItem('theme') || 'system';
    // ... resto do código
  } catch (e) {
    console.error('Error setting theme:', e);
  }
</script>
```

### Problema: Tema não persiste após reload

**Causa**: localStorage não está sendo salvo corretamente.

**Solução**: Verificar se ThemeProvider está com `enableSystem` e `attribute="class"`:
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

### Problema: Cores não mudam em dark mode

**Causa**: Faltando classes `dark:*` nos componentes.

**Solução**: Adicionar classes dark mode seguindo o design system:
```tsx
// Antes
<p className="text-gray-600">Texto</p>

// Depois
<p className="text-gray-600 dark:text-gray-400">Texto</p>
```

## 📝 Notas de Implementação

### O que foi feito:
1. ✅ Configuração do ThemeProvider com next-themes
2. ✅ Script FOUC prevention no index.html
3. ✅ ThemeToggle no Layout (desktop e mobile)
4. ✅ Dark mode completo no Dashboard
5. ✅ Dark mode completo no ChampionshipCard
6. ✅ Design system de cores consistente
7. ✅ Variáveis CSS para light/dark
8. ✅ Componentes base de UI com dark mode

### Próximos passos sugeridos:
- [ ] Adicionar dark mode em GroupsManagement
- [ ] Adicionar dark mode em KnockoutBracket
- [ ] Adicionar dark mode em AthletesManagement
- [ ] Adicionar dark mode em ChampionshipSettings
- [ ] Adicionar dark mode em todos os dialogs/modals
- [ ] Adicionar testes automatizados de dark mode
- [ ] Screenshots de light/dark mode no README

## 🎯 Best Practices

1. **Sempre use variáveis CSS quando possível**
   ```css
   background-color: hsl(var(--background));
   ```

2. **Mantenha consistência nas cores**
   - Textos: gray-900 / gray-100
   - Backgrounds: white / gray-800 ou gray-900

3. **Teste em ambos os temas**
   - Sempre verifique light E dark mode
   - Use o toggle enquanto desenvolve

4. **Use o design system**
   - Siga a tabela de cores deste documento
   - Não invente cores novas sem motivo

5. **Pense na acessibilidade**
   - Contraste adequado em ambos os temas
   - Textos legíveis em dark mode

## 📚 Referências

- [Next Themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [shadcn/ui Dark Mode](https://ui.shadcn.com/docs/dark-mode)

---

**Última atualização**: 2024-01-XX
**Versão**: 1.0.0
**Autor**: Claude (Anthropic)
