import { badRequest, handleError } from "@/lib/errors";
import { prisma } from "@/lib/prisma/prisma";
import hashing from "@/lib/utils/hashing";
import { zodSignUp } from "@/lib/utils/zodSchema";

export async function POST(req: Request) {
  try {
    const { username, email, password, confirmPassword } = await req.json();

    if (!username || !email || !password || !confirmPassword) {
      throw badRequest("All fields must be filled");
    }

    zodSignUp.parse({ username, email, password, confirmPassword });

    if (password !== confirmPassword) {
      throw badRequest("Password and confirm password must be the same");
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw badRequest("Email already registered");
    }

    const hashedPassword = await hashing(password);

    const user = await prisma.user.create({
      data: {
        name: username,
        email: email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    return Response.json(
      {
        message: "Successfully signed up",
        data: { user },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
