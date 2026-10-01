-- CreateEnum
CREATE TYPE "DimensaoComplexidade" AS ENUM ('ESFORCO', 'PRAZO', 'COMPLEXIDADE', 'RISCO');

-- CreateEnum
CREATE TYPE "NivelComplexidade" AS ENUM ('N1', 'N2', 'N3', 'N4');

-- CreateEnum
CREATE TYPE "StatusPreProjeto" AS ENUM ('EM_PREPARACAO', 'PRONTO', 'PRONTO_COM_RESSALVAS', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "StatusChecklist" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'BLOQUEADO', 'NA');

-- CreateEnum
CREATE TYPE "TipoItemOperacional" AS ENUM ('PENDENCIA', 'DECISAO', 'DEPENDENCIA', 'PROBLEMA', 'RISCO', 'CHANGE_REQUEST', 'DEFEITO');

-- CreateEnum
CREATE TYPE "StatusOperacional" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO', 'BLOQUEADO', 'APROVADO', 'REPROVADO', 'FECHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "NivelImpacto" AS ENUM ('NAO', 'BAIXO', 'MEDIO', 'ALTO');

-- CreateEnum
CREATE TYPE "TipoTeste" AS ENUM ('INTERNO', 'UAT');

-- CreateEnum
CREATE TYPE "ResultadoTeste" AS ENUM ('PLANEJADO', 'NAO_EXECUTADO', 'APROVADO', 'REPROVADO', 'BLOQUEADO', 'NA');

-- CreateEnum
CREATE TYPE "DecisaoGoNoGo" AS ENUM ('PENDENTE', 'GO', 'NO_GO', 'GO_COM_RESSALVAS');

-- CreateEnum
CREATE TYPE "Obrigatoriedade" AS ENUM ('SIM', 'NAO', 'CONDICIONAL');

-- CreateTable
CREATE TABLE "criterio_complexidade" (
    "id" UUID NOT NULL,
    "dimensao" "DimensaoComplexidade" NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao_0" TEXT NOT NULL,
    "descricao_1" TEXT NOT NULL,
    "descricao_2" TEXT NOT NULL,
    "descricao_3" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "criterio_complexidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_complexidade" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "criterio_id" UUID NOT NULL,
    "nota" INTEGER,
    "gatilho_critico" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,

    CONSTRAINT "projeto_complexidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao_complexidade" (
    "projeto_id" UUID NOT NULL,
    "avaliador" TEXT,
    "data" DATE,
    "horas_estimadas" DECIMAL(8,1),
    "score" INTEGER NOT NULL DEFAULT 0,
    "gatilhos" INTEGER NOT NULL DEFAULT 0,
    "nivel_final" "NivelComplexidade",
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por_id" UUID,

    CONSTRAINT "avaliacao_complexidade_pkey" PRIMARY KEY ("projeto_id")
);

-- CreateTable
CREATE TABLE "pre_projeto" (
    "projeto_id" UUID NOT NULL,
    "status" "StatusPreProjeto" NOT NULL DEFAULT 'EM_PREPARACAO',
    "observacao" TEXT,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_projeto_pkey" PRIMARY KEY ("projeto_id")
);

-- CreateTable
CREATE TABLE "pre_projeto_item" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "categoria" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "responsavel" TEXT,
    "informacao_contato" TEXT,
    "validacao_esperada" TEXT,
    "status" "StatusChecklist" NOT NULL DEFAULT 'PENDENTE',
    "prazo" DATE,
    "observacao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pre_projeto_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_operacional" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoItemOperacional" NOT NULL,
    "descricao" TEXT NOT NULL,
    "origem_causa" TEXT,
    "impacto_consequencia" TEXT,
    "responsavel_id" UUID,
    "responsavel_texto" TEXT,
    "data_abertura" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prazo" DATE,
    "status" "StatusOperacional" NOT NULL DEFAULT 'ABERTO',
    "impacto_escopo" "NivelImpacto" NOT NULL DEFAULT 'NAO',
    "impacto_prazo" "NivelImpacto" NOT NULL DEFAULT 'NAO',
    "impacto_horas" "NivelImpacto" NOT NULL DEFAULT 'NAO',
    "acao_resposta" TEXT,
    "decisao_aprovador" TEXT,
    "evidencia" TEXT,
    "probabilidade" INTEGER,
    "impacto" INTEGER,
    "horas_cr" DECIMAL(7,1),
    "dias_cr" INTEGER,
    "atividade_id" UUID,
    "backlog_item_id" UUID,
    "execucao_teste_id" UUID,
    "data_fechamento" DATE,
    "import_linha_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por_id" UUID,

    CONSTRAINT "item_operacional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caso_teste" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "tipo" "TipoTeste" NOT NULL,
    "codigo" TEXT NOT NULL,
    "backlog_item_id" UUID,
    "modulo_processo" TEXT,
    "cenario" TEXT NOT NULL,
    "pre_condicao" TEXT,
    "passos" TEXT,
    "resultado_esperado" TEXT,
    "responsavel_id" UUID,
    "responsavel_texto" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "import_linha_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "caso_teste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucao_teste" (
    "id" UUID NOT NULL,
    "caso_id" UUID NOT NULL,
    "ciclo" INTEGER NOT NULL DEFAULT 1,
    "data" DATE,
    "executor" TEXT,
    "resultado_obtido" TEXT,
    "resultado" "ResultadoTeste" NOT NULL DEFAULT 'PLANEJADO',
    "validacao" "Validacao" NOT NULL DEFAULT 'PENDENTE',
    "evidencia" TEXT,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,

    CONSTRAINT "execucao_teste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "janela_inicio" DATE,
    "janela_fim" DATE,
    "data_go_live_real" DATE,
    "decisao" "DecisaoGoNoGo" NOT NULL DEFAULT 'PENDENTE',
    "data_decisao" DATE,
    "aprovadores" TEXT,
    "justificativa" TEXT,
    "hypercare_inicio" DATE,
    "hypercare_fim" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deployment_item" (
    "id" UUID NOT NULL,
    "deployment_id" UUID NOT NULL,
    "categoria" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "obrigatorio" "Obrigatoriedade" NOT NULL DEFAULT 'SIM',
    "status" "StatusChecklist" NOT NULL DEFAULT 'PENDENTE',
    "responsavel_id" UUID,
    "responsavel_texto" TEXT,
    "data_prevista" DATE,
    "data_real" DATE,
    "evidencia" TEXT,
    "risco_observacao" TEXT,
    "aprovacao" "Validacao" NOT NULL DEFAULT 'PENDENTE',
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "deployment_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "criterio_complexidade_nome_key" ON "criterio_complexidade"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_complexidade_projeto_id_criterio_id_key" ON "projeto_complexidade"("projeto_id", "criterio_id");

-- CreateIndex
CREATE UNIQUE INDEX "pre_projeto_item_projeto_id_item_key" ON "pre_projeto_item"("projeto_id", "item");

-- CreateIndex
CREATE UNIQUE INDEX "item_operacional_execucao_teste_id_key" ON "item_operacional"("execucao_teste_id");

-- CreateIndex
CREATE INDEX "item_operacional_projeto_id_tipo_status_idx" ON "item_operacional"("projeto_id", "tipo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "item_operacional_projeto_id_codigo_key" ON "item_operacional"("projeto_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "caso_teste_projeto_id_tipo_codigo_key" ON "caso_teste"("projeto_id", "tipo", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "execucao_teste_caso_id_ciclo_key" ON "execucao_teste"("caso_id", "ciclo");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_projeto_id_nome_key" ON "deployment"("projeto_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "deployment_item_deployment_id_item_key" ON "deployment_item"("deployment_id", "item");

-- AddForeignKey
ALTER TABLE "projeto_complexidade" ADD CONSTRAINT "projeto_complexidade_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_complexidade" ADD CONSTRAINT "projeto_complexidade_criterio_id_fkey" FOREIGN KEY ("criterio_id") REFERENCES "criterio_complexidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao_complexidade" ADD CONSTRAINT "avaliacao_complexidade_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_projeto" ADD CONSTRAINT "pre_projeto_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_projeto_item" ADD CONSTRAINT "pre_projeto_item_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_operacional" ADD CONSTRAINT "item_operacional_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_operacional" ADD CONSTRAINT "item_operacional_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_operacional" ADD CONSTRAINT "item_operacional_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_operacional" ADD CONSTRAINT "item_operacional_backlog_item_id_fkey" FOREIGN KEY ("backlog_item_id") REFERENCES "backlog_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_operacional" ADD CONSTRAINT "item_operacional_execucao_teste_id_fkey" FOREIGN KEY ("execucao_teste_id") REFERENCES "execucao_teste"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso_teste" ADD CONSTRAINT "caso_teste_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso_teste" ADD CONSTRAINT "caso_teste_backlog_item_id_fkey" FOREIGN KEY ("backlog_item_id") REFERENCES "backlog_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso_teste" ADD CONSTRAINT "caso_teste_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucao_teste" ADD CONSTRAINT "execucao_teste_caso_id_fkey" FOREIGN KEY ("caso_id") REFERENCES "caso_teste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_item" ADD CONSTRAINT "deployment_item_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deployment_item" ADD CONSTRAINT "deployment_item_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "recurso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
