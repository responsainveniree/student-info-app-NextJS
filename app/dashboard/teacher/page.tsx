import React from "react";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import { getRoleDashboard, isTeacherRole } from "@/lib/constants/roles";
import TeachingClassesAndTeachingAssignments from "@/components/dashboard/teacher/TeachingClassesAndTeachingAssignments";
import TeacherSummary from "@/components/dashboard/teacher/TeacherSummary";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (!isTeacherRole(session.user.role)) {
    redirect(getRoleDashboard(session.user.role));
  }

  return (
    <div className="p-8 space-y-8">
      <TeacherSummary session={session} />
      <TeachingClassesAndTeachingAssignments session={session} />
    </div>
  );
};

export default page;
