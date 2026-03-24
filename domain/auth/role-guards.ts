import { prisma } from "@/db/prisma";
import { auth } from "@/lib/auth/authNode";
import { isClassSecretaryRole, isTeacherRole } from "@/lib/constants/roles";
import { forbidden, notFound, unauthorized } from "@/lib/errors";
import { findStudentById, findTeacher } from "@/repositories/user-repository";

export async function validateHomeroomTeacherSession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw unauthorized("You haven't logged in yet");
  }

  const teacherProfile = await findTeacher(session.user.id, prisma);

  if (!teacherProfile) {
    throw notFound("Homeroom teacher profile not found");
  }

  const canAccess = isTeacherRole(teacherProfile.staffRole);

  const isHomeroomTeacher = !!teacherProfile.homeroom;

  if (!canAccess || !isHomeroomTeacher) {
    throw forbidden("You're not allowed to access this");
  }

  return teacherProfile;
}

export async function validateSecretarySession() {
  const session = await auth();

  if (!session?.user?.id) {
    throw unauthorized("You haven't logged in yet");
  }

  const studentProfile = await findStudentById(session.user.id, prisma);

  if (!studentProfile) {
    throw notFound("Student secretary profile not found");
  }

  const canAccess = isClassSecretaryRole(studentProfile.studentRole);

  if (!canAccess) {
    throw forbidden("You're not allowed to access this");
  }

  return studentProfile;
}
