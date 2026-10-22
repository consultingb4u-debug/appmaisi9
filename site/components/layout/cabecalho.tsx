import { Botao } from "@/components/ui";
import { Marca } from "@/components/marca";
import { ctaCabecalho } from "@/conteudo/navegacao";
import { MenuMovel, NavegacaoDesktop } from "./navegacao";

export function Cabecalho() {
  return (
    // Fundo sólido, sem backdrop-filter: o filtro criaria um contêiner para o menu móvel (position: fixed).
    <header className="sticky top-0 z-50 border-b border-ardosia-100 bg-white">
      <div className="container-site flex h-[72px] items-center justify-between gap-6">
        <Marca altura={46} />
        <NavegacaoDesktop />
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <Botao href={ctaCabecalho.href} seta>
              {ctaCabecalho.rotulo}
            </Botao>
          </div>
          <MenuMovel />
        </div>
      </div>
    </header>
  );
}
