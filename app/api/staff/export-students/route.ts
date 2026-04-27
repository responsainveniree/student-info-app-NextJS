import { inngest } from "@/inngest/client";
import { getStudentExportSchema } from "@/lib/zod/student";
import { validateManagementSession } from "@/domain/auth/role-guards";

export async function POST(req: Request) {
  try {
    const session = await validateManagementSession(); // Get user info
    const body = await req.json();
    const data = getStudentExportSchema.parse(body);

    // Trigger the Inngest function
    await inngest.send({
      name: "app/students.export.requested",
      data: {
        payload: data,
        userEmail: session.user.email,
        username: session.user.name,
      },
    });

    return Response.json({
      message: "Export started. You will receive an email shortly.",
    });
  } catch (error) {
    return Response.json({ error: "Failed to start export" }, { status: 500 });
  }
}
