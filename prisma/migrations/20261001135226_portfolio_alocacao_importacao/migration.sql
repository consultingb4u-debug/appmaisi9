-- CreateEnum
CREATE TYPE "TipoProjeto" AS ENUM ('PROJETO', 'SUPORTE', 'SUSTENTACAO', 'ALOCACAO', 'INTERNO');

-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('PROJETO_IDENTIFICADO', 'APROVACAO_CLIENTE', 'NAO_APROVADO', 'EM_ANDAMENTO', 'BLOQUEADO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "StatusExecutivo" AS ENUM ('VERDE', 'AMARELO', 'VERMELHO');

-- CreateEnum
CREATE TYPE "FaseProjeto" AS ENUM ('ENVISIONING', 'DEVELOPMENT', 'DEPLOYMENT', 'POST_DEPLOY');

-- CreateEnum
CREATE TYPE "PapelProjeto" AS ENUM ('GP', 'FUNCIONAL', 'TECNICO', 'DEV', 'ANALISTA', 'APOIO');

-- CreateEnum
CREATE TYPE "StatusAlocacao" AS ENUM ('PLANEJADO', 'EM_ANDAMENTO', 'BLOQUEADO', 'AGUARDANDO_CLIENTE', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoIndisponibilidade" AS ENUM ('FERIAS', 'FERIADO_LOCAL', 'AUSENCIA', 'TREINAMENTO', 'BLOQUEIO', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusIndisponibilidade" AS ENUM ('PENDENTE', 'APROVADA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "TipoImportacao" AS ENUM ('CTRL003', 'CTRL001');

-- CreateEnum
CREATE TYPE "StatusLote" AS ENUM ('CARREGADO', 'VALIDADO', 'COM_ERROS', 'EFETIVADO', 'DESCARTADO');

-- CreateEnum
CREATE TYPE "AcaoImportacao" AS ENUM ('CRIAR', 'ATUALIZAR', 'IGNORAR');

-- CreateEnum
CREATE TYPE "StatusLinha" AS ENUM ('OK', 'ALERTA', 'ERRO');

-- CreateTable
CREATE TABLE "cliente_apelido" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "apelido" TEXT NOT NULL,

    CONSTRAINT "cliente_apelido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "cliente_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoProjeto" NOT NULL DEFAULT 'PROJETO',
    "status" "StatusProjeto" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "gp_id" UUID,
    "data_kickoff" DATE,
    "data_go_live_alvo" DATE,
    "data_go_live_real" DATE,
    "data_encerramento_prevista" DATE,
    "data_encerramento_real" DATE,
    "horas_vendidas" DECIMAL(8,1),
    "notas" TEXT,
    "status_executivo" "StatusExecutivo",
    "fase_atual" "FaseProjeto",
    "arquivado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por_id" UUID,

    CONSTRAINT "projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_membro" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "recurso_id" UUID NOT NULL,
    "papel" "PapelProjeto" NOT NULL,
    "inicio" DATE,
    "fim" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projeto_membro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alocacao_semanal" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "recurso_id" UUID NOT NULL,
    "semana_id" TEXT NOT NULL,
    "horas_calculadas" DECIMAL(6,1) NOT NULL DEFAULT 0,
    "horas_manuais" DECIMAL(6,1),
    "horas_avulsas" DECIMAL(6,1) NOT NULL DEFAULT 0,
    "horas_realizadas" DECIMAL(6,1) NOT NULL DEFAULT 0,
    "status" "StatusAlocacao" NOT NULL DEFAULT 'PLANEJADO',
    "prioridade" "Prioridade",
    "observacao" TEXT,
    "import_linha_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por_id" UUID,

    CONSTRAINT "alocacao_semanal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indisponibilidade" (
    "id" UUID NOT NULL,
    "recurso_id" UUID NOT NULL,
    "tipo" "TipoIndisponibilidade" NOT NULL,
    "inicio" DATE NOT NULL,
    "fim" DATE NOT NULL,
    "horas_por_dia" DECIMAL(4,1),
    "observacao" TEXT,
    "status" "StatusIndisponibilidade" NOT NULL DEFAULT 'PENDENTE',
    "import_linha_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indisponibilidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_lote" (
    "id" UUID NOT NULL,
    "tipo" "TipoImportacao" NOT NULL,
    "arquivo_nome" TEXT NOT NULL,
    "arquivo_chave" TEXT NOT NULL,
    "status" "StatusLote" NOT NULL DEFAULT 'CARREGADO',
    "resumo" TEXT,
    "carregado_por_id" UUID,
    "carregado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "efetivado_por_id" UUID,
    "efetivado_em" TIMESTAMP(3),

    CONSTRAINT "import_lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_linha" (
    "id" UUID NOT NULL,
    "lote_id" UUID NOT NULL,
    "aba" TEXT NOT NULL,
    "linha_origem" INTEGER NOT NULL,
    "entidade" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "acao" "AcaoImportacao",
    "status" "StatusLinha",
    "entidade_id_destino" TEXT,

    CONSTRAINT "import_linha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_mensagem" (
    "id" UUID NOT NULL,
    "linha_id" UUID NOT NULL,
    "nivel" "StatusLinha" NOT NULL,
    "campo" TEXT,
    "mensagem" TEXT NOT NULL,

    CONSTRAINT "import_mensagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cliente_apelido_apelido_key" ON "cliente_apelido"("apelido");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_codigo_key" ON "projeto"("codigo");

-- CreateIndex
CREATE INDEX "projeto_status_idx" ON "projeto"("status");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_cliente_id_nome_key" ON "projeto"("cliente_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_membro_projeto_id_recurso_id_papel_key" ON "projeto_membro"("projeto_id", "recurso_id", "papel");

-- CreateIndex
CREATE INDEX "alocacao_semanal_recurso_id_semana_id_idx" ON "alocacao_semanal"("recurso_id", "semana_id");

-- CreateIndex
CREATE UNIQUE INDEX "alocacao_semanal_projeto_id_recurso_id_semana_id_key" ON "alocacao_semanal"("projeto_id", "recurso_id", "semana_id");

-- CreateIndex
CREATE INDEX "indisponibilidade_recurso_id_inicio_idx" ON "indisponibilidade"("recurso_id", "inicio");

-- CreateIndex
CREATE INDEX "import_linha_lote_id_aba_idx" ON "import_linha"("lote_id", "aba");

-- AddForeignKey
ALTER TABLE "cliente_apelido" ADD CONSTRAINT "cliente_apelido_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_gp_id_fkey" FOREIGN KEY ("gp_id") REFERENCES "recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_membro" ADD CONSTRAINT "projeto_membro_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_membro" ADD CONSTRAINT "projeto_membro_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alocacao_semanal" ADD CONSTRAINT "alocacao_semanal_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alocacao_semanal" ADD CONSTRAINT "alocacao_semanal_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alocacao_semanal" ADD CONSTRAINT "alocacao_semanal_semana_id_fkey" FOREIGN KEY ("semana_id") REFERENCES "semana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indisponibilidade" ADD CONSTRAINT "indisponibilidade_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_linha" ADD CONSTRAINT "import_linha_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "import_lote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_mensagem" ADD CONSTRAINT "import_mensagem_linha_id_fkey" FOREIGN KEY ("linha_id") REFERENCES "import_linha"("id") ON DELETE CASCADE ON UPDATE CASCADE;
