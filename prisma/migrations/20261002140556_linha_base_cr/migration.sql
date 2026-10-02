-- AlterTable
ALTER TABLE "item_operacional" ADD COLUMN     "cr_aplicado_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "linha_base" (
    "id" UUID NOT NULL,
    "projeto_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "observacao" TEXT,
    "horas_vendidas" DECIMAL(8,1),
    "go_live" DATE,
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criada_por_id" UUID,

    CONSTRAINT "linha_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linha_base_item" (
    "id" UUID NOT NULL,
    "linha_base_id" UUID NOT NULL,
    "atividade_id" UUID,
    "codigo" TEXT NOT NULL,
    "fase" TEXT NOT NULL,
    "tarefa" TEXT NOT NULL,
    "inicio" DATE,
    "fim" DATE,
    "esforco" DECIMAL(8,1) NOT NULL DEFAULT 0,
    "marco" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "linha_base_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "linha_base_projeto_id_criada_em_idx" ON "linha_base"("projeto_id", "criada_em");

-- CreateIndex
CREATE UNIQUE INDEX "linha_base_item_linha_base_id_codigo_key" ON "linha_base_item"("linha_base_id", "codigo");

-- AddForeignKey
ALTER TABLE "linha_base" ADD CONSTRAINT "linha_base_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linha_base_item" ADD CONSTRAINT "linha_base_item_linha_base_id_fkey" FOREIGN KEY ("linha_base_id") REFERENCES "linha_base"("id") ON DELETE CASCADE ON UPDATE CASCADE;
