import { PrismaClient } from "./prisma/src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("YOUR_SUPER_SECRETTTTT", 12);

  await prisma.teacher.upsert({
    where: { email: "anothergoat@gmail.com" },
    update: {},
    create: {
      id: "TCH09221232341",
      name: "WhoIsHer",
      email: "anothergoat@gmail.com",
      password: passwordHash,
      role: "teacher",
    },
  });

  await prisma.student.upsert({
    where: { email: "thegoat@gmail.com" },
    update: {},
    create: {
      name: "WhoIsHim?",
      email: "thegoat@gmail.com",
      password: passwordHash,
      role: "student",
      grade: "eleventh",
      major: "softwareEngineering",
      isVerified: true,
      teacherId: "TCH09221232341",
    },
  });

  console.log("Succesfully seeded");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
