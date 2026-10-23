import type { LucideIcon } from "lucide-react";

/** Diferencial exibido no mosaico. O primeiro da lista vira o cartão em destaque. */
export type Diferencial = {
  titulo: string;
  texto: string;
  icone?: LucideIcon;
  /** Só no destaque: linhas com ícone, título e texto curto. */
  focos?: { titulo: string; texto: string; icone: LucideIcon }[];
  /** Só no destaque: etiquetas (ex.: áreas de especialidade). */
  etiquetas?: string[];
};
