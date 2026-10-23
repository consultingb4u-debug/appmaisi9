/** Resultado do envio de um formulário: o mesmo JSON que `public/contato.php` devolve. */
export type EstadoFormulario =
  | { status: "inicial" }
  | { status: "invalido"; erros: Record<string, string> }
  | { status: "enviado"; protocolo: string }
  | { status: "nao-configurado" }
  | { status: "falha"; mensagem: string };

export const estadoInicial: EstadoFormulario = { status: "inicial" };

/** Endereço que recebe os formulários (PHP na hospedagem). */
export const enderecoEnvio = process.env.NEXT_PUBLIC_LEADS_ENDPOINT || "/contato.php";

const STATUS = new Set(["invalido", "enviado", "nao-configurado", "falha"]);

/** Lê a resposta do servidor; qualquer coisa fora do formato esperado vira "não configurado". */
export function lerResposta(json: unknown): EstadoFormulario {
  if (json && typeof json === "object" && STATUS.has((json as { status?: string }).status ?? "")) {
    return json as EstadoFormulario;
  }
  return { status: "nao-configurado" };
}
