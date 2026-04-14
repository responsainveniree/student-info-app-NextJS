import { Prisma } from "@prisma/client";

type SubjectWithConfig = Prisma.SubjectGetPayload<{
  select: {
    config: {
      select: {
        allowedGrades: true;
        type: true;
        allowedMajors: true;
      };
    };
    name: true;
    id: true;
  };
}>;

type GroupedSubjects = Record<string, any[]>;

export const groupSubjects = (
  subjects: SubjectWithConfig[],
): GroupedSubjects => {
  const grouped: GroupedSubjects = {
    general: [],
    accounting: [],
    software_engineering: [],
  };

  subjects.forEach((subject) => {
    if (subject.config.type === "GENERAL") {
      grouped.general.push(subject);
    } else if (
      subject.config.type === "MAJOR" &&
      subject.config.allowedMajors.includes("ACCOUNTING")
    ) {
      grouped.accounting.push(subject);
    } else if (
      subject.config.type === "MAJOR" &&
      subject.config.allowedMajors.includes("SOFTWARE_ENGINEERING")
    ) {
      grouped.software_engineering.push(subject);
    }
  });

  return grouped;
};
