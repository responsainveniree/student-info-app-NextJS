import {
    categoryLabelMap,
    SINGLE_PER_DAY_CATEGORIES,
    SinglePerDayCategories,
    ValidProblemPointType,
} from "@/lib/constants/problemPoint";
import { badRequest, handleError, notFound } from "@/lib/errors";
import { problemPoint } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";

function getSemester(date: Date): 1 | 2 {
    const month = date.getMonth() + 1;
    return month >= 7 && month <= 12 ? 1 : 2;
}

function getSemesterDateRange(referenceDate: Date): { start: Date; end: Date } {
    const year = referenceDate.getFullYear();
    const semester = getSemester(referenceDate);

    if (semester === 2) {
        return {
            start: new Date(year, 0, 1),
            end: new Date(year, 5, 30, 23, 59, 59, 999),
        };
    }

    return {
        start: new Date(year, 6, 1),
        end: new Date(year, 11, 31, 23, 59, 59, 999),
    };
}

// The funcionality of "category is SinglePerDayCategories" is if the function return true, the category must be "LATE" or "INCOMPLETE_ATTRIBUTES"
function isSinglePerDayCategory(
    category: ValidProblemPointType
): category is SinglePerDayCategories {
    return SINGLE_PER_DAY_CATEGORIES.includes(category as SinglePerDayCategories);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const data = problemPoint.parse(body);

        const existingTeacher = await prisma.teacher.findUnique({
            where: { id: data.teacherId },
            select: { id: true },
        });

        if (!existingTeacher) {
            throw notFound("User not found");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const problemPointDate = new Date(data.date);

        const { start: semesterStart, end: semesterEnd } =
            getSemesterDateRange(today);

        if (problemPointDate < semesterStart || problemPointDate > semesterEnd) {
            const semesterNum = getSemester(today);
            throw badRequest(
                `Attendance date is outside the current semester (Semester ${semesterNum}). ` +
                `Allowed range: ${semesterStart.toISOString().split("T")[0]} to ${semesterEnd.toISOString().split("T")[0]}.`
            );
        }

        // Just in case, If we can validate through frontend, we dont have to revalidate it again in backend
        const uniqueStudentIds = [...new Set(data.studentsId)];

        const existingStudent = await prisma.student.findMany({
            where: {
                id: {
                    in: uniqueStudentIds,
                },
            },
            select: {
                id: true,
            },
        });

        await prisma.$transaction(async (tx) => {
            for (const student of existingStudent) {
                if (isSinglePerDayCategory(data.problemPointCategory)) {
                    const existingProblemPoint = await tx.problemPoint.findFirst({
                        where: {
                            studentId: student.id,
                            category: data.problemPointCategory,
                            date: problemPointDate,
                        },
                    });

                    if (existingProblemPoint) {
                        throw badRequest(
                            `This student already has "${categoryLabelMap[data.problemPointCategory]}" problem`
                        );
                    }
                }

                await tx.problemPoint.create({
                    data: {
                        category: data.problemPointCategory,
                        point: data.point,
                        description: data.description.toString().trim() || "",
                        recordedBy: data.teacherId,
                        studentId: student.id,
                        date: problemPointDate,
                    },
                });
            }
        });

        return Response.json(
            {
                message: "Successfully crated problem point record",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(`Error in problem-point: ${error}`);
        return handleError(error);
    }
}
