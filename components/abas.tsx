"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export type Aba = { href: string; rotulo: string; emBreve?: boolean };

export function Abas({ abas }: { abas: Aba[] }) {
  const caminho = usePathname();
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-ardosia-200">
      {abas.map((a) =>
        a.emBreve ? (
          <span key={a.href} className="cursor-default px-3 py-2 text-sm whitespace-nowrap text-ardosia-400" title="Em um próximo incremento">
            {a.rotulo}
          </span>
        ) : (
          <Link
            key={a.href}
            href={a.href}
            className={clsx(
              "-mb-px border-b-2 px-3 py-2 text-sm whitespace-nowrap transition",
              caminho === a.href ? "border-destaque font-medium text-navy-900" : "border-transparent text-ardosia-600 hover:text-navy-900",
            )}
          >
            {a.rotulo}
          </Link>
        ),
      )}
    </nav>
  );
}
