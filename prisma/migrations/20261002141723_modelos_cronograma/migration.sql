-- CreateTable
CREATE TABLE "modelo_cronograma" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "backlog" JSONB NOT NULL DEFAULT '[]',
    "origem_projeto_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,

    CONSTRAINT "modelo_cronograma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelo_cronograma_item" (
    "id" UUID NOT NULL,
    "modelo_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "fase" "FaseProjeto" NOT NULL,
    "tarefa" TEXT NOT NULL,
    "modulo_processo" TEXT,
    "backlog_codigo" TEXT,
    "inicio_dia" INTEGER,
    "duracao_dias" INTEGER,
    "atribuicoes" JSONB NOT NULL DEFAULT '[]',
    "marco" BOOLEAN NOT NULL DEFAULT false,
    "cliente_participa" BOOLEAN NOT NULL DEFAULT false,
    "predecessoras" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "modelo_cronograma_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modelo_cronograma_nome_key" ON "modelo_cronograma"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "modelo_cronograma_item_modelo_id_codigo_key" ON "modelo_cronograma_item"("modelo_id", "codigo");

-- AddForeignKey
ALTER TABLE "modelo_cronograma_item" ADD CONSTRAINT "modelo_cronograma_item_modelo_id_fkey" FOREIGN KEY ("modelo_id") REFERENCES "modelo_cronograma"("id") ON DELETE CASCADE ON UPDATE CASCADE;
