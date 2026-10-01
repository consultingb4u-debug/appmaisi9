# MAIS i9 — Gestão de Projetos, Portfólio e Recursos
## Proposta de Arquitetura (Etapa 1 — para aprovação)

> **Base desta proposta:** o material descrito no chat (estrutura do CTRL-001, abas da planilha de
> Gestão de Recursos / Portfólio, colunas do cronograma e da alocação semanal, regras de capacidade).
> As planilhas em si ainda não foram anexadas ao repositório. Pontos marcados com **[validar]** são
> hipóteses que serão conferidas quando os arquivos estiverem disponíveis; nenhum deles muda a
> arquitetura, apenas campos e regras de detalhe.

---

## A. Diagnóstico do processo atual

### A.1 O que existe hoje

| Artefato | Granularidade | Conteúdo principal |
|---|---|---|
| **CTRL-001 — Controle Operacional do Projeto** | 1 arquivo por projeto | Dashboard, Complexidade, Pré-Projeto, Backlog, Cronograma, Controle Operacional, Testes Internos, UAT, Deployment, Status Report |
| **Gestão de Recursos / Portfólio** | 1 arquivo consolidado | Portfólio, Planejamento de Recursos, Projeto x Recursos, Carga por Projeto, Capacidade, Indisponibilidades, Utilização semanal, Previsto x Realizado, Disponibilidade, Sobrecarga, Dashboard de Recursos |

### A.2 Como os dados se relacionam hoje

```
Portfólio (1 linha por projeto) ─────┐
                                     │  (ligação manual por nome/código do projeto)
CTRL-001 do projeto X ───────────────┤
  └─ Cronograma: atividade + recurso + período + esforço
                                     │  (redigitado manualmente)
Gestão de Recursos ──────────────────┘
  └─ Projeto + Recurso + Semana → horas previstas / realizadas
  └─ Recurso → capacidade semanal − indisponibilidades
```

A ligação entre os arquivos é **por texto** (nome do projeto, nome do recurso), sem chave única.
O cronograma do CTRL-001 e a alocação semanal da Gestão de Recursos descrevem **o mesmo fato**
(quem trabalha em quê, quando e quanto) em granularidades diferentes, e hoje são mantidos à mão
nos dois lugares.

### A.3 Regras e cálculos identificados

| Regra | Origem | Fórmula / lógica |
|---|---|---|
| Duração útil | Cronograma | dias úteis entre Início e Fim Previsto (descontando feriados) |
| Forecast | Cronograma | Esforço Realizado + Horas para Concluir |
| Desvio Forecast | Cronograma | Forecast − Esforço Previsto (h e %) |
| Situação do prazo | Cronograma | Concluída / No prazo / Em risco / Atrasada (comparando hoje, Fim Previsto, % e Data Real) |
| % conclusão do projeto | Dashboard | média ponderada pelo esforço previsto das atividades **[validar se ponderada ou simples]** |
| Saldo semanal | Recursos | Horas Previstas − Horas Realizadas |
| Capacidade líquida | Capacidade | Capacidade Bruta − Indisponibilidade |
| Utilização | Capacidade | Horas Planejadas ÷ Capacidade Líquida |
| Faixa de utilização | Capacidade | Disponível / Adequado / Atenção / Sobrecarregado (limites a confirmar — ver J) |
| Complexidade | Complexidade | pontuação por critérios → nível **[validar critérios e pesos]** |
| Saúde do projeto | Dashboard / Status | combinação de prazo, esforço e riscos (hoje subjetiva) |

### A.4 Problemas que o aplicativo resolve

1. **Dupla digitação** cronograma ↔ alocação semanal → inconsistência entre o que o GP planejou e o que a gestão de recursos enxerga.
2. **Sem visão consolidada em tempo real**: o portfólio depende de alguém copiar dados de cada CTRL-001.
3. **Chaves por texto**: renomear projeto/recurso quebra fórmulas e PROCVs.
4. **Sem histórico confiável**: status reports e mudanças sobrescrevem a versão anterior; não se sabe quem alterou o quê.
5. **Concorrência**: uma pessoa por vez edita o arquivo; versões em e-mail/OneDrive divergem.
6. **Cópia do template**: cada novo projeto copia o CTRL-001; melhorias no template não chegam aos projetos antigos.
7. **Drill-down difícil**: descobrir *por que* um recurso está sobrecarregado exige abrir vários arquivos.

### A.5 Duplicidades que serão eliminadas

| Hoje digitado em… | Passa a ser… |
|---|---|
| Dados do projeto no Portfólio **e** no CTRL-001 | um único cadastro de Projeto |
| Recurso + período + esforço no Cronograma **e** na alocação semanal | alocação **derivada** do cronograma (com override) |
| % conclusão / datas no Dashboard do CTRL-001 **e** no Portfólio | calculados a partir das atividades |
| Lista de recursos em cada CTRL-001 | cadastro único de Recursos |
| Riscos repetidos no Status Report | Registro de riscos; o status report referencia/fotografa |
| Marcos no cronograma **e** no status report | atividades com flag `marco`; o status report lista automaticamente |

### A.6 Informações que devem continuar independentes

- **Alocação sem atividade** (gestão do projeto, suporte, pré-venda, horas internas): continua sendo lançada direto na alocação semanal.
- **Override semanal**: o planejamento de capacidade pode divergir do rateio automático — por decisão explícita.
- **Snapshot do Status Report**: é uma fotografia; não deve mudar quando o cronograma mudar depois.
- **Testes Internos x UAT**: mesmo formato, responsabilidades e aprovações diferentes (tipo distinto, mesma tabela).
- **Indisponibilidades**: pertencem ao recurso, não ao projeto.
- **Backlog**: requisito do cliente existe independentemente de ter atividade ou teste associado.

---

## B. Modelo conceitual

```
                         ┌──────────────┐
                         │   CLIENTE    │
                         └──────┬───────┘
                                │1:N
┌──────────┐  N:1 (GP)   ┌──────▼───────┐
│ USUÁRIO  ├────────────►│   PROJETO    │◄──────────── Complexidade, Pré-Projeto
└────┬─────┘             └──┬───┬───┬───┘
     │0..1               1:N│   │   │1:N
┌────▼─────┐                │   │   └──► STATUS REPORT (snapshot)
│ RECURSO  │◄───────┐       │   └──────► RISCO / PENDÊNCIA
└────┬─────┘        │       │
     │1:N           │  ┌────▼─────┐  N:N  ┌──────────┐
     ├─► CAPACIDADE │  │ ATIVIDADE├───────┤ BACKLOG  │
     ├─► INDISPONIB.│  │(cronogr.)│       └────┬─────┘
     │              │  └────┬─────┘            │N:N
     │              │       │ rateio           ▼
     │      ┌───────┴───────▼──┐          ┌──────────┐     ┌────────────┐
     └─────►│ ALOCAÇÃO SEMANAL │          │  TESTE   ├────►│ DEFEITO /  │
            │ projeto+recurso+ │          │ (INT/UAT)│     │ PENDÊNCIA  │
            │     semana       │          └──────────┘     └────────────┘
            └──────────────────┘
                                  PROJETO 1:N ─► DEPLOYMENT (checklist, Go/No-Go, Hypercare)
                                  PROJETO 1:N ─► DOCUMENTO
                       Todas as entidades ─► AUDITORIA
```

**Módulos**

| Módulo | Responsabilidade |
|---|---|
| Portfólio | clientes, projetos, filtros, dashboard executivo |
| Projeto (execução) | pré-projeto, complexidade, backlog, cronograma, operacional, testes, deployment, riscos, status reports, documentos |
| Recursos | cadastro, capacidade, indisponibilidades, alocação semanal, utilização |
| Motor de planejamento | rateio atividade → semanas, cálculo de capacidade/utilização, saúde |
| Importação | staging, validação, conciliação e efetivação das planilhas |
| Administração | usuários, perfis, calendário de feriados, parâmetros (faixas, critérios), auditoria |

---

## C. Modelo de dados

Banco relacional (PostgreSQL). Convenções:
- PK `id` (UUID); códigos legíveis separados (`codigo`), únicos.
- Todas as tabelas de negócio têm `criado_em`, `criado_por_id`, `atualizado_em`, `atualizado_por_id`.
- Exclusão lógica (`arquivado_em`) em Cliente, Projeto, Recurso; demais com exclusão física auditada.
- Domínios (status, fases, tipos) como **enums** ou tabelas de domínio quando o usuário precisar editar a lista.
- `origem_importacao_id` (FK opcional para `import_linha`) nas entidades migradas → rastreabilidade.

### C.1 Cadastros e segurança

**usuario** — `id`, `nome`, `email` (único), `perfil` (ADMIN | GESTOR | CONSULTOR | VISUALIZADOR), `ativo`, `ultimo_acesso`
**recurso** — `id`, `usuario_id` (FK, opcional e único — recurso pode não ter login), `nome`, `email`, `cargo`, `area`, `tipo` (INTERNO | TERCEIRO), `capacidade_semanal_padrao` (h), `custo_hora` (opcional), `ativo`, `data_entrada`, `data_saida`
**recurso_capacidade** — `id`, `recurso_id` FK, `vigencia_inicio`, `vigencia_fim`, `horas_semanais` → histórico de mudança de capacidade (ex.: meio período)
**cliente** — `id`, `codigo`, `nome`, `razao_social`, `segmento`, `ativo`
**contato_cliente** — `id`, `cliente_id` FK, `nome`, `email`, `telefone`, `funcao` → usado como "Recurso Cliente" no cronograma e responsável no UAT
**feriado** — `id`, `data`, `descricao`, `abrangencia` (NACIONAL | LOCAL), `localidade`

### C.2 Projeto

**projeto** — `id`, `codigo` (ex.: PRJ-2026-014), `cliente_id` FK, `nome`, `descricao`, `gp_id` FK→usuario, `status` (PROSPECCAO | PLANEJAMENTO | EM_ANDAMENTO | PAUSADO | CONCLUIDO | CANCELADO), `prioridade` (ALTA | MEDIA | BAIXA), `fase_atual` (ENVISIONING | DEVELOPMENT | DEPLOYMENT | POST_DEPLOY), `complexidade_nivel` (calculado/armazenado), `data_inicio`, `data_go_live_prevista`, `data_go_live_real`, `data_encerramento_prevista`, `data_encerramento_real`, `horas_vendidas`, `saude_manual` (override opcional), `saude_justificativa`, `arquivado_em`
> % conclusão, horas previstas/realizadas, forecast e saúde calculada são **derivados** (views/consultas), não colunas digitadas.

**projeto_membro** — `id`, `projeto_id` FK, `recurso_id` FK, `papel_no_projeto` (GP, Consultor Funcional, Técnico, …), `inicio`, `fim` · UNIQUE(projeto, recurso, papel)

**criterio_complexidade** — `id`, `nome`, `peso`, `ordem`, `ativo` **[validar com aba Complexidade]**
**projeto_complexidade** — `id`, `projeto_id` FK, `criterio_id` FK, `nota`, `observacao` · UNIQUE(projeto, criterio)
**faixa_complexidade** — `nivel` (BAIXA | MEDIA | ALTA | MUITO_ALTA), `pontuacao_min`, `pontuacao_max`

**pre_projeto_item** — `id`, `projeto_id` FK, `categoria` (ESCOPO | PREMISSA | RESTRICAO | STAKEHOLDER | CHECKLIST_KICKOFF | INFORMACAO), `descricao`, `responsavel_id`, `status`, `data_conclusao`, `observacao` **[validar campos da aba Pré-Projeto]**

### C.3 Backlog e cronograma

**backlog_item** — `id`, `projeto_id` FK, `codigo` (BL-001), `titulo`, `descricao`, `tipo` (REQUISITO | ENTREGA | MELHORIA | MUDANCA_ESCOPO), `modulo_processo`, `prioridade` (MoSCoW ou A/M/B), `status` (NOVO | APROVADO | EM_ANDAMENTO | ENTREGUE | CANCELADO), `solicitante`, `estimativa_horas`, `criterio_aceite`, `data_solicitacao`, `ordem`

**atividade** — `id`, `projeto_id` FK, `codigo` (ID visível, sequencial por projeto), `fase` (ENVISIONING | DEVELOPMENT | DEPLOYMENT | POST_DEPLOY), `atividade` (agrupador), `tarefa`, `modulo_processo`, `recurso_id` FK (Recurso MAIS i9), `contato_cliente_id` FK (Recurso Cliente), `responsavel_tipo` (MAIS_I9 | CLIENTE | AMBOS), `inicio_previsto`, `fim_previsto`, `esforco_previsto` (h), `esforco_realizado` (h, ver C.5), `horas_para_concluir` (h), `percentual_conclusao`, `status` (NAO_INICIADA | EM_ANDAMENTO | CONCLUIDA | BLOQUEADA | CANCELADA), `marco` (bool), `data_real_conclusao`, `observacao`, `ordem`, `modo_rateio` (UNIFORME_DIAS_UTEIS | MANUAL)
> **Derivados:** `duracao_util`, `forecast`, `desvio_forecast`, `situacao_prazo`.
> Hierarquia "Atividade → Tarefa" mantida como no Excel (agrupador textual). **[validar se existe WBS com mais níveis]**

**atividade_predecessora** — `atividade_id` FK, `predecessora_id` FK, `tipo` (FS por padrão) · PK composta → permite N predecessoras
**backlog_atividade** — `backlog_item_id` FK, `atividade_id` FK · PK composta (N:N)

**controle_operacional** **[validar aba Controle Operacional]** — proposta: `id`, `projeto_id`, `data`, `tipo` (REUNIAO | ACAO | DECISAO | OCORRENCIA), `descricao`, `responsavel_id`, `prazo`, `status`, `atividade_id` (opcional). Se a aba for, na prática, acompanhamento de pendências, ela é absorvida por **Pendência** (C.6).

### C.4 Testes e deployment

**caso_teste** — `id`, `projeto_id` FK, `tipo` (INTERNO | UAT), `codigo`, `cenario`, `pre_condicao`, `passos`, `resultado_esperado`, `modulo_processo`, `backlog_item_id` FK (opcional), `atividade_id` FK (opcional)
**execucao_teste** — `id`, `caso_teste_id` FK, `ciclo` (1, 2, 3…), `data`, `responsavel_recurso_id` / `responsavel_contato_id` (um dos dois), `resultado_obtido`, `status` (PENDENTE | PASSOU | FALHOU | BLOQUEADO | NAO_APLICAVEL), `observacao`
> Separar *caso* de *execução* preserva o histórico de reteste sem duplicar o cenário.

**pendencia** (defeitos e pendências gerais) — `id`, `projeto_id` FK, `codigo`, `tipo` (DEFEITO | PENDENCIA | AJUSTE | DUVIDA), `titulo`, `descricao`, `severidade`, `responsavel_id`, `prazo`, `status` (ABERTA | EM_ANDAMENTO | RESOLVIDA | CANCELADA), `origem_execucao_teste_id` FK (opcional), `atividade_id` FK (opcional), `resolucao`, `data_resolucao`

**deployment** — `id`, `projeto_id` FK, `nome` (ex.: "Go Live Fase 1"), `data_prevista`, `data_real`, `decisao_go_nogo` (PENDENTE | GO | NO_GO | GO_COM_RESSALVAS), `data_decisao`, `decisor`, `justificativa`, `hypercare_inicio`, `hypercare_fim`, `status`
**deployment_item** — `id`, `deployment_id` FK, `tipo` (ATIVIDADE | CHECKLIST), `descricao`, `responsavel_id`, `data_prevista`, `data_real`, `status`, `obrigatorio_para_go` (bool), `ordem`, `observacao`
**deployment_item_dependencia** — `item_id`, `depende_de_id` · PK composta

### C.5 Recursos, capacidade e alocação

**indisponibilidade** — `id`, `recurso_id` FK, `tipo` (FERIAS | FERIADO | AUSENCIA | TREINAMENTO | BLOQUEIO | OUTROS), `inicio`, `fim`, `horas_por_dia` (padrão = jornada; permite meio período), `descricao`
> Feriados nacionais vêm de **feriado** (aplicados a todos); indisponibilidade tipo FERIADO cobre os locais/individuais.

**semana** (tabela calendário) — `id` (ex.: 2026-W40), `inicio` (segunda), `fim` (domingo), `ano`, `numero`, `dias_uteis`

**alocacao_semanal** — unidade principal: **Projeto + Recurso + Semana**
`id`, `projeto_id` FK, `recurso_id` FK, `semana_id` FK, `horas_calculadas` (vindas do cronograma, mantidas pelo sistema), `horas_manuais` (override, nulo = sem override), `horas_avulsas` (horas sem atividade: gestão, suporte), `horas_realizadas`, `status` (PLANEJADA | CONFIRMADA | ENCERRADA), `prioridade` (herdada do projeto, editável), `observacao`
UNIQUE(`projeto_id`, `recurso_id`, `semana_id`)
> **Horas previstas** = `coalesce(horas_manuais, horas_calculadas) + horas_avulsas`. **Saldo** = previstas − realizadas.
> Cliente, Início/Fim de semana vêm por join — não são duplicados.

**atividade_semana** (detalhe do rateio) — `atividade_id` FK, `semana_id` FK, `horas_calculadas`, `horas_ajustadas` (override por atividade, opcional) · PK composta
> Permite explicar "de onde vêm" as horas de uma célula da alocação e ajustar o rateio de uma atividade específica.

**apontamento** (horas realizadas) — `id`, `recurso_id` FK, `projeto_id` FK, `atividade_id` FK (opcional), `semana_id` FK, `horas`, `descricao`
> Fonte única de "realizado": soma por atividade → `esforco_realizado`; soma por projeto+recurso+semana → `alocacao_semanal.horas_realizadas`.
> **[decisão em J]** se o realizado hoje é lançado por semana (planilha de recursos) ou por atividade (CTRL-001).

### C.6 Governança

**risco** — `id`, `projeto_id` FK, `codigo`, `descricao`, `tipo` (PRAZO | ESCOPO | CUSTO | QUALIDADE | RECURSO | CLIENTE | TECNICO), `probabilidade` (1–5), `impacto` (1–5), `severidade` (derivada = P×I → BAIXA/MEDIA/ALTA/CRITICA), `responsavel_id`, `plano_acao`, `prazo`, `status` (ABERTO | MITIGANDO | FECHADO | MATERIALIZADO), `data_identificacao`
> Pendências usam a tabela **pendencia** (C.4) — riscos são eventos futuros; pendências, problemas presentes.

**status_report** — `id`, `projeto_id` FK, `periodo_inicio`, `periodo_fim`, `data_emissao`, `status_geral` (VERDE | AMARELO | VERMELHO), `status_prazo`, `status_escopo`, `status_esforco`, `percentual_conclusao` (fotografado), `horas_previstas`, `horas_realizadas` (fotografadas), `resumo`, `comentarios`, `publicado` (bool; após publicar, fica somente leitura)
**status_report_item** — `id`, `status_report_id` FK, `secao` (ENTREGA | PROXIMO_PASSO | IMPEDIMENTO | DECISAO_NECESSARIA), `descricao`, `responsavel`, `prazo`, `ordem`
**status_report_risco** — `status_report_id`, `risco_id`, `severidade_na_data`, `status_na_data` (fotografia)
**status_report_marco** — `status_report_id`, `atividade_id`, `data_prevista_na_data`, `data_real_na_data`, `situacao_na_data`

**documento** — `id`, `projeto_id` FK, `entidade_tipo` + `entidade_id` (opcional: anexo a um teste, deployment_item etc.), `nome`, `categoria` (PROPOSTA | ESCOPO | ATA | EVIDENCIA | MANUAL | ACEITE | OUTROS), `storage_key`, `tamanho`, `mime`, `versao`, `url_externa` (para links do SharePoint)

**auditoria** — `id`, `entidade`, `entidade_id`, `projeto_id` (para filtrar histórico do projeto), `acao` (CRIAR | ALTERAR | EXCLUIR | IMPORTAR | PUBLICAR), `usuario_id`, `data_hora`, `alteracoes` (JSONB `{campo: [antes, depois]}`)
> Único lugar em que JSON é adequado: é um log imutável, não dado de negócio consultado relacionalmente.

### C.7 Importação

**import_lote** — `id`, `tipo` (PORTFOLIO_RECURSOS | CTRL001), `arquivo_nome`, `arquivo_storage_key`, `projeto_id` (quando CTRL-001), `status` (CARREGADO | VALIDADO | COM_ERROS | EFETIVADO | DESCARTADO), `carregado_por`, `efetivado_por`, `efetivado_em`
**import_linha** — `id`, `lote_id` FK, `aba`, `linha_origem`, `entidade_destino`, `dados_brutos` (JSONB — área de staging), `chave_natural`, `acao_proposta` (CRIAR | ATUALIZAR | IGNORAR), `entidade_id_destino`, `status` (OK | ALERTA | ERRO)
**import_mensagem** — `id`, `linha_id` FK, `nivel` (ERRO | ALERTA), `campo`, `mensagem`
**import_mapeamento** — `id`, `tipo` (CLIENTE | RECURSO | PROJETO), `texto_origem`, `entidade_id` → "De-Para" de nomes da planilha para cadastros (ex.: "João S." → recurso João Silva), reutilizado em todos os lotes.

---

## D. Arquitetura técnica

### D.1 Stack escolhida

| Camada | Tecnologia | Por quê |
|---|---|---|
| Aplicação (front + back) | **Next.js (App Router) + TypeScript** | Um único projeto, um único deploy; server actions/API routes evitam manter dois serviços; ecossistema enorme |
| UI | **Tailwind CSS + shadcn/ui (Radix)** | Componentes acessíveis e limpos, fácil aplicar a identidade MAIS i9; código dos componentes fica no repo |
| Tabelas | **TanStack Table** | Ordenação, filtro, agrupamento, edição inline, colunas configuráveis |
| Gantt / calendário | **Frappe Gantt** (ou componente próprio em SVG) + **FullCalendar** | Maduros, leves, sem licença comercial |
| Gráficos | **Recharts** | Simples, suficiente para dashboards |
| ORM / migrações | **Prisma** | Esquema tipado, migrações versionadas no git |
| Banco | **PostgreSQL 16** | Relacional, maduro, backup simples (`pg_dump`), roda em qualquer nuvem |
| Validação | **Zod** | Mesmas regras no formulário e no servidor e na importação |
| Leitura de Excel | **SheetJS (xlsx)** / ExcelJS | Importação das planilhas no próprio app |
| Autenticação | **Auth.js** com **Microsoft Entra ID** (login com conta corporativa) + login por e-mail/senha como alternativa | Sem gestão de senhas se a MAIS i9 usa Microsoft 365 **[ver J]** |
| Documentos | Abstração de storage: **disco local** no MVP → **S3 / Azure Blob / SharePoint** depois | Começa simples; troca sem mudar o modelo |
| Testes | Vitest (regras de cálculo) + Playwright (fluxos críticos) | O motor de rateio/capacidade é o ponto que mais precisa de teste |

**Alternativa descartada:** back-end separado (ex.: .NET/Java API + SPA React). Mais robusto para times grandes, mas dobra o número de projetos, deploys e camadas para uma equipe pequena. A estrutura modular proposta permite extrair uma API depois, se necessário.

### D.2 Organização do código

```
/app                 rotas e telas (portfolio, projetos/[id]/..., recursos, capacidade, admin)
/components          UI compartilhada (DataTable, KpiCard, StatusBadge, Gantt, WeekGrid…)
/lib/domain          regras puras e testáveis: rateio, capacidade, saúde, situação de prazo
/lib/services        casos de uso (salvar atividade → recalcular alocação → auditar)
/lib/auth            sessão e verificação de permissões (can(user, ação, recurso))
/lib/import          parsers das planilhas, validação, conciliação
/prisma              schema.prisma, migrações, seed
/docs                esta documentação
```

### D.3 Regras transversais

- **Recálculo síncrono e transacional**: ao salvar uma atividade, na mesma transação recalcula `atividade_semana` e `alocacao_semanal.horas_calculadas` dos pares (projeto, recurso) afetados. Volume pequeno → sem filas.
- **Auditoria** por middleware do Prisma: captura diffs dos campos alterados em todas as entidades de negócio.
- **Permissões**: função central `can()` com matriz perfil × ação; no MVP aplicada em nível de módulo, preparada para nível de projeto via `projeto_membro`.

### D.4 Deploy, backup e hospedagem

- **Docker Compose** com 2 contêineres: `app` (Next.js) e `db` (PostgreSQL) + volume para documentos.
- Executar localmente: `docker compose up` (ou `npm run dev` com Postgres local).
- **Backup**: `pg_dump` diário agendado + cópia do volume de documentos; retenção 30 dias; restauração documentada e testada.
- **Hospedagem futura** (sem mudar código): VM única (Azure/AWS/GCP/Hetzner), ou serviços gerenciados (Azure App Service + Azure Database for PostgreSQL + Blob Storage) — escolha natural se a empresa já usa Microsoft 365.
- CI no GitHub Actions: lint, typecheck, testes e build a cada push.

### D.5 Regra de integração Cronograma → Capacidade (requisito 11)

**Regra padrão — rateio uniforme por dia útil disponível:**

1. Para cada atividade com `recurso`, `inicio_previsto`, `fim_previsto` e `esforco_previsto`:
2. Base de rateio = **Horas para Concluir** (ou Esforço Previsto se ainda não iniciada) — assim o planejamento futuro reflete o que falta, e semanas passadas ficam com o realizado.
3. Período de rateio = de `max(início previsto, hoje)` até `fim previsto`.
4. Conta os **dias úteis** de cada semana dentro do período, descontando feriados e indisponibilidades do recurso.
5. Horas da semana = base × (dias úteis da semana ÷ dias úteis totais).
6. Arredonda em 0,5h; a diferença de arredondamento vai para a última semana.
7. Soma por projeto + recurso + semana → `alocacao_semanal.horas_calculadas`.

**Exemplo:** atividade de 40h, quarta 01/10 a terça 14/10, sem feriados → 10 dias úteis = 4h/dia → semana 40 (qua–sex, 3 dias) = 12h · semana 41 (5 dias) = 20h · semana 42 (seg–ter, 2 dias) = 8h.

**Ajustes manuais, em dois níveis:**
- **Por atividade** (`atividade_semana.horas_ajustadas`): "esta atividade concentra mais horas na 1ª semana". O total ajustado deve fechar com a base; o sistema mostra a diferença em alerta.
- **Por semana** (`alocacao_semanal.horas_manuais`): override do planejamento de capacidade, independentemente do cronograma. Fica visível com ícone ✎ e o valor calculado ao lado; botão "voltar ao calculado".
- Recálculo **nunca apaga override**; se o cronograma mudar e o override divergir muito (> 20%), a célula é sinalizada para revisão.

**Atividades sem recurso ou sem esforço** não entram na capacidade e aparecem num aviso "atividades sem planejamento de recurso" no projeto.

---

## E. Sitemap

```
Login
└─ Aplicação (navegação lateral)
   ├─ Início — Dashboard Executivo
   ├─ Portfólio
   │   ├─ Lista de projetos (filtros, busca, visões salvas)
   │   └─ Novo projeto (assistente curto)
   ├─ Projeto [código — nome]
   │   ├─ Visão Geral (KPIs, fases, marcos, riscos, pendências, carga da equipe)
   │   ├─ Pré-Projeto (premissas, escopo, stakeholders, checklist kickoff, complexidade)
   │   ├─ Backlog
   │   ├─ Cronograma  [Tabela | Gantt | Calendário]
   │   ├─ Operacional (pendências, ações, decisões)
   │   ├─ Testes Internos (casos, execuções/ciclos, defeitos)
   │   ├─ UAT (casos, execuções/ciclos, defeitos, aceite)
   │   ├─ Deployment (checklist, atividades, Go/No-Go, Go Live, Hypercare)
   │   ├─ Status Reports (histórico → novo → visualizar/exportar PDF)
   │   ├─ Riscos (lista + matriz P×I)
   │   ├─ Equipe (membros, alocação semanal do projeto)
   │   ├─ Documentos
   │   └─ Histórico (auditoria do projeto)
   ├─ Recursos
   │   ├─ Lista de recursos
   │   └─ Recurso [nome] (capacidade, indisponibilidades, projetos, carga semanal, próximas atividades, histórico)
   ├─ Capacidade
   │   ├─ Mapa de carga (recurso × semana, heatmap) → drill-down
   │   ├─ Planejamento semanal (projeto × recurso × semana, edição)
   │   └─ Indisponibilidades (calendário da equipe)
   ├─ Clientes (lista + página do cliente com seus projetos)
   └─ Administração (somente Admin)
       ├─ Usuários e perfis
       ├─ Feriados
       ├─ Parâmetros (faixas de utilização, critérios de complexidade, jornada)
       ├─ Importação de planilhas (lotes, validação, efetivação, De-Para)
       └─ Auditoria geral
```

---

## F. Wireframes

### F.1 Dashboard Executivo

```
┌────────┬──────────────────────────────────────────────────────────────────────┐
│ MAIS i9│  Início                                  [Semana 40 ▾]  🔍  (JS)       │
│        ├──────────────────────────────────────────────────────────────────────┤
│ Início │ ┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌────────┐│
│Portfól.│ │ Ativos   ││ Atrasados││ Atenção  ││ Ativid.  ││ Pend.    ││ Riscos ││
│Recursos│ │   14     ││   2 ●    ││   3 ●    ││ atrasadas││ críticas ││ altos  ││
│Capacid.│ │          ││          ││          ││   17     ││    5     ││   4    ││
│Clientes│ └──────────┘└──────────┘└──────────┘└──────────┘└──────────┘└────────┘│
│        │ ┌─ Projetos por status ────────┐ ┌─ Equipe (semana) ────────────────┐ │
│ ─────  │ │ ███████ Em andamento   9      │ │ Capacidade líquida   320h        │ │
│ Admin  │ │ ███ Planejamento       3      │ │ Planejado            298h  93%   │ │
│        │ │ ██ Pausado             2      │ │ Realizado (sem. ant.) 276h       │ │
│        │ └───────────────────────────────┘ │ ● 2 sobrecarregados  ● 3 dispon. │ │
│        │                                   └──────────────────────────────────┘ │
│        │ ┌─ Próximos Go Lives / Marcos (30 dias) ─────────────────────────────┐ │
│        │ │ 08/10  Cliente A · ERP Fase 2 · Go Live            ● no prazo       │ │
│        │ │ 15/10  Cliente B · CRM · Aceite UAT                ● em risco       │ │
│        │ └────────────────────────────────────────────────────────────────────┘ │
│        │ ┌─ Projetos que precisam de atenção ─────────────────────────────────┐ │
│        │ │ Projeto        GP     Saúde  %   Prazo    Desvio h  Motivo         │ │
│        │ └────────────────────────────────────────────────────────────────────┘ │
└────────┴──────────────────────────────────────────────────────────────────────┘
 Cada cartão é clicável → lista já filtrada (ex.: "Atrasados" → Portfólio?saude=vermelho)
```

### F.2 Portfólio

```
 Portfólio                                              [+ Novo projeto]
 🔍 Buscar…  [Cliente ▾][Status ▾][GP ▾][Recurso ▾][Prioridade ▾][Período ▾][Complex. ▾]
 Visões: (Todos) (Meus projetos) (Em atenção) (Go Live 30d)          [Tabela|Cartões]
 ┌─────────┬─────────────┬──────────┬──────┬──────┬───────┬────────┬─────┬───────┬──────┐
 │Código   │Projeto      │Cliente   │GP    │Status│Fase   │Go Live │ %   │Prev/Re│Saúde │
 ├─────────┼─────────────┼──────────┼──────┼──────┼───────┼────────┼─────┼───────┼──────┤
 │PRJ-014  │ERP Fase 2   │Cliente A │Ana   │Andam.│Develop│08/10/26│ 72% │600/410│ ●    │
 └─────────┴─────────────┴──────────┴──────┴──────┴───────┴────────┴─────┴───────┴──────┘
```

### F.3 Página do Projeto — cabeçalho + Visão Geral

```
 Portfólio › Cliente A › ERP Fase 2
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ ERP Fase 2  PRJ-014   [Em andamento] [Alta]   Saúde ● Amarelo         [⋯]    │
 │ Cliente A · GP Ana · Complexidade Alta                                        │
 │ Início 01/07 · Go Live 08/10 · Encerramento 30/11   ██████████░░░ 72%          │
 │ Horas: previstas 600 · realizadas 410 · forecast 640 (+40h / +6,7%)            │
 └──────────────────────────────────────────────────────────────────────────────┘
 Visão Geral | Pré-Projeto | Backlog | Cronograma | Operacional | Testes Internos |
 UAT | Deployment | Status Reports | Riscos | Equipe | Documentos | Histórico
 ┌─ Fases ─────────────────────────────────────┐ ┌─ Próximos marcos ───────────┐
 │ Envisioning ✔ │ Development ▶ │ Deploy │ PD  │ │ 10/10 Fim testes internos  │
 └─────────────────────────────────────────────┘ │ 20/10 Aceite UAT ● risco   │
 ┌─ Atividades atrasadas (3) ──────────────────┐ └────────────────────────────┘
 ┌─ Riscos abertos (P×I) ─┐ ┌─ Pendências ─┐ ┌─ Carga da equipe (4 semanas) ─┐
```

### F.4 Cronograma (tabela com edição inline)

```
 Cronograma    [Tabela | Gantt | Calendário]   Fase[▾] Recurso[▾] Situação[▾]  [+ Atividade]
 ┌──┬────────────┬──────────────┬────────┬───────┬───────┬─────┬─────┬─────┬────┬────────┐
 │ID│Atividade   │Tarefa        │Recurso │Início │Fim    │Prev │Real │Falta│ %  │Situação│
 ├──┴────────────┴──────────────┴────────┴───────┴───────┴─────┴─────┴─────┴────┴────────┤
 │▼ ENVISIONING                                              80h   80h    0  100%         │
 │▼ DEVELOPMENT                                             320h  210h  130   62%         │
 │ 12│Parametriz.│Fiscal        │[João ▾]│[01/10]│[14/10]│ 40  │ 10  │[30] │[25]│● prazo │
 │ 13│Parametriz.│Financeiro ◆  │Maria   │ 25/09 │ 30/09 │ 24  │ 16  │  8  │ 60 │● atras.│
 └───────────────────────────────────────────────────────────────────────────────────────┘
  Clique na célula para editar · Tab avança · Painel lateral abre detalhes (predecessoras,
  backlog vinculado, rateio semanal editável, observações, histórico).  ◆ = marco
```

### F.5 Capacidade — Mapa de carga

```
 Capacidade   Semanas [S40 ▸ S47]  Área[▾]  [Só sobrecarregados]
 ┌────────────┬──────┬──────┬──────┬──────┬──────┬──────┐
 │Recurso     │ S40  │ S41  │ S42  │ S43  │ S44  │ S45  │   ■ Disponível  ■ Adequado
 ├────────────┼──────┼──────┼──────┼──────┼──────┼──────┤   ■ Atenção     ■ Sobrecarregado
 │João Silva  │ 112% │  95% │  80% │  40% │ FÉR. │ FÉR. │
 │Maria Souza │  70% │  85% │  90% │  60% │  20% │   0% │
 └────────────┴──────┴──────┴──────┴──────┴──────┴──────┘
 Clique em "João · S40" →
 ┌─ João Silva · Semana 40 (29/09–05/10) ─────────────────────────────┐
 │ Capacidade 40h − Feriado 0h = 40h líquidas · Planejado 45h (112%)   │
 │ ERP Fase 2 (Cliente A)   28h  ← 3 atividades  (calc 28h)            │
 │ CRM (Cliente B)          12h  ✎ override (calc 8h)                   │
 │ Suporte interno           5h  avulsas                                │
 │ [Abrir planejamento] [Ver atividades]                               │
 └────────────────────────────────────────────────────────────────────┘
```

### F.6 Página do Recurso

```
 João Silva · Consultor Funcional · 40h/semana              [Nova indisponibilidade]
 ┌ Utilização 4 sem. ┐┌ Planejado/Realizado ┐┌ Projetos ativos ┐┌ Próx. ausência ┐
 │      92%          ││   152h / 140h       ││       3         ││ Férias 27/10    │
 └───────────────────┘└─────────────────────┘└─────────────────┘└─────────────────┘
 Carga semanal (barras empilhadas por projeto, linha = capacidade líquida)
  S40 ███████████▓▓▓▒ |  S41 ██████████▓▓ |  S42 ████████ |  S43 ███ | S44 (férias)
 Próximas atividades (cronogramas de todos os projetos)   |  Indisponibilidades
 Histórico (planejado × realizado por semana)
```

### F.7 Status Report

```
 Status Reports  [+ Novo status report]   (pré-preenchido com dados atuais do projeto)
 ┌───────────┬──────────────────┬────────┬─────┬───────────┐
 │Emissão    │Período           │Status  │ %   │Publicado  │
 │29/09/2026 │22/09 – 28/09     │● Amar. │ 68% │✔ Ana      │
 └───────────┴──────────────────┴────────┴─────┴───────────┘
 Edição: Status geral/prazo/escopo/esforço · Entregas · Próximos passos ·
 Impedimentos · Decisões necessárias · Riscos (selecionados do registro) ·
 Marcos (automáticos) · Comentários  →  [Salvar rascunho] [Publicar] [Exportar PDF]
```

---

## G. MVP (Release 1)

Objetivo do MVP: **a equipe deixar de usar a planilha de Gestão de Recursos e o CTRL-001 para o dia a dia** dos projetos novos e migrados.

| # | Entra no MVP |
|---|---|
| 1 | Login (Entra ID ou e-mail/senha), 4 perfis com permissão por módulo |
| 2 | Cadastros: clientes, contatos, recursos, capacidade, feriados, usuários, parâmetros |
| 3 | Dashboard executivo com indicadores clicáveis |
| 4 | Portfólio com busca, ordenação e todos os filtros pedidos |
| 5 | Página do projeto: cabeçalho, Visão Geral, Equipe, Histórico |
| 6 | **Cronograma**: tabela com edição inline, agrupamento por fase, predecessoras, marcos, cálculos (duração, forecast, desvio, situação) e **Gantt** (visualização + arrastar datas) |
| 7 | **Integração cronograma → capacidade** com rateio automático e override (D.5) |
| 8 | Capacidade: mapa de carga com faixas, drill-down recurso × semana, planejamento semanal editável, indisponibilidades |
| 9 | Página do recurso |
| 10 | Lançamento de horas realizadas (forma definida em J) |
| 11 | Backlog com vínculo a atividades |
| 12 | Riscos e Pendências |
| 13 | Testes Internos e UAT (casos, execuções, vínculo com defeitos) |
| 14 | Deployment (checklist, Go/No-Go, Go Live, Hypercare) |
| 15 | Status Reports com histórico e snapshot |
| 16 | Documentos (upload local + links) |
| 17 | Auditoria automática (quem/quando/o quê) |
| 18 | **Importação** da Gestão de Recursos/Portfólio e do CTRL-001 com staging e validação |
| 19 | Backup automatizado e Docker Compose |

**Sequência de construção sugerida (incrementos entregáveis, ~2 semanas cada):**
1. Fundação: projeto, banco, autenticação, layout, cadastros, auditoria
2. Portfólio + Projeto (cabeçalho, visão geral) + Cronograma tabela
3. Motor de rateio + Capacidade + Recurso + Indisponibilidades
4. Gantt + Backlog + Riscos/Pendências + Dashboard executivo
5. Testes/UAT + Deployment + Status Report + Documentos
6. Importação + migração assistida dos dados reais + ajustes de uso

Pré-Projeto, Complexidade e Operacional entram no incremento 5 em versão simples **[ajustar após validar as abas]**.

---

## H. Roadmap (pós-MVP)

| Versão | Itens |
|---|---|
| **1.1** | Visão calendário do cronograma · exportação Excel/PDF de todas as listas · visões salvas por usuário · notificações por e-mail (atividade atrasada, risco crítico, sobrecarga) |
| **1.2** | Baseline do cronograma (planejado original × atual) · curva S · Gestão de mudanças de escopo (Change Requests ligadas ao backlog, com impacto em horas/prazo) |
| **1.3** | Permissões por projeto (GP edita só os seus; consultor só lança horas e atualiza suas atividades) · templates de projeto (cronograma/checklists padrão por tipo de projeto) |
| **2.0** | Integração de documentos com SharePoint/OneDrive · integração com Teams (avisos) · importação/exportação MS Project · indicadores financeiros (custo/hora, margem) · portal de consulta para o cliente (UAT e status report) |
| **Futuro** | API pública, BI (Power BI conectado ao Postgres), previsão de capacidade (pipeline de propostas), app mobile para apontamento |

---

## I. Estratégia de migração

**Princípios:** não destrutiva · validar antes de efetivar · rastreável até a linha da planilha · repetível.

1. **Preparação**
   - Cadastrar (ou importar) primeiro **recursos, clientes e feriados**.
   - Montar a tabela **De-Para** (`import_mapeamento`) para nomes de recursos/clientes/projetos com grafias diferentes.
2. **Carga em staging**
   - Upload da planilha → cada linha de cada aba vira `import_linha` com os dados brutos; nada é gravado nas tabelas de negócio.
   - O arquivo original fica armazenado e vinculado ao lote.
3. **Validação** (Zod + regras de negócio), com tela de revisão:
   - Erros: recurso/cliente não mapeado, data inválida, fase fora das 4 oficiais, horas negativas, semana fora do calendário.
   - Alertas: atividade sem recurso, % inconsistente com status, soma do rateio ≠ esforço, projeto do CTRL-001 não encontrado no Portfólio.
   - O usuário corrige no De-Para ou marca linhas para ignorar; revalida quantas vezes quiser.
4. **Conciliação** — prévia do que será criado/atualizado, comparando com o que já existe pela chave natural (código do projeto; projeto+ID da atividade; projeto+recurso+semana).
5. **Efetivação** — em transação única por lote; registros recebem `origem_importacao_id`; auditoria com ação IMPORTAR. Lote pode ser reimportado (atualiza, não duplica).
6. **Ordem sugerida**
   1. Portfólio → clientes e projetos
   2. Gestão de Recursos → capacidade, indisponibilidades, alocações semanais **históricas** (horas previstas e realizadas viram `horas_manuais` e `horas_realizadas` — preservando o histórico exatamente como estava)
   3. CTRL-001 de cada projeto → cronograma, backlog, testes, deployment, riscos, status reports anteriores (como snapshots publicados)
   4. Para semanas **futuras**, o rateio automático passa a valer; onde a planilha divergir do cálculo, o valor da planilha entra como override e é sinalizado para o GP revisar.
7. **Paralelo** — 2 a 4 semanas usando app e planilhas juntos em 1–2 projetos piloto; depois congelar as planilhas (somente leitura, arquivadas como documento do projeto).

---

## J. Perguntas (decisões de negócio necessárias)

1. **Horas realizadas** — hoje são lançadas por **semana por projeto** (planilha de recursos) ou por **atividade** (CTRL-001)? Proposta: o consultor lança por semana e projeto, escolhendo a atividade opcionalmente. Quem lança: o próprio consultor ou o GP?
2. **Faixas de utilização** — confirma os limites? Proposta: **Disponível < 70% · Adequado 70–90% · Atenção 90–100% · Sobrecarregado > 100%**.
3. **Rateio** — aprova a regra "uniforme por dia útil, considerando o que falta (horas para concluir) a partir de hoje", com override por atividade e por semana?
4. **Saúde do projeto** — calculada automaticamente (prazo, desvio de horas, riscos críticos) com possibilidade de o GP sobrescrever com justificativa? Ou sempre definida manualmente pelo GP?
5. **Login** — a MAIS i9 usa Microsoft 365? Se sim, login com a conta corporativa é o padrão.
6. **Consultores no sistema** — todos os recursos terão acesso para atualizar suas atividades e lançar horas, ou somente GPs operam o sistema no MVP?
7. **Hospedagem** — há preferência (Azure, AWS, servidor próprio)? Documentos devem ficar no SharePoint desde o início ou podemos começar com armazenamento próprio?
8. **Terceiros / recursos do cliente** — recursos do cliente entram na gestão de capacidade ou apenas como responsáveis em atividades/UAT? (Proposta: apenas como contatos.)
9. **Projetos internos / não faturáveis** (pré-venda, suporte, treinamento) — devem existir como "projetos" para consumir capacidade? (Proposta: sim, com tipo INTERNO.)
10. **Planilhas reais** — para fechar os itens **[validar]** (Complexidade, Pré-Projeto, Controle Operacional, fórmulas de % e saúde), preciso de **1 CTRL-001 preenchido** e da **planilha de Gestão de Recursos**. Podem ser enviadas com dados reais ou anonimizados.
