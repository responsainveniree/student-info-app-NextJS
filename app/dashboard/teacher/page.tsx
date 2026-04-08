import React from "react";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import {
  getRoleDashboard,
  hasManagementAccess,
  isTeacherRole,
} from "@/lib/constants/roles";
import TeacherDashboard from "@/components/dashboard/teacher/dashboard/TeacherDashboard";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (
    !isTeacherRole(session.user.role) ||
    hasManagementAccess(session.user.role)
  ) {
    redirect(getRoleDashboard(session.user.role));
  }

  return (
    <div className="p-8 space-y-8">
      <TeacherDashboard session={session.user} />
    </div>
  );
};

export default page;
