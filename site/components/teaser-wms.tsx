"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { VideoTeaser } from "@/conteudo/wms";

/**
 * Teaser em loop, sem som. Só carrega e toca quando aparece na tela, pausa fora dela,
 * não toca sozinho com "reduzir movimento" e tem botão de pausar (WCAG 2.2.2).
 */
export function TeaserWms({ video }: { video: VideoTeaser }) {
  const ref = useRef<HTMLVideoElement>(null);
  const pausadoPeloVisitante = useRef(false);
  const [tocando, setTocando] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Autoplay no celular exige vídeo mudo.
    el.muted = true;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting && !pausadoPeloVisitante.current) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.35 },
    );
    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  function alternar() {
    const el = ref.current;
    if (!el) return;
    pausadoPeloVisitante.current = !el.paused;
    if (el.paused) {
      el.muted = true;
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }

  return (
    <figure className="relative overflow-hidden rounded-3xl bg-navy-950 shadow-2xl shadow-navy-950/20 ring-1 ring-navy-950/10">
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        poster={video.poster}
        width={video.largura}
        height={video.altura}
        aria-label={video.descricao}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        className="block h-auto w-full"
      >
        <source src={video.webm} type="video/webm" />
        <source src={video.mp4} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={alternar}
        aria-label={tocando ? "Pausar vídeo" : "Reproduzir vídeo"}
        className="absolute right-3 bottom-3 flex size-10 items-center justify-center rounded-full bg-navy-950/75 text-white ring-1 ring-white/25 transition-colors hover:bg-navy-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque sm:right-4 sm:bottom-4"
      >
        {tocando ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4 translate-x-px" />}
      </button>
    </figure>
  );
}
