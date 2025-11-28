"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

const SignOut = () => {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/sign-in" });
  };

  return (
    <Button
      onClick={handleSignOut}
      className="w-full h-12 bg-white border-2 border-[#E5E7EB] text-[#111827] hover:bg-red-50 hover:border-red-200 hover:text-red-600 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
    >
      <LogOut className="w-5 h-5" />
      <span>Sign Out</span>
    </Button>
  );
};

export { SignOut };
