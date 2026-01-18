import { auth } from "@/lib/auth/authNode";
import { getRoleDashboard, isStudentRole } from "@/lib/constants/roles";
import { prisma } from "@/prisma/prisma";
import { redirect } from "next/navigation";
import React from "react";
import StudentMarkView from "@/components/dashboard/student/mark/StudentMarkView";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (!isStudentRole(session.user.role)) {
    redirect(getRoleDashboard(session.user.role));
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        {session.user.name.split(" ")[0]}'s Marks
      </h1>
      <StudentMarkView session={session.user} />
    </div>
  );
};

export default page;
