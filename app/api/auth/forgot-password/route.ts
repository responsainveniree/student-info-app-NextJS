import { badRequest, handleError } from "@/lib/errors";
import { zodForgotPassword } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";
import { Redis } from "@upstash/redis";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = zodForgotPassword.parse(body);

    let user;

    user = await prisma.student.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.teacher.findUnique({
        where: { email: data.email },
      });
    }

    if (!user) {
      throw badRequest("User not found");
    }
  } catch (e) {
    handleError(e);
    console.error(e);
  }
}
