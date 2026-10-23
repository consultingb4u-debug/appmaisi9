import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { copyFileSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { empresa } from "@/conteudo/empresa";
import { versaoPolitica } from "@/conteudo/formularios";
import { camposPorTipo, rotuloTipoLead, validarLead, type TipoLead } from "@/lib/leads/esquemas";

// Sobe o contato.php no servidor embutido do PHP e confere o envio de ponta a ponta.
// Sem PHP instalado, os testes são pulados.
const temPhp = spawnSync("php", ["-v"]).status === 0;
const raiz = path.resolve(import.meta.dirname, "..");
const porta = 18000 + Math.floor(Math.random() * 1000);
const base = `http://127.0.0.1:${porta}`;
let pasta = "";
let emails = "";
let servidor: ChildProcess | undefined;

const contato = { nome: "Ana Souza", empresa: "Empresa Teste", email: "Ana@Empresa.com.br", telefone: "47 99999-8888", consentimento: "on" };

function enviar(campos: Record<string, string>, accept = "application/json") {
  const corpo = new FormData();
  for (const [k, v] of Object.entries(campos)) corpo.set(k, v);
  return fetch(`${base}/contato.php`, { method: "POST", body: corpo, headers: { Accept: accept } });
}

function ultimoEmail() {
  const arquivos = readdirSync(emails).sort();
  const bruto = readFileSync(path.join(emails, arquivos[arquivos.length - 1]), "utf8");
  const [cabecalho, corpo] = bruto.split("\r\n\r\n");
  const assunto = /Subject: =\?UTF-8\?B\?(.+)\?=/.exec(cabecalho)?.[1] ?? "";
  return {
    quantidade: arquivos.length,
    cabecalho,
    assunto: Buffer.from(assunto, "base64").toString("utf8"),
    texto: Buffer.from(corpo.replace(/\r\n/g, ""), "base64").toString("utf8"),
  };
}

describe.skipIf(!temPhp)("contato.php", () => {
  beforeAll(async () => {
    pasta = mkdtempSync(path.join(tmpdir(), "contato-php-"));
    emails = mkdtempSync(path.join(tmpdir(), "contato-emails-"));
    const limite = mkdtempSync(path.join(tmpdir(), "contato-limite-"));
    copyFileSync(path.join(raiz, "public/contato.php"), path.join(pasta, "contato.php"));
    // Mesmo conteúdo de app/contato-opcoes.json/route.ts.
    writeFileSync(
      path.join(pasta, "contato-opcoes.json"),
      JSON.stringify({ versaoPolitica, emailComercial: empresa.emailComercial, tipos: rotuloTipoLead, campos: camposPorTipo }),
    );
    writeFileSync(
      path.join(pasta, "contato-config.php"),
      `<?php return ['metodo' => 'arquivo', 'pasta_arquivo' => ${JSON.stringify(emails)}, 'pasta_limite' => ${JSON.stringify(limite)}];`,
    );
    servidor = spawn("php", ["-S", `127.0.0.1:${porta}`, "-t", pasta], { stdio: "ignore" });
    for (let i = 0; i < 50; i++) {
      try {
        await fetch(`${base}/contato-opcoes.json`);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    throw new Error("servidor PHP não subiu");
  });

  afterAll(() => {
    servidor?.kill();
  });

  it("envia a demonstração do WMS por e-mail, com protocolo, resposta ao visitante e campos legíveis", async () => {
    const r = await enviar({ ...contato, tipo: "demonstracao-wms", erp: "protheus", usuarios: "11-30", desafio: "Divergência de estoque", origemPagina: "/mais-i9-wms/" });
    const json = await r.json();
    expect(json.status).toBe("enviado");
    expect(json.protocolo).toMatch(/^[0-9A-F]{8}$/);

    const email = ultimoEmail();
    expect(email.cabecalho).toContain(`To: ${empresa.emailComercial}`);
    expect(email.cabecalho).toContain("Reply-To: Ana Souza <ana@empresa.com.br>");
    expect(email.assunto).toBe(`[Site MAIS i9] Demonstração MAIS i9 WMS: Empresa Teste (Ana Souza) · ${json.protocolo}`);
    expect(email.texto).toContain("Telefone: (47) 99999-8888");
    expect(email.texto).toContain("ERP utilizado: TOTVS Protheus");
    expect(email.texto).toContain("Principal desafio logístico: Divergência de estoque");
    expect(email.texto).toContain(`Consentimento LGPD: sim (política ${versaoPolitica})`);
    expect(email.texto).toContain("Página de origem: /mais-i9-wms/");
  });

  it("aponta os mesmos erros que a validação do site", async () => {
    const casos: [TipoLead, Record<string, string>][] = [
      ["consultoria", { nome: "A", email: "sem-arroba", telefone: "123", servico: "inexistente" }],
      ["demonstracao-wms", { ...contato, telefone: "(47) 3440-212", erp: "outro", usuarios: "x", desafio: "oi" }],
      ["contato", { ...contato, telefone: "", assunto: "proposta", mensagem: "curta", consentimento: "" }],
    ];
    for (const [tipo, campos] of casos) {
      const r = await enviar({ ...campos, tipo });
      const json = await r.json();
      const site = validarLead(tipo, campos);
      expect(json.status, tipo).toBe("invalido");
      expect(site.ok).toBe(false);
      expect(json.erros, tipo).toEqual(site.ok ? {} : site.erros);
    }
  });

  it("recusa robôs (campo invisível ou envio instantâneo) sem enviar e-mail", async () => {
    const antes = ultimoEmail().quantidade;
    const pedido = { ...contato, tipo: "contato", assunto: "proposta", mensagem: "Quero uma proposta de sustentação." };
    expect((await (await enviar({ ...pedido, website: "http://spam" })).json()).status).toBe("falha");
    expect((await (await enviar({ ...pedido, inicio: String(Date.now()) })).json()).status).toBe("falha");
    expect(ultimoEmail().quantidade).toBe(antes);
  });

  it("sem JavaScript, responde com uma página; GET não é aceito", async () => {
    const r = await enviar({ ...contato, tipo: "contato", assunto: "outros", mensagem: "Mensagem enviada sem JavaScript." }, "text/html");
    expect(r.headers.get("content-type")).toContain("text/html");
    expect(await r.text()).toContain("Recebemos sua solicitação");
    expect((await fetch(`${base}/contato.php`)).status).toBe(405);
  });
});

describe.skipIf(!temPhp)("contato.php via SMTP", () => {
  const portaPhp = porta + 1000;
  const comandos: string[] = [];
  let mensagem = "";
  let smtp: import("node:net").Server | undefined;
  let php: ChildProcess | undefined;

  beforeAll(async () => {
    const net = await import("node:net");
    // Servidor SMTP de mentira: registra os comandos e aceita tudo.
    smtp = net.createServer((s) => {
      let emDados = false;
      let buffer = "";
      s.write("220 teste ESMTP\r\n");
      s.on("data", (parte) => {
        buffer += parte.toString();
        let i;
        while ((i = buffer.indexOf("\r\n")) >= 0) {
          const linha = buffer.slice(0, i);
          buffer = buffer.slice(i + 2);
          if (emDados) {
            if (linha === ".") {
              emDados = false;
              s.write("250 OK enfileirado\r\n");
            } else mensagem += linha + "\n";
            continue;
          }
          comandos.push(linha);
          const cmd = linha.toUpperCase();
          if (cmd.startsWith("EHLO")) s.write("250-teste\r\n250 AUTH LOGIN\r\n");
          else if (cmd === "AUTH LOGIN") s.write("334 VXNlcm5hbWU6\r\n");
          else if (comandos.at(-2)?.toUpperCase() === "AUTH LOGIN") s.write("334 UGFzc3dvcmQ6\r\n");
          else if (comandos.at(-3)?.toUpperCase() === "AUTH LOGIN") s.write("235 autenticado\r\n");
          else if (cmd === "DATA") {
            emDados = true;
            s.write("354 envie\r\n");
          } else if (cmd === "QUIT") s.end("221 tchau\r\n");
          else s.write("250 OK\r\n");
        }
      });
    });
    await new Promise<void>((ok) => smtp!.listen(0, "127.0.0.1", ok));
    const portaSmtp = (smtp.address() as import("node:net").AddressInfo).port;

    const dir = mkdtempSync(path.join(tmpdir(), "contato-smtp-"));
    copyFileSync(path.join(pasta, "contato.php"), path.join(dir, "contato.php"));
    copyFileSync(path.join(pasta, "contato-opcoes.json"), path.join(dir, "contato-opcoes.json"));
    writeFileSync(
      path.join(dir, "contato-config.php"),
      `<?php return ['metodo' => 'smtp', 'pasta_limite' => ${JSON.stringify(mkdtempSync(path.join(tmpdir(), "contato-limite-")))},
        'smtp' => ['host' => '127.0.0.1', 'porta' => ${portaSmtp}, 'seguranca' => 'nenhuma', 'usuario' => 'contato@maisi9.com.br', 'senha' => 'segredo']];`,
    );
    php = spawn("php", ["-S", `127.0.0.1:${portaPhp}`, "-t", dir], { stdio: "ignore" });
    for (let i = 0; i < 50; i++) {
      try {
        await fetch(`http://127.0.0.1:${portaPhp}/contato-opcoes.json`);
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  });

  afterAll(() => {
    php?.kill();
    smtp?.close();
  });

  it("autentica, entrega ao destinatário e encerra a conversa", async () => {
    const corpo = new FormData();
    for (const [k, v] of Object.entries({ ...contato, tipo: "contato", assunto: "outros", mensagem: "Mensagem de teste via SMTP." })) corpo.set(k, v);
    const r = await fetch(`http://127.0.0.1:${portaPhp}/contato.php`, { method: "POST", body: corpo, headers: { Accept: "application/json" } });
    expect((await r.json()).status).toBe("enviado");
    expect(comandos).toContain("AUTH LOGIN");
    expect(comandos).toContain(Buffer.from("contato@maisi9.com.br").toString("base64"));
    expect(comandos).toContain(Buffer.from("segredo").toString("base64"));
    expect(comandos).toContain(`MAIL FROM:<${empresa.emailComercial}>`);
    expect(comandos).toContain(`RCPT TO:<${empresa.emailComercial}>`);
    expect(comandos.at(-1)).toBe("QUIT");
    expect(mensagem).toContain("Reply-To: Ana Souza <ana@empresa.com.br>");
  });
});
