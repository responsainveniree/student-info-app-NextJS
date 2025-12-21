"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Mail, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";

const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    try {
      await axios.post("/api/auth/forgot-password", { email });
      setSuccess(true);
      toast.success("Reset link sent to your email!");
    } catch (error) {
      console.error("Forgot password error:", error);
      if (error instanceof AxiosError) {
        toast.error(
          error.response?.data?.message || "Failed to send reset link"
        );
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#F9FAFB]">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#1E3A8A]/10 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 right-0 w-96 h-96 bg-[#3B82F6]/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#E5E7EB] overflow-hidden p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#111827] mb-2">
              Check your email
            </h2>
            <p className="text-gray-600 mb-8">
              We have sent a password reset link to your email address.
            </p>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full text-[#1E3A8A] border-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                onClick={() => setSuccess(false)}
              >
                Resend email
              </Button>
              <Link
                href="/sign-in"
                className="block text-sm text-gray-500 hover:text-[#1E3A8A] font-medium"
              >
                Back to sign in
              </Link>
            </div>
          </div>
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
            <Link
              href="/sign-in"
              className="inline-flex items-center text-blue-100 hover:text-white transition-colors mb-6 text-sm group"
            >
              <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
              Back to Sign In
            </Link>
            <h1 className="text-3xl font-bold">Forgot Password?</h1>
            <p className="text-blue-100 mt-2">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
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

              <Button
                className="w-full h-12 bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] hover:from-[#1E3A8A]/90 hover:to-[#3B82F6]/90 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reset Link
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

export default ForgotPasswordForm;
