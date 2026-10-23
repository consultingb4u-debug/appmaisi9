# Site institucional e comercial | MAIS i9

Site público da MAIS i9 (Consultoria Protheus + MAIS i9 WMS). Projeto Next.js independente do sistema
interno que está na raiz do repositório: tem dependências, CI e deploy próprios. O build gera um site
**100% estático** (`out/`) que roda em hospedagem comum (Hostinger), com os formulários enviados por
`public/contato.php`.

- Arquitetura, experiência, identidade visual e pendências: [`../docs/03-site-institucional.md`](../docs/03-site-institucional.md)

## Rodar localmente

Pré-requisitos: Node 22+ e, para testar os formulários, PHP 8.1+.

```bash
cd site
npm install
npm run dev                    # http://localhost:3000 (formulários não enviam: não há PHP)
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | site estático em `out/` |
| `php -S localhost:8080 -t out` | serve o build com o `contato.php` funcionando (sem `contato-config.php`, usa `mail()`) |
| `npm run pacote:hostinger` | gera `site-maisi9-hostinger.zip` para publicar (ver abaixo) |
| `npm run lint` / `npm run typecheck` / `npm test` | verificações (as mesmas da CI; os testes do PHP rodam se houver PHP) |

## Páginas

| Rota | Conteúdo |
|---|---|
| `/` | Home institucional: hero com acesso à consultoria e ao WMS, quem somos, consultoria, WMS, por que a MAIS i9, jornada de valor, conteúdos, CTA |
| `/consultoria-protheus` | Landing da consultoria, com formulário (`#formulario`, aceita `?servico=…`) |
| `/mais-i9-wms` | Landing do produto, com formulário de demonstração (`#demonstracao`) |
| `/sobre`, `/contato` | Institucionais (contato aceita `?assunto=…`) |
| `/conteudos`, `/conteudos/categoria/[categoria]`, `/conteudos/[slug]` | Insights (artigos em MDX) |
| `/politica-de-privacidade` | Minuta LGPD (validar com o jurídico) |
| `/sitemap.xml`, `/robots.txt`, `…/opengraph-image` | SEO técnico |

## Onde editar o conteúdo

Tudo o que é texto institucional fica em `conteudo/`; os componentes não têm dados fixos.

| Arquivo | O que contém |
|---|---|
| `conteudo/empresa.ts` | dados institucionais, contatos, WhatsApp e mensagens das chamadas (`ctaWhatsapp`), logotipo, encarregado LGPD |
| `conteudo/consultoria.ts` | serviços, desafios, diferenciais, modelos de contratação, metodologia, FAQ |
| `conteudo/wms.ts` | base operacional, módulos complementares, benefícios, integração, FAQ, telas reais e teaser em vídeo (`public/wms/`) |
| `conteudo/insights.ts` + `conteudo/artigos/*.mdx` | categorias e artigos |
| `conteudo/navegacao.ts` | menu e rodapé |

**Informação ausente fica `null`.** O site mostra um marcador `[A preencher: …]` no lugar e a omite dos
dados estruturados. Nunca substitua por dado fictício.

### Logotipo oficial

O logotipo colorido está em `public/marca/logo-maisi9.png` e o símbolo é o favicon (`app/icon.png`), ambos
usados como fornecidos. Para trocar ou acrescentar versões (SVG, versão para fundo escuro), coloque o arquivo
em `public/marca/` e ajuste `logo` em `conteudo/empresa.ts` com as **dimensões originais** do arquivo:

```ts
logo: {
  positivo: { src: "/marca/logo-maisi9.png", largura: 1527, altura: 493 },
  negativo: { src: "/marca/logo-maisi9-negativo.svg", largura: 1527, altura: 493 }, // versão branca, quando houver
},
```

Sem a versão negativa, o rodapé (fundo escuro) mostra a versão colorida sobre uma placa branca.

### Valores e preços

O site **não publica valores nem preços** (valor/hora, setup, assinatura, ganhos em R$). Eles ficam nas
propostas. O teste `tests/conteudo.test.ts` falha se algum valor em reais aparecer em `conteudo/`, `app/` ou
`components/`.

### Telas reais do MAIS i9 WMS

As telas reais têm prioridade sobre as ilustrações. Coloque as imagens em `public/wms/` e preencha
`telasReais` em `conteudo/wms.ts` (`dashboard`, `appOperador`, `operacional`, `indicadores`,
`appMotorista`). Cada tela preenchida substitui a ilustração correspondente; o aviso de
“representação ilustrativa” some quando todas forem reais.

### Publicar um artigo

1. Crie `conteudo/artigos/<slug>.mdx` com o texto em Markdown (sem título: ele vem dos metadados).
2. Registre `slug`, `titulo`, `resumo`, `categoria`, `publicadoEm`, `autor` e `minutosLeitura` em
   `artigos` (`conteudo/insights.ts`).
3. Para chamar o WhatsApp da MAIS i9 no texto, use o assunto como link: `[agende uma demonstração](whatsapp:demonstracaoWms)`
   (assuntos em `mensagensWhatsapp`, `conteudo/empresa.ts`).

Página, listagens, sitemap, imagem de compartilhamento e dados estruturados são gerados a partir do
registro. O teste `tests/conteudo.test.ts` confere se cada artigo tem arquivo e categoria válida.

## Formulários e leads

Três formulários (consultoria, demonstração do WMS e contato) validam no navegador com as regras de
`lib/leads/esquemas.ts` (Zod) e enviam para `public/contato.php`, que:

- valida de novo no servidor, com as mesmas mensagens (um teste compara as duas validações);
- lê rótulos e opções de `contato-opcoes.json`, gerado no build a partir de `conteudo/`;
- aplica proteção contra robôs (campo-armadilha, tempo mínimo e 5 envios a cada 10 minutos por IP);
- envia o e-mail para a equipe comercial, com “responder para” o visitante, protocolo, registro do
  consentimento (versão da política) e origem (página, referência e UTMs);
- só confirma o envio se o e-mail foi aceito; caso contrário, avisa que a mensagem **não foi enviada**.

O destino e o envio ficam em `contato-config.php` (modelo em `hostinger/contato-config.php`), no
servidor, fora do repositório: SMTP autenticado (recomendado) ou `mail()` do servidor.

## SEO, indexação e publicação

- `NEXT_PUBLIC_SITE_URL` e `SITE_INDEXAVEL` são lidos **no build**. Por padrão o site não é indexado
  (`robots.txt` bloqueia e as páginas saem com `noindex`); use `SITE_INDEXAVEL=true` só na publicação
  oficial, depois de resolver as pendências.
- **Hostinger:** `npm run pacote:hostinger` gera `site-maisi9-hostinger.zip` com
  `ENVIAR-PARA-public_html.zip` (site + `contato.php` + `.htaccess`, para extrair dentro de
  `public_html`), `contato-config.php`, `diagnostico.php` (confere a publicação; apagar depois) e o
  passo a passo (`hostinger/LEIA-ME.txt`). O
  pacote sai com `NEXT_PUBLIC_SITE_URL=https://www.maisi9.com.br` e `SITE_INDEXAVEL=true`; para uma
  homologação, gere com `SITE_INDEXAVEL=false npm run pacote:hostinger`.
- O `.htaccess` força HTTPS, aplica os cabeçalhos de segurança, o cache e a página 404, e bloqueia o
  acesso web ao `contato-config.php`.
- Qualquer hospedagem estática com PHP serve; sem PHP, o site funciona e os formulários avisam que não
  enviaram.

## Estrutura

```
app/                 páginas, metadados, sitemap, robots e imagens Open Graph
components/          UI (ui.tsx, secoes.tsx, abas.tsx), layout, formulários, WMS e visuais
conteudo/            textos e dados editáveis (+ artigos MDX)
lib/leads/           validação dos formulários (mesmas regras do contato.php) e leitura da resposta
public/contato.php   recebe os formulários e envia o e-mail (PHP)
hostinger/           modelo do contato-config.php e instruções de publicação
scripts/             geração do pacote para a Hostinger
lib/                 SEO (site.ts, jsonld.ts, og.tsx) e lista de rotas
tests/               testes (Vitest)
```
