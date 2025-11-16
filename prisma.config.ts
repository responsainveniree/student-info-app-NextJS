import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
dotenv.config();

export default defineConfig({
  schema: "prisma/schema-postgresql.prisma",
  migrations: {
    path: "prisma/migration",
    seed: `tsx prisma/seed.ts`,
  },
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
});
