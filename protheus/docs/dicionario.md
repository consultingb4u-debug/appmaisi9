# Dicionário de dados (gerado pelo U_MI9DIC)

Todas as tabelas são compartilhadas (X2_MODO = C) e têm o campo `_FILIAL`. Campos virtuais (V) não existem no banco: são calculados na tela.


## ZM1 — Recursos

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM1_COD | C | 6 | Código | Código do recurso |  |
| ZM1_NOME | C | 40 | Nome | Nome do recurso |  |
| ZM1_CARGO | C | 30 | Cargo | Cargo ou função |  |
| ZM1_AREA | C | 30 | Área | Área ou equipe |  |
| ZM1_HSEM | N | 5,1 | Horas/semana | Horas trabalhadas/semana |  |
| ZM1_ATIVO | C | 1 | Ativo | Recurso ativo | 1=Sim; 2=Não |
| ZM1_GESTOR | C | 1 | Gestor | Aprova e recebe alertas | 1=Sim; 2=Não |
| ZM1_USER | C | 6 | Usuário | Usuário do Protheus |  |
| ZM1_EMAIL | C | 80 | E-mail | E-mail para alertas |  |

## ZM2 — Indisponibilidades

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM2_RECURS | C | 6 | Recurso | Código do recurso |  |
| ZM2_ITEM | C | 3 | Item | Item |  |
| ZM2_TIPO | C | 1 | Tipo | Tipo de indisponibilidade | 1=Férias; 2=Feriado local; 3=Ausência; 4=Treinamento; 5=Bloqueio; 6=Outros |
| ZM2_INICIO | D | 8 | Início | Primeiro dia |  |
| ZM2_FIM | D | 8 | Fim | Último dia |  |
| ZM2_HRDIA | N | 4,1 | Horas/dia | Horas/dia (0 = dia todo) |  |
| ZM2_STATUS | C | 1 | Situação | Situação da solicitação | 1=Pendente; 2=Aprovada; 3=Recusada |
| ZM2_OBS | C | 100 | Observação | Observação |  |

## ZM3 — Projetos

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM3_COD | C | 6 | Código | Código do projeto |  |
| ZM3_NOME | C | 60 | Projeto | Nome do projeto |  |
| ZM3_CLIENT | C | A1_COD | Cliente | Código do cliente |  |
| ZM3_LOJA | C | A1_LOJA | Loja | Loja do cliente |  |
| ZM3_NOMCLI | C | 20 | Nome cliente | Nome reduzido do cliente |  |
| ZM3_GP | C | 6 | GP | Gerente do projeto |  |
| ZM3_NOMGP | C | 40 | Nome do GP | Nome do GP |  |
| ZM3_TIPO | C | 1 | Tipo | Tipo do projeto | 1=Projeto; 2=Suporte; 3=Sustentação; 4=Alocação; 5=Interno |
| ZM3_STATUS | C | 1 | Status | Status do projeto |  |
| ZM3_PRIOR | C | 1 | Prioridade | Prioridade do projeto | 1=Baixa; 2=Média; 3=Alta; 4=Crítica |
| ZM3_STAEXE | C | 1 | Status exec. | Status executivo (farol) | 1=Verde; 2=Amarelo; 3=Vermelho |
| ZM3_KICKOF | D | 8 | Kickoff | Data do kickoff |  |
| ZM3_GOLIVE | D | 8 | Go-live | Data prevista do go-live |  |
| ZM3_HRVEND | N | 8,1 | Horas vend. | Horas vendidas |  |
| ZM3_NOTAS | M | 10 | Notas | Notas do projeto |  |

## ZM4 — Atividades do cronograma

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM4_PROJET | C | 6 | Projeto | Código do projeto |  |
| ZM4_ITEM | C | 4 | Item | Item do cronograma |  |
| ZM4_FASE | C | 1 | Fase | Fase do projeto | 1=Envisioning; 2=Development; 3=Deployment; 4=Post-deploy |
| ZM4_TAREFA | C | 100 | Tarefa | Descrição da atividade |  |
| ZM4_INICIO | D | 8 | Início | Início previsto |  |
| ZM4_FIM | D | 8 | Fim | Fim previsto |  |
| ZM4_STATUS | C | 1 | Status | Status da atividade | 1=Não iniciado; 2=Em andamento; 3=Bloqueado; 4=Concluído; 5=Cancelado |
| ZM4_PERC | N | 3 | % concluído | Percentual concluído |  |
| ZM4_MARCO | C | 1 | Marco | Atividade é marco | 1=Sim; 2=Não |
| ZM4_CLIPAR | C | 1 | Cliente part | Cliente participa | 1=Sim; 2=Não |

## ZM5 — Atribuições (recursos da atividade)

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM5_PROJET | C | 6 | Projeto | Código do projeto |  |
| ZM5_ATIVID | C | 4 | Atividade | Item da atividade |  |
| ZM5_RECURS | C | 6 | Recurso | Código do recurso |  |
| ZM5_NOMREC | C | 40 | Nome | Nome do recurso |  |
| ZM5_ESFORC | N | 7,1 | Esforço (h) | Horas previstas |  |
| ZM5_REALIZ | N | 7,1 | Realizado | Horas apontadas |  |

## ZM6 — Apontamentos de horas

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM6_ID | C | 8 | Número | Número do apontamento |  |
| ZM6_RECURS | C | 6 | Recurso | Código do recurso |  |
| ZM6_NOMREC | C | 40 | Nome | Nome do recurso |  |
| ZM6_DATA | D | 8 | Data | Data do trabalho |  |
| ZM6_PROJET | C | 6 | Projeto | Código do projeto |  |
| ZM6_ATIVID | C | 4 | Atividade | Item da atividade |  |
| ZM6_TAREFA | C | 60 | Tarefa | Descrição da atividade |  |
| ZM6_HORAS | N | 5,1 | Horas | Horas trabalhadas |  |
| ZM6_DESCR | C | 120 | Descrição | O que foi feito |  |

## ZM7 — Alocações avulsas por semana

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM7_ID | C | 8 | Número | Número da alocação |  |
| ZM7_PROJET | C | 6 | Projeto | Código do projeto |  |
| ZM7_RECURS | C | 6 | Recurso | Código do recurso |  |
| ZM7_SEMANA | C | 8 | Semana | Semana ISO (2026-W40) |  |
| ZM7_HORAS | N | 6,1 | Horas | Horas avulsas na semana |  |
| ZM7_OBS | C | 100 | Observação | Motivo da alocação |  |

## ZM8 — Itens operacionais (RAID)

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM8_PROJET | C | 6 | Projeto | Código do projeto |  |
| ZM8_ITEM | C | 4 | Item | Item |  |
| ZM8_TIPO | C | 1 | Tipo | Tipo do item |  |
| ZM8_DESCR | C | 200 | Descrição | Descrição do item |  |
| ZM8_RESP | C | 6 | Responsável | Recurso responsável |  |
| ZM8_RESPTX | C | 40 | Resp. client | Responsável no cliente |  |
| ZM8_ABERT | D | 8 | Abertura | Data de abertura |  |
| ZM8_PRAZO | D | 8 | Prazo | Prazo de solução |  |
| ZM8_STATUS | C | 1 | Status | Status do item |  |
| ZM8_PROB | N | 1 | Probabilid. | Probabilidade (1 a 5) |  |
| ZM8_IMPACT | N | 1 | Impacto | Impacto (1 a 5) |  |
| ZM8_HRCR | N | 7,1 | Horas CR | Horas do change request |  |
| ZM8_DIACR | N | 4 | Dias CR | Dias úteis do CR no prazo |  |

## ZM9 — Feriados adicionais e desconsiderados

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZM9_DATA | D | 8 | Data | Data do feriado |  |
| ZM9_DESCR | C | 60 | Descrição | Descrição |  |
| ZM9_TIPO | C | 1 | Tipo | Adicionar/desconsiderar | 1=Adicionar feriado; 2=Desconsiderar nacional |

## ZMA — Alertas já avisados por e-mail

| Campo | Tipo | Tam. | Título | Descrição | Opções |
|---|---|---|---|---|---|
| ZMA_DEST | C | 6 | Destinatár. | Recurso avisado |  |
| ZMA_CHAVE | C | 80 | Chave | Chave estável do alerta |  |
| ZMA_DATA | D | 8 | Data | Data do aviso |  |
