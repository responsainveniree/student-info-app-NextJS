import CreateAccountPage from "@/components/auth/createUser/CreateAccountPage";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import { isStaffRole, getRoleDashboard } from "@/lib/constants/roles";
import { Sidebar } from "@/components/dashboard/Sidebar";

const Page = async () => {
  const session = await auth();

  if (!session) return redirect("/sign-in");

  const isStaff = isStaffRole(session.user.role);

  if (!isStaff) {
    return redirect(getRoleDashboard(session.user.role));
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <Sidebar role={session.user.role} />
        <main className="flex-1 lg:ml-64 overflow-y-auto w-full">
          <CreateAccountPage session={session.user} />
        </main>
      </div>
    </>
  );
};

export default Page;
