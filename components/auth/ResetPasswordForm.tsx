"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

const ResetPasswordContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!token) {
      toast.error("Missing reset token");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/auth/reset-password", {
        otp: token,
        password,
        confirmPassword,
      });

      toast.success("Password reset successfully!");
      // Redirect to login after short delay
      setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to reset password"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F9FAFB]">
        <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] p-8 text-center max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-2">
            Invalid Request
          </h2>
          <p className="text-gray-600">
            Missing password reset token. Please check the link in your email.
          </p>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Lock className="w-8 h-8" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center">Reset Password</h1>
            <p className="text-center text-blue-100 mt-2">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#111827]">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    placeholder="Enter new password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    className="h-12 border-2 border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 transition-all pl-4 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1E3A8A]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#111827]">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={8}
                    className="h-12 border-2 border-[#E5E7EB] focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20 transition-all pl-4 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#1E3A8A]"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                className="w-full h-12 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E3A8A]/90 hover:to-[#3B82F6]/90 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  "Resetting..."
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap in Suspense as useSearchParams causes client-side bailouts
const ResetPasswordForm = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-[#F9FAFB]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1E3A8A]"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPasswordForm;
