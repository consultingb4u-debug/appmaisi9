<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Projeto MAIS i9

- Idioma do domínio e da interface: português (nomes de modelos, campos, rotas e mensagens).
- Leia `docs/01-proposta-arquitetura.md` antes de modelar: ele define entidades, regras e o plano de incrementos.
- Regras de cálculo ficam em `lib/domain` (funções puras + testes em `tests/domain`); acesso ao banco em `lib/services`.
- Toda Server Action: `exigir(acao, modulo)` → validar com Zod → gravar em `db.$transaction` → `auditar(...)` na mesma transação.
- Datas de calendário são meia-noite UTC (`lib/domain/datas.ts`), coluna `@db.Date`. Semanas são ISO (`2026-W40`).
- Após alterar `prisma/schema.prisma`: `npm run db:migrate` (cria migração) e `npx prisma generate`.
- Verificação antes de commitar: `npm run lint && npm run typecheck && npm test && npm run build`.
