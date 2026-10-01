# MAIS i9 — Gestão de Projetos, Portfólio e Recursos

Aplicação web interna da MAIS i9 para substituir os controles em planilha
(CTRL-001 por projeto e CTRL-003 Gestão de Recursos).

- Proposta, diagnóstico das planilhas e modelo de dados: [`docs/01-proposta-arquitetura.md`](docs/01-proposta-arquitetura.md)

## Status

| Incremento | Conteúdo | Situação |
|---|---|---|
| 1 · Fundação | Login Microsoft 365, perfis, recursos e capacidade com vigência, clientes e contatos, feriados, semanas ISO, auditoria | ✅ |
| 2 · Portfólio | Portfólio (filtros, ordenação, linha do tempo), página do projeto, importação do CTRL-003 com revisão e De-Para, carga real por recurso | ✅ |
| 3 · Capacidade | Planejamento semanal editável, indisponibilidades com aprovação, mapa de carga | próximo |
| 4 · Cronograma | Backlog, cronograma, Gantt, rateio automático, importação do CTRL-001 | |
| 5 · Execução | Pré-projeto, complexidade, RAID, testes, UAT, deployment | |
| 6 · Status | Status reports, documentos, dashboard executivo | |

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
