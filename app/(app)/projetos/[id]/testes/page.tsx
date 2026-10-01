import { PaginaTestes } from "@/components/pagina-testes";

export default async function TestesInternos({ params, searchParams }: PageProps<"/projetos/[id]/testes">) {
  const { id } = await params;
  return <PaginaTestes projetoId={id} tipo="INTERNO" sp={await searchParams} />;
}
