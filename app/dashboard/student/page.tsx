import React from "react";
import StudentDashboard from "@/components/dashboard/student/StudentDashboard";

import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import { getRoleDashboard, isStudentRole } from "@/lib/constants/roles";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (!isStudentRole(session.user.role)) {
    redirect(getRoleDashboard(session.user.role));
  }

  return (
    <div>
      <StudentDashboard session={session.user} />
    </div>
  );
};

export default page;
