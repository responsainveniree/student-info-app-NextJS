import { PrismaClient } from "./prisma/src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("YOUR_SUPER_SECRET_PASSWORD", 12);

  await prisma.teacher.upsert({
    where: { email: "anothergoat@gmail.com" },
    update: {},
    create: {
      name: "WhoIsHer",
      email: "anothergoat@gmail.com",
      password: passwordHash,
      role: "teacher",
      homeroomClass: {
        create: {
          grade: "eleventh",
          major: "softwareEngineering",
          classNumber: null,
        },
      },
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
      teacherId: "cmiit3zb70000uqy06lc8kdmt",
    },
  });

  console.log("Succesfully seeded");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
