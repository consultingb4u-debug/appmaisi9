import { Building2, Clock, Headset, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { FormularioContato } from "@/components/formularios/formularios";
import { HeroPagina } from "@/components/secoes";
import { CabecalhoSecao, JsonLd, LinkSeta, Pendente, Secao } from "@/components/ui";
import { empresa, linkWhatsapp } from "@/conteudo/empresa";
import { trilha } from "@/lib/jsonld";
import { metadadosPagina } from "@/lib/site";

export const metadata = metadadosPagina({
  titulo: "Contato",
  descricao:
    "Fale com a MAIS i9: consultoria TOTVS Protheus, diagnóstico do ambiente ERP, demonstração do MAIS i9 WMS e propostas comerciais.",
  caminho: "/contato",
});

const caminhoTrilha = [
  { nome: "Início", caminho: "/" },
  { nome: "Contato", caminho: "/contato" },
];

function Linha({ icone, rotulo, children }: { icone: ReactNode; rotulo: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 py-4">
      <span aria-hidden className="mt-0.5 text-azul-600">
        {icone}
      </span>
      <div className="min-w-0">
        <dt className="text-sm text-ardosia-500">{rotulo}</dt>
        <dd className="mt-0.5 font-medium break-words text-navy-950">{children}</dd>
      </div>
    </div>
  );
}

export default function Contato() {
  const whatsapp = linkWhatsapp("Olá! Vim pelo site da MAIS i9 e gostaria de falar com a equipe comercial.");
  return (
    <>
      <JsonLd dados={trilha(caminhoTrilha)} />
      <HeroPagina
        trilha={caminhoTrilha}
        sobretitulo="Contato"
        titulo="Fale com a MAIS i9."
        descricao="Conte o que você precisa. Sua mensagem é direcionada ao especialista da frente certa — Consultoria Protheus ou MAIS i9 WMS."
      />

      <Secao>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <CabecalhoSecao sobretitulo="Formulário comercial" titulo="Envie sua mensagem" />
            <div className="mt-8 rounded-3xl border border-ardosia-200 bg-white p-6 shadow-xl shadow-navy-950/5 sm:p-10">
              <FormularioContato />
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-ardosia-200 p-6">
                <p className="text-xs font-semibold tracking-[0.14em] text-azul-600 uppercase">Consultoria Protheus</p>
                <p className="mt-2 text-[15px] text-ardosia-600">Sustentação, suporte, projetos, desenvolvimento e diagnóstico.</p>
                <LinkSeta href="/consultoria-protheus#formulario" className="mt-4">
                  Falar com um especialista Protheus
                </LinkSeta>
              </div>
              <div className="rounded-2xl border border-ardosia-200 p-6">
                <p className="text-xs font-semibold tracking-[0.14em] text-azul-600 uppercase">MAIS i9 WMS</p>
                <p className="mt-2 text-[15px] text-ardosia-600">Conheça a plataforma aplicada à sua operação logística.</p>
                <LinkSeta href="/mais-i9-wms#demonstracao" className="mt-4">
                  Agendar demonstração
                </LinkSeta>
              </div>
            </div>

            <div className="rounded-2xl bg-fundo p-6 sm:p-7">
              <h2 className="text-lg font-semibold text-navy-950">Informações institucionais</h2>
              <dl className="mt-2 divide-y divide-ardosia-200">
                <Linha icone={<Mail className="size-5" />} rotulo="E-mail comercial">
                  {empresa.emailComercial ? (
                    <a href={`mailto:${empresa.emailComercial}`} className="hover:text-azul-600">
                      {empresa.emailComercial}
                    </a>
                  ) : (
                    <Pendente>e-mail comercial</Pendente>
                  )}
                </Linha>
                <Linha icone={<Phone className="size-5" />} rotulo="Telefone comercial">
                  {empresa.telefoneComercial ? (
                    <a href={`tel:${empresa.telefoneComercial.replace(/[^\d+]/g, "")}`} className="hover:text-azul-600">
                      {empresa.telefoneComercial}
                    </a>
                  ) : (
                    <Pendente>telefone comercial</Pendente>
                  )}
                </Linha>
                {empresa.emailChamados && (
                  <Linha icone={<Headset className="size-5" />} rotulo="Clientes: abertura de chamados">
                    <a href={`mailto:${empresa.emailChamados}`} className="hover:text-azul-600">
                      {empresa.emailChamados}
                    </a>
                  </Linha>
                )}
                <Linha icone={<Clock className="size-5" />} rotulo="Horário de atendimento">
                  {empresa.horarioAtendimento ?? <Pendente>horário de atendimento</Pendente>}
                </Linha>
                <Linha icone={<MapPin className="size-5" />} rotulo="Endereço">
                  {empresa.endereco ?? <Pendente>endereço</Pendente>}
                </Linha>
                <Linha icone={<Building2 className="size-5" />} rotulo="Razão social e CNPJ">
                  {empresa.razaoSocial ?? <Pendente>razão social</Pendente>} ·{" "}
                  {empresa.cnpj ? `CNPJ ${empresa.cnpj}` : <Pendente>CNPJ</Pendente>}
                </Linha>
              </dl>
              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[#1f7a4d] px-5 py-3 font-semibold text-white hover:bg-[#186640]"
                >
                  <MessageCircle aria-hidden className="size-5" />
                  Conversar pelo WhatsApp
                </a>
              ) : (
                <p className="mt-4 text-sm text-ardosia-500">
                  O botão de WhatsApp aparece aqui quando o número oficial for informado.
                </p>
              )}
            </div>
          </aside>
        </div>
      </Secao>
    </>
  );
}
