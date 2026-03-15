import { ClassSection, Grade, Major } from "@/lib/constants/class";

export async function findClassroom(
  grade: Grade,
  major: Major,
  section: ClassSection,
  tx: any,
) {
  return tx.classroom.findUnique({
    where: {
      grade_major_section: {
        grade,
        major,
        section,
      },
    },
    select: {
      id: true,
    },
  });
}
