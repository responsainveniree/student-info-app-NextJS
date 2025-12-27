import { PrismaClient } from "./prisma/src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Test@12345", 12);

  console.log("Starting database seeding...");

  // 1. Create Principal
  const principal = await prisma.teacher.upsert({
    where: { email: "principal@test.com" },
    update: {},
    create: {
      name: "Test Principal",
      email: "principal@test.com",
      password: passwordHash,
      role: "PRINCIPAL",
    },
  });
  console.log("✓ Created Principal:", principal.email);

  // 2. Create Vice Principal
  const vicePrincipal = await prisma.teacher.upsert({
    where: { email: "viceprincipal@test.com" },
    update: {},
    create: {
      name: "Test Vice Principal",
      email: "viceprincipal@test.com",
      password: passwordHash,
      role: "VICE_PRINCIPAL",
    },
  });
  console.log("✓ Created Vice Principal:", vicePrincipal.email);

  // 3. Create Teacher with Homeroom Class
  const teacher = await prisma.teacher.upsert({
    where: { email: "teacher@test.com" },
    update: {},
    create: {
      name: "Test Teacher",
      email: "teacher@test.com",
      password: passwordHash,
      role: "TEACHER",
      homeroomClass: {
        create: {
          grade: "ELEVENTH",
          major: "SOFTWARE_ENGINEERING",
          classNumber: "1",
        },
      },
    },
  });
  console.log("✓ Created Teacher:", teacher.email);

  // 4. Create Class Secretary (Student with special role)
  const secretary = await prisma.student.upsert({
    where: { email: "secretary@test.com" },
    update: {},
    create: {
      name: "Test Class Secretary",
      email: "secretary@test.com",
      password: passwordHash,
      role: "CLASS_SECRETARY",
      grade: "ELEVENTH",
      major: "SOFTWARE_ENGINEERING",
      classNumber: "1",
      isVerified: true,
      homeroomTeacherId: teacher.id,
    },
  });
  console.log("✓ Created Class Secretary:", secretary.email);

  // 5. Create Regular Student
  const student = await prisma.student.upsert({
    where: { email: "student@test.com" },
    update: {},
    create: {
      name: "Test Student",
      email: "student@test.com",
      password: passwordHash,
      role: "STUDENT",
      grade: "ELEVENTH",
      major: "SOFTWARE_ENGINEERING",
      classNumber: "1",
      isVerified: true,
      homeroomTeacherId: teacher.id,
    },
  });
  console.log("✓ Created Student:", student.email);

  console.log("\n✅ Successfully seeded database!");
  console.log("\n📋 Test Accounts (Password: Test@12345):");
  console.log("   - Principal: principal@test.com");
  console.log("   - Vice Principal: viceprincipal@test.com");
  console.log("   - Teacher: teacher@test.com");
  console.log("   - Class Secretary: secretary@test.com");
  console.log("   - Student: student@test.com");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

