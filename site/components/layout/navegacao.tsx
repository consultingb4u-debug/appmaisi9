"use client";

import clsx from "clsx";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ctaCabecalho, menuPrincipal } from "@/conteudo/navegacao";

function ativo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function NavegacaoDesktop() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="hidden xl:block">
      <ul className="flex items-center gap-1">
        {menuPrincipal.map((item) => {
          const atual = ativo(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={atual ? "page" : undefined}
                className={clsx(
                  "relative rounded-md px-3 py-2 text-[14.5px] font-medium transition-colors",
                  atual ? "text-navy-950" : "text-ardosia-600 hover:text-navy-950",
                )}
              >
                {item.rotulo}
                {atual && <span aria-hidden className="absolute inset-x-3 -bottom-[17px] h-0.5 rounded-full bg-destaque" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MenuMovel() {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [rotaAnterior, setRotaAnterior] = useState(pathname);
  const botao = useRef<HTMLButtonElement>(null);

  // Fecha o menu ao navegar.
  if (rotaAnterior !== pathname) {
    setRotaAnterior(pathname);
    setAberto(false);
  }

  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botao.current?.focus();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <div className="xl:hidden">
      <button
        ref={botao}
        type="button"
        aria-expanded={aberto}
        aria-controls="menu-movel"
        onClick={() => setAberto((v) => !v)}
        className="-mr-2 flex size-11 items-center justify-center rounded-lg text-navy-900 hover:bg-fundo"
      >
        <span className="sr-only">{aberto ? "Fechar menu" : "Abrir menu"}</span>
        {aberto ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
      </button>

      <div
        id="menu-movel"
        hidden={!aberto}
        className="fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto border-t border-ardosia-100 bg-white"
      >
        <nav aria-label="Principal" className="container-site py-6">
          <ul className="divide-y divide-ardosia-100">
            {menuPrincipal.map((item) => {
              const atual = ativo(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={atual ? "page" : undefined}
                    className={clsx(
                      "flex items-center justify-between py-4 text-lg font-medium",
                      atual ? "text-navy-950" : "text-ardosia-700",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      {atual && <span aria-hidden className="size-1.5 rounded-[1px] bg-destaque" />}
                      {item.rotulo}
                    </span>
                    <ArrowRight aria-hidden className="size-4 text-ardosia-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={ctaCabecalho.href}
            className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-destaque px-5 py-3.5 font-semibold text-navy-950"
          >
            {ctaCabecalho.rotulo}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </nav>
      </div>
    </div>
  );
}
