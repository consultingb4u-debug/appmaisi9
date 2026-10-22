<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Site institucional MAIS i9

Projeto Next.js independente do sistema interno da raiz (deploy, dependências e CI próprios).

- Idioma do conteúdo, do código de domínio e da interface: português.
- Textos editáveis ficam em `conteudo/` (dados institucionais, serviços, módulos do WMS, cases, artigos). Componentes não devem ter dado institucional fixo.
- Nunca inventar dados (ano de fundação, clientes, números, certificações, contatos). Informação ausente fica `null` e aparece com `<Pendente>`.
- Nada de promessas numéricas de resultado; não apresentar a MAIS i9 como parte da TOTVS nem o WMS como produto TOTVS.
- Logotipo oficial só como arquivo fornecido (`conteudo/empresa.ts` → `logo`), sem redesenho.
- Formulários nunca simulam sucesso: `lib/leads/` valida com Zod e só confirma o envio se um canal (webhook ou SMTP) aceitar.
- Verificação antes de commitar: `npm run lint && npm run typecheck && npm test && npm run build` (dentro de `site/`).
