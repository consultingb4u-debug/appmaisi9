-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('LINK', 'ARQUIVO');

-- CreateTable
CREATE TABLE "status_report" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "data_referencia" DATE NOT NULL,
    "periodo_inicio" DATE,
    "periodo_fim" DATE,
    "status_executivo" "StatusExecutivo" NOT NULL,
    "fase_atual" TEXT,
    "resumo" TEXT,
    "entregas_concluidas" TEXT,
    "proximas_entregas" TEXT,
    "pontos_atencao" TEXT,
    "decisoes_necessarias" TEXT,
    "indicadores" JSONB NOT NULL,
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "publicado_em" TIMESTAMP(3),
    "publicado_por_id" UUID,
    "import_linha_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "url" TEXT,
    "arquivo_nome" TEXT,
    "arquivo_chave" TEXT,
    "tamanho" INTEGER,
    "mime_type" TEXT,
    "observacao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "status_report_projeto_id_data_referencia_idx" ON "status_report"("projeto_id", "data_referencia");

-- CreateIndex
CREATE INDEX "documento_projeto_id_idx" ON "documento"("projeto_id");

-- AddForeignKey
ALTER TABLE "status_report" ADD CONSTRAINT "status_report_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
