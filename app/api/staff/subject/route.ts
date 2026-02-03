import { prisma } from "@/db/prisma";
import { Prisma } from "@/db/prisma/src/generated/prisma/client";
import { Grade, Major } from "@/lib/constants/class";
import {
  MIN_SEARCH_LENGTH,
  OFFSET,
  TAKE_RECORDS,
} from "@/lib/constants/pagination";
import { SubjectType } from "@/lib/constants/subject";
import {
  badRequest,
  handleError,
  internalServerError,
  notFound,
} from "@/lib/errors";
import {
  createSubjectSchema,
  getSubjectQueriesSchema,
  patchSubjectSchema,
} from "@/lib/utils/zodSchema";
import { validateStaffSession } from "@/lib/validation/guards";
import { hasSubjectConfigChanged } from "@/lib/validation/subjectValidators";
import { boolean } from "zod";

export async function POST(req: Request) {
  try {
    await validateStaffSession();

    const rawData = await req.json();

    const data = createSubjectSchema.parse(rawData);

    const uniqueSubjects = new Set();
    const subjectMap = new Map();

    data.subjectRecords.map((record, index) => {
      if (
        record.subjectConfig.subjectType === "MAJOR" &&
        record.subjectConfig.major.length > 1
      ) {
        throw badRequest(
          `Row ${index + 1}: Multiple majors are not allowed for MAJOR type subjects.`,
        );
      }

      record.subjectNames.map((subjectName) => {
        const uniqueSubjectKey = `${subjectName}-${record.subjectConfig.subjectType}-${record.subjectConfig.grade.join("-")}-${record.subjectConfig.major.join("-")}`;

        if (uniqueSubjects.has(uniqueSubjectKey)) {
          throw badRequest(
            `Duplicate subject: ${subjectName}. Configuration: ${record.subjectConfig.subjectType}-${record.subjectConfig.grade.join("-")}-${record.subjectConfig.major.join("-")}, already exists`,
          );
        }

        subjectMap.set(subjectName, {
          subjectType: record.subjectConfig.subjectType,
          grade: record.subjectConfig.grade,
          major: record.subjectConfig.major,
        });
        uniqueSubjects.add(uniqueSubjectKey);
      });
    });

    const uniqueSubjectsArray = Array.from(uniqueSubjects);
    const uniqueSubjectName = uniqueSubjectsArray.map(
      (subject: any) => subject.split("-")[0],
    );

    const existingSubjects = await prisma.subject.findMany({
      where: {
        subjectName: {
          in: uniqueSubjectName,
        },
      },
      select: {
        subjectName: true,
      },
    });

    const existingSubjectNames = existingSubjects.map(
      (subject) => subject.subjectName,
    );

    const missingSubjectNames = uniqueSubjectName.filter(
      (subjectName) => !existingSubjectNames.includes(subjectName),
    );

    if (missingSubjectNames.length === 0) {
      return Response.json(
        {
          message: "No new subjects were created.",
          details:
            "All subjects in your request are already present in the database.",
        },
        { status: 200 },
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const subjectName of missingSubjectNames) {
        const subjectConfig = subjectMap.get(subjectName);

        console.log(subjectConfig);

        if (!subjectConfig) {
          throw internalServerError(
            `Mapping failed for subject: ${subjectName}`,
          );
        }

        let potentialConfig = await tx.subjectConfig.findMany({
          where: {
            AND: [
              { subjectType: subjectConfig.subjectType },
              { major: { hasEvery: subjectConfig.major } },
              { grade: { hasEvery: subjectConfig.grade } },
            ],
          },
        });

        let targetConfig = potentialConfig.find(
          (config) =>
            config.subjectType === subjectConfig.subjectType &&
            config.major.length === subjectConfig.major.length &&
            config.grade.length === subjectConfig.grade.length,
        );

        if (!targetConfig) {
          targetConfig = await tx.subjectConfig.create({
            data: {
              subjectType: subjectConfig.subjectType,
              major: subjectConfig.major,
              grade: subjectConfig.grade,
            },
          });
        }

        await tx.subject.create({
          data: {
            subjectName: subjectName,
            subjectConfigId: targetConfig.id,
          },
        });
      }
    });

    return Response.json(
      {
        message: "Successfully created new subject",
        details: `Created ${missingSubjectNames.length} new subjects.`,
      },

      { status: 201 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/staff/subject",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function GET(req: Request) {
  try {
    await validateStaffSession();

    const { searchParams } = new URL(req.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    const data = getSubjectQueriesSchema.parse(rawParams);

    const whereCondition: Prisma.SubjectWhereInput = {};

    if (data.subjectName && data.subjectName?.length >= MIN_SEARCH_LENGTH) {
      whereCondition.subjectName = {
        contains: data.subjectName,
        mode: "insensitive",
      };
    } else if (data.subjectConfig) {
      const { grade, major, subjectType } = data.subjectConfig;
      whereCondition.subjectConfig = {
        AND: [
          grade ? { grade: { hasSome: grade as Grade[] } } : {},
          major ? { major: { hasSome: major as Major[] } } : {},
          subjectType ? { subjectType: subjectType as SubjectType } : {},
        ],
      };
    }

    const subjectRecords = await prisma.subject.findMany({
      where: whereCondition,
      select: {
        id: true,
        subjectConfig: {
          select: {
            grade: true,
            major: true,
            subjectType: true,
          },
        },
      },
      orderBy: {
        subjectName: data.sortOrder,
      },
      skip: data.page * OFFSET,
      take: TAKE_RECORDS,
    });

    const totalSubject = await prisma.subject.count({
      where: whereCondition,
    });

    return Response.json(
      {
        message: "Sucessfully retrieved subjects data",
        subjects: subjectRecords,
        totalSubject: totalSubject,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/staff/subject",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    await validateStaffSession();

    const { searchParams } = new URL(req.url);

    const subjectId = Number(searchParams.get("subjectId"));

    if (!subjectId) {
      throw badRequest("Subject id is missing");
    }

    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
      select: {
        id: true,
      },
    });

    if (!subject) {
      return notFound("Subject not found");
    }

    await prisma.subject.delete({
      where: {
        id: subject.id,
      },
    });

    return Response.json(
      {
        message: "Succesfully deleted subject",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/staff/subject",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    validateStaffSession();

    const rawData = await req.json();

    const data = patchSubjectSchema.parse(rawData);

    const subject = await prisma.subject.findUnique({
      where: {
        id: data.subjectId,
      },
      select: {
        subjectName: true,
        subjectConfig: {
          select: {
            grade: true,
            major: true,
            subjectType: true,
          },
        },
      },
    });

    if (!subject) {
      throw notFound("Subject not found");
    }

    // validate subject config
    const configResult = hasSubjectConfigChanged(data, subject);
    const subjectConfigChanges = {
      hasChanged: configResult ? configResult.hasChanged : false,
      changedData: configResult ? configResult.changedData : {},
    };
    const isSubjectNameExact =
      !data.subjectName || subject.subjectName === data.subjectName;

    if (isSubjectNameExact && !subjectConfigChanges.hasChanged) {
      return Response.json({ message: "No data was edited" }, { status: 200 });
    }

    const updatePayload: any = {};

    if (!isSubjectNameExact) {
      updatePayload.subjectName = data.subjectName;
    }

    if (subjectConfigChanges.hasChanged) {
      updatePayload.subjectConfig = {
        update: subjectConfigChanges.changedData,
      };
    }

    /* 
      TODO: 
      1. If the subjectConfig data that user send doesn't match any subject config data in db, create a new one and connect
    */

    await prisma.subject.update({
      where: {
        id: data.subjectId,
      },
      data: updatePayload,
    });
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/staff/subject",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
