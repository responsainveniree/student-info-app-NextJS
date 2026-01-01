import React from "react";
import { SignOut } from "@/components/auth/SignOut";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import { getRoleDashboard, isStaffRole } from "@/lib/constants/roles";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (!isStaffRole(session.user.role)) {
    redirect(getRoleDashboard(session.user.role));
  }
  return (
    <div>
      <SignOut />
    </div>
  );
};

export default page;
