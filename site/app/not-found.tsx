import { Botao, LinkSeta, Sobretitulo } from "@/components/ui";

export default function NaoEncontrada() {
  return (
    <section className="grade-tecnica-clara">
      <div className="container-site flex min-h-[60vh] flex-col items-start justify-center py-24">
        <Sobretitulo>Erro 404</Sobretitulo>
        <h1 className="mt-5 text-4xl font-bold text-navy-950 sm:text-5xl">Página não encontrada</h1>
        <p className="mt-4 max-w-xl text-lg text-ardosia-600">
          O endereço pode ter mudado ou não existir mais. Veja por onde continuar:
        </p>
        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Botao href="/" variante="escuro" seta>
            Ir para o início
          </Botao>
          <LinkSeta href="/consultoria-protheus">Consultoria Protheus</LinkSeta>
          <LinkSeta href="/mais-i9-wms">MAIS i9 WMS</LinkSeta>
          <LinkSeta href="/contato">Contato</LinkSeta>
        </div>
      </div>
    </section>
  );
}
