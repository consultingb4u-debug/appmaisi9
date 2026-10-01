# MAIS i9 — Gestão de Projetos · Resumo técnico (incrementos 1 a 6)

> Público: equipe técnica / administração. Situação em 01/10/2026.
> Repositório: `consultingb4u-debug/appmaisi9`, branch `claude/mais-i9-project-management-3bapfx`.
> Documento de arquitetura completo (diagnóstico das planilhas, modelo de dados, roadmap): [`01-proposta-arquitetura.md`](01-proposta-arquitetura.md).

## 1. Objetivo

Substituir as planilhas CTRL-001 (uma por projeto) e CTRL-003 (gestão de recursos/portfólio) por uma aplicação web interna. O diagnóstico das planilhas mostrou dois problemas centrais:

- **Dupla digitação:** o cronograma do CTRL-001 e a alocação semanal do CTRL-003 descrevem o mesmo fato e eram mantidos à mão nos dois arquivos. Kover (92 h) e Sulmedic (88 h) não estavam no CTRL-003.
- **Dashboard zerado:** as horas do CTRL-003 estavam digitadas como texto ("4h"), então todas as somas davam 0. Com os números corrigidos, Luiz Dornelles está em 148 % na S40/26 só com o CTRL-003.

## 2. Situação por incremento

| # | Entrega | Situação |
|---|---|---|
| 1 | Fundação: autenticação, perfis, cadastros (recursos, capacidade com vigência, clientes, contatos, feriados), semanas ISO, auditoria | ✅ |
| 2 | Portfólio, página do projeto (visão geral, equipe, histórico), importação do CTRL-003 com revisão | ✅ |
| 3 | Capacidade: mapa de carga, planejamento semanal editável, indisponibilidades com aprovação | ✅ |
| 4 | Backlog, cronograma com várias pessoas por tarefa, Gantt, rateio automático nas semanas, apontamento por atividade, importação do CTRL-001 | ✅ |
| 5 | Pré-projeto/complexidade, RAID, matriz de riscos, testes internos, UAT, deployment/Go-No-Go, importação das demais abas do CTRL-001 | ✅ |
| 6 | Status reports (indicadores congelados), documentos, painel executivo | ✅ |

Números atuais: 35 tabelas, 35 enums, 6 migrações, 30 telas, 95 testes unitários.

## 3. Stack e decisões

| Camada | Escolha | Motivo |
|---|---|---|
| App (front + back) | **Next.js 16** (App Router, Server Components, Server Actions), **TypeScript** estrito | Um projeto e um deploy; sem API separada para manter |
| UI | **Tailwind CSS 4**, componentes próprios em `components/` | Leve; identidade MAIS i9 via tokens em `app/globals.css` |
| Banco | **PostgreSQL 16** + **Prisma 7** (driver adapter `@prisma/adapter-pg`) | Relacional, migrações versionadas, client tipado |
| Validação | **Zod 4** | Mesmo schema no servidor e na importação |
| Autenticação | **Auth.js 5** (next-auth `5.0.0-beta.32`, versão fixada) com **Microsoft Entra ID**; login local sem senha só para desenvolvimento | A empresa usa Microsoft 365 |
| Planilhas | **ExcelJS** | Lê valores, fórmulas (resultado) e tipos |
| Testes | **Vitest** (regras puras) | Cálculos de capacidade, semanas e importação |
| Deploy | **Docker Compose** (db → migrador → app), `output: "standalone"` | Roda em qualquer VM; Azure é o destino sugerido |

Next.js 16 tem mudanças incompatíveis com versões anteriores (ex.: `middleware` virou `proxy`, `params` e `searchParams` assíncronos). A documentação da versão instalada está em `node_modules/next/dist/docs/` e deve ser consultada antes de alterar convenções.

## 4. Arquitetura do código

```
app/(app)/            telas autenticadas; cada área tem page.tsx (Server Component) e acoes.ts ("use server")
app/login/            login (Entra ID / desenvolvimento)
app/api/auth/         rotas do Auth.js
auth.ts               configuração do Auth.js: provisionamento do usuário no 1º login, perfil no JWT
components/           UI compartilhada: ui.tsx, formulario.tsx (useActionState), grades semanais, abas
lib/domain/           regras PURAS e testadas: datas, semanas ISO, feriados (Páscoa), capacidade,
                      faixas de utilização, edição de célula, parsing de horas, rótulos de enums
lib/services/         regras que acessam o banco: capacidade e carga por semana, portfólio, auditoria
lib/importacao/       leitura de planilha (planilha.ts), leitor do CTRL-003 (ler.ts),
                      validação pura (avaliar.ts) e efetivação transacional (servico.ts)
lib/auth/             matriz de permissões (permissoes.ts) e sessão (sessao.ts)
lib/storage.ts        armazenamento de arquivos em disco (STORAGE_DIR); trocar por S3/Blob mexe só aqui
prisma/               schema.prisma, migrações, seed idempotente
tests/                Vitest
```

### Padrão de toda Server Action

```ts
export async function atualizarX(id: string, _: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  return executarAcao(async () => {                 // converte erros em mensagem (Zod, P2002, negócio)
    const u = await exigir("editar", "MODULO");     // autenticação + permissão (lança SemPermissao)
    const v = zSchema.parse(lerFormulario(dados));  // validação
    await db.$transaction(async (tx) => {
      const antes = await tx.x.findUniqueOrThrow({ where: { id } });
      const depois = await tx.x.update({ where: { id }, data: v });
      await auditar(tx, { entidade: "X", entidadeId: id, acao: "ALTERAR", usuarioId: u.id, antes, depois });
    });
    revalidatePath("/x");
  });
}
```

- Nenhuma escrita sem `exigir(...)`, mesmo que a tela já esconda o botão.
- A auditoria grava na **mesma transação** e guarda só os campos que mudaram (`{campo: [antes, depois]}`, único JSON do modelo de negócio).
- Datas de calendário são meia-noite UTC em colunas `@db.Date` (`lib/domain/datas.ts`). Semanas usam o padrão ISO 8601 (`2026-W40`, rótulo `S40/26`), compatível com as planilhas e correto na virada de ano (S53 → S01).

## 5. Modelo de dados atual

| Área | Tabelas |
|---|---|
| Segurança | `usuario` (perfil: ADMIN, GESTOR, CONSULTOR, VISUALIZADOR) |
| Recursos | `recurso`, `recurso_apelido` (grafias das planilhas), `recurso_capacidade` (vigências sem sobreposição) |
| Clientes | `cliente`, `cliente_apelido`, `contato_cliente` |
| Projetos | `projeto` (código PRJ-0001 sequencial), `projeto_membro` (GP, funcional, técnico…) |
| Capacidade | `alocacao_semanal` (UNIQUE projeto + recurso + semana), `indisponibilidade` (pendente/aprovada/recusada) |
| Calendário | `semana` (ISO, 2025–2028 no seed; criada sob demanda fora disso), `feriado` |
| Cronograma | `backlog_item`, `atividade` (CRON-001…), `atividade_atribuicao` (atividade × recurso × esforço/falta), `atribuicao_semana` (rateio semanal), `atividade_predecessora`, `apontamento` (horas por recurso × atividade × semana) |
| Pré-projeto | `criterio_complexidade` (12 critérios do CTRL-001, no seed), `projeto_complexidade` (nota 0–3 + gatilho), `avaliacao_complexidade` (score, gatilhos, nível final), `pre_projeto`, `pre_projeto_item` |
| Execução | `item_operacional` (pendência, decisão, dependência, problema, risco P×I, change request, defeito), `caso_teste` (TI-/UAT-), `execucao_teste` (um registro por ciclo), `deployment`, `deployment_item` |
| Status | `status_report` (indicadores em JSONB, rascunho/publicado), `documento` (link ou arquivo) |
| Importação | `import_lote` (+ projeto no CTRL-001), `import_linha` (staging com dados brutos em JSONB), `import_mensagem` |
| Auditoria | `auditoria` |

**Horas da alocação semanal:** `previstas = coalesce(horas_manuais, horas_calculadas) + horas_avulsas`.
- `horas_calculadas` vem do cronograma (incremento 4).
- `horas_manuais` é o ajuste manual por cima do cronograma.
- `horas_avulsas` são horas sem atividade (ex.: gestão do GP).

**Capacidade líquida:** capacidade vigente − feriados em dia útil − indisponibilidades **aprovadas**.

**Utilização:** previstas ÷ capacidade líquida. Faixas do CTRL-003, avaliadas por semana: < 50 % disponível · 50–85 % adequado · 85–100 % atenção · > 100 % sobrecarregado.

## 5b. Cronograma → capacidade (incremento 4)

- `ratearHoras()` (pura, 8 testes): distribui o que **falta** de cada atribuição nos dias úteis do recurso
  (sem fins de semana, feriados e ausências aprovadas de dia inteiro), a partir da semana atual, arredondando
  em 0,5 h. Exemplo real: Go Live da Kover, 4h de 28/10 a 03/11 → 2,5h na S44 e 1,5h na S45.
- `recalcularProjeto()` roda na mesma transação de qualquer alteração no cronograma, em apontamentos e em
  ausências aprovadas. Ele regrava `atribuicao_semana` e `alocacao_semanal.horas_calculadas`, preservando
  ajustes manuais e horas avulsas. Semanas passadas não são redistribuídas.
- Falta = valor informado ou previsto − realizado. Forecast = realizado + falta.
  Progresso = média ponderada pelo esforço previsto.
- Qualidade do cronograma: regras da aba "Auditoria CTRL-003" que continuam fazendo sentido, mais
  "período só com feriado".
- Resultado com os dados reais: Luiz Dornelles na S40/26 = 59h (CTRL-003) + 14h (cronograma Kover) =
  **73h / 40h = 183 %**, exatamente o número do diagnóstico das planilhas.

## 6. Importação do CTRL-003

1. Upload do `.xlsx` → o arquivo é guardado e cada linha das abas manuais vira `import_linha`. Nada é gravado nas tabelas de negócio.
2. `avaliarCtrl003()` é uma função **pura** (9 testes). Para cada linha ela calcula: ação (criar / atualizar / ignorar), status (OK / alerta / erro) e mensagens. Ela trata:
   - horas digitadas como texto;
   - grafias diferentes, via apelidos;
   - projeto fora do portfólio e linhas repetidas;
   - capacidade divergente;
   - tipo de indisponibilidade escrito em texto livre;
   - prioridade inferida a partir do planejamento.
3. Nomes não reconhecidos vão para um De-Para na tela; a associação vira apelido e vale para as próximas importações.
4. A efetivação reavalia tudo dentro da transação e é **idempotente**: reimportar o mesmo arquivo dá 0 alterações. Campos vazios na planilha nunca apagam dados do sistema, e linhas com erro são puladas.

### Importação do CTRL-001

- Feita por projeto (escolhido no upload). Lê as datas do Pré-Projeto, o Backlog e o Cronograma.
  Desde o incremento 5 lê também complexidade, checklist de pré-projeto, operacional, testes internos, UAT,
  deployment e status report.
- `avaliarCtrl001()` (pura, 7 testes):
  - agrupa `CRON-006`, `CRON-006.2` e `CRON-006.3` numa atividade com N atribuições, dividindo o esforço
    repetido (decisão de negócio);
  - converte o status "Atrasado" em situação calculada e % em fração para 0–100;
  - liga a atividade ao requisito pela coluna "Atividade" (`REQ-…`);
  - cria o contato do cliente quando a coluna "Recurso Cliente" traz uma pessoa;
  - importa o realizado como um único apontamento.
- Reimportar substitui pelos valores da planilha o que foi alterado no sistema; a revisão avisa linha a linha.

## 6b. Execução e status (incrementos 5 e 6)

Regras puras em `lib/domain/execucao.ts` e `lib/domain/status.ts` (testadas em `tests/domain/execucao.test.ts`):

- **Complexidade:** score = soma das notas; nível base ≤ 8 N1, ≤ 16 N2, ≤ 24 N3, acima N4; nota 3 marcada como gatilho crítico
  eleva para no mínimo N3 (1 gatilho) ou N4 (2+). Nível final = maior dos dois. Governança: Execução Direta, Gestão Leve,
  Gestão Parcial, Gestão Integral. O nível aparece no cabeçalho do projeto e como filtro/coluna no portfólio.
- **Riscos:** severidade = probabilidade × impacto (≤ 4 baixa, ≤ 9 média, ≤ 15 alta, > 15 crítica); sem matriz, vale o
  maior impacto (escopo/prazo/horas). Itens abertos com prazo passado contam como vencidos.
- **Testes:** cada execução é um ciclo; o resumo usa o último ciclo de cada caso. Reprovar com "abrir defeito" cria um
  item DEFEITO no Operacional, ligado à execução.
- **Go/No-Go:** item obrigatório precisa estar concluído e não reprovado; condicional pendente vira ressalva; defeito
  alto/crítico aberto e UAT reprovado bloqueiam. A tela sugere Go / Go com ressalvas / No-Go; a decisão é registrada
  com aprovadores e pode atualizar o Go Live real do projeto.
- **Status report:** o rascunho fotografa os indicadores (progresso, horas, atrasos, RAID, testes, prontidão) e sugere
  o status executivo; ao publicar, o report fica congelado e o status executivo vai para o projeto. Imprime em PDF
  pelo navegador.
- **Documentos:** link (recomendado: SharePoint/Teams) ou arquivo de até 10 MB no armazenamento do sistema; download
  passa pela verificação de permissão.
- **Painel executivo (Início):** projetos ativos ordenados por gravidade (status vermelho, atrasos, pendências
  vencidas, riscos altos, defeitos graves, estouro de horas) e projetos sem status report publicado há 14+ dias.

Importação: `lib/importacao/ctrl001/execucao.ts` (pura). IDs de teste repetidos na planilha (a Kover tem duas séries
TI-001…) recebem o próximo número livre; responsáveis como "Diego / Dornelles" ligam o primeiro nome reconhecido e
guardam o texto completo (há dois Diegos cadastrados, então "Diego" sozinho fica como texto); textos-modelo do
Status Report ("[Resumo…]") são ignorados.

## 7. Segurança

- Login Microsoft 365 via Entra ID (OIDC). No primeiro acesso a pessoa entra como **Visualização**; e-mails em `ADMIN_EMAILS` entram como Administrador.
- O perfil é conferido no banco a cada requisição: desativar um usuário tem efeito imediato.
- Hoje a permissão é por módulo (`lib/auth/permissoes.ts`). A função `pode()` já está pronta para restringir por projeto na versão 1.3.
- Consultor: consulta tudo, aponta as próprias horas e atualiza falta/% das suas atividades em **Minhas horas**, e solicita indisponibilidade apenas para si. Inputs de edição não são renderizados para ele, e as Server Actions recusam a escrita.
- `AUTH_DEV_LOGIN=true` habilita login sem senha. **Nunca em produção**: o seed só cria o administrador de desenvolvimento quando essa variável está ligada.

## 8. Qualidade e testes

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: todos passam, e o build sai sem avisos.
- CI no GitHub Actions (`.github/workflows/ci.yml`): lint, typecheck, testes, migrate, seed e build, com PostgreSQL de serviço.
- Testes de navegador (Playwright) rodados a cada incremento contra o **build de produção standalone**, cobrindo:
  - login, cadastros, duplicidade e histórico;
  - importação real do CTRL-003 e reimportação;
  - importação dos CTRL-001 da Kover e da Sulmedic (todas as abas) e reimportação sem duplicar;
  - complexidade, RAID, matriz de riscos, ciclo de teste reprovado com defeito, prontidão Go/No-Go, status report publicado, upload e download de documento;
  - edição da grade com reload;
  - indisponibilidade e aprovação;
  - restrições do consultor;
  - menu no celular.

  Os scripts ainda não estão no repositório (ver pendências).

## 9. Como rodar

Ver [`README.md`](../README.md). Resumo:

```bash
cp .env.example .env    # AUTH_SECRET=$(openssl rand -base64 32); para testar sem Microsoft 365: AUTH_DEV_LOGIN="true"
docker compose up -d --build                    # http://localhost:3000
# ou, sem Docker (Node 22 + PostgreSQL 16):
npm install && npm run db:deploy && npm run db:seed && npm run dev
```

## 10. Pendências e riscos conhecidos

| Item | Situação / ação |
|---|---|
| Imagem Docker | Dockerfile e compose escritos, mas **não construídos** no ambiente de desenvolvimento, que não tinha acesso ao registro npm a partir dos containers. O mesmo caminho foi validado sem Docker: banco novo → `migrate deploy` → seed → servidor standalone. Validar no primeiro `docker compose up`. |
| Entra ID | Falta registrar o app no Azure (Tenant ID, Client ID, Client Secret). Redirect URI: `https://<host>/api/auth/callback/microsoft-entra-id`. |
| GitHub Actions | O workflow existe, mas nenhuma execução foi registrada; verificar se o Actions está habilitado no repositório. |
| Auth.js 5 | Ainda em beta (versão fixada). Acompanhar o lançamento da versão estável. |
| Testes E2E no repositório | Incluir `@playwright/test` com os cenários já usados, rodando na CI. |
| Armazenamento | Disco local em volume Docker. Para Azure, trocar `lib/storage.ts` por Blob Storage. |
| Backup | `scripts/backup.sh` (pg_dump + arquivos, retenção de 30 dias) precisa ser agendado no cron do servidor. |
| Rate limit / CSP | Não implementados (uso interno atrás do login corporativo); avaliar ao expor publicamente. |
