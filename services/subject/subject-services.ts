import { prisma } from "@/db/prisma";
import {
  ensureSingleMajorForMajorType,
  validateConfigUniqueness,
  validateSubjectUniqueness,
} from "@/domain/subject/subject-rules";
import { compareSubjectConfig } from "@/domain/subject/subject-validations";
import { Grade, Major } from "@/lib/constants/class";
import { MIN_SEARCH_LENGTH } from "@/lib/constants/pagination";
import { SubjectType } from "@/lib/constants/subject";
import { badRequest, notFound, unprocessableEntity } from "@/lib/errors";
import {
  CreateSubjectSchema,
  PatchSubjectSchema,
  SubjectQueriesSchema,
} from "@/lib/zod/subject";
import {
  findSubjects,
  findUniqueSubject,
} from "@/repositories/subject-repository";
import { Prisma } from "@prisma/client";

export async function createSubjects(data: CreateSubjectSchema) {
  const uniqueSubjects = new Set<string>();
  const subjectMap = new Map<
    string,
    { subjectType: SubjectType; majors: Major[]; grades: Grade[] }
  >();

  //Validation
  data.subjectRecords.map((record, index) => {
    // Multiple majors are not allowed for subjects with type 'MAJOR'.
    ensureSingleMajorForMajorType(record, index);

    validateConfigUniqueness(record, index, uniqueSubjects, subjectMap);
  });

  const uniqueSubjectsArray = Array.from(uniqueSubjects);
  const uniqueSubjectNames = uniqueSubjectsArray.map(
    (subject: any) => subject.split("-")[0],
  );

  const subjectsByNameQuery = Prisma.validator<Prisma.SubjectWhereInput>()({
    name: {
      in: uniqueSubjectNames,
      mode: "insensitive",
    },
  });

  const subjectNameSelect = Prisma.validator<Prisma.SubjectSelect>()({
    name: true,
  });

  const existingSubjects = await findSubjects(
    prisma,
    subjectsByNameQuery,
    subjectNameSelect,
    true,
    "asc",
  );

  validateSubjectUniqueness(uniqueSubjectNames, existingSubjects);

  if (existingSubjects.length === uniqueSubjectNames.length) {
    throw unprocessableEntity(
      "All subjects in your request are already present in the database.",
    );
  }

  await prisma.$transaction(async (tx) => {
    const uniqueConfigs = Array.from(
      new Set(
        uniqueSubjectNames.map((name) => {
          const config = subjectMap.get(name);

          if (!config) return null;

          return JSON.stringify({
            ...config,
            // Sort these so the string is ALWAYS the same for the same data
            major: [...config.majors].sort(),
            grade: [...config.grades].sort(),
          });
        }),
      ),
    )
      .filter((str): str is string => !!str)
      .map((str) => JSON.parse(str));

    const configMap = new Map();

    for (const config of uniqueConfigs) {
      // Exact match check - many DBs allow array equals
      let targetConfig = await tx.subjectConfig.findFirst({
        where: {
          type: config.subjectType,
          allowedMajors: { equals: config.major },
          allowedGrades: { equals: config.grade },
        },
      });

      if (!targetConfig) {
        targetConfig = await tx.subjectConfig.create({
          data: {
            type: config.subjectType,
            allowedMajors: config.major,
            allowedGrades: config.grade,
          },
        });
      }

      // Store the ID so subjects can find it without another query
      const configKey = JSON.stringify({
        subjectType: targetConfig.type,
        majors: targetConfig.allowedMajors,
        grades: targetConfig.allowedGrades,
      });

      configMap.set(configKey, targetConfig);
    }

    // 2. Use createMany for the subjects - THIS IS THE BIG WIN
    const subjectsToCreate = uniqueSubjectNames.map((name) => {
      const config = subjectMap.get(name);
      const targetConfig = configMap.get(JSON.stringify(config));

      return {
        name,
        configId: targetConfig.id,
        type: targetConfig.type,
      };
    });

    await tx.subject.createMany({
      data: subjectsToCreate,
      skipDuplicates: true,
    });
  });

  return { totalNewSubjects: uniqueSubjectNames.length };
}

export async function getSubjects(data: SubjectQueriesSchema) {
  const whereQuery: Prisma.SubjectWhereInput = {};

  if (data.subjectName && data.subjectName?.length >= MIN_SEARCH_LENGTH) {
    whereQuery.name = {
      contains: data.subjectName,
      mode: "insensitive",
    };
  } else if (data.grade || data.major || data.subjectType) {
    whereQuery.config = {
      AND: [
        data.grade
          ? { allowedGrades: { hasSome: [data.grade] as Grade[] } }
          : {},
        data.major
          ? { allowedMajors: { hasSome: [data.major] as Major[] } }
          : {},
        data.subjectType ? { type: data.subjectType as SubjectType } : {},
      ],
    };
  }

  const subjectSelect = Prisma.validator<Prisma.SubjectSelect>()({
    id: true,
    name: true,
    config: {
      select: {
        allowedGrades: true,
        allowedMajors: true,
        type: true,
      },
    },
  });

  const subjectRecords = await findSubjects(
    prisma,
    whereQuery,
    subjectSelect,
    data.getAll,
    data.sortOrder,
    data.page,
  );
  const formattedSubjects = subjectRecords.map((subject) => ({
    id: subject.id,
    subjectName: subject.name,
    subjectConfig: subject.config,
  }));

  const totalSubject = await prisma.subject.count({
    where: whereQuery,
  });

  return {
    formattedSubjects,
    totalSubject,
  };
}

export async function deleteSubject(subjectId: number) {
  // Explicit check for NaN or null
  if (!subjectId || isNaN(subjectId)) {
    throw badRequest("Valid Subject ID is required");
  }

  // Atomic Delete: Don't findUnique first. Just try to delete it.
  await prisma.subject.delete({
    where: { id: subjectId },
  });
}

export async function updateSubject(data: PatchSubjectSchema) {
  const whereQueryById: Prisma.SubjectWhereUniqueInput = {
    id: data.subjectId,
  };

  const selectSubjectConfig = Prisma.validator<Prisma.SubjectSelect>()({
    name: true,
    config: true,
  });

  const currentSubject = await findUniqueSubject(
    whereQueryById,
    selectSubjectConfig,
    prisma,
  );

  if (!currentSubject) throw notFound("Subject not found");

  if (data.subjectName) {
    const whereQueryByName: Prisma.SubjectWhereUniqueInput = {
      name: data.subjectName,
    };

    const selectSubjectId = Prisma.validator<Prisma.SubjectSelect>()({
      id: true,
    });

    const findDuplicate = await findUniqueSubject(
      whereQueryByName,
      selectSubjectId,
      prisma,
    );

    // Ensure the duplicate found isn't the current record itself
    if (findDuplicate && findDuplicate.id !== data.subjectId) {
      throw unprocessableEntity("A subject with this name already exists.");
    }
  }

  const configChanged = compareSubjectConfig(data, currentSubject);
  const nameChanged =
    data.subjectName && data.subjectName !== currentSubject.name;

  if (!configChanged && !nameChanged) {
    return Response.json({ message: "No data was edited" }, { status: 200 });
  }

  const updateData: any = {};

  if (nameChanged) {
    updateData.name = data.subjectName;
  }

  if (configChanged) {
    const subjectConfig = {
      allowedMajors:
        data.subjectConfig?.allowedMajors ??
        currentSubject.config.allowedMajors,
      allowedGrades:
        data.subjectConfig?.allowedGrades ??
        currentSubject.config.allowedGrades,
      type: data.subjectConfig?.type ?? currentSubject.config.type,
    };

    const potentialConfig = await prisma.subjectConfig.findMany({
      where: {
        allowedMajors: { hasEvery: subjectConfig.allowedMajors },
        allowedGrades: { hasEvery: subjectConfig.allowedGrades },
        type: subjectConfig.type,
      },
    });

    let targetConfig = potentialConfig.find(
      (config: {
        type: SubjectType;
        allowedMajors: Major[];
        allowedGrades: Grade[];
      }) =>
        subjectConfig.type === config.type &&
        subjectConfig.allowedGrades.length === config.allowedGrades.length &&
        subjectConfig.allowedMajors.length === config.allowedMajors.length,
    );

    if (!targetConfig) {
      targetConfig = await prisma.subjectConfig.create({
        data: {
          allowedGrades: subjectConfig.allowedGrades,
          allowedMajors: subjectConfig.allowedMajors,
          type: subjectConfig.type,
        },
      });
    }

    updateData.configId = targetConfig.id;
  }

  await prisma.subject.update({
    where: { id: data.subjectId },
    data: updateData,
  });
}
