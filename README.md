# Game Log · Front-end

[![CI](https://github.com/kauanunnes/game-log-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/kauanunnes/game-log-frontend/actions/workflows/ci.yml)

Front-end do Game Log, um diário de jogos com cara de Windows 95. A API e a documentação do projeto (requisitos, telas, roadmap) ficam no repositório do back-end, em `docs/`.

## Stack

Vue 3 · TypeScript · Vite · Vue Router · Pinia · TanStack Query · Vitest · ESLint + Oxlint · Prettier · pnpm

## Rodando

```bash
pnpm install
pnpm dev
```

Abre em `http://localhost:5173`. As chamadas para `/api` vão para a API em `http://localhost:8080`; para usar outro endereço, defina `API_URL`.

## Scripts

| Script | O que faz |
| --- | --- |
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Checagem de tipos e build de produção |
| `pnpm test:unit` | Testes com Vitest |
| `pnpm lint` | Oxlint e ESLint |
| `pnpm format` | Prettier |

O CI roda, a cada push e PR, o lint, o Prettier, a checagem de tipos, os testes e o build.

## Estrutura

```text
src/
├── api/          cliente HTTP (token em memória, refresh automático no 401) e um arquivo por recurso
├── components/   janela, barra de tarefas, nota em estrelas, card de jogo...
├── lib/          rótulos dos enums, formatação, filtros da URL, tabela da RN02 e composables
├── router/       rotas, abas e guarda de login
├── stores/       Pinia: sessão
├── styles/       tokens de design e estilos base
├── types/        tipos da API
└── views/        uma view por rota; as abas do perfil e das configurações em subpastas
```

## Telas

- **Início:** jogos em alta na semana e avaliações recentes.
- **Explorar:** busca no catálogo com filtros de gênero, plataforma e ano, e ordenação.
- **Jogo:** dados do IGDB, números da comunidade, avaliações e o registro na biblioteca.
- **Perfil:** abas de jogados, jogando, quero jogar, desejos, favoritos, avaliações e estatísticas.
- **Configurações:** perfil, senha, privacidade e exclusão da conta.

## Visual

Interface do Windows 95/98 com acentos vaporwave: janelas cinza com relevo, barra de título azul (ou rosa nos destaques), área de trabalho verde-água e fontes em pixel. As cores, sombras e fontes ficam em `src/styles/tokens.css`. Em desenvolvimento, `/_design` mostra a paleta, a tipografia e os componentes.
