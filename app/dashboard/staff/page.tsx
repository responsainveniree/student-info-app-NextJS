import React from "react";
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
      <h1 className="text-2xl font-bold m-4 mt-20 lg:mt-4">
        Staff Dashboard, {session.user.name}
      </h1>
    </div>
  );
};

export default page;
