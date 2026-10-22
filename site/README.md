# Site institucional e comercial — MAIS i9

Site público da MAIS i9 (Consultoria Protheus + MAIS i9 WMS). Projeto Next.js independente do sistema
interno que está na raiz do repositório: tem dependências, CI e deploy próprios.

- Arquitetura, experiência, identidade visual e pendências: [`../docs/03-site-institucional.md`](../docs/03-site-institucional.md)

## Rodar localmente

Pré-requisito: Node 22+.

```bash
cd site
npm install
cp .env.example .env.local     # opcional: destino dos leads (ver abaixo)
npm run dev                    # http://localhost:3000
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build de produção e servidor |
| `npm run lint` / `npm run typecheck` / `npm test` | verificações (as mesmas da CI) |

## Páginas

| Rota | Conteúdo |
|---|---|
| `/` | Home: hero, soluções, por que a MAIS i9, jornada de valor, clientes e cases, conteúdos, CTA |
| `/consultoria-protheus` | Landing da consultoria, com formulário (`#formulario`, aceita `?servico=…`) |
| `/mais-i9-wms` | Landing do produto, com formulário de demonstração (`#demonstracao`) |
| `/sobre`, `/cases`, `/contato` | Institucionais (contato aceita `?assunto=…`) |
| `/conteudos`, `/conteudos/categoria/[categoria]`, `/conteudos/[slug]` | Insights (artigos em MDX) |
| `/politica-de-privacidade` | Minuta LGPD (validar com o jurídico) |
| `/sitemap.xml`, `/robots.txt`, `…/opengraph-image` | SEO técnico |

## Onde editar o conteúdo

Tudo o que é texto institucional fica em `conteudo/` — os componentes não têm dados fixos.

| Arquivo | O que contém |
|---|---|
| `conteudo/empresa.ts` | dados institucionais, contatos, WhatsApp, logotipo, encarregado LGPD |
| `conteudo/consultoria.ts` | serviços, desafios, diferenciais, modelos de contratação, metodologia, FAQ |
| `conteudo/wms.ts` | base operacional, módulos complementares, benefícios, integração, FAQ, telas reais |
| `conteudo/cases.ts` | cases, depoimentos e logotipos de clientes (só com autorização) |
| `conteudo/insights.ts` + `conteudo/artigos/*.mdx` | categorias e artigos |
| `conteudo/navegacao.ts` | menu e rodapé |

**Informação ausente fica `null`.** O site mostra um marcador `[A preencher: …]` no lugar e a omite dos
dados estruturados. Nunca substitua por dado fictício.

### Logotipo oficial

1. Coloque o arquivo original em `public/marca/` (SVG de preferência), sem editar.
2. Em `conteudo/empresa.ts`, preencha `logo.positivo` (fundo claro) e, se houver, `logo.negativo`
   (fundo escuro) com o caminho e as **dimensões originais** do arquivo — usadas só para manter a proporção:

```ts
logo: {
  positivo: { src: "/marca/logo-maisi9.svg", largura: 640, altura: 180 },
  negativo: { src: "/marca/logo-maisi9-negativo.svg", largura: 640, altura: 180 },
},
```

Enquanto não houver arquivo, cabeçalho e rodapé mostram apenas o nome em texto simples.

### Telas reais do MAIS i9 WMS

As telas reais têm prioridade sobre as ilustrações. Coloque as imagens em `public/wms/` e preencha
`telasReais` em `conteudo/wms.ts` (`dashboard`, `appOperador`, `operacional`, `indicadores`,
`appMotorista`). Cada tela preenchida substitui a ilustração correspondente; o aviso de
“representação ilustrativa” some quando todas forem reais.

### Publicar um artigo

1. Crie `conteudo/artigos/<slug>.mdx` com o texto em Markdown (sem título — ele vem dos metadados).
2. Registre `slug`, `titulo`, `resumo`, `categoria`, `publicadoEm`, `autor` e `minutosLeitura` em
   `artigos` (`conteudo/insights.ts`).

Página, listagens, sitemap, imagem de compartilhamento e dados estruturados são gerados a partir do
registro. O teste `tests/conteudo.test.ts` confere se cada artigo tem arquivo e categoria válida.

## Formulários e leads

Três formulários (consultoria, demonstração do WMS e contato) enviam para a Server Action
`lib/leads/acao.ts`, que valida com Zod (`lib/leads/esquemas.ts`), aplica proteção contra robôs
(campo-armadilha, tempo mínimo e limite por IP) e entrega o lead nos canais configurados:

| Variável | Canal |
|---|---|
| `LEADS_WEBHOOK_URL` (+ `LEADS_WEBHOOK_TOKEN`) | `POST` com o lead em JSON — CRM, n8n, Make, Zapier, planilha… |
| `LEADS_EMAIL_PARA` + `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | e-mail para a equipe comercial, com “responder para” o visitante |

- O envio só é confirmado ao visitante se **ao menos um canal aceitar**. Sem canal configurado, o
  formulário avisa que a mensagem **não foi enviada** — nada é simulado.
- O JSON do lead (`versao: 1`) traz contato, campos com rótulos legíveis, mensagem, registro do
  consentimento (com a versão da política) e origem (página, referência e UTMs da sessão). O formato
  está em `lib/leads/montar.ts`.

## SEO, indexação e publicação

- `NEXT_PUBLIC_SITE_URL` e `SITE_INDEXAVEL` são lidos **no build**. Por padrão o site não é indexado
  (`robots.txt` bloqueia e as páginas saem com `noindex`); use `SITE_INDEXAVEL=true` só na publicação
  oficial, depois de resolver as pendências.
- Docker: `docker build --build-arg NEXT_PUBLIC_SITE_URL=https://… --build-arg SITE_INDEXAVEL=true -t maisi9-site .`
  e `docker run -p 3000:3000 --env-file .env maisi9-site` (variáveis dos leads em tempo de execução).
- Qualquer plataforma Node (Vercel, Azure App Service, Render…) também serve: diretório raiz `site/`.

## Estrutura

```
app/                 páginas, metadados, sitemap, robots e imagens Open Graph
components/          UI (ui.tsx, secoes.tsx, abas.tsx), layout, formulários, WMS e visuais
conteudo/            textos e dados editáveis (+ artigos MDX)
lib/leads/           validação, montagem, entrega e Server Action dos formulários
lib/                 SEO (site.ts, jsonld.ts, og.tsx) e lista de rotas
tests/               testes (Vitest)
```
