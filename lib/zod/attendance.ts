import { z } from "zod";
import { AttendanceTypesEnum, page, SortOrderEnum } from "./general";

export const bulkAttendanceSchema = z.object({
  date: z.string({ message: "Must be filled" }),
  records: z.array(
    z.object({
      studentId: z.string({ message: "Must be filled" }),
      attendanceType: AttendanceTypesEnum,
      description: z.string().max(300).optional(),
    }),
  ),
});

export type BulkAttendanceSchema = z.infer<typeof bulkAttendanceSchema>;

export const studentAttendacesQueriesSchema = z.object({
  date: z
    .string({ message: "Must be filled" })
    .default(new Date().toISOString().split("T")[0]),
  homeroomTeacherId: z.string().optional(),
  page,
  sortOrder: SortOrderEnum,
  searchQuery: z.string().optional(),
});

export type StudentAttendacesQueriesSchema = z.infer<
  typeof studentAttendacesQueriesSchema
>;

export const attendanceSummaryQueries = z.object({
  page,
  sortOrder: SortOrderEnum,
  searchQuery: z.string().optional(),
});

export type AttendanceSummaryQueriesSchema = z.infer<
  typeof attendanceSummaryQueries
>;
