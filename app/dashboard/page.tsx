import { auth } from "@/lib/auth/authNode";
import { getRoleDashboard } from "@/lib/constants/roles";
import { redirect } from "next/navigation";
import React from "react";

const page = async () => {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  if (session) redirect(getRoleDashboard(session.user.role));

  return <div></div>;
};

export default page;
