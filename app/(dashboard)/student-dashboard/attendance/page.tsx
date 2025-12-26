import AttendanceManager from "@/components/attendance/AttendanceManager";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

import React from "react";

const page = async () => {
  const session = await auth();

  if (!session) return redirect("/sign-in");

  if (session.user.role !== "classSecretary") {
    return redirect("/student-dashboard");
  }

  return <AttendanceManager session={session.user} />;
};

export default page;
