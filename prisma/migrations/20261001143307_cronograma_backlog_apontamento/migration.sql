-- CreateEnum
CREATE TYPE "TipoBacklog" AS ENUM ('ENTREGA', 'REQUISITO', 'MELHORIA', 'INTEGRACAO', 'RELATORIO', 'CUSTOMIZACAO');

-- CreateEnum
CREATE TYPE "AderenciaPadrao" AS ENUM ('ADERENTE', 'PARCIAL', 'GAP', 'A_VALIDAR');

-- CreateEnum
CREATE TYPE "SimNaoAConfirmar" AS ENUM ('SIM', 'NAO', 'A_CONFIRMAR');

-- CreateEnum
CREATE TYPE "StatusItem" AS ENUM ('NAO_INICIADO', 'EM_ANDAMENTO', 'BLOQUEADO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Validacao" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO', 'NA');

-- AlterTable
ALTER TABLE "import_lote" ADD COLUMN     "projeto_id" UUID;

-- CreateTable
CREATE TABLE "backlog_item" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "modulo_processo" TEXT,
    "requisito" TEXT NOT NULL,
    "tipo" "TipoBacklog" NOT NULL DEFAULT 'ENTREGA',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "aderencia_padrao" "AderenciaPadrao" NOT NULL DEFAULT 'A_VALIDAR',
    "solucao_proposta" TEXT,
    "customizacao" "SimNaoAConfirmar" NOT NULL DEFAULT 'A_CONFIRMAR',
    "criterio_aceite" TEXT,
    "estimativa_horas" DECIMAL(7,1),
    "responsavel_id" UUID,
    "status" "StatusItem" NOT NULL DEFAULT 'NAO_INICIADO',
    "validacao_cliente" "Validacao" NOT NULL DEFAULT 'PENDENTE',
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "import_linha_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por_id" UUID,

    CONSTRAINT "backlog_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividade" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "fase" "FaseProjeto" NOT NULL,
    "backlog_item_id" UUID,
    "tarefa" TEXT NOT NULL,
    "modulo_processo" TEXT,
    "responsavel_id" UUID,
    "contato_cliente_id" UUID,
    "cliente_participa" BOOLEAN NOT NULL DEFAULT false,
    "inicio_previsto" DATE,
    "fim_previsto" DATE,
    "percentual_conclusao" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusItem" NOT NULL DEFAULT 'NAO_INICIADO',
    "marco" BOOLEAN NOT NULL DEFAULT false,
    "data_real_conclusao" DATE,
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "import_linha_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por_id" UUID,

    CONSTRAINT "atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividade_atribuicao" (
    "id" UUID NOT NULL,
    "atividade_id" UUID NOT NULL,
    "recurso_id" UUID NOT NULL,
    "esforco_previsto" DECIMAL(7,1) NOT NULL DEFAULT 0,
    "horas_para_concluir" DECIMAL(7,1),

    CONSTRAINT "atividade_atribuicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atribuicao_semana" (
    "atribuicao_id" UUID NOT NULL,
    "semana_id" TEXT NOT NULL,
    "horas_calculadas" DECIMAL(6,1) NOT NULL,

    CONSTRAINT "atribuicao_semana_pkey" PRIMARY KEY ("atribuicao_id","semana_id")
);

-- CreateTable
CREATE TABLE "atividade_predecessora" (
    "atividade_id" UUID NOT NULL,
    "predecessora_id" UUID NOT NULL,

    CONSTRAINT "atividade_predecessora_pkey" PRIMARY KEY ("atividade_id","predecessora_id")
);

-- CreateTable
CREATE TABLE "apontamento" (
    "id" UUID NOT NULL,
    "recurso_id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "atividade_id" UUID,
    "semana_id" TEXT NOT NULL,
    "horas" DECIMAL(5,1) NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apontamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "backlog_item_projeto_id_codigo_key" ON "backlog_item"("projeto_id", "codigo");

-- CreateIndex
CREATE INDEX "atividade_projeto_id_fase_idx" ON "atividade"("projeto_id", "fase");

-- CreateIndex
CREATE UNIQUE INDEX "atividade_projeto_id_codigo_key" ON "atividade"("projeto_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "atividade_atribuicao_atividade_id_recurso_id_key" ON "atividade_atribuicao"("atividade_id", "recurso_id");

-- CreateIndex
CREATE INDEX "apontamento_recurso_id_semana_id_idx" ON "apontamento"("recurso_id", "semana_id");

-- CreateIndex
CREATE INDEX "apontamento_atividade_id_idx" ON "apontamento"("atividade_id");

-- CreateIndex
CREATE INDEX "apontamento_projeto_id_recurso_id_semana_id_idx" ON "apontamento"("projeto_id", "recurso_id", "semana_id");

-- AddForeignKey
ALTER TABLE "backlog_item" ADD CONSTRAINT "backlog_item_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backlog_item" ADD CONSTRAINT "backlog_item_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_backlog_item_id_fkey" FOREIGN KEY ("backlog_item_id") REFERENCES "backlog_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_contato_cliente_id_fkey" FOREIGN KEY ("contato_cliente_id") REFERENCES "contato_cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_atribuicao" ADD CONSTRAINT "atividade_atribuicao_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_atribuicao" ADD CONSTRAINT "atividade_atribuicao_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atribuicao_semana" ADD CONSTRAINT "atribuicao_semana_atribuicao_id_fkey" FOREIGN KEY ("atribuicao_id") REFERENCES "atividade_atribuicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atribuicao_semana" ADD CONSTRAINT "atribuicao_semana_semana_id_fkey" FOREIGN KEY ("semana_id") REFERENCES "semana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_predecessora" ADD CONSTRAINT "atividade_predecessora_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_predecessora" ADD CONSTRAINT "atividade_predecessora_predecessora_id_fkey" FOREIGN KEY ("predecessora_id") REFERENCES "atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apontamento" ADD CONSTRAINT "apontamento_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apontamento" ADD CONSTRAINT "apontamento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apontamento" ADD CONSTRAINT "apontamento_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apontamento" ADD CONSTRAINT "apontamento_semana_id_fkey" FOREIGN KEY ("semana_id") REFERENCES "semana"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
