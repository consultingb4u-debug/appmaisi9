import clsx from "clsx";
import {
  ArrowLeft,
  Bell,
  ChartColumn,
  CircleCheck,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  PackageCheck,
  ScanBarcode,
  Search,
  SlidersHorizontal,
  Truck,
  Warehouse,
} from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import type { TelaReal } from "@/conteudo/wms";

/*
 * Representações ILUSTRATIVAS da interface do MAIS i9 WMS, com dados fictícios.
 * Quando as telas reais forem fornecidas (conteudo/wms.ts → telasReais), elas
 * substituem estas ilustrações automaticamente.
 */

export function MolduraNavegador({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx("overflow-hidden rounded-xl bg-white shadow-2xl shadow-navy-950/30 ring-1 ring-navy-950/10", className)}>
      <div className="flex items-center gap-3 border-b border-ardosia-100 bg-fundo px-4 py-2.5">
        <div aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-ardosia-200" />
          <span className="size-2.5 rounded-full bg-ardosia-200" />
          <span className="size-2.5 rounded-full bg-ardosia-200" />
        </div>
        <div className="mx-auto rounded-md bg-white px-3 py-1 text-[10px] font-medium text-ardosia-500 ring-1 ring-ardosia-100">{titulo}</div>
        <span aria-hidden className="w-10" />
      </div>
      {children}
    </div>
  );
}

export function MolduraCelular({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "w-[240px] shrink-0 rounded-[2.25rem] bg-navy-950 p-2 shadow-2xl shadow-navy-950/40 ring-1 ring-white/10",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[1.8rem] bg-white">
        <span aria-hidden className="absolute top-1.5 left-1/2 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-navy-950" />
        {children}
      </div>
    </div>
  );
}

export function TelaOuIlustracao({ real, children, celular = false }: { real: TelaReal | null; children: ReactNode; celular?: boolean }) {
  if (!real) return <>{children}</>;
  return (
    <Image
      src={real.src}
      alt={real.descricao}
      width={real.largura}
      height={real.altura}
      sizes={celular ? "240px" : "(min-width: 1024px) 760px, 100vw"}
      className={clsx("h-auto w-full", celular ? "rounded-[1.8rem]" : "rounded-xl")}
    />
  );
}

function Pilula({ tom, children }: { tom: "ok" | "azul" | "laranja" | "cinza"; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-semibold whitespace-nowrap",
        tom === "ok" && "bg-ok/10 text-[#167a42]",
        tom === "azul" && "bg-azul-100 text-azul-600",
        tom === "laranja" && "bg-destaque-claro text-[#8a4a0e]",
        tom === "cinza" && "bg-ardosia-100 text-ardosia-600",
      )}
    >
      {children}
    </span>
  );
}

const navWms = [
  { t: "Painel", I: LayoutDashboard },
  { t: "Recebimento", I: PackageCheck },
  { t: "Armazém", I: Warehouse },
  { t: "Expedição", I: Truck },
  { t: "Inventário", I: ClipboardList },
  { t: "Indicadores", I: ChartColumn },
  { t: "Administração", I: SlidersHorizontal },
];

function BarraLateral({ ativo }: { ativo: string }) {
  return (
    <aside className="hidden w-36 shrink-0 flex-col gap-0.5 bg-navy-950 p-3 text-[10.5px] @2xl:flex">
      <p className="mb-3 px-2 text-[11px] font-bold text-white">MAIS i9 WMS</p>
      {navWms.map(({ t, I }) => (
        <span
          key={t}
          className={clsx(
            "flex items-center gap-2 rounded-md px-2 py-1.5",
            t === ativo ? "bg-white/10 text-white" : "text-ardosia-300",
          )}
        >
          <I aria-hidden className="size-3.5" />
          {t}
        </span>
      ))}
    </aside>
  );
}

function Topo({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-[13px] font-bold text-navy-950">{titulo}</p>
        <p className="text-[10px] text-ardosia-500">{subtitulo}</p>
      </div>
      <div className="flex items-center gap-2 text-ardosia-400">
        <span className="hidden items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[10px] ring-1 ring-ardosia-100 @md:flex">
          <Search aria-hidden className="size-3" /> Buscar produto, lote ou endereço
        </span>
        <Bell aria-hidden className="size-3.5" />
        <span className="flex size-6 items-center justify-center rounded-full bg-navy-800 text-[9px] font-semibold text-white">OP</span>
      </div>
    </div>
  );
}

export function MockDashboard() {
  const barras = [38, 52, 64, 47, 72, 88, 66, 54, 70, 58];
  return (
    <div className="@container flex bg-[#f6f8fb] text-left" aria-hidden>
      <BarraLateral ativo="Painel" />
      <div className="min-w-0 flex-1 space-y-3 p-3.5 @lg:p-4">
        <Topo titulo="Painel da operação" subtitulo="Armazém principal · turno atual" />
        <div className="grid grid-cols-2 gap-2.5 @lg:grid-cols-4">
          {[
            { r: "Recebimentos em conferência", v: "6", d: "2 com divergência", I: PackageCheck },
            { r: "Tarefas de armazenagem", v: "24", d: "App Operador", I: Warehouse },
            { r: "Pedidos em separação", v: "38", d: "12 prontos p/ conferência", I: Truck },
            { r: "Ocupação do armazém", v: "72%", d: "Rua C acima de 90%", I: MapPin },
          ].map(({ r, v, d, I }) => (
            <div key={r} className="rounded-lg bg-white p-2.5 ring-1 ring-ardosia-100">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[9.5px] leading-tight text-ardosia-500">{r}</p>
                <I aria-hidden className="size-3.5 shrink-0 text-azul-500" />
              </div>
              <p className="mt-1.5 font-display text-lg font-bold text-navy-950">{v}</p>
              <p className="text-[9px] text-ardosia-400">{d}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2.5 @lg:grid-cols-5">
          <div className="rounded-lg bg-white p-3 ring-1 ring-ardosia-100 @lg:col-span-3">
            <div className="flex items-center justify-between">
              <p className="text-[10.5px] font-semibold text-navy-900">Movimentações por hora</p>
              <span className="text-[9px] text-ardosia-400">Hoje</span>
            </div>
            <div className="mt-3 flex h-16 items-end gap-1.5 @2xl:h-20">
              {barras.map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className={clsx("flex-1 rounded-t-sm", i === 5 ? "bg-destaque" : "bg-azul-500/70")}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[8.5px] text-ardosia-400">
              <span>08h</span>
              <span>12h</span>
              <span>17h</span>
            </div>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-ardosia-100 @lg:col-span-2">
            <p className="text-[10.5px] font-semibold text-navy-900">Ocupação por rua</p>
            <div className="mt-2.5 space-y-2">
              {[
                ["Rua A", 64],
                ["Rua B", 71],
                ["Rua C", 93],
                ["Rua D", 48],
              ].map(([rua, p]) => (
                <div key={rua} className="flex items-center gap-2 text-[9.5px] text-ardosia-600">
                  <span className="w-9">{rua}</span>
                  <span className="h-1.5 flex-1 rounded-full bg-ardosia-100">
                    <span
                      style={{ width: `${p}%` }}
                      className={clsx("block h-full rounded-full", Number(p) > 90 ? "bg-destaque" : "bg-azul-500")}
                    />
                  </span>
                  <span className="w-7 text-right">{p}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-lg bg-white ring-1 ring-ardosia-100">
          <p className="border-b border-ardosia-100 px-3 py-2 text-[10.5px] font-semibold text-navy-900">Expedição do dia</p>
          <table className="w-full text-[9.5px]">
            <tbody className="divide-y divide-ardosia-100 text-ardosia-600">
              {[
                ["104582", "Cliente 01", "18 itens", <Pilula key="1" tom="ok">Expedido</Pilula>],
                ["104583", "Cliente 02", "6 itens", <Pilula key="2" tom="azul">Em conferência</Pilula>],
                ["104584", "Cliente 03", "31 itens", <Pilula key="3" tom="laranja">Em separação</Pilula>],
                ["104585", "Cliente 04", "9 itens", <Pilula key="4" tom="cinza">Aguardando</Pilula>],
              ].map(([p, c, q, s]) => (
                <tr key={String(p)}>
                  <td className="px-3 py-1.5 font-semibold text-navy-900">Pedido {p}</td>
                  <td className="px-3 py-1.5">{c}</td>
                  <td className="hidden px-3 py-1.5 @md:table-cell">{q}</td>
                  <td className="px-3 py-1.5 text-right">{s}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BarraStatus() {
  return (
    <div className="flex items-center justify-between bg-navy-950 px-5 pt-3 pb-1.5 text-[9px] font-semibold text-white">
      <span>09:41</span>
      <span className="flex gap-1">
        <span className="h-2 w-3 rounded-sm bg-white/80" />
        <span className="h-2 w-4 rounded-sm bg-white/80" />
      </span>
    </div>
  );
}

export function MockAppOperador() {
  return (
    <div className="text-left" aria-hidden>
      <BarraStatus />
      <div className="bg-navy-950 px-4 pt-2 pb-4 text-white">
        <div className="flex items-center gap-2">
          <ArrowLeft className="size-4" />
          <p className="text-[13px] font-bold">Armazenagem</p>
        </div>
        <p className="mt-1 text-[10px] text-ardosia-300">Tarefa 3 de 8 · Doca 02</p>
        <div className="mt-2.5 h-1 rounded-full bg-white/15">
          <span className="block h-full w-[37%] rounded-full bg-destaque" />
        </div>
      </div>
      <div className="space-y-3 bg-[#f6f8fb] p-3.5">
        <div className="rounded-xl bg-white p-3 ring-1 ring-ardosia-100">
          <p className="text-[9.5px] text-ardosia-500">Produto</p>
          <p className="text-[12px] font-semibold text-navy-950">000482 · Item exemplo cx 12 un.</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-[9.5px]">
            <div>
              <p className="text-ardosia-500">Lote</p>
              <p className="font-semibold text-navy-900">L2611</p>
            </div>
            <div>
              <p className="text-ardosia-500">Validade</p>
              <p className="font-semibold text-navy-900">11/2027</p>
            </div>
            <div>
              <p className="text-ardosia-500">Qtd.</p>
              <p className="font-semibold text-navy-900">24 cx</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-navy-900 p-3 text-white">
          <p className="text-[9.5px] text-ardosia-300">Endereço de destino</p>
          <p className="mt-0.5 font-display text-2xl font-bold tracking-wide">A-03-02-1</p>
          <p className="text-[9.5px] text-ardosia-300">Rua A · Prédio 03 · Nível 02 · Posição 1</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-azul-500/50 bg-white px-3 py-2.5 text-[10.5px] text-ardosia-500">
          <ScanBarcode className="size-4 text-azul-500" />
          Leia a etiqueta do endereço
        </div>
        <div className="rounded-xl bg-destaque py-2.5 text-center text-[11.5px] font-bold text-navy-950">Confirmar armazenagem</div>
      </div>
    </div>
  );
}

export function MockRecebimento() {
  const itens = [
    { cod: "000482", desc: "Item exemplo cx 12 un.", esp: 24, conf: 24, lote: "L2611", val: "11/2027" },
    { cod: "000517", desc: "Item exemplo fardo 6 un.", esp: 40, conf: 40, lote: "L2598", val: "08/2027" },
    { cod: "000533", desc: "Item exemplo unidade", esp: 120, conf: 116, lote: "L2604", val: "02/2028" },
    { cod: "000561", desc: "Item exemplo cx 24 un.", esp: 18, conf: null, lote: "—", val: "—" },
  ];
  return (
    <div className="@container flex bg-[#f6f8fb] text-left" aria-hidden>
      <BarraLateral ativo="Recebimento" />
      <div className="min-w-0 flex-1 space-y-3 p-3.5 @lg:p-4">
        <Topo titulo="Conferência de recebimento" subtitulo="Documento de entrada 000123 · Fornecedor exemplo" />
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-ardosia-100">
          <div className="min-w-32 flex-1">
            <div className="flex justify-between text-[9.5px] text-ardosia-500">
              <span>Itens conferidos</span>
              <span className="font-semibold text-navy-900">3 de 4</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-ardosia-100">
              <span className="block h-full w-3/4 rounded-full bg-azul-500" />
            </div>
          </div>
          <Pilula tom="laranja">1 divergência</Pilula>
          <Pilula tom="azul">Integrado ao ERP</Pilula>
        </div>
        <div className="overflow-hidden rounded-lg bg-white ring-1 ring-ardosia-100">
          <table className="w-full text-[9.5px]">
            <thead className="bg-fundo text-left text-ardosia-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Produto</th>
                <th className="px-2 py-2 text-right font-semibold">Esperado</th>
                <th className="px-2 py-2 text-right font-semibold">Conferido</th>
                <th className="hidden px-2 py-2 font-semibold @md:table-cell">Lote</th>
                <th className="hidden px-2 py-2 font-semibold @lg:table-cell">Validade</th>
                <th className="px-3 py-2 text-right font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ardosia-100 text-ardosia-600">
              {itens.map((it) => (
                <tr key={it.cod}>
                  <td className="px-3 py-2">
                    <p className="font-semibold text-navy-900">{it.cod}</p>
                    <p className="hidden text-[9px] text-ardosia-400 @md:block">{it.desc}</p>
                  </td>
                  <td className="px-2 py-2 text-right">{it.esp}</td>
                  <td className="px-2 py-2 text-right font-semibold text-navy-900">{it.conf ?? "—"}</td>
                  <td className="hidden px-2 py-2 @md:table-cell">{it.lote}</td>
                  <td className="hidden px-2 py-2 @lg:table-cell">{it.val}</td>
                  <td className="px-3 py-2 text-right">
                    {it.conf === null ? (
                      <Pilula tom="cinza">Pendente</Pilula>
                    ) : it.conf === it.esp ? (
                      <Pilula tom="ok">Conferido</Pilula>
                    ) : (
                      <Pilula tom="laranja">Divergente</Pilula>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 text-[10px] font-semibold">
          <span className="rounded-md bg-white px-3 py-1.5 text-navy-900 ring-1 ring-ardosia-200">Registrar divergência</span>
          <span className="rounded-md bg-navy-900 px-3 py-1.5 text-white">Finalizar conferência</span>
        </div>
      </div>
    </div>
  );
}

export function MockIndicadores() {
  const serie = [42, 48, 45, 57, 61, 55, 68, 72, 66, 74, 79, 76];
  const max = 90;
  const pontos = serie.map((v, i) => `${(i / (serie.length - 1)) * 100},${100 - (v / max) * 100}`).join(" ");
  return (
    <div className="@container flex bg-[#f6f8fb] text-left" aria-hidden>
      <BarraLateral ativo="Indicadores" />
      <div className="min-w-0 flex-1 space-y-3 p-3.5 @lg:p-4">
        <Topo titulo="Indicadores gerenciais" subtitulo="Últimas 12 semanas · armazém principal" />
        <div className="grid grid-cols-2 gap-2.5 @lg:grid-cols-4">
          {[
            ["Pedidos expedidos", "4.812", "no período"],
            ["Itens recebidos", "12.640", "no período"],
            ["Inventários concluídos", "18", "contagens por endereço"],
            ["Lotes a vencer (90 dias)", "27", "acompanhar giro"],
          ].map(([r, v, d]) => (
            <div key={r} className="rounded-lg bg-white p-2.5 ring-1 ring-ardosia-100">
              <p className="text-[9.5px] leading-tight text-ardosia-500">{r}</p>
              <p className="mt-1.5 font-display text-lg font-bold text-navy-950">{v}</p>
              <p className="text-[9px] text-ardosia-400">{d}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2.5 @lg:grid-cols-5">
          <div className="rounded-lg bg-white p-3 ring-1 ring-ardosia-100 @lg:col-span-3">
            <p className="text-[10.5px] font-semibold text-navy-900">Pedidos expedidos por semana</p>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="mt-3 h-24 w-full overflow-visible">
              {[25, 50, 75].map((y) => (
                <line key={y} x1={0} x2={100} y1={y} y2={y} stroke="#e3e9f0" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
              ))}
              <polyline points={`0,100 ${pontos} 100,100`} fill="#2b7bbf" fillOpacity={0.08} stroke="none" />
              <polyline points={pontos} fill="none" stroke="#2b7bbf" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="rounded-lg bg-white p-3 ring-1 ring-ardosia-100 @lg:col-span-2">
            <p className="text-[10.5px] font-semibold text-navy-900">Tarefas por etapa</p>
            <div className="mt-3 space-y-2">
              {[
                ["Recebimento", 28],
                ["Armazenagem", 34],
                ["Separação", 24],
                ["Expedição", 14],
              ].map(([e, p]) => (
                <div key={e} className="text-[9.5px] text-ardosia-600">
                  <div className="flex justify-between">
                    <span>{e}</span>
                    <span>{p}%</span>
                  </div>
                  <span className="mt-1 block h-1.5 rounded-full bg-ardosia-100">
                    <span style={{ width: `${Number(p) * 2.5}%` }} className="block h-full rounded-full bg-navy-700" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MockAppMotorista() {
  const entregas = [
    { c: "Cliente 01", e: "Centro · 2 vol.", s: "Entregue" },
    { c: "Cliente 02", e: "Distrito ind. · 5 vol.", s: "Entregue" },
    { c: "Cliente 03", e: "Zona norte · 3 vol.", s: "Em rota" },
    { c: "Cliente 04", e: "Zona norte · 1 vol.", s: "Pendente" },
  ];
  return (
    <div className="text-left" aria-hidden>
      <BarraStatus />
      <div className="bg-navy-950 px-4 pt-2 pb-4 text-white">
        <p className="text-[13px] font-bold">Viagem 0142</p>
        <p className="mt-1 text-[10px] text-ardosia-300">6 entregas · 2 concluídas</p>
      </div>
      <div className="space-y-2 bg-[#f6f8fb] p-3.5">
        {entregas.map((x, i) => (
          <div key={x.c} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 ring-1 ring-ardosia-100">
            <span
              className={clsx(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-[9.5px] font-bold",
                x.s === "Entregue" ? "bg-ok/15 text-[#167a42]" : x.s === "Em rota" ? "bg-destaque text-navy-950" : "bg-ardosia-100 text-ardosia-600",
              )}
            >
              {x.s === "Entregue" ? <CircleCheck className="size-3.5" /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-navy-950">{x.c}</p>
              <p className="truncate text-[9.5px] text-ardosia-500">{x.e}</p>
            </div>
            <Pilula tom={x.s === "Entregue" ? "ok" : x.s === "Em rota" ? "laranja" : "cinza"}>{x.s}</Pilula>
          </div>
        ))}
        <div className="rounded-xl bg-destaque py-2.5 text-center text-[11.5px] font-bold text-navy-950">Registrar entrega</div>
      </div>
    </div>
  );
}
