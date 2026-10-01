# MAIS i9 — Gestão de Projetos, Portfólio e Recursos
## Proposta de Arquitetura (Etapa 1 — para aprovação) · v3

> **Base desta versão:** análise célula a célula (valores, fórmulas, validações, formatações condicionais e nomes definidos) de:
> - `CTRL-001_Kover_Implantação_WMS_v1.9.xlsx` (12 abas)
> - `CTRL-001_Sulmedic_Projeto_Reforma_Tributária_v1.9.xlsx` (12 abas — mesmo template)
> - `CTRL-003_Gestao_Recursos_v5.3.xlsx` (14 abas, 3 ocultas/legado)
>
> Datas de referência das planilhas: semana S40/2026 (28/09/2026).

---

## A. Diagnóstico dos arquivos atuais

### A.1 CTRL-001 — Controle Operacional do Projeto (1 arquivo por projeto)

| Aba | O que é | Campos / regras encontradas |
|---|---|---|
| **Dashboard** | Visão executiva (100% fórmulas, exceto 2 textos livres) | Projeto, Status (vem do Status Report), Progresso, Go Live (vem do Pré-Projeto); Horas Previstas / Realizadas / Forecast / Atividades Atrasadas; **Próximos 3 marcos** (marco = Sim, não concluído, ordenado por Fim Previsto); Progresso e horas **por fase**; **Horas por Recurso MAIS i9 — "base para o CTRL-003"** com contagem de linhas com alerta; campos livres "Resumo para status do cliente" e "Pontos de atenção" |
| **Pré-Projeto \| Complexidade** | Avaliação de complexidade e baseline de abertura | Projeto, Cliente, Avaliador, Data, Horas estimadas; **12 critérios** em 4 dimensões (Esforço, Prazo, Complexidade, Risco), nota 0–3 com descrição de cada nota, e flag "Gatilho crítico?"; Score = soma; Nível base **N1 ≤ 8 · N2 ≤ 16 · N3 ≤ 24 · N4 > 24**; 1 gatilho crítico (nota 3 + Sim) ⇒ mínimo N3, 2+ ⇒ N4; Nível final = maior dos dois; **Governança: N1 Execução Direta · N2 Gestão Leve · N3 Gestão Parcial · N4 Gestão Integral** |
| **Pré-Projeto** | Checklist de prontidão para o kickoff | GP, Início previsto, **Go Live alvo**, Status Pré-Projeto (Pronto para iniciar / Pronto com ressalvas / Bloqueado); 7 itens padrão (Equipe, Acessos, Ambiente, Governança, Agenda, Escopo, Liberação) com Responsável, Informação/Contato, Validação, Status (Pendente/Concluído/Bloqueado/N/A), Prazo, Observação. O título da aba diz "conteúdo a ser absorvido em Pré-Projeto \| Complexidade" — já há intenção de unificar |
| **Backlog** | Requisitos/entregas (`REQ-001…`) | Módulo\|Processo, Requisito, Tipo, Prioridade (Baixa/Média/Alta/Crítica), Aderência ao Padrão, Solução Proposta, Customização?, Critério de Aceite, Estimativa h, Responsável, Status, Validação Cliente (Pendente/Aprovado/Reprovado/N/A), Observação |
| **Cronograma** | Atividades (`CRON-001…`) + Gantt semanal por formatação condicional | As 23 colunas descritas por você. Detalhes relevantes: **a coluna "Atividade" guarda o código do requisito (`REQ-00x`)** — é o vínculo cronograma ↔ backlog; quando uma tarefa tem vários recursos, ela é **duplicada em linhas `CRON-006`, `CRON-006.2`, `CRON-006.3`** (uma por recurso); Status inclui "Atrasado" como valor digitável; Duração Útil = `NETWORKDAYS` (sem feriados); Forecast = Realizado + Para Concluir; Desvio = Forecast − Previsto |
| **Operacional** | Registro RAID unificado | Tipo (**Pendência, Decisão, Dependência, Problema, Risco, Change Request**), Descrição, Origem/Causa, Impacto/Consequência, Responsável, Abertura, Prazo, Status (Aberto, Em andamento, Aguardando, Bloqueado, Aprovado, Reprovado, Fechado, Cancelado), Impacto em Escopo / Prazo / Horas (Não/Baixo/Médio/Alto), Ação/Resposta, Decisão/Aprovador, Evidência. Vazio nos dois projetos |
| **Teste Interno** | Casos de teste MAIS i9 (`TI-…`) | Requisito, Módulo, Pré-condição, Cenário\|Passos, Resultado Esperado, Responsável MAIS i9, Data, Resultado, Defeito\|Pendência (texto), Evidência, Validação MAIS i9 |
| **Teste Cliente \| UAT** | Homologação (`UAT-…`) | Requisito, Módulo, Cenário\|Passos, Resultado Esperado, Key User\|Cliente, Data, Resultado, Defeito\|Pendência, Evidência, **Aceite Cliente**, Observação |
| **Deployment** | Checklist de Go Live | 12 itens padrão em 8 categorias (Escopo\|Qualidade, Dados\|Acessos, Integrações, Infraestrutura, Deploy, Comunicação, Suporte, Decisão), Obrigatório? (Sim/Não/**Condicional**), Status, Responsável, Evidência, Risco\|Observação, Aprovação; último item = "Go/No-Go aprovado" |
| **Status Report** | **Um único** status (sobrescrito a cada ciclo) | Período, Status Executivo (Verde/Amarelo/Vermelho), Fase Atual, Resumo Executivo, Entregas Concluídas, Próximas Entregas; indicadores automáticos (progresso, horas, atrasadas, pendências vencidas, riscos/problemas abertos, nº de CRs) |
| **Auditoria CTRL-003** | Validação de cada linha do cronograma antes de consolidar no CTRL-003 | **14 regras de qualidade** (ver A.3) e coluna "Pronta p/ CTRL-003" |
| **Parâmetros** | Listas | Status, Fases (as 4 oficiais), Prioridade, **12 Recursos MAIS i9 copiados em cada arquivo**, Recursos Cliente, Resultado de teste, Status operacional/executivo/checklist, Validação |

### A.2 CTRL-003 — Gestão de Recursos / Portfólio (consolidado)

| Aba | O que é | Observações da análise |
|---|---|---|
| **Portfólio Projetos** | Cadastro mestre — 24 projetos, 13 clientes | Id, Cliente, Projeto, Status (Em Andamento, Bloqueado, Aprovação Cliente, Não Aprovado, Projeto Identificado, Concluído, Cancelado), Notas\|Bloqueios\|Ações, **Funcional**, **Técnico**, Horas Projeto, Kick-off, Go Live, Encerramento. **Horas e datas vazias em todos os 24 projetos**; não há coluna GP, prioridade, complexidade nem código que ligue ao CTRL-001 |
| **Planejamento Recursos** | **1 linha = projeto + recurso + semana** (S40–S53) | 33 linhas preenchidas. Status (Planejado, Em Andamento, Bloqueado, Aguardando Cliente, Concluído, Cancelado), Prioridade (Alta/Média/Baixa — "Crítica" usada fora da lista), Observação descreve o trabalho da semana. **Horas Realizadas vazias** em todas as linhas |
| **Capacidade** | Matriz recurso × semana | 40h/sem (Miguel Barater e Diego Bonilha 30h; Adilson Elias sem valor). **Não é usada pelo dashboard** |
| **Indisponibilidades** | Férias, ausências, bloqueios | Recurso, Tipo, Início, Fim, Horas, Semana, Observação, **Status (Pendente → aprovação)**. **Não é usada em nenhum cálculo** |
| **Dashboard Recursos** | Utilização por recurso/semana | Utilização = planejado ÷ capacidade (coluna fixa no próprio dashboard); faixa calculada sobre a **média das 14 semanas**: **> 100% Sobrecarregado · ≥ 85% Atenção · < 50% Disponível · senão Adequado**; capacidade total fixa em 460h/semana |
| **Projeto vs. Recursos** | Prev × Real por projeto/recurso/semana | Lista **fixa** de 24 combinações — **apenas 1 recurso por projeto** (o "Funcional") |
| **Carga por Projeto** | Horas por projeto × semana | 336 linhas fixas (24 projetos × 14 semanas) |
| **Calendário \| Gantt** | Linha do tempo do portfólio | Usa as datas do Portfólio — que estão vazias, portanto o Gantt fica vazio |
| Parâmetros / Dados Projetos / 3 abas LEGADO | Listas e apoio | Lista de recursos repetida em 4 lugares; **Tipo de projeto** já previsto (Projeto, Suporte, Sustentação, Interno) mas não usado |

### A.3 Regras e cálculos identificados (serão implementados no sistema)

| Regra | Fórmula atual | No sistema |
|---|---|---|
| Duração útil | `NETWORKDAYS(Início, Fim)` | Dias úteis descontando **feriados** (hoje não desconta) |
| Forecast | Realizado + Horas para Concluir | Igual |
| Desvio Forecast | Forecast − Esforço Previsto | Igual (h e %) |
| Situação do Prazo | Concluído → "Concluído"; Cancelado → vazio; Status = Atrasado **ou** hoje > Fim → "Atrasado"; Fim − hoje ≤ 3 dias → "Atenção"; senão "No prazo" | Igual, mas **"Atrasado" deixa de ser status digitável** — passa a ser só situação calculada (hoje é possível ter status "Atrasado" em tarefa no prazo, e vice-versa) |
| Progresso do projeto/fase | **Média simples** do % das atividades não canceladas | Proposta: **média ponderada pelo esforço previsto** (uma tarefa de 2h e outra de 40h hoje pesam igual) — ver J |
| Próximos marcos | 3 primeiros marcos não concluídos por Fim Previsto | Igual, sem limite e clicável |
| Horas por recurso no projeto | `SUMIFS` por nome do recurso | Agregação por `recurso_id` |
| Complexidade | Score, gatilhos, nível base/mínimo/final, governança | Igual, parametrizável |
| Utilização semanal | Planejado ÷ capacidade (fixa) | Planejado ÷ **capacidade líquida** (capacidade − indisponibilidades − feriados) |
| Faixas | > 100% / ≥ 85% / < 50% / resto — sobre a **média** do período | Mesmas faixas, avaliadas **semana a semana** (a média de 14 semanas esconde a sobrecarga pontual) |
| **Qualidade do cronograma** (aba Auditoria) | 14 regras: sem fase · fase fora das 4 oficiais · mais de 1 recurso na célula · recurso fora da lista · esforço sem recurso · recurso sem esforço · sem datas · data em fim de semana · fim antes do início · **atravessa semanas: definir distribuição** · concluída sem realizado · responsável ≠ recurso sem explicação · possível duplicidade · concluída com % < 100 / 100% sem status concluído | Viram **validações em tempo real** no formulário (impedem ou alertam) e um painel "Qualidade do cronograma" no projeto. Várias deixam de existir por construção (recurso fora da lista, mais de 1 recurso na célula, fase inválida) |

### A.4 Problemas concretos encontrados nos arquivos

1. **O dashboard do CTRL-003 está zerado.** As horas do Planejamento foram digitadas como texto (`"4h"`, `"20h"`), então todo `SUMIFS` retorna 0: Horas Planejadas S40 = 0, todos os recursos aparecem "Disponível" com 100% de disponibilidade.
2. **A sobrecarga real não aparece em lugar nenhum.** Somando o CTRL-003 com o que está nos CTRL-001 (distribuído por dia útil):

   | Recurso | Semana | CTRL-003 | + CTRL-001 | Total | Capacidade | Utilização |
   |---|---|---|---|---|---|---|
   | Luiz Dornelles | S40 | 59h | Kover 14h | **73h** | 40h | **183%** |
   | Luiz Dornelles | S41 | 30h | Kover 24h | **54h** | 40h | **135%** |
   | Luiz Dornelles | S42 | 41h | Kover 20h | **61h** | 40h | **153%** |
   | Julis Felipe | S40 | 40h | Sulmedic 16h | **56h** | 40h | **140%** |
   | Julis Felipe | S42 | 0h | Sulmedic 24h | 24h | 40h | 60% (invisível no CTRL-003) |

   Kover (140h) e Sulmedic Reforma Tributária (88h) **não têm nenhuma linha** no Planejamento Recursos: a consolidação manual CTRL-001 → CTRL-003 não aconteceu, mesmo com a aba Auditoria preparada para isso.
3. **Atividades com vários recursos viram linhas duplicadas** (`CRON-006`, `.2`, `.3`), com o mesmo esforço repetido em cada linha e uma linha sem recurso (só cliente). Como o esforço é o mesmo repetido (confirmado), **o Kover soma 140h mas o esforço real é 92h** em 26 tarefas; a duplicação também gera 6 alertas "Esforço sem Recurso MAIS i9".
4. **Nomes de pessoas sem padrão:** "Diego / Dornelles", "Dornelles / Diego", "Diego / Murilo / Dornelles" nos testes (e existem **dois Diegos**: Fortunato e Bonilha); "Laura Iris" é GP do Sulmedic e aparece nas Indisponibilidades, mas não está na lista de recursos (que tem "Laura Camargo"); GP do Kover = "GP MAIS i9"; cliente "DIPIL" × "Dipil".
5. **Recurso Cliente mistura empresa e pessoa** ("Kover", "Sulmedic", "Leondil Ribeiro").
6. **Testes:** no Kover, o mesmo ID (`TI-001`…`TI-009`) existe duas vezes — 9 casos gerados automaticamente a partir do backlog + 55 casos detalhados, cuja coluna "Requisito" contém o nome do cenário (não o `REQ`), portanto **sem vínculo com o backlog**. Não existe coluna "Resultado obtido"; defeitos são texto livre e não viram pendência; o valor "Planejado" é usado sem constar da lista.
7. **Datas inconsistentes:** atividade de 09/10 a **10/10 (sábado)** e Sulmedic 16/10 a 17/10 (sábado, duração útil = 1).
8. **Status Report sem histórico:** um único quadro sobrescrito; "Progresso Planejado" usa a mesma fórmula do "Realizado" (não existe linha de base).
9. **Datas e horas do projeto em 3 lugares** (Pré-Projeto do CTRL-001, Portfólio, Gantt) — o Go Live do Kover (03/11) está no CTRL-001 e vazio no Portfólio.
10. **Complexidade não preenchida** nos dois projetos (score 0 ⇒ classificados como N1 por padrão, embora o Kover tenha 140h, 3+ integrações e Go Live com rollback).
11. **Semana sem ano** (`S40`): o calendário quebra na virada de ano (S53 → S01).
12. **Horas de gestão** (Carlos Camargo: "GP \| acompanhamento…") e projetos que não são de implantação (Agricopel "Alocação DEV") só existem no CTRL-003 — corretamente, pois não vêm de cronograma.

### A.5 Duplicidades que o sistema elimina

| Hoje mantido em… | Passa a ser… |
|---|---|
| Lista de 12 recursos em cada CTRL-001 + 4 lugares do CTRL-003 | Cadastro único de Recursos |
| Projeto/Cliente/GP/Go Live no Pré-Projeto, no Portfólio e no Gantt | Cadastro único de Projeto |
| Cronograma (recurso × período × esforço) **e** Planejamento Recursos | Alocação semanal **derivada** do cronograma + override manual |
| Aba Auditoria CTRL-003 + Dashboard "base para o CTRL-003" | Desnecessárias — a integração é automática; as regras viram validação |
| Capacidade em 3 lugares (Capacidade, Dados Projetos, coluna fixa do Dashboard) | Capacidade do recurso com vigência |
| Abas Projeto vs. Recursos, Carga por Projeto, Gantt do portfólio (linhas fixas) | Consultas dinâmicas sobre a alocação |
| Casos de UAT/TI gerados copiando tarefas do cronograma | Casos ligados a requisito/atividade por FK |
| Indicadores do Status Report recalculados à mão | Fotografados automaticamente ao publicar |

### A.6 O que deve continuar independente

- **Alocação sem atividade** (gestão do GP, sustentação, alocação de DEV, interno) — lançada direto no planejamento semanal.
- **Override semanal** — o planejamento pode divergir do rateio automático por decisão do gestor.
- **Status Report publicado** — fotografia imutável.
- **Teste Interno × UAT** — mesmo formato, responsáveis e aceite diferentes.
- **Indisponibilidades** — pertencem ao recurso, não ao projeto.
- **Responsável × Recurso executor** — hoje já são colunas diferentes (o GP responde, o consultor executa).
- **Registro Operacional (RAID)** — itens com ciclo de vida próprio, ligados ou não a atividades.

---

## B. Modelo conceitual

```
                          ┌──────────────┐
                          │   CLIENTE    │──1:N── CONTATO CLIENTE (key users)
                          └──────┬───────┘
                                 │1:N
 ┌──────────┐  GP / Funcional ┌──▼──────────┐── Complexidade (12 critérios → N1..N4)
 │ USUÁRIO  │───────────────►│   PROJETO   │── Pré-Projeto (checklist de prontidão)
 └────┬─────┘  / Técnico     └─┬──┬──┬──┬──┘
      │0..1                    │  │  │  └──► STATUS REPORT (snapshots, histórico)
 ┌────▼─────┐                  │  │  └─────► REGISTRO OPERACIONAL (Pendência, Decisão,
 │ RECURSO  │                  │  │           Dependência, Problema, Risco, Change Request)
 └──┬───┬───┘                  │  └────────► DEPLOYMENT (checklist, Go/No-Go, Hypercare)
    │   │                      │1:N
    │   │        ┌─────────────▼───┐  N:1  ┌──────────────┐  1:N  ┌──────────────┐
    │   │        │   ATIVIDADE     ├──────►│ BACKLOG (REQ)│◄──────┤ CASO DE TESTE│
    │   │        │   (CRON)        │       └──────────────┘       │  (TI / UAT)  │
    │   │        └──────┬──────────┘                              └──────┬───────┘
    │   │               │1:N                                             │1:N
    │   └──────────────►│ ATRIBUIÇÃO (atividade × recurso × esforço)     ▼
    │                   │      │ rateio por dia útil              EXECUÇÃO ──► DEFEITO
    │                   ▼      ▼                                  (vira item do Registro
    ├─► CAPACIDADE   ALOCAÇÃO SEMANAL  (projeto + recurso + semana)  Operacional)
    └─► INDISPONIBILIDADE      ▲ override manual / horas avulsas
                               └─ APONTAMENTO (horas realizadas)
                   Todas as entidades ──► AUDITORIA
```

| Módulo | Responsabilidade |
|---|---|
| **Portfólio** | Clientes, projetos, tipos, filtros, Gantt do portfólio, dashboard executivo |
| **Projeto** | Pré-projeto + complexidade, backlog, cronograma, operacional (RAID), testes, UAT, deployment, status reports, documentos |
| **Recursos** | Cadastro, capacidade, indisponibilidades (com aprovação), planejamento semanal, utilização |
| **Motor de planejamento** | Rateio atividade → semanas, capacidade líquida, faixas, saúde, regras de qualidade |
| **Importação** | Staging, validação, De-Para e efetivação dos CTRL-001 e CTRL-003 |
| **Administração** | Usuários/perfis, feriados, parâmetros, templates (checklists, critérios), auditoria |

---

## C. Modelo de dados

Banco relacional (PostgreSQL). Convenções:
- PK `id` (UUID); códigos legíveis (`CRON-001`, `REQ-001`, `TI-001`) únicos **por projeto**, gerados pelo sistema.
- Tabelas de negócio com `criado_em`, `criado_por_id`, `atualizado_em`, `atualizado_por_id`.
- Exclusão lógica (`arquivado_em`) em Cliente, Projeto, Recurso.
- Listas de valores do Excel (status, tipos) viram **enums**; listas que o usuário edita viram **tabelas de domínio**.
- `import_linha_id` (FK opcional) nas entidades migradas → rastreabilidade até arquivo/aba/linha.

### C.1 Cadastros e segurança

| Tabela | Campos principais |
|---|---|
| **usuario** | id, nome, email (único), perfil (ADMIN · GESTOR · CONSULTOR · VISUALIZADOR), ativo, ultimo_acesso |
| **recurso** | id, usuario_id (FK, único, opcional), nome, apelidos (para importação: "Dornelles"), email, cargo, area, tipo (INTERNO · TERCEIRO), ativo, data_entrada, data_saida |
| **recurso_capacidade** | id, recurso_id FK, vigencia_inicio, vigencia_fim (nula = vigente), horas_semanais, horas_dia (padrão = semanais ÷ 5) |
| **cliente** | id, codigo, nome, razao_social, segmento, ativo |
| **contato_cliente** | id, cliente_id FK, nome, email, telefone, funcao (Sponsor, Key User, TI, GP Cliente) |
| **feriado** | id, data, descricao, abrangencia (NACIONAL · ESTADUAL · MUNICIPAL), uf, municipio |
| **semana** | id (`2026-W40`), ano_iso, numero, inicio (seg), fim (dom), rotulo (`S40/26`) |

### C.2 Projeto, pré-projeto e complexidade

| Tabela | Campos principais |
|---|---|
| **projeto** | id, codigo, cliente_id FK, nome, tipo (PROJETO · SUPORTE · SUSTENTACAO · ALOCACAO · INTERNO), status (PROJETO_IDENTIFICADO · APROVACAO_CLIENTE · NAO_APROVADO · EM_ANDAMENTO · BLOQUEADO · CONCLUIDO · CANCELADO), prioridade (BAIXA · MEDIA · ALTA · CRITICA), gp_id FK→recurso, funcional_id FK→recurso, tecnico_id FK→recurso, data_kickoff, data_go_live_alvo, data_go_live_real, data_encerramento_prevista, data_encerramento_real, horas_vendidas, notas (Notas\|Bloqueios\|Ações), status_executivo (VERDE · AMARELO · VERMELHO — último publicado), fase_atual (derivada, editável) |
| **projeto_membro** | id, projeto_id, recurso_id, papel (GP · FUNCIONAL · TECNICO · DEV · APOIO), inicio, fim |
| **projeto_contato** | projeto_id, contato_cliente_id, papel (SPONSOR · GP_CLIENTE · KEY_USER · TI) |
| **criterio_complexidade** | id, dimensao (ESFORCO · PRAZO · COMPLEXIDADE · RISCO), nome, descricao_0, descricao_1, descricao_2, descricao_3, ordem, ativo — *seed com os 12 critérios atuais* |
| **projeto_complexidade** | id, projeto_id, criterio_id, nota (0–3), gatilho_critico (bool), observacao · UNIQUE(projeto, criterio) |
| **avaliacao_complexidade** | projeto_id (PK), avaliador_id, data, horas_estimadas, score, gatilhos, nivel_base, nivel_minimo, nivel_final (N1–N4), governanca — *derivados gravados ao salvar, para histórico e filtro* |
| **pre_projeto** | projeto_id (PK), status (PRONTO · PRONTO_COM_RESSALVAS · BLOQUEADO), observacao |
| **pre_projeto_item** | id, projeto_id, categoria (EQUIPE · ACESSOS · AMBIENTE · GOVERNANCA · AGENDA · ESCOPO · LIBERACAO · OUTRO), item, responsavel_texto, informacao_contato, validacao_esperada (Confirmado · Testado · Definido · Validado), status (PENDENTE · CONCLUIDO · BLOQUEADO · NA), prazo, observacao, ordem |
| **template_item** | id, tipo (PRE_PROJETO · DEPLOYMENT), categoria, item, validacao/obrigatoriedade padrão, ordem — *os 7 itens de pré-projeto e os 12 de deployment atuais viram template copiado ao criar o projeto* |

### C.3 Backlog e cronograma

| Tabela | Campos principais |
|---|---|
| **backlog_item** | id, projeto_id, codigo (`REQ-001`), modulo_processo, requisito, tipo (ENTREGA · REQUISITO · MELHORIA · INTEGRACAO · RELATORIO · CUSTOMIZACAO), prioridade, aderencia_padrao (ADERENTE · PARCIAL · GAP · A_VALIDAR), solucao_proposta, customizacao (SIM · NAO · A_CONFIRMAR), criterio_aceite, estimativa_horas, responsavel_id, status (NAO_INICIADO · EM_ANDAMENTO · BLOQUEADO · CONCLUIDO · CANCELADO), validacao_cliente (PENDENTE · APROVADO · REPROVADO · NA), observacao, ordem |
| **atividade** | id, projeto_id, codigo (`CRON-001`), fase (ENVISIONING · DEVELOPMENT · DEPLOYMENT · POST_DEPLOY), **backlog_item_id** FK (hoje coluna "Atividade"), tarefa, modulo_processo, contato_cliente_id FK (Recurso Cliente — pessoa) ou `cliente_responsavel` (bool, quando é "o cliente" genericamente), responsavel_id FK→recurso, inicio_previsto, fim_previsto, percentual_conclusao, status (NAO_INICIADO · EM_ANDAMENTO · BLOQUEADO · CONCLUIDO · CANCELADO), marco (bool), data_real_conclusao, observacao, ordem |
| **atividade_atribuicao** | id, atividade_id, recurso_id, esforco_previsto, esforco_realizado (derivado dos apontamentos), horas_para_concluir, modo_rateio (UNIFORME · MANUAL) · UNIQUE(atividade, recurso) — **substitui as linhas `.2`/`.3`** |
| **atribuicao_semana** | atribuicao_id, semana_id, horas_calculadas, horas_ajustadas (override opcional) · PK composta |
| **atividade_predecessora** | atividade_id, predecessora_id, tipo (FS) · PK composta |

> **Derivados (não armazenados):** duração útil, esforço previsto/realizado/para concluir da atividade (soma das atribuições), forecast, desvio, situação do prazo, progresso por fase/projeto.

### C.4 Registro Operacional (RAID), testes e deployment

| Tabela | Campos principais |
|---|---|
| **item_operacional** | id, projeto_id, codigo, tipo (PENDENCIA · DECISAO · DEPENDENCIA · PROBLEMA · RISCO · CHANGE_REQUEST · DEFEITO), descricao, origem_causa, impacto_consequencia, responsavel_id / responsavel_contato_id, data_abertura, prazo, status (ABERTO · EM_ANDAMENTO · AGUARDANDO · BLOQUEADO · APROVADO · REPROVADO · FECHADO · CANCELADO), impacto_escopo / impacto_prazo / impacto_horas (NAO · BAIXO · MEDIO · ALTO), acao_resposta, decisao_aprovador, evidencia_observacao, **probabilidade (1–5), impacto (1–5), severidade** (só RISCO), **horas_cr, dias_cr** (só CHANGE_REQUEST), atividade_id / backlog_item_id / execucao_teste_id (vínculos opcionais), data_fechamento |

> **Por que uma tabela só?** O CTRL-001 já usa um registro único com 6 tipos e o mesmo ciclo de vida — e o Status Report conta "riscos/problemas abertos", "pendências vencidas" e "CRs" sobre ela. Na interface, Riscos, Pendências e Change Requests aparecem como **abas filtradas** com os campos específicos de cada tipo. Um defeito encontrado em teste vira item tipo DEFEITO ligado à execução.

| Tabela | Campos principais |
|---|---|
| **caso_teste** | id, projeto_id, tipo (INTERNO · UAT), codigo (`TI-001` / `UAT-001`), backlog_item_id FK, atividade_id FK (opcional), modulo_processo, cenario, pre_condicao, passos, resultado_esperado, responsavel_id (INTERNO) / contato_cliente_id (UAT), ordem |
| **execucao_teste** | id, caso_teste_id, ciclo (1, 2, 3…), data, executor, **resultado_obtido** (novo), resultado (PLANEJADO · NAO_EXECUTADO · APROVADO · REPROVADO · BLOQUEADO · NA), validacao (PENDENTE · APROVADO · REPROVADO · NA — "Validação MAIS i9" ou "Aceite Cliente"), observacao |
| **deployment** | id, projeto_id, nome ("Go Live", "Go Live Fase 2"), janela_inicio, janela_fim, data_go_live_real, decisao_go_nogo (PENDENTE · GO · NO_GO · GO_COM_RESSALVAS), data_decisao, aprovadores, justificativa, hypercare_inicio, hypercare_fim, status |
| **deployment_item** | id, deployment_id, categoria, item, obrigatorio (SIM · NAO · CONDICIONAL), status (NAO_INICIADO · EM_ANDAMENTO · BLOQUEADO · CONCLUIDO · NA), responsavel_id, data_prevista, data_real, evidencia, risco_observacao, aprovacao (PENDENTE · APROVADO · REPROVADO · NA), atividade_id (opcional), ordem |
| **deployment_item_dependencia** | item_id, depende_de_id |

> Regra Go/No-Go: o sistema indica "Pronto para Go" quando todos os itens **Sim** estão Concluídos/Aprovados e os **Condicional** estão Concluídos ou N/A; defeitos críticos abertos e UAT reprovado bloqueiam.

### C.5 Recursos, capacidade e alocação

| Tabela | Campos principais |
|---|---|
| **indisponibilidade** | id, recurso_id, tipo (FERIAS · FERIADO_LOCAL · AUSENCIA · TREINAMENTO · BLOQUEIO · OUTROS), inicio, fim, horas_por_dia (padrão = jornada), observacao, status (PENDENTE · APROVADA · RECUSADA) — só APROVADA reduz capacidade |
| **alocacao_semanal** | **Projeto + Recurso + Semana** — id, projeto_id, recurso_id, semana_id, horas_calculadas (soma das atribuições, mantida pelo sistema), horas_manuais (override, nulo = sem override), horas_avulsas (gestão, sustentação, alocação), horas_realizadas (soma dos apontamentos), status (PLANEJADO · EM_ANDAMENTO · BLOQUEADO · AGUARDANDO_CLIENTE · CONCLUIDO · CANCELADO), prioridade, observacao · UNIQUE(projeto, recurso, semana) |
| **apontamento** | id, recurso_id, **atividade_id** (obrigatório para projetos com cronograma), projeto_id, semana_id, data, horas, descricao — **cada pessoa aponta as horas que fez por atividade**; projetos sem cronograma (suporte, sustentação, alocação) aceitam apontamento direto no projeto |

> **Horas previstas** = `coalesce(horas_manuais, horas_calculadas) + horas_avulsas` · **Saldo** = previstas − realizadas.
> **Capacidade líquida(semana)** = horas_semanais vigentes − feriados nacionais/locais × horas_dia − indisponibilidades aprovadas.
> **Utilização** = Σ horas previstas do recurso na semana ÷ capacidade líquida.

### C.6 Status Report, documentos e auditoria

| Tabela | Campos principais |
|---|---|
| **status_report** | id, projeto_id, periodo_inicio, periodo_fim, data_emissao, status_executivo (VERDE · AMARELO · VERMELHO), fase_atual, resumo_executivo, comentarios, publicado_em, publicado_por — após publicar fica somente leitura |
| **status_report_indicador** | status_report_id (PK), progresso_planejado (linha de base ou curva planejada), progresso_realizado, horas_previstas, horas_realizadas, forecast, atividades_atrasadas, pendencias_vencidas, riscos_problemas_abertos, change_requests — *fotografados* |
| **status_report_item** | id, status_report_id, secao (ENTREGA_CONCLUIDA · PROXIMA_ENTREGA · PROXIMO_PASSO · IMPEDIMENTO · DECISAO_NECESSARIA · PONTO_ATENCAO), descricao, responsavel, prazo, ordem |
| **status_report_marco** / **status_report_risco** | fotografia de marcos (data prevista, situação) e riscos (severidade, status) na data |
| **documento** | id, projeto_id, entidade_tipo + entidade_id (anexo a teste, item de deployment, RAID…), nome, categoria, storage_key **ou** url_externa (SharePoint), tamanho, mime, versao |
| **auditoria** | id, entidade, entidade_id, projeto_id, acao (CRIAR · ALTERAR · EXCLUIR · IMPORTAR · PUBLICAR), usuario_id, data_hora, alteracoes JSONB `{campo: [antes, depois]}` — único JSON do modelo de negócio: é log imutável |

### C.7 Importação

| Tabela | Campos principais |
|---|---|
| **import_lote** | id, tipo (CTRL003 · CTRL001), arquivo_nome, arquivo_storage_key, versao_template ("v1.9", "v5.3"), projeto_id, status (CARREGADO · VALIDADO · COM_ERROS · EFETIVADO · DESCARTADO), carregado_por/em, efetivado_por/em |
| **import_linha** | id, lote_id, aba, linha_origem, entidade_destino, dados_brutos JSONB (staging), chave_natural, acao_proposta (CRIAR · ATUALIZAR · IGNORAR), entidade_id_destino, status (OK · ALERTA · ERRO) |
| **import_mensagem** | id, linha_id, nivel, campo, mensagem |
| **import_de_para** | id, tipo (RECURSO · CLIENTE · PROJETO · CONTATO), texto_origem, entidade_id — reaproveitado entre lotes ("Dornelles" → Luiz Dornelles; "DIPIL" → Dipil) |

---

## D. Arquitetura técnica

### D.1 Stack

| Camada | Tecnologia | Por quê |
|---|---|---|
| Aplicação (front + back) | **Next.js (App Router) + TypeScript** | Um projeto, um deploy; ecossistema amplo; fácil achar quem mantenha |
| UI | **Tailwind CSS + shadcn/ui** | Visual limpo, acessível, identidade MAIS i9 aplicada por tokens de cor |
| Tabelas | **TanStack Table** | Ordenação, filtros, agrupamento por fase, edição inline com teclado |
| Gantt / calendário | **Frappe Gantt** + **FullCalendar** | Maduros e sem licença comercial |
| Gráficos | **Recharts** | Suficiente para os dashboards |
| ORM / migrações | **Prisma** | Esquema tipado e migrações versionadas no git |
| Banco | **PostgreSQL 16** | Relacional, maduro, backup simples |
| Validação | **Zod** | Mesmas regras no formulário, no servidor e na importação |
| Leitura de Excel | **ExcelJS** | Lê valores e tipos (detecta `"4h"` como texto) |
| Autenticação | **Auth.js** + Microsoft Entra ID (se houver M365) ou e-mail/senha | Ver J |
| Documentos | Abstração de storage: disco local → S3/Azure Blob; links do SharePoint desde já | Os projetos já usam Teams/SharePoint como repositório oficial (item do Pré-Projeto) |
| Testes | Vitest (motor de cálculo) + Playwright (fluxos críticos) | Rateio, capacidade e complexidade precisam de testes automatizados |

Alternativa descartada: API separada (.NET/Java) + SPA — dobra projetos e deploys para uma equipe pequena. A organização modular permite extrair uma API depois.

### D.2 Organização do código

```
/app            telas (portfolio, projetos/[id]/*, recursos, capacidade, admin)
/components     DataTable, KpiCard, StatusBadge, Gantt, WeekGrid, Heatmap…
/lib/domain     regras puras e testadas: rateio, capacidade, faixas, situação do prazo,
                complexidade, progresso, qualidade do cronograma (14 regras)
/lib/services   casos de uso transacionais (salvar atividade → recalcular → auditar)
/lib/auth       sessão e can(usuario, acao, recurso)
/lib/import     leitores CTRL-001 v1.9 e CTRL-003 v5.3, validação, conciliação
/prisma         schema, migrações, seed (fases, critérios, templates, feriados)
/docs           documentação
```

### D.3 Regras transversais
- **Recálculo síncrono e transacional:** salvar uma atividade/atribuição recalcula `atribuicao_semana` e `alocacao_semanal.horas_calculadas` dos pares projeto+recurso afetados.
- **Auditoria** por extensão do Prisma em todas as entidades de negócio.
- **Permissões** centralizadas em `can()`; MVP por módulo, preparado para escopo por projeto.

### D.4 Deploy e backup
- **Docker Compose**: `app` + `db` + volume de documentos. Local: `docker compose up`.
- **Backup**: `pg_dump` diário + cópia do volume; retenção 30 dias; restauração testada.
- **Hospedagem futura** sem mudar código: VM única, ou Azure App Service + Azure Database for PostgreSQL + Blob Storage.
- **CI** (GitHub Actions): lint, typecheck, testes e build.

### D.5 Integração Cronograma → Capacidade (requisito 11)

A própria aba "Auditoria CTRL-003" já sinaliza o problema: *"Atravessa S44–S45: definir distribuição semanal"*. Regra proposta:

1. Cada **atribuição** (atividade × recurso) tem esforço previsto e horas para concluir.
2. **Base de rateio** = Horas para Concluir (ou Esforço Previsto se não iniciada).
3. **Período** = de `max(início previsto, segunda-feira da semana atual)` até `fim previsto`.
4. Conta os **dias úteis do recurso** em cada semana do período (descontando fins de semana, feriados e indisponibilidades aprovadas).
5. Horas da semana = base × dias úteis da semana ÷ dias úteis do período; arredonda em 0,5h e ajusta a diferença na última semana.
6. Soma por projeto + recurso + semana → `alocacao_semanal.horas_calculadas`.
7. Semanas passadas não são redistribuídas: ficam com o planejado congelado e o realizado apontado.

**Exemplo real (Kover, CRON-023 "Executar Go Live", Luiz, 4h, 28/10 a 03/11):** 4 dias úteis em S44 (qua–sex = 3 dias → 2,4h ≈ 2,5h) e S45 (seg–ter = 2 dias → 1,6h ≈ 1,5h).

**Ajustes manuais em dois níveis:**
- **Por atribuição** (`atribuicao_semana.horas_ajustadas`): "concentrar 3h na S45". O sistema mostra se a soma ajustada difere da base.
- **Por semana** (`alocacao_semanal.horas_manuais`): o gestor de recursos define o valor final da célula projeto × recurso × semana. Ícone ✎ com o valor calculado ao lado e botão "voltar ao calculado".
- Recalcular **nunca apaga override**; divergência > 20% entre override e calculado é sinalizada para revisão.
- **Horas avulsas** (GP, sustentação, alocação) entram direto na alocação, sem atividade.

---

## E. Sitemap

```
Login
└─ Aplicação (navegação lateral)
   ├─ Início — Dashboard Executivo
   ├─ Portfólio
   │   ├─ Lista (tabela | cartões | Gantt do portfólio) com filtros e visões salvas
   │   └─ Novo projeto (assistente: dados → complexidade → pré-projeto → templates)
   ├─ Projeto [CLIENTE · Projeto]
   │   ├─ Visão Geral (KPIs, fases, próximos marcos, atrasos, RAID crítico, carga da equipe, qualidade do cronograma)
   │   ├─ Pré-Projeto (prontidão + complexidade/governança)
   │   ├─ Backlog
   │   ├─ Cronograma [Tabela | Gantt | Calendário]
   │   ├─ Operacional (RAID: Pendências · Decisões · Dependências · Problemas · Change Requests)
   │   ├─ Testes Internos (casos, ciclos de execução, defeitos)
   │   ├─ UAT (casos, ciclos, aceite, defeitos)
   │   ├─ Deployment (checklist, Go/No-Go, Go Live, Hypercare)
   │   ├─ Status Reports (histórico → novo → publicar/exportar)
   │   ├─ Riscos (lista + matriz P×I)
   │   ├─ Equipe (membros, alocação semanal do projeto)
   │   ├─ Documentos
   │   └─ Histórico (auditoria)
   ├─ Recursos
   │   ├─ Lista
   │   └─ Recurso [nome]
   ├─ Capacidade
   │   ├─ Mapa de carga (recurso × semana) → detalhe
   │   ├─ Planejamento semanal (projeto × recurso × semana)
   │   ├─ Indisponibilidades (calendário + aprovação)
   │   └─ Apontamento de horas
   ├─ Clientes (lista + página do cliente)
   └─ Administração
       ├─ Usuários e perfis
       ├─ Feriados
       ├─ Parâmetros (faixas, critérios de complexidade, templates de pré-projeto e deployment)
       ├─ Importação (lotes, validação, De-Para, efetivação)
       └─ Auditoria geral
```

---

## F. Wireframes

### F.1 Dashboard Executivo

```
┌────────┬──────────────────────────────────────────────────────────────────────┐
│ MAIS i9│  Início                                   Semana [S40/26 ▾]   (LC)     │
│        ├──────────────────────────────────────────────────────────────────────┤
│ Início │ ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐   │
│Portfól.│ │ Ativos  ││Vermelho ││ Amarelo ││Ativid.  ││Pendênc. ││ Riscos  │   │
│Recursos│ │   24    ││   1 ●   ││   3 ●   ││atrasadas││vencidas ││ altos   │   │
│Capacid.│ │         ││         ││         ││   6     ││   2     ││   1     │   │
│Clientes│ └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘└─────────┘   │
│        │ ┌─ Equipe · S40 ─────────────────────┐ ┌─ Projetos por status ──────┐ │
│ ────── │ │ Capacidade líquida 420h            │ │ Em andamento   ██████ 24   │ │
│ Admin  │ │ Planejado 195h (46%) · Real 0h     │ │ Aprov. cliente ▏ 0         │ │
│        │ │ ● 2 sobrecarregados  ● 7 disponív. │ │ Bloqueado      ▏ 0         │ │
│        │ │ Luiz D. 183% · Julis F. 140%  →    │ └────────────────────────────┘ │
│        │ └────────────────────────────────────┘                                │
│        │ ┌─ Próximos Go Lives e marcos (30 dias) ─────────────────────────────┐ │
│        │ │ 06/10 Kover · Integração Protheus > WMS (marco)      ● no prazo     │ │
│        │ │ 27/10 Sulmedic · Reforma Tributária · Go Live         ● no prazo    │ │
│        │ │ 03/11 Kover · Implantação WMS · Go Live               ● no prazo    │ │
│        │ └────────────────────────────────────────────────────────────────────┘ │
│        │ ┌─ Precisam de atenção ──────────────────────────────────────────────┐ │
│        │ │ Projeto           GP     Status  %   Atrasadas  Desvio  Motivo      │ │
│        │ └────────────────────────────────────────────────────────────────────┘ │
└────────┴──────────────────────────────────────────────────────────────────────┘
 Números com os dados reais de S40/26 (CTRL-003 + CTRL-001 Kover e Sulmedic).
 Cada número é um link para a lista já filtrada.
```

### F.2 Portfólio

```
 Portfólio                                       [Tabela | Cartões | Gantt]   [+ Novo]
 🔍 Buscar…  [Cliente▾][Status▾][Tipo▾][GP▾][Recurso▾][Prioridade▾][Período▾][Complex.▾]
 Visões: (Todos) (Meus) (Em atenção) (Go Live 30d) (Sem planejamento)
 ┌────────┬───────────────────┬──────────┬────────┬──────┬────┬────────┬────┬────────┬──┐
 │Cliente │Projeto            │GP        │Funcion.│Status│Nív.│Go Live │ %  │Prev/Fc │● │
 ├────────┼───────────────────┼──────────┼────────┼──────┼────┼────────┼────┼────────┼──┤
 │Kover   │Implantação WMS    │—         │Luiz D. │Andam.│ N? │03/11/26│ 1% │140/140 │🟡│
 │Sulmedic│Reforma Tributária │Laura I.  │Julis F.│Andam.│ N1 │27/10/26│ 1% │ 88/88  │⚪│
 └────────┴───────────────────┴──────────┴────────┴──────┴────┴────────┴────┴────────┴──┘
 "Sem planejamento" = projeto ativo sem cronograma e sem alocação (substitui a coluna
 "Sem Planejamento?" do CTRL-003).
```

### F.3 Projeto — cabeçalho e Visão Geral

```
 Portfólio › Kover › Implantação WMS
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ Implantação WMS   [Em andamento] [Alta] [Complexidade não avaliada] 🟡 [⋯] │
 │ Kover · GP — · Funcional Luiz Dornelles · Técnico Luiz Dornelles              │
 │ Kickoff 28/09 · Go Live 03/11 · Encerramento 06/11     █░░░░░░░░░░ 1%          │
 │ Horas: previstas 140 · realizadas 0 · forecast 140 (0h)   ⚠ 3 atrasadas        │
 └──────────────────────────────────────────────────────────────────────────────┘
 Visão Geral | Pré-Projeto | Backlog | Cronograma | Operacional | Testes Internos |
 UAT | Deployment | Status Reports | Riscos | Equipe | Documentos | Histórico
 ┌─ Fases ──────────────────────────────────────────┐ ┌─ Próximos marcos ───────┐
 │ Envisioning — │ Development ▶ 1% │ Deploy │ PD    │ │ 06/10 Protheus > WMS    │
 └──────────────────────────────────────────────────┘ │ 14/10 Abastecimento     │
 ┌─ Qualidade do cronograma (3) ────────────────────┐ │ 15/10 Apontamento prod. │
 │ ⚠ CRON-010 termina num sábado (10/10)            │ └─────────────────────────┘
 │ ⚠ CRON-023 sem distribuição semanal revisada     │ ┌─ Carga da equipe ───────┐
 └──────────────────────────────────────────────────┘ │ Luiz  S40 183% S41 135% │
                                                      └─────────────────────────┘
```

### F.4 Cronograma (tabela com edição inline)

```
 Cronograma   [Tabela | Gantt | Calendário]  Fase[▾] Recurso[▾] Situação[▾] REQ[▾]  [+ Atividade]
 ┌────────┬───────┬──────────────────────────────┬──────────────┬──────┬──────┬────┬────┬────┬────────┐
 │ID      │REQ    │Tarefa                        │Recursos      │Início│Fim   │Prev│Real│ %  │Situação│
 ├────────┴───────┴──────────────────────────────┴──────────────┴──────┴──────┴────┴────┴────┴────────┤
 │▼ DEVELOPMENT                                                              106h   0h   1%           │
 │ CRON-006│REQ-002│Concluir integração SKP > Protheus│Luiz 4h·Murilo 4h│05/10│05/10│ 8 │ 0 │ 0 │● prazo │
 │ CRON-007│REQ-002│Concluir integração Protheus>WMS ◆│Luiz 4h          │06/10│06/10│ 4 │ 0 │ 0 │● prazo │
 └──────────────────────────────────────────────────────────────────────────────────────────────────────┘
 Uma linha por tarefa; vários recursos na mesma linha (fim das linhas .2/.3).
 Painel lateral: atribuições e rateio semanal editável, predecessoras, testes ligados, histórico.
```

### F.5 Capacidade — Mapa de carga

```
 Capacidade   [S40/26 ▸ S47/26]   Área[▾]   [Só ≥ 85%]
 ┌──────────────────┬──────┬──────┬──────┬──────┬──────┬──────┐  ■ Disponível < 50%
 │Recurso           │ S40  │ S41  │ S42  │ S43  │ S44  │ S45  │  ■ Adequado 50–85%
 ├──────────────────┼──────┼──────┼──────┼──────┼──────┼──────┤  ■ Atenção 85–100%
 │Luiz Dornelles    │ 183% │ 135% │ 153% │  93% │  24% │  29% │  ■ Sobrecarregado > 100%
 │Julis Felipe      │ 140% │  35% │  60% │  50% │  35% │   0% │
 │Diego Fortunato   │  60% │  35% │  10% │  50% │   0% │   0% │
 │Laura (?) treino  │      │      │      │ ▒ 8h │      │      │
 └──────────────────┴──────┴──────┴──────┴──────┴──────┴──────┘
 Clique em "Luiz · S40" →
 ┌─ Luiz Dornelles · S40 (28/09–04/10) ─────────────────────────────────┐
 │ Capacidade 40h − indisponível 0h = 40h · Planejado 73h (183%)        │
 │ Dipil · WMS Expedição               33h  avulsa/manual               │
 │ Alltech · Implantação PCP (WMS)     20h  avulsa/manual               │
 │ Kover · Implantação WMS             14h  ← 5 atividades (calculado)  │
 │ CCP · Recebimento NF                 4h  manual                      │
 │ Sintex · Projeto Custos              2h  manual                      │
 │ [Abrir planejamento] [Ver atividades]                                │
 └──────────────────────────────────────────────────────────────────────┘
```

### F.6 Página do Recurso

```
 Luiz Dornelles · Consultor · 40h/semana                 [+ Indisponibilidade]
 ┌ Utilização 4 sem ┐┌ Planejado/Real 4 sem ┐┌ Projetos ativos ┐┌ Próx. ausência ┐
 │      141%        ││     225h / 0h        ││       5         ││      —         │
 └──────────────────┘└──────────────────────┘└─────────────────┘└────────────────┘
 Carga semanal (barras empilhadas por projeto; linha = capacidade líquida)
 S40 ████████████████████▓▓▓▓▓▒▒  73h | S41 ███████████▓▓▓▓ 54h | S42 ██████████▓▓▓ 61h
 Próximas atividades (todos os projetos) · Indisponibilidades · Histórico prev × real
```

### F.7 Status Report

```
 Status Reports                                      [+ Novo (pré-preenchido)]
 ┌──────────┬───────────────┬────────┬──────┬──────────────┐
 │Emissão   │Período        │Status  │  %   │Publicado     │
 │29/09/2026│22/09 – 28/09  │🟡      │  1%  │✔ 29/09 · GP  │
 └──────────┴───────────────┴────────┴──────┴──────────────┘
 Formulário: Status executivo · Fase atual · Resumo executivo · Entregas concluídas ·
 Próximas entregas · Impedimentos · Decisões necessárias · Pontos de atenção (do RAID) ·
 Marcos (automático) · Indicadores (automático, congelados ao publicar)
 [Salvar rascunho] [Publicar] [Exportar PDF]
```

---

## G. MVP (Release 1)

Objetivo: **substituir CTRL-001 e CTRL-003 no dia a dia**, sem voltar às planilhas.

| # | Entra no MVP |
|---|---|
| 1 | Login, 4 perfis com permissão por módulo |
| 2 | Cadastros: clientes, contatos, recursos, capacidade com vigência, feriados, usuários |
| 3 | Dashboard executivo com indicadores clicáveis |
| 4 | Portfólio com busca, ordenação, todos os filtros e Gantt do portfólio |
| 5 | Projeto: cabeçalho, Visão Geral, Equipe, Histórico |
| 6 | Pré-Projeto + Complexidade (12 critérios, nível e governança automáticos) |
| 7 | Backlog |
| 8 | **Cronograma** em tabela com edição inline, **atribuição de vários recursos**, predecessoras, marcos, cálculos, painel de qualidade (14 regras) e **Gantt** |
| 9 | **Integração cronograma → capacidade** com rateio e override (D.5) |
| 10 | Capacidade: mapa de carga semanal com detalhe, planejamento semanal editável (inclui horas avulsas), indisponibilidades com aprovação |
| 11 | Página do recurso |
| 12 | Apontamento de horas realizadas **por atividade**, feito por cada consultor ("minhas atividades da semana") |
| 13 | Operacional (RAID) com abas Riscos, Pendências e Change Requests |
| 14 | Testes Internos e UAT (casos, execuções por ciclo, defeitos ligados ao RAID) |
| 15 | Deployment (checklist por template, Go/No-Go, Go Live, Hypercare) |
| 16 | Status Reports com histórico e indicadores congelados |
| 17 | Documentos (upload + links SharePoint) |
| 18 | Auditoria automática |
| 19 | **Importação** de CTRL-003 v5.3 e CTRL-001 v1.9 com staging, De-Para e validação |
| 20 | Docker Compose + backup automatizado |

**Ordem de construção (incrementos de ~2 semanas, cada um utilizável):**
1. Fundação: banco, login, layout, cadastros, auditoria, calendário de semanas/feriados
2. Portfólio + Projeto (cabeçalho, visão geral, equipe) + **importação do CTRL-003**
3. Capacidade, planejamento semanal, indisponibilidades, página do recurso → **CTRL-003 aposentado**
4. Backlog + Cronograma (tabela, atribuições, Gantt) + motor de rateio + **importação do CTRL-001**
5. Pré-Projeto/Complexidade + Operacional/Riscos + Testes/UAT + Deployment
6. Status Report + Documentos + Dashboard executivo final + ajustes do piloto → **CTRL-001 aposentado**

> Começar pelo CTRL-003 entrega valor mais cedo: o dashboard de recursos hoje está zerado, e com os cronogramas importados no incremento 4 a sobrecarga real passa a aparecer.

---

## H. Roadmap (pós-MVP)

| Versão | Itens |
|---|---|
| **1.1** | Calendário do cronograma · exportação Excel/PDF das listas · notificações por e-mail (atraso, pendência vencida, sobrecarga, indisponibilidade a aprovar) · visões salvas |
| **1.2** | **Linha de base** do cronograma (planejado original × atual) e curva S — dá significado ao "Progresso Planejado" do Status Report · fluxo de Change Request com impacto em horas/prazo e aprovação |
| **1.3** | Permissões por projeto (GP edita os seus; consultor atualiza suas atividades e aponta horas) · templates de cronograma por tipo de projeto (ex.: Reforma Tributária, WMS) |
| **2.0** | SharePoint/OneDrive integrado · avisos no Teams · importação MS Project · custo/hora e margem · portal do cliente (UAT e status report) |
| **Futuro** | Power BI sobre o PostgreSQL · pipeline comercial (projetos identificados consumindo capacidade prevista) · app mobile para apontamento |

---

## I. Estratégia de migração

**Princípios:** não destrutiva · validar antes de efetivar · rastreável até a linha da planilha · reexecutável.

### I.1 Etapas
1. **Cadastros e De-Para** — importar os recursos (lista dos Parâmetros) e clientes; resolver no De-Para os nomes divergentes (*Dornelles, Diego, Laura Iris, GP MAIS i9, DIPIL*) e os textos de "Recurso Cliente" (empresa → `cliente_responsavel`; pessoa → contato).
2. **Carga em staging** — cada linha de cada aba vira `import_linha`; o arquivo original fica guardado no lote.
3. **Validação** — erros e alertas exibidos por linha; o usuário corrige o De-Para ou ignora a linha e revalida.
4. **Conciliação** — prévia do que será criado/atualizado pela chave natural.
5. **Efetivação** — transação única por lote, auditada (ação IMPORTAR). Reimportar o mesmo arquivo atualiza, não duplica.
6. **Paralelo** — 2 a 4 semanas com 2 projetos piloto (sugestão: Kover e Sulmedic) antes de congelar as planilhas como documento somente leitura.

### I.2 Mapeamento aba → tabela

| Origem | Destino | Tratamentos específicos |
|---|---|---|
| CTRL-003 · Parâmetros / Capacidade / Dados Projetos | recurso, recurso_capacidade, cliente | Capacidade por semana vira vigência (40h; 30h Miguel/Diego Bonilha); Adilson sem capacidade → alerta |
| CTRL-003 · Portfólio Projetos | projeto, projeto_membro (Funcional/Técnico) | Status mapeado 1:1; projetos sem datas/horas → alerta; Notas → `projeto.notas` |
| CTRL-003 · Planejamento Recursos | alocacao_semanal (`horas_manuais` ou `horas_avulsas`) | **Converter `"4h"` → 4**; `S40` + data de início → `2026-W40`; prioridade "Crítica" aceita; observação "GP \| …" → horas avulsas de gestão |
| CTRL-003 · Indisponibilidades | indisponibilidade | Status Pendente preservado; recurso inexistente → De-Para |
| CTRL-003 · Dashboard, Projeto vs Recursos, Carga, Gantt | — | Não importadas (derivadas) |
| CTRL-001 · Pré-Projeto \| Complexidade | avaliacao_complexidade, projeto_complexidade | Score 0 em todos os critérios → importar como "não avaliado", não como N1 |
| CTRL-001 · Pré-Projeto | pre_projeto, pre_projeto_item; Go Live alvo → projeto | Conflito de datas com o Portfólio → alerta para escolher |
| CTRL-001 · Backlog | backlog_item | Chave: projeto + REQ |
| CTRL-001 · Cronograma | atividade, atividade_atribuicao, atividade_predecessora | **Linhas `CRON-xxx.n` são agrupadas na atividade `CRON-xxx`** como atribuições; como o esforço era repetido, o **esforço da atividade é o da linha principal** e é dividido igualmente entre os recursos MAIS i9 (ex.: CRON-006 = 4h → Luiz 2h + Murilo 2h), com alerta para o GP ajustar; linha sem recurso MAIS i9 com esforço → alerta (provável participação do cliente); "Atividade" (`REQ-…`) → `backlog_item_id`; status "Atrasado" → EM_ANDAMENTO/NAO_INICIADO + situação calculada; data em fim de semana → alerta |
| CTRL-001 · Operacional | item_operacional | Tipo mapeado 1:1 |
| CTRL-001 · Teste Interno / UAT | caso_teste + execucao_teste (ciclo 1) | IDs duplicados → renumerar com De-Para de ID; "Requisito" que não é `REQ-…` → vira cenário, sem vínculo, com alerta; responsáveis múltiplos ("Diego / Dornelles") → principal + observação; "Defeito \| Pendência" preenchido → item_operacional tipo DEFEITO |
| CTRL-001 · Deployment | deployment + deployment_item | 12 itens; "Go/No-Go aprovado" → decisão do deployment |
| CTRL-001 · Status Report | status_report (publicado, com data da importação) | Vira o 1º registro do histórico |
| CTRL-001 · Dashboard / Auditoria / Parâmetros | — | Derivadas; resumo e pontos de atenção do Dashboard → comentários do 1º status report |

### I.3 Após a importação
- Para semanas **futuras**, o rateio automático passa a valer para projetos com cronograma; onde o CTRL-003 tinha valor manual para o mesmo projeto+recurso+semana, ele entra como **override** sinalizado para revisão do GP.
- Para os demais projetos (sem CTRL-001), o planejamento manual continua sendo a fonte.

---

## J. Decisões registradas

| # | Tema | Decisão |
|---|---|---|
| 1 | Horas realizadas | **Cada pessoa aponta as horas que fez, por atividade.** O realizado da atividade, da alocação semanal e do projeto é a soma dos apontamentos. Consultores precisam de acesso ao sistema já no MVP |
| 2 | Linhas `.2`/`.3` | **Mesmo esforço repetido.** Na importação o esforço conta uma vez e é dividido entre os recursos (ajustável). Kover: 92h reais, não 140h |
| 3 | GP | **GP padrão = Carlos Camargo** (pré-preenchido em novos projetos e na importação, editável). "Laura Iris" e "Laura Camargo" são a mesma pessoa, com papel de **analista** — "Laura Iris" vira apelido no De-Para. "GP MAIS i9" → Carlos Camargo |
| 4 | Progresso | **Média ponderada pelo esforço previsto** |
| 5 | Faixas, rateio, status | Faixas atuais avaliadas **semana a semana**; rateio por dia útil com ajuste e override (D.5); Status Executivo **manual com sugestão** do sistema |
| 6 | Login | **Microsoft 365 / Entra ID** (login com a conta corporativa) |
| 7 | Perfis | **Administrador / Gestor:** Carlos Camargo, Alexandre Camargo, Murilo Fernandes — aprovam indisponibilidades, mantêm portfólio e planejamento. **Consultor:** demais recursos — atualizam suas atividades (%, horas para concluir) e apontam horas. **Visualização:** diretoria/convidados |

### Pendentes (seguem com o padrão proposto, salvo indicação)
- **Hospedagem:** Azure (natural com Microsoft 365) — App Service + PostgreSQL gerenciado. Até lá, Docker Compose em qualquer servidor.
- **Documentos:** links para o SharePoint do projeto no MVP; upload de evidências pequenas no próprio sistema.
- **Tipos de projeto:** Projeto · Suporte · Sustentação · Alocação · Interno.
- **Entra ID:** para ativar o login corporativo é preciso registrar o aplicativo no Entra ID da MAIS i9 (Tenant ID, Client ID e Client Secret). Durante o desenvolvimento uso um login local de teste.
