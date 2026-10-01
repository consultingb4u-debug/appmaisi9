import { horasPrevistas } from "@/lib/domain/alocacao";

type AlocacaoDb = {
  horasCalculadas: { toNumber(): number };
  horasManuais: { toNumber(): number } | null;
  horasAvulsas: { toNumber(): number };
  horasRealizadas: { toNumber(): number };
};

export function previstas(a: AlocacaoDb): number {
  return horasPrevistas({ horasCalculadas: a.horasCalculadas.toNumber(), horasManuais: a.horasManuais?.toNumber() ?? null, horasAvulsas: a.horasAvulsas.toNumber() });
}

export function realizadas(a: AlocacaoDb): number {
  return a.horasRealizadas.toNumber();
}
