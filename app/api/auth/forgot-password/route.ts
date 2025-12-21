import { handleError, notFound, tooManyRequest } from "@/lib/errors";
import { zodForgotPassword } from "@/lib/utils/zodSchema";
import { prisma } from "@/prisma/prisma";
import redis from "@/lib/redis";
import { sendEmail } from "@/lib/emails/nodeMailer";
import { render } from "@react-email/render";
import ResetPasswordOtpEmail from "@/lib/emails/ResetPasswordOtpEmail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = zodForgotPassword.parse(body);

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
      });
    }

    if (!user) {
      throw notFound("User not found");
    }

    const RATE_LIMIT = 3;
    // TTL = Time To Live
    const RATE_LIMIT_TTL = 60 * 60;
    const OTP_TTL = 15 * 60;

    const rateKey = `rate:otp:${user.id}`;

    const otpRequestCount = await redis.incr(rateKey);

    // Set TTL hanya saat request pertama
    if (otpRequestCount === 1) {
      await redis.expire(rateKey, RATE_LIMIT_TTL);
    }

    if (otpRequestCount > RATE_LIMIT) {
      throw tooManyRequest(
        "You have requested OTP too many times. Please try again later."
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(
      `otp:${otp}`,
      user.id,
      { EX: OTP_TTL } // 15 menit
    );

    const html = render(
      ResetPasswordOtpEmail({
        schoolName: "SMK ADVENT",
        userName: user.name,
        userEmail: user.email,
        otpCode: otp,
        currentYear: new Date().getFullYear(),
        currentTime: new Date(),
      })
    );

    await sendEmail({
      email: user.email,
      html: await html,
      subject: "Reset Your Password - OTP Verification",
    });

    return Response.json(
      { message: "If the email exists, an OTP has been sent." },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return handleError(e);
  }
}
