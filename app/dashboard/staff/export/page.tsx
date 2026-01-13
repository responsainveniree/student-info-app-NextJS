import { auth } from "@/lib/auth/authNode";
import { getRoleDashboard, isStaffRole } from "@/lib/constants/roles";
import { redirect } from "next/navigation";
import ExportStudentExcel from "@/components/dashboard/staff/ExportStudentExcel";

const Page = async () => {
  const session = await auth();

  if (!session) {
    return redirect("/sign-in");
  }

  if (!isStaffRole(session.user.role)) {
    return redirect(getRoleDashboard(session.user.role));
  }

  return (
    <div className="m-4">
      <ExportStudentExcel session={session.user} />;
    </div>
  );
};

export default Page;
