"use client";

import { useRef, useState } from "react";

export type PontoCurva = { rotulo: string; planejado: number | null; realizado: number | null; forecast: number | null; atual: boolean };

// Duas identidades validadas (azul = linha de base; laranja = horas reais e sua projeção).
const COR = { planejado: "#2a78d6", real: "#eb6834" };
const W = 820;
const H = 280;
const M = { t: 16, r: 96, b: 30, l: 52 };

/** Arredonda o topo do eixo para um número "limpo" (1, 2, 2,5 ou 5 × 10ⁿ). */
function topoLimpo(max: number) {
  if (max <= 0) return 10;
  const passo = 10 ** Math.floor(Math.log10(max / 4));
  const m = [1, 2, 2.5, 5, 10].find((k) => (k * passo * 4) >= max) ?? 10;
  return m * passo * 4;
}

/** Curva S em horas acumuladas: linha de base × realizado × forecast, com cursor que mostra as três séries. */
export function CurvaS({ pontos }: { pontos: PontoCurva[] }) {
  const [i, setI] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const n = pontos.length;
  const max = topoLimpo(Math.max(0, ...pontos.flatMap((p) => [p.planejado ?? 0, p.realizado ?? 0, p.forecast ?? 0])));
  const pw = W - M.l - M.r;
  const ph = H - M.t - M.b;
  const x = (k: number) => M.l + (n <= 1 ? pw / 2 : (k / (n - 1)) * pw);
  const y = (v: number) => M.t + ph - (v / max) * ph;
  const caminho = (campo: keyof Pick<PontoCurva, "planejado" | "realizado" | "forecast">) =>
    pontos
      .map((p, k) => [p[campo], k] as const)
      .filter(([v]) => v !== null)
      .map(([v, k], j) => `${j ? "L" : "M"}${x(k).toFixed(1)},${y(v!).toFixed(1)}`)
      .join(" ");
  const ultimo = (campo: "planejado" | "realizado" | "forecast") => {
    for (let k = n - 1; k >= 0; k--) if (pontos[k][campo] !== null) return { k, v: pontos[k][campo]! };
    return null;
  };
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const passoX = Math.max(1, Math.ceil(n / 10));
  const kAtual = pontos.findIndex((p) => p.atual);
  const fimPlan = ultimo("planejado");
  const fimReal = ultimo("realizado");
  const fimFc = ultimo("forecast");
  const h = (v: number | null) => (v === null ? "—" : `${v.toLocaleString("pt-BR")}h`);

  const mover = (e: React.PointerEvent<SVGRectElement>) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    setI(Math.max(0, Math.min(n - 1, Math.round(((px - M.l) / pw) * (n - 1)))));
  };
  const sel = i !== null ? pontos[i] : null;
  // Rótulos de fim: se colidirem, ficam só na legenda e no cursor.
  const rotulos = [fimPlan && { k: fimPlan.k, v: fimPlan.v, texto: `Base ${h(fimPlan.v)}`, cor: COR.planejado }, fimFc && { k: fimFc.k, v: fimFc.v, texto: `Forecast ${h(fimFc.v)}`, cor: COR.real }].filter(Boolean) as { k: number; v: number; texto: string; cor: string }[];
  const colidem = rotulos.length === 2 && Math.abs(y(rotulos[0].v) - y(rotulos[1].v)) < 14;

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-4 text-xs text-ardosia-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5" style={{ background: COR.planejado }} /> Linha de base (planejado)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-5" style={{ background: COR.real }} /> Realizado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed" style={{ borderColor: COR.real }} /> Forecast (realizado + previsto)
        </span>
      </div>
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Curva S do projeto em horas acumuladas">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} stroke="#e3e9f0" strokeWidth={1} />
              <text x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#5b6b82" style={{ fontVariantNumeric: "tabular-nums" }}>
                {t.toLocaleString("pt-BR")}h
              </text>
            </g>
          ))}
          {pontos.map((p, k) =>
            k % passoX === 0 || k === n - 1 ? (
              <text key={p.rotulo} x={x(k)} y={H - 8} textAnchor="middle" fontSize={11} fill="#5b6b82">
                {p.rotulo}
              </text>
            ) : null,
          )}
          {kAtual >= 0 && (
            <g>
              <line x1={x(kAtual)} x2={x(kAtual)} y1={M.t} y2={M.t + ph} stroke="#b9c4d2" strokeWidth={1} />
              <text x={x(kAtual) + 4} y={M.t + 10} fontSize={10} fill="#5b6b82">
                hoje
              </text>
            </g>
          )}
          <path d={caminho("planejado")} fill="none" stroke={COR.planejado} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={caminho("forecast")} fill="none" stroke={COR.real} strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" strokeLinecap="round" />
          <path d={caminho("realizado")} fill="none" stroke={COR.real} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {fimReal && <circle cx={x(fimReal.k)} cy={y(fimReal.v)} r={4.5} fill={COR.real} stroke="#ffffff" strokeWidth={2} />}
          {!colidem &&
            rotulos.map((r) => (
              <g key={r.texto}>
                <circle cx={x(r.k)} cy={y(r.v)} r={4} fill={r.cor} stroke="#ffffff" strokeWidth={2} />
                <text x={x(r.k) + 8} y={y(r.v) + 4} fontSize={11} fill="#0f2a4a" fontWeight={600}>
                  {r.texto}
                </text>
              </g>
            ))}
          {sel && i !== null && (
            <g pointerEvents="none">
              <line x1={x(i)} x2={x(i)} y1={M.t} y2={M.t + ph} stroke="#0f2a4a" strokeOpacity={0.35} strokeWidth={1} />
              {sel.planejado !== null && <circle cx={x(i)} cy={y(sel.planejado)} r={4} fill={COR.planejado} stroke="#fff" strokeWidth={2} />}
              {(sel.realizado ?? sel.forecast) !== null && <circle cx={x(i)} cy={y((sel.realizado ?? sel.forecast)!)} r={4} fill={COR.real} stroke="#fff" strokeWidth={2} />}
            </g>
          )}
          <rect x={M.l} y={M.t} width={pw} height={ph} fill="transparent" onPointerMove={mover} onPointerLeave={() => setI(null)} />
        </svg>
        {sel && i !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-md border border-ardosia-100 bg-white px-3 py-2 text-xs shadow-md"
            style={{ left: `${(x(i) / W) * 100}%`, transform: x(i) > W * 0.6 ? "translateX(calc(-100% - 12px))" : "translateX(12px)" }}
          >
            <div className="mb-1 font-medium text-ardosia-500">{sel.rotulo}</div>
            {[
              ["Linha de base", sel.planejado, COR.planejado, false],
              ["Realizado", sel.realizado, COR.real, false],
              ["Forecast", sel.forecast, COR.real, true],
            ].map(([r, v, cor, tracejado]) => (
              <div key={r as string} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-ardosia-600">
                  <span className="inline-block w-3.5" style={{ borderTop: `2px ${tracejado ? "dashed" : "solid"} ${cor}` }} />
                  {r as string}
                </span>
                <strong className="text-navy-900 tabular-nums">{h(v as number | null)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
      <details className="mt-2 text-xs">
        <summary className="cursor-pointer text-ardosia-500">Ver em tabela</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="tabela">
            <thead>
              <tr>
                <th>Semana</th>
                <th className="text-right">Linha de base</th>
                <th className="text-right">Realizado</th>
                <th className="text-right">Forecast</th>
              </tr>
            </thead>
            <tbody>
              {pontos.map((p) => (
                <tr key={p.rotulo} className={p.atual ? "bg-destaque/5" : ""}>
                  <td>{p.rotulo}</td>
                  <td className="text-right tabular-nums">{h(p.planejado)}</td>
                  <td className="text-right tabular-nums">{h(p.realizado)}</td>
                  <td className="text-right tabular-nums">{h(p.forecast)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
