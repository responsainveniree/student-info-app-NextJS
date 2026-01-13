import { handleError, tooManyRequest } from "@/lib/errors";
import { zodForgotPassword } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";
import redis from "@/lib/redis";
import { sendEmail } from "@/lib/emails/nodeMailer";
import { render } from "@react-email/render";
import ResetPasswordOtpEmail from "@/lib/emails/ResetPasswordOtpEmail";
import hashing from "@/lib/utils/hashing";
import { headers } from "next/headers";
import crypto from "crypto";
import { hashResetToken } from "@/lib/utils/hashToken";

export async function POST(req: Request) {
  try {
    const headersList = headers();
    const body = await req.json();
    const data = zodForgotPassword.parse(body);
    const ip =
      (await headersList).get("x-forwarded-for") ||
      (await headersList).get("x-real-ip") ||
      "unknown";

    if (ip === "unknown") {
      throw tooManyRequest("Unable to verify request origin");
    }

    // TTL = Time To Live
    const IP_RATE_LIMIT_TTL = 15 * 60;
    const OTP_RATE_LIMIT_TTL = 3 * 60 * 60;
    const TOKEN_TTL = 15 * 60;
    const IP_RATE_LIMIT = 5;

    const ipRateKey = `rate:ip:${ip}`;

    const ipRequestCount = await redis.incr(ipRateKey);

    if (ipRequestCount === 1) {
      await redis.expire(ipRateKey, IP_RATE_LIMIT_TTL);
    }

    if (ipRequestCount > IP_RATE_LIMIT) {
      throw tooManyRequest(
        "Requested OTP too many times. Please try again later."
      );
    }

    let user;

    user = await prisma.student.findUnique({
      where: { email: data.email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      user = await prisma.teacher.findUnique({
        where: { email: data.email },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }

    if (!user) {
      user = await prisma.parent.findUnique({
        where: { email: data.email },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }

    if (!user) {
      return Response.json(
        { message: "If the email exists, an OTP has been sent." },
        { status: 201 }
      );
    }

    const cooldownKey = `cooldown:reset:${user.id}`;
    const lastReset = await redis.get(cooldownKey);

    if (lastReset) {
      throw tooManyRequest(
        "Too many password reset attempts. Please try again later."
      );
    }

    const OTP_RATE_LIMIT = 3;

    const otpRateKey = `rate:otp:${user.id}`;

    const otpRequestCount = await redis.incr(otpRateKey);

    // Set TTL only for first request
    if (otpRequestCount === 1) {
      await redis.expire(otpRateKey, OTP_RATE_LIMIT_TTL);
    }

    if (otpRequestCount > OTP_RATE_LIMIT) {
      throw tooManyRequest(
        "Requested OTP too many times. Please try again later."
      );
    }

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
      })
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
      { EX: TOKEN_TTL } // 15 menit
    );

    return Response.json(
      { message: "If the email exists, an OTP has been sent." },
      { status: 201 }
    );
  } catch (error) {
    console.error("API_ERROR", {
      route: "/api/auth/forgot-pasword",
      message: error instanceof Error ? error.message : String(error),
    });
    return handleError(error);
  }
}
