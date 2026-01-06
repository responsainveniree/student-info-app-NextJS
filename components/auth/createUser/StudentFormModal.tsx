"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChangeEvent, FormEvent, useRef, useState, useEffect } from "react";
import axios from "axios";
import { Upload, UserPlus, FileSpreadsheet, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "../../ui/spinner";
import { Eye, EyeOff } from "lucide-react";

import { GRADES, CLASSNUMBERS, MAJORS } from "@/lib/constants/class";
import {
  formatClassNumber,
  getGradeNumber,
  getMajorDisplayName,
  MAJOR_DISPLAY_MAP,
  GRADE_DISPLAY_MAP,
  STUDENT_ROLES_MAP,
} from "@/lib/utils/labels";
import { STUDENT_ROLES } from "@/lib/constants/roles";

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudentFormModal = ({ open, onOpenChange }: StudentFormModalProps) => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string>("");
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    grade: "",
    major: "",
    classNumber: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [parentAccountData, setparentAccountData] = useState({
    email: "",
    password: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        grade: "",
        major: "",
        classNumber: "",
        role: "",
      });
      setError("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file.name);
    setUploadLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "/api/auth/account/bulk/student-accounts",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          responseType: "blob",
        }
      );

      if (res.status === 200) {
        toast.success(res.data.message);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || "Failed to upload file";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploadLoading(false);
      if (fileRef.current) fileRef.current.value = "";
      setUploadedFile("");
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setData({ ...data, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        "/api/auth/account/single/student-account",
        data
      );

      if (res.status === 200) {
        console.log(res);

        toast.success(
          "Student account created successfully. Check the parent account above."
        );

        setIsSuccess(true);

        setparentAccountData({
          email: res.data.data.parentAccount.email,
          password: res.data.data.parentAccount.password,
        });

        setTimeout(() => {
          setparentAccountData({ email: "", password: "" });
          setIsSuccess(false);
        }, 60 * 1000);

        setTimeout(() => {
          setData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            grade: "",
            major: "",
            classNumber: "",
            role: "",
          });
          setError("");
          setShowPassword(false);
          setShowConfirmPassword(false);
        }, 5000);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Something went wrong. Try again."
      );
      toast.error("Something went wrong. Read the message above.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <Spinner />
        </div>
      )}

      {uploadLoading && (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center">
          <Spinner />
        </div>
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <GraduationCap className="w-8 h-8" />
              Student Registration
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-md overflow-hidden">
              <div className="bg-green-600 px-6 py-3">
                <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Parent Account Created
                </h3>
              </div>

              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Email
                    </p>
                    <p className="text-sm text-gray-900 font-medium break-all">
                      {parentAccountData.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(parentAccountData.email);
                      toast.success("Email copied!");
                    }}
                    className="ml-3 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Copy email"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Password
                    </p>
                    <p className="text-sm text-gray-900 font-mono font-medium">
                      {parentAccountData.password}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(parentAccountData.password);
                      toast.success("Password copied!");
                    }}
                    className="ml-3 p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Copy password"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <svg
                    className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-xs text-amber-800">
                    <span className="font-semibold">Important:</span> Save these
                    credentials securely. The parent will need them to access
                    their account.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const text = `Parent Account\nEmail: ${parentAccountData.email}\nPassword: ${parentAccountData.password}`;
                    navigator.clipboard.writeText(text);
                    toast.success("All credentials copied!");
                  }}
                  className="w-full mt-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy All Credentials
                </button>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Excel Upload Section */}
            <div className="border rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white mb-3 shadow-lg">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  Quick Import
                </h3>
                <p className="text-gray-600 text-sm">
                  Upload Excel file for bulk registration
                </p>
              </div>

              <div className="relative group">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-green-400 transition-all text-center">
                  <label
                    htmlFor="student-excel-file"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-green-600 mb-2" />
                    <span className="text-sm font-semibold text-gray-800">
                      {uploadedFile || "Click to upload Excel file"}
                    </span>
                    <span className="text-xs text-gray-500">
                      Supported: .xlsx, .xls
                    </span>
                  </label>
                  <input
                    ref={fileRef}
                    id="student-excel-file"
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadLoading}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm font-semibold text-gray-500 uppercase">
                  Or Register Manually
                </span>
              </div>
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-800">
                  Personal Information
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="username"
                    placeholder="Enter username"
                    type="text"
                    minLength={3}
                    required
                    disabled={loading}
                    onChange={handleChange}
                    value={data.username}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="email"
                    placeholder="your.email@example.com"
                    type="email"
                    required
                    disabled={loading}
                    onChange={handleChange}
                    value={data.email}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Grade <span className="text-red-500">*</span>
                  </label>
                  <Select
                    onValueChange={(v) => setData({ ...data, grade: v })}
                    value={data.grade}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {GRADE_DISPLAY_MAP[g]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Major <span className="text-red-500">*</span>
                  </label>
                  <Select
                    onValueChange={(v) => setData({ ...data, major: v })}
                    value={data.major}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select major" />
                    </SelectTrigger>
                    <SelectContent>
                      {MAJORS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {MAJOR_DISPLAY_MAP[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Class Number <span className="text-red-500">*</span>
                  </label>
                  <Select
                    onValueChange={(v) => setData({ ...data, classNumber: v })}
                    value={data.classNumber}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSNUMBERS.map((num) => (
                        <SelectItem key={num} value={num}>
                          {num === "none" ? "None" : `Class ${num}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <Select
                    onValueChange={(v) => setData({ ...data, role: v })}
                    value={data.role}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {STUDENT_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {STUDENT_ROLES_MAP[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      name="password"
                      placeholder="Minimum 8 characters"
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      required
                      disabled={loading}
                      onChange={handleChange}
                      value={data.password}
                      className="h-11 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      name="confirmPassword"
                      placeholder="Re-enter password"
                      type={showConfirmPassword ? "text" : "password"}
                      minLength={8}
                      required
                      disabled={loading}
                      onChange={handleChange}
                      value={data.confirmPassword}
                      className="h-11 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-lg rounded-xl shadow-lg"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Student Account
                  </span>
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StudentFormModal;
