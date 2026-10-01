import { carregarCronograma } from "./cronograma";
import { carregarProjeto } from "./projeto";
import { resumoExecucao } from "./execucao";
import { FASE, FASES } from "@/lib/domain/rotulos";
import { chaveDia } from "@/lib/domain/datas";
import type { Indicadores } from "@/lib/domain/status";

export type { Indicadores };

export async function fotografarIndicadores(projetoId: string): Promise<Indicadores> {
  const [p, crono, ex] = await Promise.all([carregarProjeto(projetoId), carregarCronograma(projetoId), resumoExecucao(projetoId)]);
  if (!p) throw new Error("Projeto não encontrado.");
  const ativas = crono.atividades.filter((a) => a.status !== "CANCELADO");
  // Fase atual: a primeira fase (na ordem oficial) que ainda tem atividade não concluída.
  const fase = FASES.find((f) => ativas.some((a) => a.fase === f && a.status !== "CONCLUIDO")) ?? null;
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    geradoEm: new Date().toISOString(),
    progresso: crono.progresso,
    faseAtual: fase ? FASE[fase] : ativas.length ? "Concluído" : null,
    goLive: (p.dataGoLiveReal ?? p.dataGoLiveAlvo) ? chaveDia((p.dataGoLiveReal ?? p.dataGoLiveAlvo)!) : null,
    horas: {
      vendidas: p.horasVendidas?.toNumber() ?? null,
      planejadas: r1(p.horasPlanejadas),
      realizadas: r1(p.horasRealizadas),
      forecast: ativas.length ? r1(ativas.reduce((t, a) => t + a.totais.forecast, 0)) : null,
    },
    atividades: { total: ativas.length, concluidas: ativas.filter((a) => a.status === "CONCLUIDO").length, atrasadas: ativas.filter((a) => a.situacao === "ATRASADO").length },
    complexidade: ex.complexidade?.nivel ?? null,
    pendenciasVencidas: ex.pendenciasVencidas,
    itensAbertos: ex.abertos,
    riscosAbertos: ex.riscosAbertos,
    riscosAltos: ex.riscosAltos,
    changeRequests: ex.changeRequests,
    defeitosAbertos: ex.defeitosAbertos,
    defeitosGraves: ex.defeitosGraves,
    testesInternos: { total: ex.testesInternos.total, aprovado: ex.testesInternos.aprovado },
    uat: { total: ex.testesUat.total, aprovado: ex.testesUat.aprovado },
    prontidaoGoLive: ex.deployment ? { percentual: ex.deployment.prontidao.percentual, sugestao: ex.deployment.prontidao.sugestao, bloqueios: ex.deployment.prontidao.bloqueios.length } : null,
  };
}
