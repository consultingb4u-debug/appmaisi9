import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { empresa, type ArquivoLogo } from "@/conteudo/empresa";

/**
 * Logotipo oficial da MAIS i9, exibido exatamente como fornecido: só a altura é definida
 * e a largura acompanha a proporção original. Sem o arquivo configurado em
 * `conteudo/empresa.ts`, mostra apenas o nome da empresa em texto simples — não é
 * uma versão do logotipo e deve ser substituído pelo arquivo oficial.
 */
export function Marca({ fundo = "claro", altura = 36, className }: { fundo?: "claro" | "escuro"; altura?: number; className?: string }) {
  const { positivo, negativo } = empresa.logo;
  const arquivo = fundo === "escuro" ? (negativo ?? positivo) : positivo;
  const precisaPlaca = fundo === "escuro" && !negativo && !!positivo;

  return (
    <Link href="/" aria-label={`${empresa.nome} — página inicial`} className={clsx("inline-flex shrink-0 items-center", className)}>
      {arquivo ? (
        <span className={clsx(precisaPlaca && "rounded-md bg-white px-3 py-2")}>
          <LogoArquivo arquivo={arquivo} altura={altura} />
        </span>
      ) : (
        <span
          data-pendente="logotipo"
          className={clsx("text-xl font-bold tracking-tight", fundo === "escuro" ? "text-white" : "text-navy-950")}
        >
          {empresa.nome}
        </span>
      )}
    </Link>
  );
}

function LogoArquivo({ arquivo, altura }: { arquivo: ArquivoLogo; altura: number }) {
  const largura = Math.round((arquivo.largura / arquivo.altura) * altura);
  return (
    <Image
      src={arquivo.src}
      alt={empresa.nome}
      width={largura}
      height={altura}
      loading="eager"
      unoptimized={arquivo.src.endsWith(".svg")}
      style={{ width: largura, height: altura }}
    />
  );
}
