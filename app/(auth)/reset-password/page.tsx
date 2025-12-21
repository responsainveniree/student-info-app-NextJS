import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import type { Metadata } from "next";
import { auth } from "@/lib/auth/authNode";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reset Password | Student Info App",
  description: "Create a new password",
};

const page = async () => {
  const session = await auth();

  if (!session) {
    return (
      <div>
        <ResetPasswordForm />
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
