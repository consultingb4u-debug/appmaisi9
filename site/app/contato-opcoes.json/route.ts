import { empresa } from "@/conteudo/empresa";
import { versaoPolitica } from "@/conteudo/formularios";
import { camposPorTipo, rotuloTipoLead } from "@/lib/leads/esquemas";

export const dynamic = "force-static";

/**
 * Rótulos e opções dos formulários, gerados no build a partir de `conteudo/`.
 * Lido por `public/contato.php` para validar as escolhas e montar o e-mail.
 */
export function GET() {
  return Response.json({
    versaoPolitica,
    emailComercial: empresa.emailComercial,
    tipos: rotuloTipoLead,
    campos: camposPorTipo,
  });
}
