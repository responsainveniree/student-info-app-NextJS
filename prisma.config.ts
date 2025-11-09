import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "lib/prisma/schema-postgresql.prisma",
  migrations: {
    path: "lib/prisma",
    seed: `tsx lib/prisma/seed.ts`,
  },
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
