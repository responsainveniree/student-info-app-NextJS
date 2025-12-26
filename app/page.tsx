import React from "react";

import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();

  if (!session) return redirect("/sign-in");

  switch (session.user.role) {
    case "student":
      return redirect("/student-dashboard");
    case "classSecretary":
      return redirect("/student-dashboard");
    case "teacher":
      return redirect("/teacher-dashboard");
    case "vicePrincipal":
      return redirect("/staff-dashboard");
    case "principal":
      return redirect("/staff-dashboard");
  }

  return <div></div>;
};

export default page;
