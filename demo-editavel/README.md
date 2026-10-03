# Demo editável

Versão do app que roda inteira no navegador, publicada como artefato no claude.ai, para experimentar
sem instalar nada. Usa as mesmas regras de cálculo do sistema (`lib/domain`): rateio das horas nas
semanas, capacidade líquida com feriados e ausências, situação do prazo, progresso ponderado e alertas.

- Telas: Início, Portfólio (criar/editar/excluir projeto), Projeto (cronograma com recursos e esforço,
  Gantt, Operacional, carga semanal), Capacidade (mapa, detalhe, horas avulsas), Recursos e
  indisponibilidades (aprovar/recusar), Alertas.
- Os dados ficam no banco do próprio artefato (capability `db`), uma coleção por entidade:
  `recursos`, `clientes`, `projetos`, `atividades`, `operacional`, `alocacoes`, `indisponibilidades`.
- Não tem login, importação de planilhas, e-mail, testes/UAT, deployment nem status report.

Gerar a página: `node demo-editavel/montar.mjs` → `demo-editavel/dist/index.html`.
React 18 vem do cdnjs (UMD); o CSS é Tailwind compilado e embutido.
