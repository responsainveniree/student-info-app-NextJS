import { prisma } from "@/db/prisma";
import { badRequest } from "@/lib/errors";
import { getSemester } from "@/lib/utils/date";

export const updateSemseter = async () => {
  const currentDate = new Date();
  const semester = getSemester(currentDate);
  const transformSemester = semester == 1 ? "FIRST" : "SECOND";

  // Check database semester
  let databaseSemester = await prisma.gradebook.findFirst({
    select: {
      semester: true,
    },
  });

  if (!databaseSemester) databaseSemester = { semester: "FIRST" };

  if (transformSemester === databaseSemester.semester) {
    throw badRequest(
      `You can't update the semester now. It's still in the ${semester} semester scope`,
    );
  }

  await prisma.$transaction([
    prisma.assessment.deleteMany(),

    prisma.$executeRawUnsafe(
      `ALTER SEQUENCE "Assessment_id_seq" RESTART WITH 1;`,
    ),
    prisma.$executeRawUnsafe(
      `ALTER SEQUENCE "AssessmentScore_id_seq" RESTART WITH 1;`,
    ),

    prisma.gradebook.updateMany({
      data: { semester: transformSemester },
    }),
  ]);

  return {
    currentSemester: transformSemester,
  };
};
