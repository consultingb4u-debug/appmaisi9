#!/usr/bin/env bash
# Gera o pacote para a Hostinger: site estático (public_html) + configuração de e-mail + instruções.
set -euo pipefail
cd "$(dirname "$0")/.."

export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://www.maisi9.com.br}"
export SITE_INDEXAVEL="${SITE_INDEXAVEL:-true}"

rm -rf out
npx next build

for arquivo in index.html 404.html contato.php .htaccess contato-opcoes.json sitemap.xml robots.txt; do
  test -f "out/$arquivo" || { echo "Faltou out/$arquivo no build" >&2; exit 1; }
done

pasta=pacote-hostinger
rm -rf "$pasta" site-maisi9-hostinger.zip
mkdir -p "$pasta"
# O site vai num zip próprio, com os arquivos na raiz: enviado para public_html e extraído lá mesmo,
# leva todas as pastas (inclusive _next e o .htaccess oculto).
(cd out && zip -qr "../$pasta/ENVIAR-PARA-public_html.zip" .)
cp hostinger/contato-config.php hostinger/diagnostico.php hostinger/LEIA-ME.txt "$pasta/"
(cd "$pasta" && zip -qr ../site-maisi9-hostinger.zip .)
echo "Pacote: $(pwd)/site-maisi9-hostinger.zip"
