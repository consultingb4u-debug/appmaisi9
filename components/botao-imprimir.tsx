"use client";

import { classeBotao } from "./ui";

export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className={classeBotao("secundario", "sm")}>
      Imprimir / PDF
    </button>
  );
}
