-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "notificar_email" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "notificacao_enviada" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "chave" TEXT NOT NULL,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacao_enviada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visao_salva" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tela" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "parametros" TEXT NOT NULL,
    "compartilhada" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visao_salva_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notificacao_enviada_usuario_id_chave_key" ON "notificacao_enviada"("usuario_id", "chave");

-- CreateIndex
CREATE UNIQUE INDEX "visao_salva_usuario_id_tela_nome_key" ON "visao_salva"("usuario_id", "tela", "nome");

-- AddForeignKey
ALTER TABLE "notificacao_enviada" ADD CONSTRAINT "notificacao_enviada_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visao_salva" ADD CONSTRAINT "visao_salva_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
