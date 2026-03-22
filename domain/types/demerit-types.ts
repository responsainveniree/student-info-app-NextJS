import { Prisma } from "@prisma/client";

// Why did I move this select into another file because I need it for creating a type safety to avoid error in TS compiler
export const demeritCheckSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  studentProfile: {
    select: {
      demerits: {
        select: {
          category: true,
        },
      },
    },
  },
});

export type StudentWithDemerits = Prisma.UserGetPayload<{
  select: typeof demeritCheckSelect;
}>;

export const selectDemeritPointWithStudent =
  Prisma.validator<Prisma.DemeritPointSelect>()({
    id: true,
    category: true,
    student: {
      select: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    },
  });

export type DemeritPointWithStudent = Prisma.DemeritPointGetPayload<{
  select: typeof selectDemeritPointWithStudent;
}>;
