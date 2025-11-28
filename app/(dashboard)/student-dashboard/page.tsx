import React from "react";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

const page = async () => {
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
    <div>
      <StudentDashboard />
    </div>
  );
};

export default page;
