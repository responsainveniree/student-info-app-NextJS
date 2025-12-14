import React from "react";

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

  return <div>hi</div>;
};

export default page;
