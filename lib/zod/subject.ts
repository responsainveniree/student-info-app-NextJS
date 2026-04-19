import { z } from "zod";
import {
  zodCustomErrorMsg,
  GradeEnum,
  MajorEnum,
  page,
  SortOrderEnum,
  subjectConfig,
  SubjectTypeEnum,
} from "./general";

export const createSubjectSchema = z.object({
  subjectRecords: z
    .array(
      z.object({
        subjectNames: z
          .array(
            z.string().min(3, { message: "At least must be 3 Characters" }),
          )
          .min(1),
        subjectConfig,
      }),
    )
    .min(1),
});

export const getSubjectQueriesSchema = z.object({
  page,
  sortOrder: SortOrderEnum,
  subjectName: z.string().optional(),
  grade: GradeEnum.optional(),
  major: MajorEnum.optional(),
  subjectType: SubjectTypeEnum.optional(),
  getAll: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => val === "true"),
});

export const patchSubjectSchema = z.object({
  subjectId: z.string(zodCustomErrorMsg("Subject id", "string")),
  subjectName: z
    .string()
    .min(3, "Must be at least 3 characters long.")
    .optional(),
  subjectConfig: subjectConfig.partial().optional(),
});

export type CreateSubjectSchema = z.infer<typeof createSubjectSchema>;
export type SubjectQueriesSchema = z.infer<typeof getSubjectQueriesSchema>;
export type PatchSubjectSchema = z.infer<typeof patchSubjectSchema>;
