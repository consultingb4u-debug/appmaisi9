# MAIS i9 — Site institucional e comercial

> Arquitetura, experiência, identidade visual aplicada e pendências do novo site.
> Código em [`site/`](../site) · como rodar e editar: [`site/README.md`](../site/README.md)

## 1. Objetivo e princípios

O site existe para **gerar oportunidades comerciais qualificadas** nas duas frentes da MAIS i9:

| Frente | O que é | Conversões |
|---|---|---|
| **MAIS i9 Consultoria Protheus** | Serviços para empresas que usam o ERP TOTVS Protheus | Falar com um especialista Protheus · Solicitar diagnóstico · Solicitar proposta |
| **MAIS i9 WMS** | Produto próprio, SaaS, de gestão de armazéns | Agendar demonstração · Conversar com um especialista · Solicitar proposta |

Princípios que orientaram as decisões:

1. **Em 10 segundos, o visitante entende** quem é a MAIS i9, as duas frentes e como falar com a equipe.
2. **Cada frente tem a sua jornada** e CTAs próprios, sem “Saiba mais” genérico.
3. **Credibilidade sem exagero**: nenhuma promessa numérica, nenhum dado inventado; o que falta aparece
   como pendência visível (`[A preencher: …]`) até ser fornecido.
4. **WMS é produto, consultoria é serviço**: o WMS nunca aparece como serviço de consultoria nem como
   produto da TOTVS; a MAIS i9 nunca aparece como parte ou representante da TOTVS.
5. **Nada simulado**: formulários só confirmam envio quando o lead chega de fato ao destino configurado.

## 2. Mapa do site

```
Início (/)
├── Consultoria Protheus (/consultoria-protheus)
├── MAIS i9 WMS (/mais-i9-wms)
├── Sobre Nós (/sobre)
├── Cases (/cases)
├── Conteúdos (/conteudos)
│   ├── /conteudos/categoria/[categoria]   8 categorias
│   └── /conteudos/[slug]                  artigos (MDX)
├── Contato (/contato)
└── Política de Privacidade (/politica-de-privacidade)
```

**Cabeçalho fixo:** logotipo · Início | Consultoria Protheus | MAIS i9 WMS | Sobre Nós | Cases | Conteúdos | Contato ·
botão **“Falar com um especialista”**. Abaixo de 1280 px o menu vira um painel em tela cheia; o CTA permanece visível a
partir de 640 px e dentro do menu no celular.

**Rodapé completo:** apresentação, CTA, links por frente (incluindo âncoras para serviços, modelos,
funcionalidades, integração e demonstração), contato comercial, política de privacidade e o aviso de marcas.

## 3. Estrutura das páginas

### Início
1. **Hero** (azul-marinho): headline e subheadline do briefing, CTAs “Conhecer a Consultoria Protheus” e
   “Explorar o MAIS i9 WMS”, composição visual ERP ↔ integração ↔ WMS (consultoria apoiando o ERP, mapa do
   armazém, eventos da operação) — desenhada em SVG, sem banco de imagens.
2. **Nossas soluções**: dois blocos (claro para a consultoria, escuro para o produto), cada um com proposta
   de valor, benefícios e CTA próprio.
3. **Por que escolher a MAIS i9**: os 7 diferenciais do briefing.
4. **Como geramos valor**: jornada Entender → Planejar → Implementar → Sustentar → Evoluir.
5. **Clientes e cases**: espaços reservados para logotipos, cases e depoimentos (só com autorização).
6. **Conteúdos**: três artigos mais recentes.
7. **CTA final**: “Vamos conversar sobre os desafios da sua operação?” → “Falar com a MAIS i9”, com atalhos
   para diagnóstico e demonstração.

### Consultoria Protheus
Hero com painel ilustrativo de governança de demandas → proposta de valor (“mais do que alocar
profissionais”) e 3 pilares → **6 desafios** comuns → **6 serviços** com itens do briefing e “Solicitar
proposta” (pré-seleciona o serviço no formulário) → **diferenciais** → **5 modelos de contratação** (sem
preços) → **metodologia de atendimento** em 5 etapas → **benefícios** → **FAQ** (7 perguntas, incluindo
“A MAIS i9 faz parte da TOTVS?”) → **formulário** com próximos passos → aviso de marcas → ponte para o WMS.

### MAIS i9 WMS (página de produto)
Hero com o painel web e o App Operador → faixa de credenciais (integração Protheus, APIs, App Operador, SaaS)
→ **Visão do produto** em abas (Dashboard web, App Operador, Telas operacionais, Indicadores gerenciais) →
**10 benefícios** → **Como funciona**: ERP → Recebimento → Armazenagem → Movimentação → Expedição, com o
que vai do ERP para o armazém e o que volta → **Base operacional**: os 7 componentes em cards interativos
(abas acessíveis por teclado) → **4 módulos complementares** e a nota “todos fazem parte do produto padrão;
implantação dimensionada” → **Integração com TOTVS Protheus** (pacote padrão, 5 pontos e APIs para outros
ERPs sem prometer integrações prontas) → **Aplicativos** (App Operador e App Motorista, separados) → FAQ →
**formulário de demonstração** → ponte para a consultoria.

### Institucionais
- **Sobre**: quem somos, campos editáveis (fundação, sede, equipe, certificações), atuação, visão sobre
  tecnologia e negócios, compromisso com os clientes, experiência da equipe.
- **Cases**: logotipos, cases por frente (implantação, evolução, sustentação, WMS) e depoimentos — estrutura
  pronta, publicada só com autorização (`conteudo/cases.ts`).
- **Conteúdos**: listagem com filtro por categoria e página de artigo com CTA contextual (consultoria ou WMS).
  Três artigos iniciais, educativos, para revisão da equipe.
- **Contato**: formulário com assunto de interesse, atalhos por frente, informações institucionais e botão
  de WhatsApp (aparece só quando houver número oficial).

## 4. Identidade visual aplicada

| Elemento | Decisão |
|---|---|
| **Cores** | Paleta já usada no sistema interno da MAIS i9: azul-marinho `#0a1a30`/`#0f2a4a` (superfícies de destaque), azul institucional `#1f5f9e` (textos e links) e `#2b7bbf` (gráficos), ardósia `#4f6480` (texto de apoio), cinza muito claro `#f4f6f9`, branco. **Laranja `#f28c28` só como destaque**: botão principal (com texto marinho, contraste AA), marcadores e detalhes. Sobre fundo claro o laranja nunca é cor de texto. |
| **Tipografia** | Manrope (títulos) e Inter (texto), auto-hospedadas pelo `next/font`. Ajustar se o manual de marca definir outra família. |
| **Logotipo** | Arquivo oficial, usado sem alteração (`conteudo/empresa.ts`). Enquanto não for fornecido, o nome aparece em texto simples — não há versão recriada do logotipo. |
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

**Marca e materiais**
- [ ] Logotipo oficial (versões para fundo claro e escuro) e favicon derivado do símbolo
- [ ] Confirmação da paleta e da tipografia com o manual de marca
- [ ] Telas reais do MAIS i9 WMS (dashboard, App Operador, telas operacionais, indicadores, App Motorista)

**Dados institucionais** (`conteudo/empresa.ts`)
- [ ] Razão social, CNPJ, endereço, cidade/UF
- [ ] E-mail e telefone comerciais, horário de atendimento, WhatsApp oficial, LinkedIn
- [ ] Ano de fundação, tamanho da equipe, experiência da equipe, segmentos atendidos, certificações

**Comercial e jurídico**
- [ ] Destino dos leads: URL do CRM/automação (webhook) e/ou e-mail + SMTP
- [ ] Revisão jurídica da Política de Privacidade (encarregado, fornecedores, prazo de retenção) e do aviso de marcas
- [ ] Cases, logotipos e depoimentos com autorização dos clientes

**Validação de conteúdo**
- [ ] Descrições funcionais dos módulos do WMS e fluxo de integração com o Protheus (time de produto)
- [ ] Metodologia de atendimento, modelos de contratação e FAQ (time de consultoria)
- [ ] Revisão dos três artigos iniciais

**Publicação**
- [ ] Domínio e hospedagem; `NEXT_PUBLIC_SITE_URL` e `SITE_INDEXAVEL=true` no build oficial
- [ ] Se houver ferramentas de análise ou marketing: consentimento de cookies e atualização da política

## 7. Próximas evoluções sugeridas

- Páginas individuais para cada case aprovado e para cada serviço da consultoria (SEO de cauda longa).
- Integração nativa com o CRM escolhido (o webhook já entrega o lead estruturado).
- CMS headless para a equipe publicar conteúdos sem deploy.
- Analytics com consentimento e eventos de conversão por CTA.
