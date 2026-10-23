/**
 * Máscara de telefone brasileiro com DDD: (47) 3440-2120 (fixo) ou (47) 99999-9999 (celular).
 * Aceita colar com +55 ou zero à frente; o que passa de 11 dígitos é descartado.
 */
export function digitosTelefone(valor: string): string {
  let d = valor.replace(/\D/g, "").replace(/^0+/, "");
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  return d.slice(0, 11);
}

export function formatarTelefone(valor: string): string {
  const d = digitosTelefone(valor);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  const ddd = d.slice(0, 2);
  const numero = d.slice(2);
  // Com 11 dígitos é celular (5 + 4); até 10, fixo (4 + 4).
  const corte = d.length === 11 ? 5 : 4;
  if (numero.length <= corte) return `(${ddd}) ${numero}`;
  return `(${ddd}) ${numero.slice(0, corte)}-${numero.slice(corte)}`;
}

/** Posição do cursor no texto formatado que deixa à esquerda a mesma quantidade de dígitos. */
export function posicaoAposDigitos(formatado: string, digitos: number): number {
  if (digitos <= 0) return formatado.startsWith("(") && formatado.length > 1 ? 1 : 0;
  let vistos = 0;
  for (let i = 0; i < formatado.length; i++) {
    if (/\d/.test(formatado[i]) && ++vistos === digitos) return i + 1;
  }
  return formatado.length;
}
