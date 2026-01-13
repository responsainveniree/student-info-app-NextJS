import { auth } from "@/lib/auth/authNode";
import { getRoleDashboard, isParentRole } from "@/lib/constants/roles";
import { redirect } from "next/navigation";
import React from "react";
import ParentMarkWrapper from "@/components/dashboard/parent/mark/ParentMarkWrapper";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  if (!isParentRole(session.user.role)) {
    redirect(getRoleDashboard(session.user.role));
  }

  return (
    <div className="p-6">
      <ParentMarkWrapper session={session.user} />
    </div>
  );
};

export default page;
