import { describe, expect, it } from "vitest";
import { validarLead } from "@/lib/leads/esquemas";
import { lerResposta } from "@/lib/leads/estado";

const contato = {
  nome: "Ana Souza",
  empresa: "Empresa Teste",
  email: "  Ana@Empresa.com.BR ",
  telefone: "(11) 98888-7777",
  consentimento: "on",
};

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

describe("lerResposta", () => {
  it("aceita o JSON do contato.php e trata o inesperado como não configurado", () => {
    expect(lerResposta({ status: "enviado", protocolo: "3F2A9C1E" })).toEqual({ status: "enviado", protocolo: "3F2A9C1E" });
    expect(lerResposta({ status: "invalido", erros: { nome: "Informe seu nome." } }).status).toBe("invalido");
    expect(lerResposta("<?php echo 1;")).toEqual({ status: "nao-configurado" });
    expect(lerResposta({ ok: true })).toEqual({ status: "nao-configurado" });
  });
});
