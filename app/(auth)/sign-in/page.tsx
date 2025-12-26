import React from "react";
import SignIn from "@/components/auth/SignIn";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();

  if (!session)
    return (
      <div>
        <SignIn />
      </div>
    );

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
};

export default page;
