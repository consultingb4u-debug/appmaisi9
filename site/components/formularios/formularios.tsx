"use client";

import { useState } from "react";
import { opcoesServico } from "@/conteudo/consultoria";
import { empresa } from "@/conteudo/empresa";
import { opcoesAssunto } from "@/conteudo/formularios";
import { opcoesErp, opcoesUsuarios } from "@/conteudo/wms";
import { Campo, CampoSelecao, CampoTexto } from "./campos";
import { FormularioLead } from "./formulario-lead";

function ContatoAlternativo() {
  if (!empresa.emailComercial && !empresa.telefoneComercial) return null;
  return (
    <p>
      Se preferir, fale com a equipe comercial
      {empresa.emailComercial && (
        <>
          {" "}
          por <a href={`mailto:${empresa.emailComercial}`} className="font-medium underline">{empresa.emailComercial}</a>
        </>
      )}
      {empresa.telefoneComercial && <> ou pelo telefone {empresa.telefoneComercial}</>}.
    </p>
  );
}

function DadosContato({ telefoneOpcional = false }: { telefoneOpcional?: boolean }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Campo nome="nome" rotulo="Nome" autoComplete="name" />
      <Campo nome="empresa" rotulo="Empresa" autoComplete="organization" />
      <Campo nome="email" rotulo="E-mail corporativo" tipo="email" autoComplete="email" placeholder="nome@empresa.com.br" />
      <Campo nome="telefone" rotulo="Telefone" tipo="tel" autoComplete="tel" placeholder="(00) 00000-0000" opcional={telefoneOpcional} />
    </div>
  );
}

export function FormularioConsultoria() {
  return (
    <FormularioLead
      tipo="consultoria"
      rotuloEnviar="Falar com um especialista Protheus"
      aposEnvio="Um especialista em Protheus vai analisar sua solicitação e entrar em contato para entender o cenário."
      alternativa={<ContatoAlternativo />}
    >
      <DadosContato />
      <CampoSelecao nome="servico" rotulo="Serviço de interesse" opcoes={opcoesServico} parametroUrl="servico" />
      <CampoTexto nome="mensagem" rotulo="Mensagem" opcional placeholder="Conte brevemente o contexto: módulos, demandas, prazos…" />
    </FormularioLead>
  );
}

export function FormularioDemoWms() {
  const [erp, setErp] = useState("");
  return (
    <FormularioLead
      tipo="demonstracao-wms"
      rotuloEnviar="Agendar demonstração"
      aposEnvio="Um especialista do MAIS i9 WMS vai entrar em contato para conhecer a sua operação e combinar a demonstração."
      alternativa={<ContatoAlternativo />}
    >
      <DadosContato />
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoSelecao nome="erp" rotulo="ERP utilizado" opcoes={opcoesErp} aoMudar={setErp} />
        <CampoSelecao nome="usuarios" rotulo="Quantidade aproximada de usuários" opcoes={opcoesUsuarios} />
      </div>
      {erp === "outro" && <Campo nome="erpOutro" rotulo="Qual ERP?" />}
      <CampoTexto
        nome="desafio"
        rotulo="Principal desafio logístico"
        linhas={3}
        placeholder="Ex.: divergências de estoque, controle de lotes, produtividade na expedição…"
      />
    </FormularioLead>
  );
}

export function FormularioContato() {
  return (
    <FormularioLead
      tipo="contato"
      rotuloEnviar="Enviar mensagem"
      aposEnvio="Sua mensagem foi encaminhada à equipe comercial da MAIS i9, que vai retornar o contato."
      alternativa={<ContatoAlternativo />}
    >
      <DadosContato telefoneOpcional />
      <CampoSelecao nome="assunto" rotulo="Assunto de interesse" opcoes={opcoesAssunto} parametroUrl="assunto" />
      <CampoTexto nome="mensagem" rotulo="Mensagem" placeholder="Como podemos ajudar?" />
    </FormularioLead>
  );
}
