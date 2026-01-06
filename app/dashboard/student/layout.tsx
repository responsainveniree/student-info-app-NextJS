import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import {

  isStudentRole,
  getRoleDashboard,
} from "@/lib/constants/roles";

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (!isStudentRole(session.user.role)) {
    redirect(getRoleDashboard(session.user.role));
  }

  return (
    <div>
      {children}
    </div>
  );
}
