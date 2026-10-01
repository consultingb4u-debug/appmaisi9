import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

function criarCliente() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Uma única instância por processo (o hot reload do `next dev` recria módulos).
const global_ = globalThis as unknown as { prisma?: PrismaClient };
export const db = global_.prisma ?? criarCliente();
if (process.env.NODE_ENV !== "production") global_.prisma = db;
