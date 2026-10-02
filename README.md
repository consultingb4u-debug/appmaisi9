# MAIS i9 — Gestão de Projetos, Portfólio e Recursos

Aplicação web interna da MAIS i9 para substituir os controles em planilha
(CTRL-001 por projeto e CTRL-003 Gestão de Recursos).

- Proposta, diagnóstico das planilhas e modelo de dados: [`docs/01-proposta-arquitetura.md`](docs/01-proposta-arquitetura.md)
- Resumo técnico para a equipe de TI: [`docs/02-resumo-tecnico.md`](docs/02-resumo-tecnico.md)

## Ver funcionando

| Opção | Para quem | Dados |
|---|---|---|
| **Claude Code no seu computador** (app Claude Desktop ou `claude remote-control` numa pasta local): peça "rode o app do MAIS i9 para eu testar" | quem não quer instalar nada além do Claude | ficam no seu computador enquanto o banco existir |
| **Docker** (abaixo) | TI / quem tem Docker Desktop | persistentes no volume do Docker |
| **Homologação na nuvem** (Azure ou similar, com login Microsoft 365) | a equipe toda, por um endereço https | persistentes, com backup |

A sessão do Claude Code na nuvem (claude.ai/code) roda num container temporário sem endereço público:
lá o app é executado e testado automaticamente, mas não dá para abrir no seu navegador.

### Ver funcionando em 5 minutos (Docker)

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado.

```bash
git clone https://github.com/consultingb4u-debug/appmaisi9.git
cd appmaisi9
git checkout claude/mais-i9-project-management-3bapfx
cp .env.example .env
```

No `.env`, preencha `AUTH_SECRET` com qualquer texto longo e ponha `AUTH_DEV_LOGIN="true"`. Depois:

```bash
docker compose up -d --build
```

Abra http://localhost:3000, clique em **Entrar sem senha** (usuário `admin@maisi9.local`), vá em
**Administração → Importação** e envie o `CTRL-003_Gestao_Recursos_v5.3.xlsx`. Confira a revisão,
marque a confirmação e clique em **Efetivar**. Depois importe cada CTRL-001 escolhendo o tipo
"CTRL-001" e o projeto correspondente (ex.: Kover · Implantação WMS). Portfólio, Cronograma, Capacidade
e Recursos passam a mostrar os dados reais.

Para parar: `docker compose down` (os dados ficam guardados; `docker compose down -v` apaga tudo).

## Status

| Incremento | Conteúdo | Situação |
|---|---|---|
| 1 · Fundação | Login Microsoft 365, perfis, recursos e capacidade com vigência, clientes e contatos, feriados, semanas ISO, auditoria | ✅ |
| 2 · Portfólio | Portfólio (filtros, ordenação, linha do tempo), página do projeto, importação do CTRL-003 com revisão e De-Para, carga real por recurso | ✅ |
| 3 · Capacidade | Mapa de carga com detalhe recurso × semana, planejamento semanal editável inline, indisponibilidades com solicitação e aprovação | ✅ |
| 4 · Cronograma | Backlog, cronograma (várias pessoas por tarefa, edição inline), Gantt, rateio automático nas semanas, apontamento por atividade (Minhas horas), importação do CTRL-001 | ✅ |
| 5 · Execução | Pré-projeto e complexidade (N1–N4), registro operacional (RAID), matriz de riscos, testes internos e UAT com ciclos e defeitos, deployment com prontidão Go/No-Go e hypercare, importação das demais abas do CTRL-001 | ✅ |
| 6 · Status | Status reports com indicadores congelados e histórico, documentos (links SharePoint ou arquivos), painel executivo na tela inicial | ✅ |
| 1.1 | Exportação Excel (portfólio, capacidade, cronograma, backlog, operacional, testes, UAT), calendário mensal (geral e por projeto), alertas no app e por e-mail, visões salvas de filtros | ✅ |
| 1.2 | Linha de base do cronograma (comparação planejado original × atual), curva S (base × realizado × forecast), progresso planejado no status report, fluxo de change request com aprovação que aplica horas e prazo ao projeto | ✅ |

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma 7 + PostgreSQL 16 ·
Auth.js 5 (Microsoft Entra ID) · Zod · Vitest.

## Rodar localmente

Pré-requisitos: Node 22+ e PostgreSQL 16.

```bash
cp .env.example .env          # ajuste DATABASE_URL e AUTH_SECRET; para testar sem Microsoft 365: AUTH_DEV_LOGIN="true"
npm install                   # também gera o Prisma Client
npm run db:deploy             # aplica as migrações
npm run db:seed               # semanas, feriados nacionais, equipe e clientes do CTRL-003 (idempotente)
npm run dev                   # http://localhost:3000
```

Com `AUTH_DEV_LOGIN="true"`, o seed cria `admin@maisi9.local` (Administrador) e a tela de login
permite entrar sem senha com qualquer usuário cadastrado. **Nunca habilite isso em produção.**

### Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run lint` / `npm run typecheck` / `npm test` | verificações (as mesmas da CI) |
| `npm run db:migrate` | cria uma nova migração após alterar `prisma/schema.prisma` |
| `npm run db:deploy` | aplica migrações pendentes |
| `npm run db:seed` | dados iniciais (idempotente) |

## Importar o CTRL-003

**Administração → Importação**: envie o `.xlsx`. O sistema lê Portfólio Projetos, Planejamento Recursos,
Capacidade e Indisponibilidades e mostra uma revisão linha a linha (criar / atualizar / sem alteração,
alertas e erros). Nomes não reconhecidos vão para o **De-Para**, que fica salvo como apelido.
Nada é gravado até clicar em **Efetivar**. Reimportar o mesmo arquivo não duplica nada, e campos
vazios na planilha não apagam dados do sistema. O arquivo original fica guardado no lote.

## Importar o CTRL-001

Também em **Administração → Importação**, escolhendo o tipo CTRL-001 e o projeto. São lidas as abas
Pré-Projeto | Complexidade, Pré-Projeto, Backlog, Cronograma, Operacional, Teste Interno,
Teste Cliente | UAT, Deployment e Status Report. As abas calculadas (Dashboard, Auditoria) são
recalculadas pelo sistema. Reimportar não duplica nada: um resultado de teste diferente vira um
novo ciclo de execução, e o histórico é mantido.

## Alertas por e-mail

A tela **Alertas** mostra, para cada pessoa, atividades atrasadas, pendências vencidas, sobrecarga
(semana atual e próxima), ausências a aprovar e status reports atrasados. A rotina diária
(`POST /api/tarefas/alertas` com `Authorization: Bearer $CRON_SECRET`) manda por e-mail só os
alertas que a pessoa ainda não recebeu. O serviço `agendador` do `docker-compose.yml` chama a rotina
nos dias úteis às 7h. Configure `SMTP_*`, `APP_URL` e `CRON_SECRET` no `.env`; sem `SMTP_HOST` a
rotina só simula. Cada usuário pode desligar os e-mails na própria tela de alertas.

## Login com Microsoft 365

1. No portal do Azure → **Microsoft Entra ID → Registros de aplicativo → Novo registro**
   (contas somente deste diretório organizacional).
2. URI de redirecionamento (Web): `https://<endereço-do-app>/api/auth/callback/microsoft-entra-id`
3. Em **Certificados e segredos**, crie um segredo do cliente.
4. Preencha no `.env`: `AUTH_MICROSOFT_ENTRA_ID_ID` (ID do aplicativo), `AUTH_MICROSOFT_ENTRA_ID_SECRET`
   e `AUTH_MICROSOFT_ENTRA_ID_ISSUER=https://login.microsoftonline.com/<ID do locatário>/v2.0`.
5. Coloque o e-mail do primeiro administrador em `ADMIN_EMAILS`.

No primeiro acesso, cada pessoa entra como **Visualização**; um administrador define o perfil
(Administrador, Gestor, Consultor) e vincula ao recurso em **Administração → Usuários**. Se o
e-mail do recurso estiver cadastrado, o vínculo é automático.

## Produção (Docker Compose)

```bash
cp .env.example .env          # preencha AUTH_SECRET, Entra ID, ADMIN_EMAILS; defina POSTGRES_PASSWORD
docker compose up -d --build  # db → migrador (migrações + seed) → app na porta 3000
```

### Backup

`scripts/backup.sh` gera `backups/maisi9-AAAAMMDD-HHMM.sql.gz` e o pacote dos arquivos enviados (mantém 30 dias). Agende no cron:

```
0 2 * * * /opt/maisi9/scripts/backup.sh
```

Restauração: `gunzip -c backups/<arquivo>.sql.gz | docker compose exec -T db psql -U maisi9 -d maisi9`

## Estrutura

```
app/(app)/          telas autenticadas (início, portfólio, projetos/[id]/*, recursos, clientes, admin/*)
app/login/          tela de login
components/         UI compartilhada (ui.tsx, formulario.tsx, historico.tsx, menu)
lib/domain/         regras puras e testadas: semanas ISO, feriados, capacidade, faixas, diffs de auditoria
lib/services/       regras que acessam o banco (capacidade e carga por semana, portfólio, auditoria)
lib/importacao/     leitura de planilhas, validação pura (testada) e efetivação da importação
lib/auth/           sessão e matriz de permissões por perfil
prisma/             schema, migrações e seed
tests/              testes unitários (Vitest)
```
