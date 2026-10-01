import { z } from "zod";
import type { EstadoAcao } from "@/components/formulario";
import { SemPermissao } from "@/lib/auth/sessao";

/** Lê um FormData como objeto simples, com strings vazias convertidas em undefined. */
export function lerFormulario(dados: FormData): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of dados.entries()) {
    if (k.startsWith("$ACTION")) continue;
    const s = typeof v === "string" ? v.trim() : undefined;
    out[k] = s === "" ? undefined : s;
  }
  return out;
}

/** Executa a ação convertendo erros esperados em mensagem para o usuário. */
export async function executarAcao(fn: () => Promise<EstadoAcao | void>): Promise<EstadoAcao> {
  try {
    return (await fn()) ?? { ok: true, mensagem: "Salvo." };
  } catch (e) {
    if (e instanceof SemPermissao) return { erro: e.message };
    if (e instanceof z.ZodError) return { erro: e.issues.map((i) => i.message).join(" · ") };
    if (e instanceof ErroNegocio) return { erro: e.message };
    const codigo = (e as { code?: string })?.code;
    if (codigo === "P2002") return { erro: "Já existe um registro com esses dados." };
    if (codigo === "P2003") return { erro: "Registro está em uso e não pode ser excluído." };
    // Erros de controle do Next (redirect/notFound) precisam seguir adiante.
    if ((e as { digest?: string })?.digest?.startsWith("NEXT_")) throw e;
    console.error(e);
    return { erro: "Erro inesperado ao salvar." };
  }
}

export class ErroNegocio extends Error {}

export const zTextoOpcional = z.string().max(500).optional();
