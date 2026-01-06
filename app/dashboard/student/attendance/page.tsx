import AttendanceManager from "@/components/attendance/AttendanceManager";
import { auth } from "@/lib/auth/authNode";
import { isClassSecretaryRole } from "@/lib/constants/roles";
import { redirect } from "next/navigation";

import React from "react";

const page = async () => {
  const session = await auth();

  if (!session) return redirect("/sign-in");

  if (!isClassSecretaryRole(session.user.role)) {
    return redirect("/student-dashboard");
  }

  return <AttendanceManager session={session.user} />;
};

export default page;
