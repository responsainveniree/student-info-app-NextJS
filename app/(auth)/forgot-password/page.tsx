import React from "react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import type { Metadata } from "next";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Forgot Password | Student Info App",
  description: "Reset your password",
};

const page = async () => {
  const session = await auth();

  if (!session) {
    return (
      <div>
        <ForgotPasswordForm />
      </div>
    );
  }

  if (session.user.role === "student") {
    redirect("/student-dashboard");
  }

  if (session.user.role === "teacher") {
    redirect("/teacher-dashboard");
  }

  if (
    session.user.role === "vicePrincipal" ||
    session.user.role === "principal"
  ) {
    redirect("/staff-dashboard");
  }

  return <div></div>;
};

export default page;
