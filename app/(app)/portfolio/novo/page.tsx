import { db } from "@/lib/db";
import { exigirPagina } from "@/lib/auth/sessao";
import { Cabecalho, Cartao } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { CamposProjeto } from "@/components/campos-projeto";
import { criarProjeto } from "../../projetos/acoes";

export const metadata = { title: "Novo projeto" };

export default async function NovoProjeto() {
  await exigirPagina("editar", "PORTFOLIO");
  const [clientes, recursos] = await Promise.all([
    db.cliente.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.recurso.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  const gpPadrao = recursos.find((r) => r.nome === "Carlos Camargo")?.id;
  return (
    <>
      <Cabecalho titulo="Novo projeto" trilha={[{ rotulo: "Portfólio", href: "/portfolio" }]} subtitulo="O código (PRJ-0000) é gerado automaticamente." />
      <Cartao>
        <Formulario acao={criarProjeto} rotuloEnviar="Criar projeto">
          <CamposProjeto clientes={clientes} recursos={recursos} gpPadraoId={gpPadrao} />
        </Formulario>
      </Cartao>
    </>
  );
}
