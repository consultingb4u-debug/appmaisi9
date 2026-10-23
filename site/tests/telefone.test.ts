import { describe, expect, it } from "vitest";
import { digitosTelefone, formatarTelefone, posicaoAposDigitos } from "@/lib/telefone";

describe("máscara de telefone", () => {
  it("formata fixo e celular com DDD", () => {
    expect(formatarTelefone("4734402120")).toBe("(47) 3440-2120");
    expect(formatarTelefone("47999998888")).toBe("(47) 99999-8888");
  });

  it("formata enquanto a pessoa digita", () => {
    expect(formatarTelefone("")).toBe("");
    expect(formatarTelefone("4")).toBe("(4");
    expect(formatarTelefone("47")).toBe("(47");
    expect(formatarTelefone("473")).toBe("(47) 3");
    expect(formatarTelefone("473440")).toBe("(47) 3440");
    expect(formatarTelefone("4734402")).toBe("(47) 3440-2");
  });

  it("aceita valor colado com +55, zero ou pontuação e corta o excesso", () => {
    expect(formatarTelefone("+55 47 3440-2120")).toBe("(47) 3440-2120");
    expect(formatarTelefone("5547999998888")).toBe("(47) 99999-8888");
    expect(formatarTelefone("047 3440.2120")).toBe("(47) 3440-2120");
    expect(digitosTelefone("47 99999-88887777")).toBe("47999998888");
  });

  it("refaz a máscara ao apagar (celular volta a fixo)", () => {
    expect(formatarTelefone("(47) 99999-888")).toBe("(47) 9999-9888");
  });

  it("mantém o cursor depois do mesmo dígito", () => {
    expect(posicaoAposDigitos("(47) 3440-2120", 2)).toBe(3);
    expect(posicaoAposDigitos("(47) 3440-2120", 6)).toBe(9);
    expect(posicaoAposDigitos("(47) 3440-2120", 10)).toBe(14);
  });
});
