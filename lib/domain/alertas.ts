// Regras dos alertas (puras). Cada alerta tem uma chave estável: a mesma situação gera a mesma chave
// todo dia, o que permite avisar por e-mail só uma vez e listar no app enquanto a situação durar.
import { chaveDia, diffDias, formatarData, paraDia } from "./datas";
import { rotuloSemana, type SemanaIso } from "./semanas";

export type TipoAlerta = "ATIVIDADE_ATRASADA" | "PENDENCIA_VENCIDA" | "SOBRECARGA" | "INDISPONIBILIDADE_PENDENTE" | "STATUS_REPORT_ATRASADO";
export type Gravidade = "ALTA" | "MEDIA";

export type Alerta = {
  chave: string;
  tipo: TipoAlerta;
  gravidade: Gravidade;
  titulo: string;
  detalhe: string;
  href: string;
  /** Recursos interessados (viram usuários pelo vínculo recurso → usuário). */
  recursos: string[];
  /** Avisar também os gestores (perfis Administrador e Gestor). */
  gestores: boolean;
  projetoId?: string;
};

export const ROTULO_ALERTA: Record<TipoAlerta, string> = {
  ATIVIDADE_ATRASADA: "Atividade atrasada",
  PENDENCIA_VENCIDA: "Pendência vencida",
  SOBRECARGA: "Recurso sobrecarregado",
  INDISPONIBILIDADE_PENDENTE: "Indisponibilidade a aprovar",
  STATUS_REPORT_ATRASADO: "Status report atrasado",
};

type Projeto = { id: string; nome: string; cliente: string; gpRecursoId: string | null };

export function alertasAtividades(
  atividades: { id: string; codigo: string; tarefa: string; fimPrevisto: Date; projeto: Projeto; recursos: string[] }[],
  hoje: Date,
): Alerta[] {
  return atividades.map((a) => {
    const dias = diffDias(paraDia(hoje), a.fimPrevisto);
    return {
      chave: `ATIVIDADE_ATRASADA:${a.id}:${chaveDia(a.fimPrevisto)}`,
      tipo: "ATIVIDADE_ATRASADA",
      gravidade: dias > 5 ? "ALTA" : "MEDIA",
      titulo: `${a.codigo} · ${a.tarefa}`,
      detalhe: `${a.projeto.cliente} · ${a.projeto.nome} — fim previsto ${formatarData(a.fimPrevisto)} (${dias} dia(s) de atraso)`,
      href: `/projetos/${a.projeto.id}/cronograma`,
      recursos: [...new Set([...a.recursos, ...(a.projeto.gpRecursoId ? [a.projeto.gpRecursoId] : [])])],
      gestores: false,
      projetoId: a.projeto.id,
    };
  });
}

export function alertasPendencias(
  itens: { id: string; codigo: string; tipo: string; descricao: string; prazo: Date; responsavelId: string | null; projeto: Projeto }[],
  hoje: Date,
): Alerta[] {
  return itens.map((i) => {
    const dias = diffDias(paraDia(hoje), i.prazo);
    return {
      chave: `PENDENCIA_VENCIDA:${i.id}:${chaveDia(i.prazo)}`,
      tipo: "PENDENCIA_VENCIDA",
      gravidade: dias > 5 || i.tipo === "RISCO" || i.tipo === "DEFEITO" ? "ALTA" : "MEDIA",
      titulo: `${i.codigo} · ${i.descricao}`,
      detalhe: `${i.projeto.cliente} · ${i.projeto.nome} — prazo ${formatarData(i.prazo)} (${dias} dia(s) vencido)`,
      href: `/projetos/${i.projeto.id}/operacional?situacao=vencidos`,
      recursos: [...new Set([...(i.responsavelId ? [i.responsavelId] : []), ...(i.projeto.gpRecursoId ? [i.projeto.gpRecursoId] : [])])],
      gestores: false,
      projetoId: i.projeto.id,
    };
  });
}

/** Sobrecarga: utilização acima de 100% na semana (a chave inclui a semana: cada semana avisa uma vez). */
export function alertasSobrecarga(cargas: { recursoId: string; nome: string; semana: SemanaIso; planejado: number; capacidade: number }[]): Alerta[] {
  return cargas
    .filter((c) => c.planejado > c.capacidade && c.planejado > 0)
    .map((c) => {
      const pct = c.capacidade > 0 ? Math.round((c.planejado / c.capacidade) * 100) : null;
      return {
        chave: `SOBRECARGA:${c.recursoId}:${c.semana.id}`,
        tipo: "SOBRECARGA" as const,
        gravidade: (pct === null || pct > 120 ? "ALTA" : "MEDIA") as Gravidade,
        titulo: `${c.nome} em ${pct === null ? "semana sem capacidade" : `${pct}%`} na ${rotuloSemana(c.semana)}`,
        detalhe: `${c.planejado}h planejadas para ${c.capacidade}h de capacidade líquida`,
        href: `/capacidade?r=${c.recursoId}&s=${c.semana.id}`,
        recursos: [c.recursoId],
        gestores: true,
      };
    });
}

export function alertasIndisponibilidades(pendentes: { id: string; recurso: string; tipo: string; inicio: Date; fim: Date }[]): Alerta[] {
  return pendentes.map((i) => ({
    chave: `INDISPONIBILIDADE_PENDENTE:${i.id}`,
    tipo: "INDISPONIBILIDADE_PENDENTE",
    gravidade: "MEDIA",
    titulo: `${i.recurso} · ${i.tipo}`,
    detalhe: `${formatarData(i.inicio)} a ${formatarData(i.fim)} aguardando aprovação`,
    href: "/capacidade/indisponibilidades",
    recursos: [],
    gestores: true,
  }));
}

/** Projeto ativo sem status report publicado há mais de `dias` dias (a chave muda a cada semana sem report). */
export function alertasStatusReport(projetos: (Projeto & { ultimo: Date | null })[], hoje: Date, dias = 14): Alerta[] {
  const h = paraDia(hoje);
  return projetos
    .filter((p) => !p.ultimo || diffDias(h, p.ultimo) > dias)
    .map((p) => {
      const desde = p.ultimo ? diffDias(h, p.ultimo) : null;
      return {
        chave: `STATUS_REPORT_ATRASADO:${p.id}:${p.ultimo ? chaveDia(p.ultimo) : "nunca"}:${Math.floor((desde ?? 0) / 7)}`,
        tipo: "STATUS_REPORT_ATRASADO",
        gravidade: "MEDIA",
        titulo: `${p.cliente} · ${p.nome}`,
        detalhe: p.ultimo ? `Último status report publicado em ${formatarData(p.ultimo)} (${desde} dias)` : "Nenhum status report publicado",
        href: `/projetos/${p.id}/status`,
        recursos: p.gpRecursoId ? [p.gpRecursoId] : [],
        gestores: !p.gpRecursoId,
        projetoId: p.id,
      };
    });
}

/** Alertas de um usuário: os que citam o recurso dele, mais os de gestores se for gestor. */
export function alertasDoUsuario(alertas: Alerta[], u: { recursoId: string | null; gestor: boolean }): Alerta[] {
  return alertas.filter((a) => (u.recursoId && a.recursos.includes(u.recursoId)) || (u.gestor && a.gestores));
}

/** Ordena: gravidade alta primeiro, depois por tipo e título. */
export function ordenarAlertas(alertas: Alerta[]): Alerta[] {
  const ordemTipo = Object.keys(ROTULO_ALERTA);
  return [...alertas].sort((a, b) => (a.gravidade === b.gravidade ? 0 : a.gravidade === "ALTA" ? -1 : 1) || ordemTipo.indexOf(a.tipo) - ordemTipo.indexOf(b.tipo) || a.titulo.localeCompare(b.titulo));
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Corpo do e-mail diário: novos alertas em destaque e um resumo dos que continuam abertos. */
export function montarResumo(nome: string, novos: Alerta[], continuam: Alerta[], baseUrl: string) {
  const assunto = `MAIS i9 · ${novos.length} novo(s) alerta(s)${continuam.length ? ` e ${continuam.length} em aberto` : ""}`;
  const item = (a: Alerta) =>
    `<li style="margin:0 0 8px"><a href="${esc(baseUrl + a.href)}" style="color:#0f1f3a;font-weight:600">${esc(a.titulo)}</a>${a.gravidade === "ALTA" ? ' <span style="color:#c0392b">● alta</span>' : ""}<br><span style="color:#5b6b82">${esc(ROTULO_ALERTA[a.tipo])} · ${esc(a.detalhe)}</span></li>`;
  const html = `<div style="font:14px/1.5 Segoe UI,Arial,sans-serif;color:#0f1f3a;max-width:640px">
<p>Olá, ${esc(nome.split(" ")[0])}.</p>
<p><strong>Novos alertas</strong></p><ul style="padding-left:18px">${novos.map(item).join("")}</ul>
${continuam.length ? `<p style="color:#5b6b82">Continuam em aberto: ${continuam.length} alerta(s) já avisado(s). <a href="${esc(baseUrl)}/alertas">Ver todos</a></p>` : ""}
<p style="color:#8a97a8;font-size:12px">Aviso automático do sistema de gestão de projetos da MAIS i9. Para não receber e-mails, desligue em Alertas → Preferências.</p></div>`;
  const texto = [`Olá, ${nome.split(" ")[0]}.`, "", "Novos alertas:", ...novos.map((a) => `- ${a.titulo} (${ROTULO_ALERTA[a.tipo]}) — ${a.detalhe} ${baseUrl}${a.href}`), "", continuam.length ? `Continuam em aberto: ${continuam.length}. ${baseUrl}/alertas` : ""].join("\n");
  return { assunto, html, texto };
}
