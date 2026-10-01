import { DECISAO_GO, TOM_DECISAO_GO } from "@/lib/domain/rotulos";
import type { ResumoExecucao } from "@/lib/services/execucao";
import { Indicador, Selo } from "@/components/ui";

/** Indicadores de execução do projeto: RAID, testes, UAT e prontidão do Go Live. */
export function PainelExecucao({ projetoId, r }: { projetoId: string; r: ResumoExecucao }) {
  const base = `/projetos/${projetoId}`;
  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <Indicador
        rotulo="Pendências vencidas"
        valor={r.pendenciasVencidas}
        tom={r.pendenciasVencidas ? "critico" : "ok"}
        detalhe={`${r.abertos} item(ns) aberto(s)`}
        href={`${base}/operacional?situacao=vencidos`}
      />
      <Indicador rotulo="Riscos abertos" valor={r.riscosAbertos} tom={r.riscosAltos ? "critico" : r.riscosAbertos ? "alerta" : "ok"} detalhe={`${r.riscosAltos} alto(s)/crítico(s)`} href={`${base}/riscos`} />
      <Indicador rotulo="Defeitos abertos" valor={r.defeitosAbertos} tom={r.defeitosGraves ? "critico" : r.defeitosAbertos ? "alerta" : "ok"} detalhe={`${r.defeitosGraves} grave(s)`} href={`${base}/operacional?tipo=DEFEITO`} />
      <Indicador rotulo="Testes internos" valor={r.testesInternos.total ? `${r.testesInternos.aprovado}%` : "—"} detalhe={`${r.testesInternos.aprovados}/${r.testesInternos.total} aprovados`} href={`${base}/testes`} tom={r.testesInternos.reprovados ? "alerta" : "navy"} />
      <Indicador rotulo="UAT" valor={r.testesUat.total ? `${r.testesUat.aprovado}%` : "—"} detalhe={`${r.testesUat.aprovados}/${r.testesUat.total} aceitos`} href={`${base}/uat`} tom={r.testesUat.reprovados ? "critico" : "navy"} />
      <Indicador
        rotulo="Go Live"
        valor={r.deployment ? `${r.deployment.prontidao.percentual}%` : "—"}
        detalhe={
          r.deployment ? (
            <span className="inline-flex items-center gap-1">
              sugestão <Selo tom={TOM_DECISAO_GO[r.deployment.prontidao.sugestao]}>{DECISAO_GO[r.deployment.prontidao.sugestao]}</Selo>
            </span>
          ) : (
            "sem deployment planejado"
          )
        }
        href={`${base}/deployment`}
        tom={r.deployment?.prontidao.bloqueios.length ? "critico" : "navy"}
      />
    </div>
  );
}
