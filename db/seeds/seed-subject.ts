import { Grade, Major } from "@/lib/constants/class";
import { SubjectType } from "@/lib/constants/subject";
import { PrismaClient } from "@prisma/client";
import { create } from "domain";

type SubjectSeed = {
  name: string;
  type: SubjectType;
  grades: Grade[];
  majors: Major[];
};

const SUBJECT_DATA: SubjectSeed[] = [
  // ── GENERAL – SEMUA KELAS & JURUSAN ──────────────────────────────────
  {
    name: "English",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Civic Education",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Mathematics",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Religion",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Indonesian",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Conversation",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "History",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },

  // ── GENERAL – KELAS 10 & 11 ───────────────────────────────────────────
  {
    name: "Physical Education",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Mandarin",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "PAL",
    type: "GENERAL",
    grades: ["TENTH", "ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },

  // ── GENERAL – KELAS 10 SAJA ───────────────────────────────────────────
  {
    name: "Information Technology",
    type: "GENERAL",
    grades: ["TENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Art",
    type: "GENERAL",
    grades: ["TENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Fundamentals of Science & Social",
    type: "GENERAL",
    grades: ["TENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },

  // ── MAJOR – SOFTWARE ENGINEERING ─────────────────────────────────────
  {
    name: "Fundamentals of Fluency SWE",
    type: "MAJOR",
    grades: ["TENTH"],
    majors: ["SOFTWARE_ENGINEERING"],
  },
  {
    name: "Creative Entrepreneurial Products SWE",
    type: "MAJOR",
    grades: ["ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING"],
  },
  {
    name: "Web Development",
    type: "MAJOR",
    grades: ["ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING"],
  },
  {
    name: "Database",
    type: "MAJOR",
    grades: ["ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING"],
  },
  {
    name: "Object Oriented Programming",
    type: "MAJOR",
    grades: ["ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING"],
  },
  {
    name: "Mobile Development",
    type: "MAJOR",
    grades: ["ELEVENTH", "TWELFTH"],
    majors: ["SOFTWARE_ENGINEERING"],
  },

  // ── MAJOR – ACCOUNTING ────────────────────────────────────────────────
  {
    name: "Fundamentals of Fluency Accounting",
    type: "MAJOR",
    grades: ["TENTH"],
    majors: ["ACCOUNTING"],
  },
  {
    name: "Accounting Principles",
    type: "MAJOR",
    grades: ["ELEVENTH", "TWELFTH"],
    majors: ["ACCOUNTING"],
  },

  // ── MAJOR – KEDUA JURUSAN ─────────────────────────────────────────────
  {
    name: "Creative Entrepreneurial Products Accounting",
    type: "MAJOR",
    grades: ["TENTH", "ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Computerized Accounting",
    type: "MAJOR",
    grades: ["TENTH", "ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Financial Accounting",
    type: "MAJOR",
    grades: ["TENTH", "ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Banking",
    type: "MAJOR",
    grades: ["TENTH", "ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Taxation",
    type: "MAJOR",
    grades: ["TENTH", "ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
  {
    name: "Microsoft Office",
    type: "MAJOR",
    grades: ["ELEVENTH"],
    majors: ["SOFTWARE_ENGINEERING", "ACCOUNTING"],
  },
];

export async function seedSubjects(prisma: PrismaClient) {
  console.log("\n📖 Seeding Subjects...");

  let created = 0;
  let skipped = 0;

  for (const subject of SUBJECT_DATA) {
    const existing = await prisma.subject.findUnique({
      where: { name: subject.name },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.$transaction(async (tx: any) => {
      const config = await tx.subjectConfig.create({
        data: {
          type: subject.type,
          allowedGrades: subject.grades,
          allowedMajors: subject.majors,
        },
      });

      await tx.subject.create({
        data: {
          name: subject.name,
          type: subject.type,
          configId: config.id,
        },
      });
    });

    console.log(`   ✓  ${subject.name} (${subject.type})`);
    created++;
  }

  console.log(`   → ${created} created, ${skipped} skipped`);
}
