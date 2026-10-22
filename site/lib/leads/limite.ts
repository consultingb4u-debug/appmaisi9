/**
 * Limite simples de envios por chave (IP) em janela deslizante, em memória.
 * Protege o canal de entrega contra abuso; em várias instâncias o limite é por instância.
 */
export function criarLimitador({ maximo, janelaMs, agora = Date.now }: { maximo: number; janelaMs: number; agora?: () => number }) {
  const registros = new Map<string, number[]>();
  return function permitir(chave: string): boolean {
    const t = agora();
    const recentes = (registros.get(chave) ?? []).filter((x) => t - x < janelaMs);
    if (recentes.length >= maximo) {
      registros.set(chave, recentes);
      return false;
    }
    recentes.push(t);
    registros.set(chave, recentes);
    // Evita crescimento indefinido do mapa.
    if (registros.size > 5000) {
      for (const [k, v] of registros) if (!v.some((x) => t - x < janelaMs)) registros.delete(k);
    }
    return true;
  };
}
