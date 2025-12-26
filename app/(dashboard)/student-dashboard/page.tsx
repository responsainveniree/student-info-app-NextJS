import React from "react";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  return (
    <div>
      <StudentDashboard session={session.user} />
    </div>
  );
};

export default page;
