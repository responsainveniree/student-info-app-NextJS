import React from "react";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";
import ClassroomContent from "@/components/dashboard/teacher/classroom/ClassroomContent";

const ClassroomPage = async () => {
  const session = await auth();

  if (!session) {
    redirect("/sign-in");
  }

  return <ClassroomContent session={session.user} />;
};

export default ClassroomPage;
