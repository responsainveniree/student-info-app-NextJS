import { badRequest, handleError } from "@/lib/errors";
import { printConsoleError } from "@/lib/utils/printError";
import { deleteUser } from "@/services/user/user-service";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const userId = searchParams.get("userId");

    if (!userId) throw badRequest("User id parameter not found");

    await deleteUser(userId);

    return Response.json(
      { message: "User account successfully deleted" },
      { status: 200 },
    );
  } catch (error) {
    printConsoleError(error, "DELETE", "/api/staff/user/delete");
    return handleError(error);
  }
}
