"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export type ItemMenu = { href: string; rotulo: string; icone: string; emBreve?: string };

export function MenuLateral({ principal, admin }: { principal: ItemMenu[]; admin: ItemMenu[] }) {
  const caminho = usePathname();
  const ativo = (href: string) => (href === "/" ? caminho === "/" : caminho.startsWith(href));

  const renderItem = (item: ItemMenu) =>
    item.emBreve ? (
      <span key={item.href} className="flex cursor-default items-center gap-3 rounded-md px-3 py-2 text-sm text-ardosia-400/70" title={`Disponível no ${item.emBreve}`}>
        <span className="w-4 text-center">{item.icone}</span>
        <span className="flex-1">{item.rotulo}</span>
        <span className="rounded bg-white/5 px-1.5 text-[10px] uppercase">em breve</span>
      </span>
    ) : (
      <Link
        key={item.href}
        href={item.href}
        onClick={(e) => e.currentTarget.closest("details")?.removeAttribute("open")}
        className={clsx(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
          ativo(item.href) ? "bg-white/10 font-medium text-white" : "text-ardosia-200 hover:bg-white/5 hover:text-white",
        )}
      >
        <span className={clsx("w-4 text-center", ativo(item.href) && "text-destaque")}>{item.icone}</span>
        {item.rotulo}
      </Link>
    );

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {principal.map(renderItem)}
      {admin.length > 0 && (
        <>
          <div className="mt-6 mb-1 px-3 text-[11px] font-semibold tracking-wider text-ardosia-400 uppercase">Administração</div>
          {admin.map(renderItem)}
        </>
      )}
    </nav>
  );
}
