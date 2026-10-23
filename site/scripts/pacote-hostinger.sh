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
cp -R out "$pasta/public_html"
cp hostinger/contato-config.php hostinger/LEIA-ME.txt "$pasta/"
(cd "$pasta" && zip -qr ../site-maisi9-hostinger.zip .)
echo "Pacote: $(pwd)/site-maisi9-hostinger.zip"
