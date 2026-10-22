/** Resultado do envio de um formulário, compartilhado entre a Server Action e o componente. */
export type EstadoFormulario =
  | { status: "inicial" }
  | { status: "invalido"; erros: Record<string, string> }
  | { status: "enviado"; protocolo: string }
  | { status: "nao-configurado" }
  | { status: "falha"; mensagem: string };

export const estadoInicial: EstadoFormulario = { status: "inicial" };
