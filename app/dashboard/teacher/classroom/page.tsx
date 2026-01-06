import React from "react";
import Classroom from "@/components/dashboard/teacher/Classroom";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();

  if (!session) redirect("/sign-in");

  return <Classroom session={session}></Classroom>;
};

export default page;
