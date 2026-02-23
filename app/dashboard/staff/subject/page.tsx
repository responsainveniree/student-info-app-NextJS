import { auth } from "../../../../lib/auth/authNode";
import {
  getRoleDashboard,
  hasManagementAccess,
} from "../../../../lib/constants/roles";
import { redirect } from "next/navigation";
import SubjectPageClient from "../../../../components/dashboard/staff/subject/SubjectPageClient";

const Page = async () => {
  const session = await auth();

  if (!session) {
    return redirect("/sign-in");
  }

  if (!hasManagementAccess(session.user.role)) {
    return redirect(getRoleDashboard(session.user.role));
  }

  return <SubjectPageClient />;
};

export default Page;
