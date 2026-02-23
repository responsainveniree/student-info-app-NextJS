import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(prisma: PrismaClient) {
  console.log("\n👤 Seeding Users...");

  const passwordHash = await bcrypt.hash("Test@12345", 12);

  // 1. Principal
  const principal = await prisma.user.upsert({
    where: { email: "principal@test.com" },
    update: {},
    create: {
      name: "Test Principal",
      email: "principal@test.com",
      password: passwordHash,
      role: "STAFF",
      teacherProfile: { create: { staffRole: "PRINCIPAL" } },
    },
  });
  console.log(`   ✓  Principal: ${principal.email}`);

  // 2. Vice Principal
  const vicePrincipal = await prisma.user.upsert({
    where: { email: "viceprincipal@test.com" },
    update: {},
    create: {
      name: "Test Vice Principal",
      email: "viceprincipal@test.com",
      password: passwordHash,
      role: "STAFF",
      teacherProfile: { create: { staffRole: "VICE_PRINCIPAL" } },
    },
  });
  console.log(`   ✓  Vice Principal: ${vicePrincipal.email}`);

  console.log(`   → 2 users seeded`);
}
