import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { HeroPagina } from "@/components/secoes";
import { Pendente } from "@/components/ui";
import { empresa } from "@/conteudo/empresa";
import { versaoPolitica } from "@/conteudo/formularios";
import { metadadosPagina } from "@/lib/site";

export const metadata = metadadosPagina({
  titulo: "Política de Privacidade",
  descricao: "Como a MAIS i9 trata os dados pessoais enviados pelos formulários deste site, conforme a LGPD.",
  caminho: "/politica-de-privacidade",
});

function Topico({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h2>{titulo}</h2>
      {children}
    </section>
  );
}

export default function PoliticaPrivacidade() {
  const controlador = empresa.razaoSocial ?? <Pendente>razão social</Pendente>;
  const cnpj = empresa.cnpj ?? <Pendente>CNPJ</Pendente>;
  const encarregado = empresa.encarregadoDados;

  return (
    <>
      <HeroPagina
        trilha={[
          { nome: "Início", caminho: "/" },
          { nome: "Política de Privacidade", caminho: "/politica-de-privacidade" },
        ]}
        sobretitulo="LGPD"
        titulo="Política de Privacidade"
        descricao="Como tratamos os dados pessoais enviados pelos formulários deste site."
      />
      <div className="container-site py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div role="note" className="mb-12 flex gap-3 rounded-xl border border-alerta/40 bg-alerta/10 p-5 text-sm text-navy-900">
            <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-[#8a6a00]" />
            <p>
              <strong>Minuta para validação jurídica.</strong> Este texto é uma base inicial e deve ser revisado e aprovado pelo
              jurídico da MAIS i9 antes da publicação do site. Versão: {versaoPolitica}.
            </p>
          </div>

          <div className="artigo">
            <Topico titulo="1. Quem é o controlador dos dados">
              <p>
                Os dados pessoais enviados por este site são tratados por {controlador}, inscrita no CNPJ sob o nº {cnpj} (“MAIS
                i9”), na condição de controladora, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).
              </p>
            </Topico>

            <Topico titulo="2. Quais dados coletamos">
              <p>Coletamos apenas os dados que você informa nos formulários de contato, proposta e demonstração:</p>
              <ul>
                <li>nome, empresa, e-mail corporativo e telefone;</li>
                <li>assunto ou serviço de interesse e a mensagem enviada;</li>
                <li>no pedido de demonstração: ERP utilizado, quantidade aproximada de usuários e principal desafio logístico;</li>
                <li>registro do consentimento (data, hora e versão desta política) e a preferência sobre comunicações;</li>
                <li>
                  informações sobre a origem do acesso (página do site, endereço de referência e parâmetros de campanha), usadas
                  para entender como você chegou até nós.
                </li>
              </ul>
              <p>
                Este site não utiliza cookies de publicidade. <Pendente>revisar este item se forem adicionadas ferramentas de análise ou marketing</Pendente>
              </p>
            </Topico>

            <Topico titulo="3. Para que usamos os dados">
              <ul>
                <li>responder à sua solicitação, entrar em contato e apresentar propostas comerciais;</li>
                <li>agendar e realizar demonstrações do MAIS i9 WMS;</li>
                <li>registrar o histórico do relacionamento comercial;</li>
                <li>enviar conteúdos e comunicações da MAIS i9, somente se você tiver autorizado.</li>
              </ul>
            </Topico>

            <Topico titulo="4. Bases legais">
              <p>
                O tratamento se apoia no consentimento do titular (art. 7º, I), na execução de procedimentos preliminares
                relacionados a contrato a pedido do titular (art. 7º, V) e no legítimo interesse da MAIS i9 em responder e manter
                o relacionamento comercial (art. 7º, IX), sempre respeitados os direitos e as expectativas do titular.
              </p>
            </Topico>

            <Topico titulo="5. Compartilhamento">
              <p>
                Os dados não são vendidos. Podem ser compartilhados com fornecedores que nos ajudam a operar o site e o
                relacionamento comercial (hospedagem, e-mail e sistema de gestão de clientes), que atuam como operadores e seguem
                as nossas instruções. <Pendente>listar os fornecedores utilizados</Pendente>
              </p>
            </Topico>

            <Topico titulo="6. Por quanto tempo guardamos">
              <p>
                Mantemos os dados pelo tempo necessário para atender às finalidades acima ou enquanto houver relacionamento
                comercial, e pelos prazos exigidos por lei. <Pendente>definir prazo de retenção dos leads</Pendente>
              </p>
            </Topico>

            <Topico titulo="7. Seus direitos">
              <p>
                Você pode, a qualquer momento, solicitar confirmação do tratamento, acesso, correção, anonimização, bloqueio ou
                eliminação dos dados, portabilidade, informações sobre compartilhamento e revogação do consentimento (art. 18 da
                LGPD). Também pode cancelar o recebimento de comunicações a qualquer momento.
              </p>
            </Topico>

            <Topico titulo="8. Segurança">
              <p>
                Adotamos medidas técnicas e administrativas para proteger os dados contra acessos não autorizados e situações
                acidentais ou ilícitas de destruição, perda, alteração ou divulgação.
              </p>
            </Topico>

            <Topico titulo="9. Encarregado pelo tratamento de dados">
              <p>
                Para exercer seus direitos ou tirar dúvidas sobre esta política, fale com o encarregado:{" "}
                {encarregado.nome ?? <Pendente>nome do encarregado</Pendente>} —{" "}
                {encarregado.email ? <a href={`mailto:${encarregado.email}`}>{encarregado.email}</a> : <Pendente>e-mail do encarregado</Pendente>}.
              </p>
            </Topico>

            <Topico titulo="10. Alterações">
              <p>
                Esta política pode ser atualizada. A versão vigente é sempre a publicada nesta página, e a versão aceita em cada
                envio de formulário fica registrada junto com a sua solicitação.
              </p>
            </Topico>
          </div>
        </div>
      </div>
    </>
  );
}
