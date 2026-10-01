import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Vazio é aceito para `prisma generate` (build e CI); migrate e seed exigem a URL.
    url: process.env.DATABASE_URL ?? "",
  },
});
