import { describe, expect, it, vi } from "vitest";
import { entregarLead, lerConfigEntrega, type Dependencias } from "@/lib/leads/entrega";
import { validarLead } from "@/lib/leads/esquemas";
import { criarLimitador } from "@/lib/leads/limite";
import { emailDoLead, lerOrigem, montarLead, protocolo } from "@/lib/leads/montar";

const contato = {
  nome: "Ana Souza",
  empresa: "Empresa Teste",
  email: "  Ana@Empresa.com.BR ",
  telefone: "(11) 98888-7777",
  consentimento: "on",
};

const agora = new Date("2026-10-22T13:00:00Z");
const ctx = { id: "3f2a9c1e-0000-4000-8000-000000000000", agora };

describe("validarLead", () => {
  it("guarda o telefone já no formato com DDD", () => {
    const r = validarLead("contato", { ...contato, telefone: "+55 11 988887777", assunto: "proposta", mensagem: "Quero uma proposta de sustentação." });
    expect(r.ok && r.dados.telefone).toBe("(11) 98888-7777");
  });

  it("aceita a demonstração do WMS e normaliza o e-mail", () => {
    const r = validarLead("demonstracao-wms", { ...contato, erp: "protheus", usuarios: "11-30", desafio: "Divergência de estoque" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.dados.email).toBe("ana@empresa.com.br");
  });

  it("aponta cada campo inválido com mensagem em português", () => {
    const r = validarLead("consultoria", { nome: "A", email: "sem-arroba", telefone: "123", servico: "inexistente" });
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.erros).toEqual({
        nome: "Informe seu nome.",
        empresa: "Informe o nome da empresa.",
        email: "Informe um e-mail válido.",
        telefone: "Informe um telefone válido com DDD.",
        servico: "Selecione o serviço de interesse.",
        consentimento: "Para enviarmos o retorno, é preciso concordar com o tratamento dos dados.",
      });
  });

  it("exige o nome do ERP quando a opção é 'Outro ERP'", () => {
    const r = validarLead("demonstracao-wms", { ...contato, erp: "outro", erpOutro: "  ", usuarios: "ate-10", desafio: "Inventário" });
    expect(r).toEqual({ ok: false, erros: { erpOutro: "Informe qual ERP." } });
  });

  it("no contato, telefone é opcional e mensagem é obrigatória", () => {
    const r = validarLead("contato", { ...contato, telefone: "", assunto: "proposta", mensagem: "curta" });
    expect(r).toEqual({ ok: false, erros: { mensagem: "Escreva uma mensagem com pelo menos 10 caracteres." } });
  });

  it("recusa consentimento ausente", () => {
    const r = validarLead("contato", { ...contato, consentimento: undefined, assunto: "outros", mensagem: "Quero conversar sobre o ERP." });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.erros)).toEqual(["consentimento"]);
  });
});

describe("montarLead", () => {
  const r = validarLead("demonstracao-wms", {
    ...contato,
    email: "joao@gmail.com",
    erp: "protheus",
    usuarios: "31-100",
    desafio: "Expedição sem conferência",
    aceitaComunicacoes: "on",
  });
  if (!r.ok) throw new Error("dados de teste inválidos");
  const origem = lerOrigem({ origemPagina: "/mais-i9-wms", origemReferencia: "https://www.google.com/", utm_source: "linkedin", utm_x: "ignorado" });
  const lead = montarLead("demonstracao-wms", r.dados, origem, ctx);

  it("traz rótulos legíveis, consentimento e origem", () => {
    expect(lead.campos).toEqual([
      { chave: "erp", rotulo: "ERP utilizado", valor: "protheus", texto: "TOTVS Protheus" },
      { chave: "usuarios", rotulo: "Quantidade aproximada de usuários", valor: "31-100", texto: "De 31 a 100 usuários" },
      { chave: "desafio", rotulo: "Principal desafio logístico", valor: "Expedição sem conferência", texto: "Expedição sem conferência" },
    ]);
    expect(lead.contato.emailGratuito).toBe(true);
    expect(lead.consentimento).toMatchObject({ tratamentoDados: true, comunicacoes: true, registradoEm: agora.toISOString() });
    expect(lead.origem).toEqual({ pagina: "/mais-i9-wms", referencia: "https://www.google.com/", utm: { utm_source: "linkedin" } });
  });

  it("gera protocolo curto e e-mail com o resumo", () => {
    expect(protocolo(lead)).toBe("3F2A9C1E");
    const email = emailDoLead(lead);
    expect(email.assunto).toBe("[Site MAIS i9] Demonstração MAIS i9 WMS: Empresa Teste (Ana Souza) · 3F2A9C1E");
    expect(email.texto).toContain("ERP utilizado: TOTVS Protheus");
    expect(email.texto).toContain("E-mail: joao@gmail.com (provedor gratuito)");
    expect(email.texto).toContain("UTM: utm_source=linkedin");
  });

  it("descarta página de origem que não seja um caminho do site", () => {
    expect(lerOrigem({ origemPagina: "https://outro.site/x" }).pagina).toBeNull();
  });
});

describe("entregarLead", () => {
  const r = validarLead("contato", { ...contato, assunto: "proposta", mensagem: "Quero uma proposta de sustentação." });
  if (!r.ok) throw new Error("dados de teste inválidos");
  const lead = montarLead("contato", r.dados, lerOrigem({}), ctx);

  const deps = (over: Partial<Dependencias> = {}): Dependencias => ({
    fetch: vi.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch,
    enviarEmail: vi.fn(async () => {}),
    ...over,
  });

  it("sem destino configurado, informa que não enviou", async () => {
    expect(await entregarLead(lead, lerConfigEntrega({}), deps())).toEqual({ status: "nao-configurado" });
  });

  it("e-mail exige SMTP_HOST, remetente e destinatário", () => {
    expect(lerConfigEntrega({ LEADS_EMAIL_PARA: "comercial@x.com" }).email).toBeNull();
    expect(lerConfigEntrega({ LEADS_EMAIL_PARA: "a@x.com; b@x.com", SMTP_HOST: "smtp.x.com", SMTP_USER: "site@x.com" }).email).toMatchObject({
      para: ["a@x.com", "b@x.com"],
      de: "site@x.com",
      smtp: { host: "smtp.x.com", porta: 587 },
    });
  });

  it("envia JSON ao webhook com token", async () => {
    const d = deps();
    const res = await entregarLead(lead, lerConfigEntrega({ LEADS_WEBHOOK_URL: "https://crm.exemplo/hook", LEADS_WEBHOOK_TOKEN: "segredo" }), d);
    expect(res).toEqual({ status: "entregue", canais: ["webhook"], falhas: [] });
    const [url, init] = (d.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("https://crm.exemplo/hook");
    expect(init.headers).toMatchObject({ Authorization: "Bearer segredo" });
    expect(JSON.parse(init.body)).toMatchObject({ versao: 1, tipo: "contato", contato: { email: "ana@empresa.com.br" } });
  });

  it("vale o envio se ao menos um canal aceitar; falha se nenhum aceitar", async () => {
    const config = lerConfigEntrega({ LEADS_WEBHOOK_URL: "https://crm.exemplo/hook", LEADS_EMAIL_PARA: "c@x.com", SMTP_HOST: "smtp", SMTP_FROM: "s@x.com" });
    const webhookFora = deps({ fetch: vi.fn(async () => new Response(null, { status: 500 })) as unknown as typeof fetch });
    expect(await entregarLead(lead, config, webhookFora)).toEqual({ status: "entregue", canais: ["email"], falhas: ["webhook: HTTP 500"] });

    const tudoFora = deps({
      fetch: vi.fn(async () => new Response(null, { status: 500 })) as unknown as typeof fetch,
      enviarEmail: vi.fn(async () => {
        throw new Error("SMTP recusou");
      }),
    });
    expect(await entregarLead(lead, config, tudoFora)).toEqual({ status: "falha", falhas: ["webhook: HTTP 500", "email: SMTP recusou"] });
  });
});

describe("criarLimitador", () => {
  it("bloqueia acima do máximo e libera após a janela", () => {
    let t = 0;
    const permitir = criarLimitador({ maximo: 2, janelaMs: 1000, agora: () => t });
    expect([permitir("ip"), permitir("ip"), permitir("ip"), permitir("outro")]).toEqual([true, true, false, true]);
    t = 1001;
    expect(permitir("ip")).toBe(true);
  });
});
