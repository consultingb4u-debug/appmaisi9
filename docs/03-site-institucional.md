# MAIS i9 — Site institucional e comercial

> Arquitetura, experiência, identidade visual aplicada e pendências do novo site.
> Código em [`site/`](../site) · como rodar e editar: [`site/README.md`](../site/README.md)

## 1. Objetivo e princípios

O site existe para **gerar oportunidades comerciais qualificadas** nos serviços e produtos da MAIS i9:

| Oferta | O que é | Conversões |
|---|---|---|
| **MAIS i9 Consultoria Protheus** | Serviços para empresas que usam o ERP TOTVS Protheus | Falar com um especialista Protheus · Solicitar diagnóstico · Solicitar proposta |
| **MAIS i9 WMS** | Produto próprio, SaaS, de gestão de armazéns | Agendar demonstração · Conversar com um especialista · Solicitar proposta |

Princípios que orientaram as decisões:

1. **Em 10 segundos, o visitante entende** quem é a MAIS i9, o que ela oferece e como falar com a equipe.
2. **Cada oferta tem a sua jornada** e CTAs próprios, sem “Saiba mais” genérico. A consultoria é apresentada
   pela especialização em Protheus; o WMS, pelo que o produto entrega. Uma não é argumento de venda da outra.
3. **Credibilidade sem exagero**: nenhuma promessa numérica, nenhum dado inventado; o que falta aparece
   como pendência visível (`[A preencher: …]`) até ser fornecido.
4. **WMS é produto, consultoria é serviço**: o WMS nunca aparece como serviço de consultoria nem como
   produto da TOTVS; a MAIS i9 nunca aparece como parte ou representante da TOTVS.
5. **Nada simulado**: formulários só confirmam envio quando o lead chega de fato ao destino configurado.
6. **Conversão pelo WhatsApp**: “Falar com um especialista”, “Solicitar diagnóstico”, “Agendar demonstração” e
   “Solicitar proposta” abrem o WhatsApp da MAIS i9 com uma mensagem inicial do assunto (`ctaWhatsapp` em
   `site/conteudo/empresa.ts`). Os formulários continuam nas páginas como canal alternativo.

## 2. Mapa do site

```
Início (/)
├── Consultoria Protheus (/consultoria-protheus)
├── MAIS i9 WMS (/mais-i9-wms)
├── Sobre Nós (/sobre)
├── Conteúdos (/conteudos)
│   ├── /conteudos/categoria/[categoria]   8 categorias
│   └── /conteudos/[slug]                  artigos (MDX)
├── Contato (/contato)
└── Política de Privacidade (/politica-de-privacidade)
```

**Cabeçalho fixo:** logotipo · Início | Consultoria Protheus | MAIS i9 WMS | Sobre Nós | Conteúdos | Contato ·
botão **“Falar com um especialista”**. Abaixo de 1280 px o menu vira um painel em tela cheia; o CTA permanece visível a
partir de 640 px e dentro do menu no celular.

**Rodapé completo:** apresentação, CTA, links por frente (incluindo âncoras para serviços, modelos,
funcionalidades, integração e demonstração), contato comercial, política de privacidade e o aviso de marcas.

## 3. Estrutura das páginas

### Início
Página institucional: apresenta a MAIS i9 e seus serviços e produtos, e leva o visitante à página da
Consultoria Protheus ou do MAIS i9 WMS. Conteúdo em `conteudo/inicio.ts`.

1. **Hero** (azul-marinho): headline e subheadline do briefing e duas “portas” — **Serviço · MAIS i9 Consultoria
   Protheus** e **Produto · MAIS i9 WMS** —, que levam a “Conhecer a Consultoria Protheus” e “Explorar o MAIS i9 WMS”.
2. **Quem somos**: apresentação institucional, link para a página Sobre e as credenciais (+20 anos, +10.000 horas…).
3. **MAIS i9 Consultoria Protheus** (serviço): “Especialistas em TOTVS Protheus”, principais serviços, painel
   ilustrativo de governança e CTAs para a página da consultoria e para falar com um especialista.
4. **MAIS i9 WMS** (produto): “Gestão Inteligente de Armazéns”, o que o produto entrega (incluindo a conexão ao
   Protheus pelo Addon MAIS i9, via API), vitrine do painel e do App Operador e CTAs para a página do produto e
   para agendar demonstração.
5. **Por que a MAIS i9**: os 7 diferenciais do briefing.
6. **Como geramos valor**: jornada Entender → Planejar → Implementar → Sustentar → Evoluir.
7. **Conteúdos**: três artigos mais recentes.
8. **CTA final**: “Vamos conversar sobre os desafios da sua operação?” → “Falar com a MAIS i9”, com atalhos
   para diagnóstico Protheus e demonstração do WMS.

### Consultoria Protheus
Página do serviço, centrada na especialização em TOTVS Protheus. Hero com painel ilustrativo de governança de
demandas → **o que sua empresa ganha** → **experiência** (credenciais e especialidades da equipe) → **desafios**
comuns → **6 serviços** com itens do briefing e “Solicitar proposta” (abre o WhatsApp com o serviço na mensagem),
mais DBA Oracle e SQL Server → **diferenciais** → **5 modelos de contratação** (sem preços), com matriz e
condições de atendimento → **metodologia de atendimento**, prioridades e canais → **benefícios** → o papel da
MAIS i9 → **FAQ** (incluindo “A MAIS i9 faz parte da TOTVS?”) → **formulário** com próximos passos → aviso de marcas.

### MAIS i9 WMS (página de produto)
Página do produto: o que ele é, o que faz e o que entrega. Hero com o painel web e o App Operador → faixa de
credenciais (Addon MAIS i9 para o Protheus, APIs, App Operador, SaaS)
→ **Visão do produto**: teaser em vídeo (31 s, sem som, em loop) e abas (Dashboard, App Operador, Telas
operacionais, Torre Controle de Expedição) →
**10 benefícios** → **Como funciona**: ERP → Recebimento → Armazenagem → Movimentação → Expedição, com o
que vai do ERP para o armazém e o que volta → **Base operacional**: os 7 componentes em cards interativos
(abas acessíveis por teclado) → **4 módulos complementares** e a nota “todos fazem parte do produto padrão;
implantação dimensionada” → **Conexão com o TOTVS Protheus** pelo **Addon MAIS i9, via API** (os dois sentidos da
integração e “diversas integrações disponíveis”, sem listar cada uma; APIs para outros ERPs) → **Aplicativos** (App Operador e App Motorista, separados) → FAQ →
**formulário de demonstração**.

### Institucionais
- **Sobre**: quem somos, missão e credenciais, atuação, visão sobre tecnologia e negócios, compromisso com os
  clientes, experiência da equipe (especialidades, tipos de projeto e segmentos atendidos).
- **Cases**: logotipos, cases por frente (implantação, evolução, sustentação, WMS) e depoimentos — estrutura
  pronta, publicada só com autorização (`conteudo/cases.ts`).
- **Conteúdos**: listagem com filtro por categoria e página de artigo com CTA contextual (consultoria ou WMS).
  Três artigos iniciais, educativos, para revisão da equipe.
- **Contato**: formulário com assunto de interesse, atalhos para Consultoria e WMS, e-mail, telefone, e-mail de
  chamados e botão de WhatsApp.

## 4. Identidade visual aplicada

| Elemento | Decisão |
|---|---|
| **Cores** | Paleta já usada no sistema interno da MAIS i9: azul-marinho `#0a1a30`/`#0f2a4a` (superfícies de destaque), azul institucional `#1f5f9e` (textos e links) e `#2b7bbf` (gráficos), ardósia `#4f6480` (texto de apoio), cinza muito claro `#f4f6f9`, branco. **Laranja `#f28c28` só como destaque**: botão principal (com texto marinho, contraste AA), marcadores e detalhes. Sobre fundo claro o laranja nunca é cor de texto. |
| **Tipografia** | Manrope (títulos) e Inter (texto), auto-hospedadas pelo `next/font`. Ajustar se o manual de marca definir outra família. |
| **Logotipo** | Arquivo oficial colorido, usado sem alteração (`site/public/marca/logo-maisi9.png`); no rodapé escuro, sobre placa branca até chegar a versão negativa. O símbolo é o favicon. |
| **Ritmo** | Seções alternando branco, cinza muito claro e azul-marinho com grade técnica discreta; cantos arredondados; sombras leves. |
| **Imagens** | Sem fotos genéricas. Visuais construídos em código: composição de integração na Home, painel de governança na consultoria e telas do WMS. As telas do WMS são **ilustrativas, com dados fictícios** e aviso explícito, até serem substituídas pelas telas reais. |
| **Ícones** | Um único conjunto (Lucide), traço consistente. |
| **Movimento** | Revelação suave ao rolar feita só com CSS (sem JavaScript) e animação de fluxo na integração; tudo desligado com “reduzir movimento”. |

## 5. Arquitetura técnica

| Tema | Implementação |
|---|---|
| Stack | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS 4, Zod, MDX — mesma base do sistema interno |
| Isolamento | Projeto em `site/`, com `package.json`, CI e deploy próprios; não compartilha banco nem login com o sistema interno |
| Renderização | Todas as páginas geradas estaticamente; JavaScript só no menu móvel, nas abas e nos formulários |
| Conteúdo | Separado do código em `conteudo/` (tipado). Artigos em MDX com registro de metadados — pronto para migrar para um CMS headless no futuro |
| SEO | Metadados e canônica por página, Open Graph/Twitter com imagem gerada por página, `sitemap.xml`, `robots.txt`, dados estruturados (Organization, WebSite, Service, SoftwareApplication, FAQPage, BreadcrumbList, BlogPosting), URLs amigáveis em português |
| Indexação | Bloqueada por padrão (`SITE_INDEXAVEL`) para ambientes de teste; liberar só na publicação oficial |
| Acessibilidade | Link “pular para o conteúdo”, landmarks, trilhas de navegação, foco visível, abas WAI-ARIA, FAQ com `<details>`, erros de formulário ligados aos campos e anunciados, contraste AA |
| Formulários | Server Action com Zod, campo-armadilha, tempo mínimo e limite por IP; entrega por webhook (CRM) e/ou SMTP; consentimento LGPD registrado com a versão da política; UTMs e página de origem enviadas ao CRM |
| Segurança | Cabeçalhos `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; JSON-LD escapado |
| Qualidade | `npm run lint`, `typecheck`, `test` (Vitest: validação, montagem e entrega dos leads, limitador, consistência do conteúdo) e `build`, também na CI |

## 6. Pendências para publicação

Itens que dependem da MAIS i9 — o site sinaliza cada um em vez de inventar.

**Já incorporado** (apresentação comercial 2026-2S, propostas WMS e Evolutivo, folhetos): logotipo colorido e
símbolo (favicon), domínio `maisi9.com.br`, e-mail e telefone comerciais, e-mail de chamados, +20 anos de
experiência, +10.000 horas de projetos, especialidades da equipe, missão, os cinco modelos de contratação e o
quadro de benefícios, canais e classificação de prioridades, DBA Oracle/SQL Server, funcionalidades reais dos
módulos do WMS, implantação e contratação do WMS. Informados depois: sede em Joinville/SC, WhatsApp (47) 3440-2120
e segmentos atendidos.

**Regra de conteúdo:** o site não publica valores nem preços (valor/hora, setup, assinatura, ganhos em R$) nem
quantidades de pacotes comerciais (horas mensais, usuários incluídos). O teste `tests/conteudo.test.ts` falha se
algum valor em reais entrar no conteúdo. Também ficaram de fora os números genéricos do folheto do WMS
(“−40% de perdas”, “95%+ de acuracidade”, “−70% no tempo de inventário”, “ROI em até 6 meses”), que não vêm de um
case. A página de cases foi removida a pedido da MAIS i9; o site não publica resultados de clientes.

**Marca e materiais**
- [ ] Logotipo em SVG e a versão para fundo escuro (branca), usada no rodapé e na imagem de compartilhamento
- [x] Telas reais do MAIS i9 WMS: dashboard de controle de lotes (sem as linhas de valor em reais) e duas telas do
  App Operador (menu de tarefas e consulta por produto), em `site/public/wms/`
- [x] Telas operacionais: portal de aplicações do WMS (módulos por processo)
- [x] Torre Controle de Expedição: monitor logístico de expedição (sem a área vazia abaixo do quadro)
- [ ] Tela real ainda pendente: App Motorista.
- [x] Teaser do WMS (`site/public/wms/teaser-wms.webm` + `.mp4` + pôster), montado das demonstrações gravadas: só a
  área do sistema, sem nome do prospect, sem telas com valores em reais ou CNPJ. Toca só quando visível, tem botão
  de pausar e não toca sozinho com “reduzir movimento”. Os vídeos originais não estão no repositório.
- [ ] Versão do teaser com música (MP4 para LinkedIn/WhatsApp): aguarda a faixa escolhida (licença de uso comercial) O “Dashboard de Localização” enviado não foi usado: tem valores negativos e em reais, gráficos
  vazios e a captura cortada à direita
- [ ] Recaptura da consulta por produto com quantidade dentro da capacidade (a tela atual mostra 5.785 para
  capacidade de 2.620)

**Dados institucionais** (`site/conteudo/empresa.ts`)
- [ ] Razão social e CNPJ (usados na Política de Privacidade e no rodapé)
- [ ] LinkedIn
- [ ] Confirmar o papel de `suite.maisi9.com.br` (citado no folheto do WMS)

**Comercial e jurídico**
- [ ] Destino dos leads: URL do CRM/automação (webhook) e/ou e-mail + SMTP
- [ ] Revisão jurídica da Política de Privacidade (encarregado, fornecedores, prazo de retenção) e do aviso de marcas

**Validação de conteúdo**
- [ ] Metodologia de atendimento e FAQ (time de consultoria)
- [ ] Revisão dos três artigos iniciais

**Publicação**
- [ ] Domínio e hospedagem; `NEXT_PUBLIC_SITE_URL=https://www.maisi9.com.br` e `SITE_INDEXAVEL=true` no build oficial
- [ ] Se houver ferramentas de análise ou marketing: consentimento de cookies e atualização da política

## 7. Próximas evoluções sugeridas

- Páginas individuais para cada case aprovado e para cada serviço da consultoria (SEO de cauda longa).
- Integração nativa com o CRM escolhido (o webhook já entrega o lead estruturado).
- CMS headless para a equipe publicar conteúdos sem deploy.
- Analytics com consentimento e eventos de conversão por CTA.
