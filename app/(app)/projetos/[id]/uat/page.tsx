import { PaginaTestes } from "@/components/pagina-testes";

export default async function Uat({ params, searchParams }: PageProps<"/projetos/[id]/uat">) {
  const { id } = await params;
  return <PaginaTestes projetoId={id} tipo="UAT" sp={await searchParams} />;
}
