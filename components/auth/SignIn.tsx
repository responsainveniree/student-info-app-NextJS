import { signIn } from "@/lib/auth/authNode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAction } from "@/lib/actions/executeActions";
import Link from "next/link";
import { LogIn, Mail, Lock, GraduationCap } from "lucide-react";

const SignIn = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F9FAFB]">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#1E3A8A]/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FBBF24]/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-10 h-10" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center">Welcome Back</h1>
            <p className="text-center text-blue-100 mt-2">
              Sign in to continue to your account
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form
              className="space-y-6"
              action={async (formData) => {
                "use server";
                await executeAction({
                  actionFn: async () => {
                    await signIn("credentials", formData);
                  },
                });
              }}
            >
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#111827] flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-[#1E3A8A]" />
                  Email Address
                </label>
                <div className="relative">
                  <Input
                    name="email"
                    placeholder="your.email@example.com"
                    type="email"
                    required
                    className="h-12 border-2 border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 transition-all pl-4"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#111827] flex items-center">
                  <Lock className="w-4 h-4 mr-2 text-[#1E3A8A]" />
                  Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    placeholder="Enter your password"
                    type="password"
                    required
                    className="h-12 border-2 border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 transition-all pl-4"
                  />
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#1E3A8A] border-[#E5E7EB] rounded focus:ring-[#1E3A8A]"
                  />
                  <span className="ml-2 text-[#111827]">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[#1E3A8A] hover:text-[#3B82F6] font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Sign In Button */}
              <Button
                className="w-full h-12 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E3A8A]/90 hover:to-[#3B82F6]/90 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                type="submit"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
