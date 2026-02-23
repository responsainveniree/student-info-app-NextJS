import React from "react";
import { auth } from "@/lib/auth/authNode";
import AssessmentManagement from "@/components/dashboard/teacher/AssessmentManagement";
import { redirect } from "next/navigation";
import { getRoleDashboard, isTeacherRole } from "@/lib/constants/roles";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (!isTeacherRole(session.user.role)) {
    redirect(getRoleDashboard(session.user.role));
  }

  return <AssessmentManagement />;
};

export default page;
