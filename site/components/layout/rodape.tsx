import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { Marca } from "@/components/marca";
import { Botao, LinkDestino, Pendente } from "@/components/ui";
import { avisoMarcas, ctaWhatsapp, empresa, linkWhatsapp } from "@/conteudo/empresa";
import { rodape } from "@/conteudo/navegacao";

export function Rodape() {
  const whatsapp = linkWhatsapp("Olá! Vim pelo site da MAIS i9.");
  const ano = new Date().getFullYear();

  return (
    <footer className="grade-tecnica bg-navy-950 text-ardosia-200">
      <div className="container-site pt-16 pb-10 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Marca fundo="escuro" altura={40} />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-ardosia-300">
              Tecnologia, consultoria e soluções para gestão empresarial: consultoria especializada em TOTVS Protheus e o
              MAIS i9 WMS, solução própria para gestão de armazéns.
            </p>
            <Botao href={ctaWhatsapp("geral")} seta className="mt-7">
              Falar com um especialista
            </Botao>
          </div>

          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            {rodape.map((grupo) => (
              <div key={grupo.titulo}>
                <h2 className="text-sm font-semibold text-white">{grupo.titulo}</h2>
                <ul className="mt-4 space-y-3">
                  {grupo.itens.map((item) => (
                    <li key={item.href}>
                      <LinkDestino href={item.href} className="text-sm text-ardosia-300 transition-colors hover:text-white">
                        {item.rotulo}
                      </LinkDestino>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold text-white">Contato comercial</h2>
            <ul className="mt-4 space-y-3.5 text-sm">
              <li className="flex gap-3">
                <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-300" />
                {empresa.emailComercial ? (
                  <a href={`mailto:${empresa.emailComercial}`} className="hover:text-white">
                    {empresa.emailComercial}
                  </a>
                ) : (
                  <Pendente claro>e-mail comercial</Pendente>
                )}
              </li>
              <li className="flex gap-3">
                <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-300" />
                {empresa.telefoneComercial ? (
                  <a href={`tel:${empresa.telefoneComercial.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                    {empresa.telefoneComercial}
                  </a>
                ) : (
                  <Pendente claro>telefone comercial</Pendente>
                )}
              </li>
              <li className="flex gap-3">
                <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-300" />
                {empresa.endereco ?? empresa.sede ?? <Pendente claro>endereço</Pendente>}
              </li>
              {whatsapp && (
                <li className="flex gap-3">
                  <MessageCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-300" />
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    WhatsApp comercial
                  </a>
                </li>
              )}
            </ul>
            {empresa.linkedin && (
              <a
                href={empresa.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block text-sm font-medium text-white hover:text-azul-300"
              >
                MAIS i9 no LinkedIn
              </a>
            )}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8 text-xs leading-relaxed text-ardosia-400">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {ano} {empresa.razaoSocial ?? empresa.nome}
              {empresa.cnpj ? ` · CNPJ ${empresa.cnpj}` : ""}. Todos os direitos reservados.
            </p>
            <Link href="/politica-de-privacidade" className="text-ardosia-300 hover:text-white">
              Política de Privacidade
            </Link>
          </div>
          <p className="mt-4 max-w-4xl">{avisoMarcas}</p>
        </div>
      </div>
    </footer>
  );
}
