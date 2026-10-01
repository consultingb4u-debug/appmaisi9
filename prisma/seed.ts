// Dados iniciais (idempotente — pode rodar várias vezes).
// Recursos, capacidades e clientes vêm das listas do CTRL-003 v5.3 (aba Parâmetros/Capacidade).
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { dia } from "../lib/domain/datas";
import { feriadosNacionais } from "../lib/domain/feriados";
import { semanasEntre } from "../lib/domain/semanas";
import { CRITERIOS_COMPLEXIDADE } from "../lib/domain/modelos";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const RECURSOS: { nome: string; horas: number; cargo?: string; apelidos?: string[] }[] = [
  { nome: "Carlos Camargo", horas: 40, cargo: "Gerente de Projetos" },
  { nome: "Alexandre Camargo", horas: 40 },
  { nome: "Murilo Fernandes", horas: 40 },
  { nome: "Julis Felipe", horas: 40 },
  { nome: "Luiz Dornelles", horas: 40, apelidos: ["Dornelles"] },
  { nome: "Vandrian Kohler", horas: 40 },
  { nome: "Luciano Souza", horas: 40 },
  { nome: "Diego Fortunato", horas: 40 },
  { nome: "Miguel Barater", horas: 30 },
  { nome: "Diego Bonilha", horas: 30 },
  { nome: "Laura Camargo", horas: 40, cargo: "Analista", apelidos: ["Laura Iris"] },
  { nome: "Adilson Elias", horas: 40 },
];

const CLIENTES = ["Agricopel", "Alltech", "Buhler", "CCP", "Dipil", "Erzeg", "Global", "Hitachi", "Kover", "Metalnox", "Sensus", "Sintex", "Sonepar", "Sulmedic"];

async function main() {
  // Calendário de semanas ISO 2025–2028
  const semanas = semanasEntre(dia(2025, 1, 1), dia(2028, 12, 31));
  await db.semana.createMany({
    data: semanas.map((s) => ({ id: s.id, anoIso: s.anoIso, numero: s.numero, inicio: s.inicio, fim: s.fim })),
    skipDuplicates: true,
  });

  for (const ano of [2026, 2027]) {
    await db.feriado.createMany({
      data: feriadosNacionais(ano).map((f) => ({ data: f.data, descricao: f.descricao, abrangencia: "NACIONAL" as const })),
      skipDuplicates: true,
    });
  }

  for (const r of RECURSOS) {
    const existente = await db.recurso.findUnique({ where: { nome: r.nome } });
    if (existente) continue;
    await db.recurso.create({
      data: {
        nome: r.nome,
        cargo: r.cargo,
        capacidades: { create: { vigenciaInicio: dia(2026, 1, 1), horasSemanais: r.horas } },
        apelidos: r.apelidos ? { create: r.apelidos.map((apelido) => ({ apelido })) } : undefined,
      },
    });
  }

  await db.cliente.createMany({ data: CLIENTES.map((nome) => ({ nome })), skipDuplicates: true });

  // Critérios de complexidade do CTRL-001 (editáveis depois; o seed não sobrescreve).
  await db.criterioComplexidade.createMany({
    data: CRITERIOS_COMPLEXIDADE.map((c, i) => ({ dimensao: c.dimensao, nome: c.nome, descricao0: c.d[0], descricao1: c.d[1], descricao2: c.d[2], descricao3: c.d[3], ordem: i + 1 })),
    skipDuplicates: true,
  });

  // Administrador para o login de desenvolvimento (nunca usado em produção).
  if (process.env.AUTH_DEV_LOGIN === "true") {
    await db.usuario.upsert({
      where: { email: "admin@maisi9.local" },
      update: {},
      create: { email: "admin@maisi9.local", nome: "Administrador (dev)", perfil: "ADMIN" },
    });
  }

  console.log(`Seed concluído: ${semanas.length} semanas, ${RECURSOS.length} recursos, ${CLIENTES.length} clientes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
