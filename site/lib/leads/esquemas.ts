import { z } from "zod";
import { opcoesServico } from "@/conteudo/consultoria";
import { opcoesAssunto } from "@/conteudo/formularios";
import { opcoesErp, opcoesUsuarios } from "@/conteudo/wms";

export const TIPOS_LEAD = ["consultoria", "demonstracao-wms", "contato"] as const;
export type TipoLead = (typeof TIPOS_LEAD)[number];

export const rotuloTipoLead: Record<TipoLead, string> = {
  consultoria: "Consultoria Protheus",
  "demonstracao-wms": "Demonstração MAIS i9 WMS",
  contato: "Contato comercial",
};

type Opcao = { valor: string; rotulo: string };

const digitos = (t: string) => t.replace(/\D/g, "");
const telefoneValido = (t: string) => digitos(t).length >= 10 && digitos(t).length <= 13;

const opcao = (opcoes: Opcao[], mensagem: string) =>
  z.string({ error: mensagem }).refine((v) => opcoes.some((o) => o.valor === v), mensagem);

const nome = z.string({ error: "Informe seu nome." }).trim().min(2, "Informe seu nome.").max(120, "Use até 120 caracteres.");
const empresa = z
  .string({ error: "Informe o nome da empresa." })
  .trim()
  .min(2, "Informe o nome da empresa.")
  .max(160, "Use até 160 caracteres.");
const email = z
  .string({ error: "Informe seu e-mail corporativo." })
  .trim()
  .toLowerCase()
  .max(160, "Use até 160 caracteres.")
  .pipe(z.email("Informe um e-mail válido."));
const telefone = z
  .string({ error: "Informe o telefone com DDD." })
  .trim()
  .max(30, "Telefone inválido.")
  .refine(telefoneValido, "Informe o telefone com DDD.");
const telefoneOpcional = z
  .string()
  .trim()
  .max(30, "Telefone inválido.")
  .refine((t) => t === "" || telefoneValido(t), "Informe o telefone com DDD.")
  .optional();
const textoLivre = z.string().trim().max(3000, "Use até 3.000 caracteres.").optional();
const consentimento = z.literal("on", {
  error: "Para enviarmos o retorno, é preciso concordar com o tratamento dos dados.",
});
const aceitaComunicacoes = z.literal("on").optional();

const base = { nome, empresa, email, consentimento, aceitaComunicacoes };

export const esquemas = {
  consultoria: z.object({
    ...base,
    telefone,
    servico: opcao(opcoesServico, "Selecione o serviço de interesse."),
    mensagem: textoLivre,
  }),
  "demonstracao-wms": z
    .object({
      ...base,
      telefone,
      erp: opcao(opcoesErp, "Selecione o ERP utilizado."),
      erpOutro: z.string().trim().max(80, "Use até 80 caracteres.").optional(),
      usuarios: opcao(opcoesUsuarios, "Selecione a quantidade aproximada de usuários."),
      desafio: z
        .string({ error: "Conte qual é o principal desafio logístico." })
        .trim()
        .min(5, "Conte qual é o principal desafio logístico.")
        .max(3000, "Use até 3.000 caracteres."),
    })
    .superRefine((d, ctx) => {
      if (d.erp === "outro" && !d.erpOutro) ctx.addIssue({ code: "custom", path: ["erpOutro"], message: "Informe qual ERP." });
    }),
  contato: z.object({
    ...base,
    telefone: telefoneOpcional,
    assunto: opcao(opcoesAssunto, "Selecione o assunto."),
    mensagem: z
      .string({ error: "Escreva sua mensagem." })
      .trim()
      .min(10, "Escreva uma mensagem com pelo menos 10 caracteres.")
      .max(3000, "Use até 3.000 caracteres."),
  }),
} as const;

export type DadosLead = { [T in TipoLead]: z.output<(typeof esquemas)[T]> };

/** Rótulos legíveis dos campos específicos de cada formulário (e-mail e CRM). */
export const camposPorTipo: { [T in TipoLead]: { chave: string; rotulo: string; opcoes?: Opcao[] }[] } = {
  consultoria: [{ chave: "servico", rotulo: "Serviço de interesse", opcoes: opcoesServico }],
  "demonstracao-wms": [
    { chave: "erp", rotulo: "ERP utilizado", opcoes: opcoesErp },
    { chave: "erpOutro", rotulo: "Qual ERP" },
    { chave: "usuarios", rotulo: "Quantidade aproximada de usuários", opcoes: opcoesUsuarios },
    { chave: "desafio", rotulo: "Principal desafio logístico" },
  ],
  contato: [{ chave: "assunto", rotulo: "Assunto", opcoes: opcoesAssunto }],
};

export function ehTipoLead(v: unknown): v is TipoLead {
  return typeof v === "string" && (TIPOS_LEAD as readonly string[]).includes(v);
}

export type ResultadoValidacao<T extends TipoLead> =
  | { ok: true; dados: DadosLead[T] }
  | { ok: false; erros: Record<string, string> };

/** Valida os campos enviados; devolve a primeira mensagem de erro de cada campo. */
export function validarLead<T extends TipoLead>(tipo: T, entrada: Record<string, unknown>): ResultadoValidacao<T> {
  // Campos vazios do formulário chegam como "": tratados como não preenchidos.
  const limpa = Object.fromEntries(Object.entries(entrada).filter(([, v]) => !(typeof v === "string" && v.trim() === "")));
  const r = esquemas[tipo].safeParse(limpa);
  if (r.success) return { ok: true, dados: r.data as DadosLead[T] };
  const erros: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const campo = String(issue.path[0] ?? "formulario");
    erros[campo] ??= issue.message;
  }
  return { ok: false, erros };
}
