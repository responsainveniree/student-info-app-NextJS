import { prisma } from "@/db/prisma";
import { deleteUserById } from "@/repositories/user-repository";

export const deleteUser = async (userId: string) => {
  await deleteUserById(userId, prisma);
};
