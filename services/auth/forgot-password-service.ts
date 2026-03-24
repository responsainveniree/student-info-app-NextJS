import { ForgotPasswordSchema } from "@/lib/zod/auth";
import { tooManyRequest } from "@/lib/errors";
import { prisma } from "@/db/prisma";
import redis from "@/lib/redis";
import { sendEmail } from "@/lib/emails/nodeMailer";
import { render } from "@react-email/render";
import ResetPasswordOtpEmail from "@/lib/emails/ResetPasswordOtpEmail";
import hashing from "@/lib/utils/hashing";
import { headers } from "next/headers";
import crypto from "crypto";
import { hashResetToken } from "@/lib/utils/hashToken";
import { findUserByEmail } from "@/repositories/user-repository";
import { TOKEN_TTL } from "@/lib/constants/rate-limiter";
import {
  assertForgotPasswordIpLimit,
  assertOtpRequestLimit,
} from "@/domain/auth/forgot-password-rules";

export async function forgotPassword(data: ForgotPasswordSchema) {
  const headersList = headers();

  const ip =
    (await headersList).get("x-forwarded-for") ||
    (await headersList).get("x-real-ip") ||
    "unknown";

  if (ip === "unknown") {
    throw tooManyRequest("Unable to verify request origin");
  }

  await assertForgotPasswordIpLimit(ip);

  const user = await findUserByEmail(data.email, prisma);

  if (!user)
    return Response.json(
      { message: "If the email exists, an OTP has been sent." },
      { status: 201 },
    );

  await assertOtpRequestLimit(user.id);

  const rawResetToken = crypto.randomBytes(32).toString("hex");
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await hashing(otp);

  const html = render(
    ResetPasswordOtpEmail({
      schoolName: "SMK ADVENT",
      userName: user.name,
      userEmail: user.email,
      otpCode: otp,
      resetToken: rawResetToken,
      currentYear: new Date().getFullYear(),
      currentTime: new Date(),
    }),
  );

  await sendEmail({
    email: user.email,
    html: await html,
    subject: "Reset Your Password - OTP Verification",
  });

  await redis.set(
    `reset:${hashResetToken(rawResetToken)}`,
    JSON.stringify({
      userId: user.id,
      otpHash: hashedOtp,
    }),
    { EX: TOKEN_TTL }, // 15 menit
  );
}
