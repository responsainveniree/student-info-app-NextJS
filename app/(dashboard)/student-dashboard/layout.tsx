import { Sidebar } from "@/components/ui/Sidebar";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (session.user.role === "teacher") {
    redirect("/teacher-dashboard");
  }

  if (
    session.user.role === "vicePrincipal" ||
    session.user.role === "principal"
  ) {
    redirect("/staff-dashboard");
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Sidebar role={session?.user?.role} />
      {/* Main Content - responsive margin */}
      <main className="lg:ml-64 pt-16 lg:pt-0">{children}</main>
    </div>
  );
}
