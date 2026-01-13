import { badRequest, handleError } from "@/lib/errors";
import redis from "@/lib/redis";
import hashing from "@/lib/utils/hashing";
import { hashResetToken } from "@/lib/utils/hashToken";
import { ResetPasswordSchema, zodResetPassword } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body: ResetPasswordSchema = await req.json();
    const data = zodResetPassword.parse(body);

    const resetData = await redis.get(`reset:${hashResetToken(data.token)}`);

    if (!resetData) {
      throw badRequest("Invalid or expired reset token");
    }

    const { userId, otpHash } = JSON.parse(resetData);

    const isOtpValid = await bcrypt.compare(data.otp, otpHash);

    if (!isOtpValid) {
      throw badRequest("Invalid or expired OTP code");
    }

    if (data.password !== data.confirmPassword) {
      throw badRequest("Password and confirm password must be the same");
    }

    const hashedPassword = await hashing(data.password);

    let updated;

    updated = await prisma.student.updateMany({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    if (updated.count === 0) {
      updated = await prisma.teacher.updateMany({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    }

    if (updated.count) {
      updated = await prisma.parent.updateMany({
        where: { id: userId },
        data: { password: hashedPassword },
      });
    }

    const PASSWORD_RESET_COOLDOWN = 24 * 60 * 60; // 24 jam
    await redis.set(`cooldown:reset:${userId}`, "1", {
      EX: PASSWORD_RESET_COOLDOWN,
    });

    await redis.del(`rate:otp:${userId}`);
    await redis.del(`reset:${hashResetToken(data.token)}`);

    return Response.json(
      {
        message: "Succesfully changed the password",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/auth/reset-pasword",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
