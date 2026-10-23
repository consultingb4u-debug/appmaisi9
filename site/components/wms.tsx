import clsx from "clsx";
import { ArrowRight, Check } from "lucide-react";
import { Abas } from "@/components/abas";
import {
  MockAppMotorista,
  MockAppOperador,
  MockDashboard,
  MockIndicadores,
  MockRecebimento,
  MolduraCelular,
  MolduraNavegador,
  TelaOuIlustracao,
} from "@/components/visuais/mockups";
import { baseOperacional, etapasFluxo, telasReais, type ChaveTela } from "@/conteudo/wms";

/** Legenda das telas exibidas: reais (dados de demonstração), ilustrativas ou as duas. */
export function NotaIlustracao({ telas, claro = false }: { telas: ChaveTela[]; claro?: boolean }) {
  const reais = telas.filter((t) => telasReais[t]).length;
  const texto =
    reais === telas.length
      ? "Telas do MAIS i9 WMS com dados de demonstração."
      : reais === 0
        ? "Representação ilustrativa da interface do MAIS i9 WMS, com dados fictícios."
        : "Telas do MAIS i9 WMS e representações ilustrativas da interface, com dados de demonstração.";
  return <p className={clsx("text-xs", claro ? "text-ardosia-400" : "text-ardosia-500")}>{texto}</p>;
}

/** Composição do topo da página do WMS: painel web + App Operador. */
export function VitrineHero() {
  return (
    <div className="relative sm:pr-24 sm:pb-16 lg:pr-20">
      <MolduraNavegador titulo="MAIS i9 WMS · Dashboard">
        <TelaOuIlustracao real={telasReais.dashboard}>
          <MockDashboard />
        </TelaOuIlustracao>
      </MolduraNavegador>
      <div className="absolute right-0 bottom-0 hidden origin-bottom-right scale-[0.72] sm:block">
        <MolduraCelular>
          <TelaOuIlustracao real={telasReais.appOperador} celular>
            <MockAppOperador />
          </TelaOuIlustracao>
        </MolduraCelular>
      </div>
    </div>
  );
}

const visoes = [
  {
    id: "dashboard",
    rotulo: "Dashboard web",
    titulo: "Lotes e validades sob controle",
    texto: "Lotes aptos, críticos e em alerta, vencimentos por faixa de dias e a estratégia FIFO/FEFO acompanhados em um painel único.",
    itens: ["Lotes críticos e em alerta em destaque", "Vencimentos por faixa de dias", "Distribuição por estratégia FIFO/FEFO"],
    tela: (
      <MolduraNavegador titulo="MAIS i9 WMS · Dashboard">
        <TelaOuIlustracao real={telasReais.dashboard}>
          <MockDashboard />
        </TelaOuIlustracao>
      </MolduraNavegador>
    ),
  },
  {
    id: "app-operador",
    rotulo: "App Operador",
    titulo: "Tarefas executadas no ponto da operação",
    texto: "O operador recebe a tarefa, confirma produto, lote e endereço com a leitura de códigos e registra a execução na hora.",
    itens: ["Smartphones Android e coletores compatíveis", "Confirmação por leitura de códigos", "Menos papel e menos digitação"],
    tela: (
      <div className="flex justify-center rounded-2xl bg-navy-950 py-10">
        <MolduraCelular>
          <TelaOuIlustracao real={telasReais.appOperador} celular>
            <MockAppOperador />
          </TelaOuIlustracao>
        </MolduraCelular>
      </div>
    ),
  },
  {
    id: "operacional",
    rotulo: "Telas operacionais",
    titulo: "Conferência com controle de cada item",
    texto: "Na conferência de recebimento, o esperado é comparado ao conferido, com registro de lote, validade e divergências.",
    itens: ["Documentos fiscais e XML vindos do ERP", "Lote e validade registrados na entrada", "Divergências identificadas antes da armazenagem"],
    tela: (
      <MolduraNavegador titulo="MAIS i9 WMS · Conferência de recebimento">
        <TelaOuIlustracao real={telasReais.operacional}>
          <MockRecebimento />
        </TelaOuIlustracao>
      </MolduraNavegador>
    ),
  },
  {
    id: "indicadores",
    rotulo: "Indicadores gerenciais",
    titulo: "Informação para a gestão decidir",
    texto: "Volumes, evolução e distribuição das tarefas por etapa para acompanhar a operação logística ao longo do tempo.",
    itens: ["Evolução de recebimentos e expedições", "Acompanhamento de lotes e validades", "Visão consolidada para a gestão"],
    tela: (
      <MolduraNavegador titulo="MAIS i9 WMS · Indicadores">
        <TelaOuIlustracao real={telasReais.indicadores}>
          <MockIndicadores />
        </TelaOuIlustracao>
      </MolduraNavegador>
    ),
  },
];

/** Seção "Visão do produto": abas com dashboard, app, telas operacionais e indicadores. */
export function VisaoProduto() {
  return (
    <Abas
      rotuloLista="Telas do MAIS i9 WMS"
      classeLista="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0"
      classeAba="shrink-0 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap"
      classeAbaAtiva="bg-navy-900 text-white"
      classeAbaInativa="bg-white text-ardosia-700 ring-1 ring-ardosia-200 hover:ring-navy-700"
      classePainel="mt-10 outline-none"
      abas={visoes.map((v) => ({
        id: v.id,
        rotulo: v.rotulo,
        conteudo: (
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <h3 className="text-2xl font-bold text-navy-950">{v.titulo}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-ardosia-600">{v.texto}</p>
              <ul className="mt-6 space-y-3">
                {v.itens.map((i) => (
                  <li key={i} className="flex gap-3 text-[15px] text-ardosia-700">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-600" strokeWidth={2.5} />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-8">{v.tela}</div>
          </div>
        ),
      }))}
    />
  );
}

/** Fluxo ERP → Recebimento → Armazenagem → Movimentação → Expedição. */
export function FluxoOperacao() {
  return (
    <ol className="grid gap-4 md:grid-cols-5 md:gap-0">
      {etapasFluxo.map(({ titulo, texto, icone: Icone }, i) => (
        <li key={titulo} className="revelar relative flex gap-4 md:flex-col md:items-center md:px-3 md:text-center">
          {i < etapasFluxo.length - 1 && (
            <>
              <span aria-hidden className="absolute top-14 bottom-[-1rem] left-7 w-px bg-ardosia-200 md:hidden" />
              <span aria-hidden className="absolute top-7 left-[calc(50%+2.25rem)] hidden h-px w-[calc(100%-4.5rem)] bg-ardosia-300 md:block" />
              <ArrowRight aria-hidden className="absolute top-[1.2rem] -right-2 hidden size-4 text-ardosia-400 md:block" />
            </>
          )}
          <span
            className={clsx(
              "relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl",
              i === 0 ? "bg-navy-900 text-white" : "bg-white text-azul-600 ring-1 ring-ardosia-200",
            )}
          >
            <Icone aria-hidden className="size-6" strokeWidth={1.75} />
          </span>
          <div className="pb-4 md:pb-0">
            <p className="mt-0.5 text-[11px] font-semibold tracking-wider text-ardosia-500 uppercase md:mt-5">
              {i === 0 ? "Sistema de gestão" : `Etapa ${i}`}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-navy-950">{titulo}</h3>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ardosia-600">{texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Base operacional: sete componentes em cards interativos. */
export function BaseOperacional() {
  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <Abas
        rotuloLista="Componentes da base operacional"
        orientacao="vertical"
        classeLista="flex flex-col gap-2 lg:col-span-5"
        classeAba="flex w-full items-center gap-4 rounded-xl border p-4"
        classeAbaAtiva="border-navy-900 bg-navy-900 text-white shadow-lg shadow-navy-950/15"
        classeAbaInativa="border-ardosia-200 bg-white text-navy-950 hover:border-navy-700"
        classePainel="outline-none lg:col-span-7"
        abas={baseOperacional.map((m, i) => ({
          id: m.id,
          rotulo: (
            <>
              <span className="font-display text-sm font-bold opacity-50">{String(i + 1).padStart(2, "0")}</span>
              <m.icone aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
              <span className="flex-1 text-[15px] font-semibold">{m.titulo}</span>
              <ArrowRight aria-hidden className="size-4 opacity-40" />
            </>
          ),
          conteudo: (
            <div className="grade-tecnica-clara h-full rounded-3xl border border-ardosia-200 bg-fundo p-8 sm:p-10">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
                <m.icone aria-hidden className="size-7" strokeWidth={1.75} />
              </span>
              <h3 className="mt-6 text-2xl font-bold text-navy-950">{m.titulo}</h3>
              <p className="mt-3 text-lg leading-relaxed text-ardosia-600">{m.resumo}</p>
              <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                {m.itens.map((item) => (
                  <li key={item} className="flex gap-3 rounded-xl bg-white p-4 text-[14.5px] leading-snug text-ardosia-700 ring-1 ring-ardosia-100">
                    <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-azul-600" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-7 flex gap-3 border-t border-ardosia-200 pt-6 text-[15px] font-medium text-navy-900">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-[1px] bg-destaque" />
                {m.beneficio}
              </p>
            </div>
          ),
        }))}
      />
    </div>
  );
}

export function Aplicativos() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[
        {
          rotulo: "Base operacional",
          titulo: "App Operador",
          texto: "Para a equipe do armazém executar recebimento, armazenagem, movimentações e expedição com mobilidade, confirmando cada etapa no ponto da operação.",
          tela: <MockAppOperador />,
          real: telasReais.appOperadorConsulta ?? telasReais.appOperador,
        },
        {
          rotulo: "Módulo Gestão de Entregas e Viagens",
          titulo: "App Motorista",
          texto: "Para o motorista acompanhar as entregas da viagem e registrar cada entrega, levando a rastreabilidade para além do armazém.",
          tela: <MockAppMotorista />,
          real: telasReais.appMotorista,
        },
      ].map((app) => (
        <article
          key={app.titulo}
          className="revelar grade-tecnica relative flex flex-col overflow-hidden rounded-3xl bg-navy-950 p-8 text-white sm:flex-row sm:items-end sm:gap-8 sm:p-10"
        >
          <div className="sm:flex-1 sm:self-center">
            <p className="text-xs font-semibold tracking-[0.14em] text-azul-300 uppercase">{app.rotulo}</p>
            <h3 className="mt-3 text-2xl font-bold">{app.titulo}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-ardosia-200">{app.texto}</p>
          </div>
          <MolduraCelular className="mx-auto mt-10 scale-90 sm:mt-0 sm:mb-[-4rem] sm:scale-100">
            <TelaOuIlustracao real={app.real} celular>
              {app.tela}
            </TelaOuIlustracao>
          </MolduraCelular>
        </article>
      ))}
    </div>
  );
}
