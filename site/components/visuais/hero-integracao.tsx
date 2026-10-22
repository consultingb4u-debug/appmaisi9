import { ArrowLeftRight, CircleCheck, CodeXml, Database, Headset, Layers, LifeBuoy, ScanBarcode, Warehouse } from "lucide-react";

const COR = {
  card: "#0f2a4a",
  cardClaro: "#17365d",
  borda: "rgba(255,255,255,0.12)",
  texto: "#ffffff",
  suave: "#aab8c8",
  apagado: "#8395ab",
  azul: "#2b7bbf",
  azulClaro: "#8dbbe6",
  destaque: "#f28c28",
  ok: "#3fbf7f",
};

function Cartao({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={14} fill={COR.card} stroke={COR.borda} />;
}

function CabecalhoCartao({ x, y, rotulo, titulo, Icone }: { x: number; y: number; rotulo: string; titulo: string; Icone: typeof Database }) {
  return (
    <g>
      <rect x={x} y={y} width={34} height={34} rx={9} fill={COR.cardClaro} />
      <Icone x={x + 8} y={y + 8} width={18} height={18} color={COR.azulClaro} strokeWidth={1.75} />
      <text x={x + 46} y={y + 13} fontSize={9.5} fill={COR.apagado} letterSpacing={1.2}>
        {rotulo}
      </text>
      <text x={x + 46} y={y + 30} fontSize={14} fontWeight={700} fill={COR.texto}>
        {titulo}
      </text>
    </g>
  );
}

// Mapa do armazém: posições ocupadas, livres e a posição da tarefa atual.
const mapa = ["xx.xxx", "x.xx.x", "xxx.x!", ".xx.xx"];

/** Composição do topo da Home: ERP + consultoria, integração e o WMS na operação física. Ilustrativa. */
export function HeroIntegracao() {
  return (
    <svg
      viewBox="0 0 600 480"
      role="img"
      aria-label="Ilustração: o ERP TOTVS Protheus, apoiado pela consultoria MAIS i9, integrado ao MAIS i9 WMS, que conduz recebimento, armazenagem e expedição no armazém."
      className="h-auto w-full"
    >
      {/* Conexões */}
      <path d="M232 128 C 262 128, 252 196, 272 196" fill="none" stroke={COR.azul} strokeWidth={1.5} strokeDasharray="4 4" className="animate-fluxo" />
      <path d="M332 196 C 352 196, 342 128, 362 128" fill="none" stroke={COR.azul} strokeWidth={1.5} strokeDasharray="4 4" className="animate-fluxo" />
      <path d="M126 228 L 126 262" stroke={COR.borda} strokeWidth={1.5} strokeDasharray="3 4" />

      {/* ERP */}
      <Cartao x={22} y={48} w={210} h={180} />
      <CabecalhoCartao x={38} y={62} rotulo="ERP" titulo="TOTVS Protheus" Icone={Database} />
      {["Compras", "Estoque", "Faturamento", "Financeiro"].map((m, i) => (
        <g key={m}>
          <text x={38} y={130 + i * 22} fontSize={11.5} fill={COR.suave}>
            {m}
          </text>
          <rect x={136} y={124 + i * 22} width={80} height={5} rx={2.5} fill="rgba(255,255,255,0.08)" />
          <rect x={136} y={124 + i * 22} width={[62, 74, 48, 56][i]} height={5} rx={2.5} fill={COR.azul} opacity={0.75} />
        </g>
      ))}
      <line x1={38} x2={216} y1={204} y2={204} stroke={COR.borda} />
      <circle cx={43} cy={216} r={3.5} fill={COR.ok} />
      <text x={53} y={220} fontSize={10.5} fill={COR.suave}>
        Ambiente estável e sustentado
      </text>

      {/* Consultoria */}
      <Cartao x={22} y={262} w={210} h={168} />
      <CabecalhoCartao x={38} y={276} rotulo="CONSULTORIA" titulo="MAIS i9 Protheus" Icone={Headset} />
      {[
        { t: "Sustentação contínua", I: LifeBuoy },
        { t: "Projetos e evolução", I: Layers },
        { t: "Customizações ADVPL/TLPP", I: CodeXml },
      ].map(({ t, I }, i) => (
        <g key={t}>
          <rect x={38} y={326 + i * 32} width={178} height={24} rx={6} fill="rgba(255,255,255,0.04)" />
          <I x={46} y={331 + i * 32} width={14} height={14} color={COR.azulClaro} strokeWidth={1.75} />
          <text x={68} y={342 + i * 32} fontSize={11} fill={COR.suave}>
            {t}
          </text>
        </g>
      ))}

      {/* Integração */}
      <circle cx={302} cy={196} r={42} fill="none" stroke={COR.azul} strokeOpacity={0.35} className="animate-pulso" />
      <circle cx={302} cy={196} r={30} fill={COR.cardClaro} stroke={COR.azul} strokeWidth={1.5} />
      <ArrowLeftRight x={290} y={184} width={24} height={24} color={COR.texto} strokeWidth={1.75} />
      <text x={302} y={258} fontSize={10.5} fill={COR.suave} textAnchor="middle" letterSpacing={0.6}>
        Integração
      </text>

      {/* WMS */}
      <Cartao x={362} y={28} w={218} h={300} />
      <CabecalhoCartao x={378} y={42} rotulo="PRODUTO SAAS" titulo="MAIS i9 WMS" Icone={Warehouse} />
      <text x={378} y={104} fontSize={9.5} fill={COR.apagado} letterSpacing={1.2}>
        MAPA DO ARMAZÉM
      </text>
      {mapa.flatMap((linha, r) =>
        [...linha].map((c, k) => (
          <rect
            key={`${r}-${k}`}
            x={378 + k * 31}
            y={114 + r * 23}
            width={27}
            height={18}
            rx={3}
            fill={c === "!" ? COR.destaque : c === "x" ? COR.azul : "rgba(255,255,255,0.06)"}
            fillOpacity={c === "x" ? 0.45 : 1}
            className={c === "!" ? "animate-pulso" : undefined}
          />
        )),
      )}
      {[
        { t: "Recebimento", p: 0.72, cor: COR.azul },
        { t: "Armazenagem", p: 0.48, cor: COR.destaque },
        { t: "Expedição", p: 0.86, cor: COR.azul },
      ].map(({ t, p, cor }, i) => (
        <g key={t}>
          <text x={378} y={230 + i * 30} fontSize={11.5} fill={COR.suave}>
            {t}
          </text>
          <rect x={472} y={224 + i * 30} width={92} height={5} rx={2.5} fill="rgba(255,255,255,0.08)" />
          <rect x={472} y={224 + i * 30} width={92 * p} height={5} rx={2.5} fill={cor} />
        </g>
      ))}
      <line x1={378} x2={564} y1={302} y2={302} stroke={COR.borda} />
      <text x={378} y={318} fontSize={10.5} fill={COR.suave}>
        App Operador · 12 tarefas em execução
      </text>

      {/* Eventos da operação */}
      <g>
        <rect x={280} y={350} width={226} height={48} rx={12} fill={COR.card} stroke={COR.borda} />
        <CircleCheck x={294} y={364} width={20} height={20} color={COR.ok} strokeWidth={1.75} />
        <text x={324} y={370} fontSize={11.5} fontWeight={600} fill={COR.texto}>
          Pedido 104582 expedido
        </text>
        <text x={324} y={386} fontSize={10} fill={COR.apagado}>
          Conferido · retorno enviado ao ERP
        </text>
      </g>
      <g>
        <rect x={354} y={410} width={226} height={48} rx={12} fill={COR.card} stroke={COR.borda} />
        <ScanBarcode x={368} y={424} width={20} height={20} color={COR.destaque} strokeWidth={1.75} />
        <text x={398} y={430} fontSize={11.5} fontWeight={600} fill={COR.texto}>
          Endereço A-03-02 confirmado
        </text>
        <text x={398} y={446} fontSize={10} fill={COR.apagado}>
          Lote L2611 · validade 11/2027
        </text>
      </g>
    </svg>
  );
}
