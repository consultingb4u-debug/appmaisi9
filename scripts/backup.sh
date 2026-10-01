#!/usr/bin/env sh
# Backup diário do banco (agende no cron do servidor, ex.: 0 2 * * * /caminho/scripts/backup.sh)
# Mantém os últimos 30 dias em ./backups. Restauração:
#   gunzip -c backups/maisi9-AAAAMMDD-HHMM.sql.gz | docker compose exec -T db psql -U maisi9 -d maisi9
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups
ARQ="backups/maisi9-$(date +%Y%m%d-%H%M).sql.gz"
docker compose exec -T db pg_dump -U maisi9 -d maisi9 --no-owner | gzip > "$ARQ"
# Arquivos enviados (planilhas importadas, documentos)
docker compose exec -T app tar czf - -C /app storage > "backups/maisi9-arquivos-$(date +%Y%m%d-%H%M).tar.gz"
find backups -name 'maisi9-*' -mtime +30 -delete
echo "Backup gerado: $ARQ"
