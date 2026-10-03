# MAIS i9 · Gestão de Projetos no Protheus (ADVPL)

Versão do sistema de gestão de projetos, portfólio e recursos da MAIS i9 para rodar **dentro do TOTVS Protheus**, escrita em ADVPL com telas MVC.
As regras de cálculo são as mesmas do app web (`lib/domain`): semanas ISO, feriados, rateio de horas pelos dias úteis, capacidade líquida, faixas de utilização, situação do prazo, progresso ponderado, severidade P × I e alertas.

> **Importante:** este código não foi compilado nem executado num Protheus. Foi escrito seguindo os padrões do ADVPL/MVC, as regras de cálculo foram conferidas contra os mesmos casos de teste do app web, mas a **primeira compilação e o primeiro uso devem ser feitos num ambiente de desenvolvimento ou de teste**. Ajustes pequenos (nome de consulta padrão, parâmetro de e-mail da sua versão, grupo de campos) são esperados.

## O que tem nesta pasta

```
protheus/
├── README.md               este guia
├── docs/
│   ├── dicionario.md       tabelas e campos criados (ZM1…ZMA)
│   └── menu.md             itens de menu sugeridos e perfis de acesso
└── src/                    fontes para compilar (CP-1252, CRLF)
    ├── MI9DIC.prw          compatibilizador: cria SX2, SX3, SIX, SX7, SXB, SX6 e as tabelas
    ├── MI9DOM.prw          regras de cálculo (funções puras, sem banco)
    ├── MI9CALC.prw         motor: carga, capacidade, indicadores, alertas, realizado
    ├── MI9A010.prw         Recursos + indisponibilidades (MVC) e aprovação
    ├── MI9A020.prw         Projetos + cronograma + recursos da atividade + RAID (MVC)
    ├── MI9A030.prw         Apontamento de horas (MVC)
    ├── MI9A040.prw         Alocações avulsas por semana (MVC) e feriados (U_MI9A050)
    ├── MI9R010.prw         Relatório: capacidade por recurso × semana
    ├── MI9R020.prw         Relatório: portfólio de projetos
    ├── MI9R030.prw         Relatório: alertas do dia
    ├── MI9J010.prw         Job diário: alertas por e-mail
    └── MI9TST.prw          Testes das regras (U_MI9TST)
```

## Pré-requisitos

- Protheus 12 (release 12.1.2210 ou superior recomendada), banco SQL (SQL Server, Oracle ou PostgreSQL) com TopConnect/DBAccess.
- Ambiente de compilação: VS Code com a extensão **TOTVS Developer Studio** e acesso ao AppServer de desenvolvimento.
- Cadastro de clientes (SA1) em uso: o projeto aponta para o cliente do Protheus (código + loja).
- Para e-mail: parâmetros `MV_RELSERV`, `MV_RELACNT`, `MV_RELPSW`, `MV_RELAUTH` (e `MV_RELTLS`/`MV_RELSSL` se o servidor exigir) já configurados — são os mesmos do envio de NF-e e de outros e-mails do Protheus.

## Instalação, passo a passo

1. **Conferir os nomes das tabelas.** Os fontes usam o prefixo `ZM` (ZM1 a ZM9 e ZMA). Se a sua base já usa alguma dessas tabelas, troque o prefixo em todos os fontes antes de compilar (busca e troca de `ZM` por outro prefixo livre, por exemplo `ZP`).
2. **Compilar** todos os arquivos de `src/` no RPO do ambiente de **teste** (no VS Code: botão direito na pasta › *Compilar pasta*).
3. **Rodar os testes das regras**: no SmartClient, programa inicial `U_MI9TST`, ou pelo menu *Fórmulas*. Deve aparecer `Testes MAIS i9: 61 ok, 0 falha(s)`. Isso valida as regras de cálculo antes de criar qualquer tabela.
4. **Criar o dicionário**: com backup do banco e sem usuários conectados, executar `U_MI9DIC` (menu do SIGACFG ou *Fórmulas*). O processo pode ser repetido: o que já existe é atualizado. O log fica em `\mi9dic.log` (na pasta `protheus_data`).
5. **Criar os itens de menu** no SIGACFG conforme [docs/menu.md](docs/menu.md) e dar acesso aos perfis.
6. **Cadastrar os recursos** (MI9A010): para cada pessoa, preencha o **Usuário** do Protheus (é assim que o apontamento sabe quem é quem), o e-mail, as horas semanais e marque **Gestor = Sim** para quem aprova (Carlos Camargo, Alexandre Camargo e Murilo Fernandes).
7. **Agendar os alertas**: no SIGACFG › Schedule, agendar `U_MI9J010` (dias úteis, 7h) com empresa e filial. Começa em modo de teste (`MV_MI9MAIL = .F.`: só registra no console). Depois de conferir, mude `MV_MI9MAIL` para `.T.` para enviar de verdade.
8. Repetir os passos 2 a 7 no ambiente de **produção** depois da validação.

## Como o sistema funciona no Protheus

| No app web | No Protheus |
|---|---|
| Recursos e indisponibilidades | **MI9A010** – recurso com grade de férias/ausências; botão *Aprovar indisponibilidades* (só gestores) |
| Projetos, cronograma, operacional | **MI9A020** – cabeçalho do projeto e duas abas: *Cronograma* (atividades + recursos de cada atividade) e *Operacional (RAID)* |
| Minhas horas | **MI9A030** – apontamento; o consultor só vê e lança as próprias horas |
| Alocação semanal avulsa | **MI9A040** – horas de um recurso num projeto numa semana (`2026-W40`), fora do cronograma |
| Feriados | Nacionais calculados automaticamente (inclusive Carnaval e Corpus Christi); **MI9A050** para feriados locais ou para desconsiderar um ponto facultativo |
| Capacidade (mapa de calor) | **MI9R010** – recurso × semana: horas planejadas / capacidade líquida, % e faixa |
| Portfólio | **MI9R020** – conclusão, horas, atrasos, riscos e status executivo informado × sugerido |
| Alertas e e-mail diário | **MI9R030** (consulta) e **MI9J010** (job de e-mail) |
| Indicadores do projeto | Botão *Indicadores* no MI9A020, com opção de aplicar o status executivo sugerido |

Regras que valem em todas as telas:

- **Horas realizadas** vêm só dos apontamentos (`ZM5_REALIZ` é recalculado a cada gravação, na mesma transação).
- **Carga planejada** = o que falta de cada atribuição (esforço − realizado), distribuído nos dias úteis do recurso da semana atual em diante (sem fins de semana, feriados e ausências aprovadas de dia inteiro), arredondado em 0,5 h, + alocações avulsas.
- **Capacidade líquida** = horas semanais − feriados em dia útil − ausências aprovadas.
- **Faixas**: < 50% disponível · 50–85% adequado · ≥ 85% atenção · > 100% sobrecarregado.
- **Status e %** andam juntos: concluída ⇒ 100%; 100% ⇒ concluída; % > 0 em “não iniciada” ⇒ em andamento.
- **Progresso do projeto** ponderado pelo esforço previsto; canceladas não contam.
- Atividade, atribuição ou projeto **com horas apontadas não pode ser excluído** (cancele em vez de excluir).

## O que ficou de fora desta primeira versão

O núcleo (cadastros, cronograma, apontamento, capacidade, portfólio, RAID e alertas) está aqui. Do app web, ainda **não** foram portados:

- importação das planilhas CTRL-001 e CTRL-003 (no Protheus a carga inicial pode ser feita por importação CSV/MsExecAuto — dá para fazer em seguida);
- linha de base, curva S e fluxo de aprovação de change request;
- status report, documentos, dashboard executivo gráfico;
- complexidade (N1–N4), pré-projeto, casos de teste, Go/No-Go e checklist de deployment;
- modelos de cronograma, calendário visual, visões salvas;
- permissão por projeto (no Protheus, o acesso é por menu/perfil; o apontamento já restringe o consultor às próprias horas).

## Testes

`U_MI9TST` cobre as regras puras com os mesmos casos do app web (semanas ISO, Páscoa e feriados, rateio, capacidade, faixas, situação do prazo, progresso, coerência status/%, severidade e status executivo sugerido). As telas, consultas SQL e o envio de e-mail precisam ser validados no ambiente de teste do Protheus.
