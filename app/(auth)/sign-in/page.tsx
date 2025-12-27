import React from "react";
import SignIn from "@/components/auth/SignIn";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import { getRoleDashboard } from "@/lib/constants/roles";

const page = async () => {
  const session = await auth();

  if (!session)
    return (
      <div>
        <SignIn />
      </div>
    );

  return redirect(getRoleDashboard(session.user.role));
};

export default page;

