import { usuarioAtual } from "@/lib/auth/sessao";
import { db } from "@/lib/db";
import { Abas } from "@/components/abas";
import { Cabecalho } from "@/components/ui";

export default async function LayoutCapacidade({ children }: LayoutProps<"/capacidade">) {
  await usuarioAtual();
  const pendentes = await db.indisponibilidade.count({ where: { status: "PENDENTE" } });
  return (
    <>
      <Cabecalho titulo="Capacidade" subtitulo="Capacidade líquida = capacidade semanal − feriados − ausências aprovadas · Utilização = horas planejadas ÷ capacidade líquida" />
      <Abas
        abas={[
          { href: "/capacidade", rotulo: "Mapa de carga" },
          { href: "/capacidade/planejamento", rotulo: "Planejamento semanal" },
          { href: "/capacidade/indisponibilidades", rotulo: pendentes ? `Indisponibilidades (${pendentes} pendente${pendentes > 1 ? "s" : ""})` : "Indisponibilidades" },
        ]}
      />
      {children}
    </>
  );
}
