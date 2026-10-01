-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'GESTOR', 'CONSULTOR', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "TipoRecurso" AS ENUM ('INTERNO', 'TERCEIRO');

-- CreateEnum
CREATE TYPE "FuncaoContato" AS ENUM ('SPONSOR', 'GP_CLIENTE', 'KEY_USER', 'TI', 'OUTRO');

-- CreateEnum
CREATE TYPE "AbrangenciaFeriado" AS ENUM ('NACIONAL', 'ESTADUAL', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "AcaoAuditoria" AS ENUM ('CRIAR', 'ALTERAR', 'EXCLUIR', 'IMPORTAR', 'PUBLICAR');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'VISUALIZADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acesso" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurso" (
    "id" UUID NOT NULL,
    "usuario_id" UUID,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "cargo" TEXT,
    "area" TEXT,
    "tipo" "TipoRecurso" NOT NULL DEFAULT 'INTERNO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_entrada" DATE,
    "data_saida" DATE,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por_id" UUID,

    CONSTRAINT "recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurso_apelido" (
    "id" UUID NOT NULL,
    "recurso_id" UUID NOT NULL,
    "apelido" TEXT NOT NULL,

    CONSTRAINT "recurso_apelido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recurso_capacidade" (
    "id" UUID NOT NULL,
    "recurso_id" UUID NOT NULL,
    "vigencia_inicio" DATE NOT NULL,
    "vigencia_fim" DATE,
    "horas_semanais" DECIMAL(5,1) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,

    CONSTRAINT "recurso_capacidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "razao_social" TEXT,
    "segmento" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por_id" UUID,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contato_cliente" (
    "id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "funcao" "FuncaoContato" NOT NULL DEFAULT 'OUTRO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contato_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feriado" (
    "id" UUID NOT NULL,
    "data" DATE NOT NULL,
    "descricao" TEXT NOT NULL,
    "abrangencia" "AbrangenciaFeriado" NOT NULL DEFAULT 'NACIONAL',
    "uf" CHAR(2),
    "municipio" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feriado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "semana" (
    "id" TEXT NOT NULL,
    "ano_iso" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "inicio" DATE NOT NULL,
    "fim" DATE NOT NULL,

    CONSTRAINT "semana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidade_id" TEXT NOT NULL,
    "projeto_id" UUID,
    "acao" "AcaoAuditoria" NOT NULL,
    "usuario_id" UUID,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resumo" TEXT,
    "alteracoes" JSONB,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "recurso_usuario_id_key" ON "recurso"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "recurso_nome_key" ON "recurso"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "recurso_email_key" ON "recurso"("email");

-- CreateIndex
CREATE UNIQUE INDEX "recurso_apelido_apelido_key" ON "recurso_apelido"("apelido");

-- CreateIndex
CREATE INDEX "recurso_capacidade_recurso_id_vigencia_inicio_idx" ON "recurso_capacidade"("recurso_id", "vigencia_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_nome_key" ON "cliente"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "contato_cliente_cliente_id_nome_key" ON "contato_cliente"("cliente_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "feriado_data_abrangencia_descricao_key" ON "feriado"("data", "abrangencia", "descricao");

-- CreateIndex
CREATE UNIQUE INDEX "semana_inicio_key" ON "semana"("inicio");

-- CreateIndex
CREATE UNIQUE INDEX "semana_ano_iso_numero_key" ON "semana"("ano_iso", "numero");

-- CreateIndex
CREATE INDEX "auditoria_entidade_entidade_id_idx" ON "auditoria"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "auditoria_projeto_id_idx" ON "auditoria"("projeto_id");

-- CreateIndex
CREATE INDEX "auditoria_data_hora_idx" ON "auditoria"("data_hora");

-- AddForeignKey
ALTER TABLE "recurso" ADD CONSTRAINT "recurso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso_apelido" ADD CONSTRAINT "recurso_apelido_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurso_capacidade" ADD CONSTRAINT "recurso_capacidade_recurso_id_fkey" FOREIGN KEY ("recurso_id") REFERENCES "recurso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contato_cliente" ADD CONSTRAINT "contato_cliente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
