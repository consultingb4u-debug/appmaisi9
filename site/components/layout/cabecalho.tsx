import { Botao } from "@/components/ui";
import { Marca } from "@/components/marca";
import { ctaCabecalho } from "@/conteudo/navegacao";
import { MenuMovel, NavegacaoDesktop } from "./navegacao";

export function Cabecalho() {
  return (
    // O desfoque fica no ::before: backdrop-filter no próprio header viraria contêiner do menu móvel (position: fixed).
    <header className="sticky top-0 z-50 border-b border-ardosia-100/80 before:absolute before:inset-0 before:-z-10 before:bg-white/90 before:backdrop-blur-xl before:backdrop-saturate-150">
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
